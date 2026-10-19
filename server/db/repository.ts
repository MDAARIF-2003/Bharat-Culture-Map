import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  applySchemaMigrations,
  openSqliteDatabase,
  SqliteDatabaseAdapter,
  SqliteDriverName,
} from "./index";
import {
  CULTURE_CATEGORIES,
  EvidenceStatus,
  EventScheduleStatus,
  EventWorkflowStatus,
  MediaAssetType,
  MediaPublicationStatus,
  MediaRightsStatus,
  MediaType,
  ProvenanceStep,
  RecordOrigin,
  RecordStatus,
  SourceType,
  TRADITION_DIRECTORY_CATEGORIES,
  TraditionDirectoryCategory,
  TraditionWorkflowStatus,
  UserRole,
} from "../../shared/const";
import {
  CalendarQueryFilter,
  CalendarQueryPayload,
  CommunityEnquiryItem,
  CommunityEnquiryType,
  CulturalEventAdmin,
  CulturalEventItem,
  CulturalEventOccurrence,
  CulturalRecordAdmin,
  CulturalRightsPassport,
  GeoLocation,
  GeographyDatasetMetadata,
  HeritageVocabularyItem,
  MapDiscoveryPayload,
  MapRecordSummary,
  MediaAssetItem,
  PlaceChildSummary,
  PlaceDetailPayload,
  ProvenanceLogEntry,
  PublicCulturalRecord,
  SourceCitation,
  TraditionAdmin,
  TraditionDetail,
  TraditionDirectoryPayload,
  TraditionPlaceAssociation,
  TraditionQueryFilter,
  TraditionSummary,
  TripItineraryItem,
  TripPlan,
  TripPlanDay,
  AccountPersonaType,
  ArtMartOrder,
  ArtMartOrderItem,
  ArtMartProduct,
  ArtMartSeller,
  EcosystemResourceItem,
  HerCraftDirectoryPayload,
  HerCraftEnterprise,
  HerCraftOpportunity,
  IndustryMaterialListing,
  IndustryMaterialRequest,
  PractitionerProfile,
  TripPlannerRequest,
  UserAccount,
} from "../../shared/contracts";
import {
  DEMO_HERCRAFT_ENTERPRISES,
  DEMO_HERCRAFT_OPPORTUNITIES,
} from "./hercraft-seed";
import {
  DEMO_ACCOUNTS,
  DEMO_ART_MART_ORDERS,
  DEMO_ART_MART_PRODUCTS,
  DEMO_ART_MART_SELLERS,
  DEMO_ECOSYSTEM_RESOURCES,
  DEMO_INDUSTRY_MATERIALS,
  DEMO_INDUSTRY_REQUESTS,
  DEMO_PRACTITIONERS,
  DemoAccountSpec,
} from "./demo-ecosystem-seed";
import { buildGeographyDatasetMetadata } from "./import-geography";
import {
  defaultPersonaForRole,
  hashPassword,
  RBAC,
  sanitizePublicPersona,
  validatePasswordStrength,
  verifyPassword,
} from "../modules/auth";
import {
  ConsentGateError,
  createDefaultRightsPassport,
  evaluatePublicationGate,
  toPublicCulturalRecord,
} from "../modules/consent-gate";
import { buildInitialSeedBundle } from "./seed-data";
import { buildTraditionsSeedBundle } from "./traditions-seed";

export interface UserWithPasswordHash extends UserAccount {
  passwordHash: string;
}

export interface CreateRecordInput {
  slug?: string;
  traditionId?: string | null;
  traditionSlug?: string | null;
  recordOrigin?: RecordOrigin;
  unescoDomain: CulturalRecordAdmin["unescoDomain"];
  category: CulturalRecordAdmin["category"];
  isWomenLed?: boolean;
  isSacredOrRestricted?: boolean;
  practitionerFullNamePrivate?: string;
  practitionerChosenName: string;
  practitionerCommunityName?: string;
  practitionerVillagePrivate?: string;
  practitionerTaluka?: string;
  practitionerPhonePrivate?: string;
  practitionerAddressPrivate?: string;
  stateId: string;
  districtId?: string | null;
  talukaId?: string | null;
  cityTownId?: string | null;
  sourceAttribution?: string | null;
  sourceUrl?: string | null;
  exactLatPrivate?: number | null;
  exactLngPrivate?: number | null;
  titleEn: string;
  titleMr?: string;
  subtitleEn?: string;
  summaryEn: string;
  summaryMr?: string;
  practiceContextEn?: string;
  practiceContextMr?: string;
  tags?: string[];
  heroImageUrl?: string;
  originalVoiceLanguage?: string;
  originalVoiceAudioUrl?: string | null;
  originalVoiceTranscriptMr?: string | null;
  mediationM1SubtitlesEn?: string | null;
  mediationM2SyntheticContextText?: string | null;
  mediationM3HumanStoryCompanionText?: string | null;
  mediationM3NarratorCredit?: string | null;
  storyCompanionPrompts?: CulturalRecordAdmin["storyCompanionPrompts"];
  vocabulary?: Array<{
    termRoman: string;
    termDevanagari: string;
    languageCode?: string;
    meaningEn: string;
    meaningMr?: string;
    misunderstoodNote?: string;
  }>;
}

export interface UpdateRightsPassportInput {
  consentTakingPart?: boolean;
  consentBeingRecorded?: boolean;
  consentPublicUse?: boolean;
  consentMode?: CulturalRightsPassport["consentMode"];
  witnessNamePrivate?: string | null;
  consentSignedAt?: string | null;
  statements?: Partial<CulturalRightsPassport["statements"]>;
  identityDisplay?: CulturalRightsPassport["identityDisplay"];
  locationGranularity?: CulturalRightsPassport["locationGranularity"];
  audioVideoAccess?: CulturalRightsPassport["audioVideoAccess"];
  translationScope?: CulturalRightsPassport["translationScope"];
  allowedTranslationLanguages?: string[];
  aiUse?: CulturalRightsPassport["aiUse"];
  downloadReuse?: CulturalRightsPassport["downloadReuse"];
  commercialUse?: CulturalRightsPassport["commercialUse"];
  contactMode?: CulturalRightsPassport["contactMode"];
  withdrawalStatus?: CulturalRightsPassport["withdrawalStatus"];
  practitionerConfirmedAt?: string | null;
  preReleaseReconfirmedAt?: string | null;
}

export interface AddProvenanceStepInput {
  stepType: ProvenanceStep;
  performedByUserId: string | null;
  performedByRole: UserRole | "SYSTEM_DEMO_SEED";
  performedByDisplay: string;
  practitionerApproved: boolean;
  versionLabel: string;
  notes: string;
}

export interface CultureMapRepository {
  readonly driverName: SqliteDriverName;
  readonly dbPath: string;
  readonly migratedFromPortableCount: number;
  close(): void;
  runMigrations(): string[];
  countUsers(): number;
  findUserByEmail(email: string): UserWithPasswordHash | null;
  findUserById(id: string): UserAccount | null;
  listUsers(): UserAccount[];
  createUser(input: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    accountType?: AccountPersonaType;
    bio?: string;
    phone?: string;
    locationLabel?: string;
    organisationOrGuild?: string;
    preferredLanguage?: string;
    linkedPractitionerId?: string | null;
    linkedSellerId?: string | null;
    linkedHerCraftId?: string | null;
  }): UserAccount;
  updateUserProfile(
    userId: string,
    patch: {
      fullName?: string;
      bio?: string;
      phone?: string;
      locationLabel?: string;
      organisationOrGuild?: string;
      preferredLanguage?: string;
      accountType?: AccountPersonaType;
      currentPassword?: string;
      newPassword?: string;
    }
  ): UserAccount;
  adminUpdateUser(
    userId: string,
    patch: {
      role?: UserRole;
      accountType?: AccountPersonaType;
      linkedPractitionerId?: string | null;
      linkedSellerId?: string | null;
      linkedHerCraftId?: string | null;
      isActive?: boolean;
      fullName?: string;
    }
  ): UserAccount;
  listDemoAccounts(): DemoAccountSpec[];
  loginOrProvisionDemoAccount(email: string): UserAccount;

  listLocations(): GeoLocation[];
  getLocationById(id: string): GeoLocation | null;
  createLocation(input: {
    id?: string;
    level: GeoLocation["level"];
    nameEn: string;
    nameMr?: string;
    abbr?: string;
    parentId: string | null;
    centerLat: number;
    centerLng: number;
    defaultZoom?: number;
  }): GeoLocation;
  getPlaceDetail(idOrSlug: string): PlaceDetailPayload | null;
  getGeographyMetadata(): GeographyDatasetMetadata;

  queryPublicCalendar(filter?: CalendarQueryFilter): CalendarQueryPayload;
  getPublicEventById(id: string): CulturalEventItem | null;
  getAdminEventById(id: string): CulturalEventAdmin | null;
  listPublicEvents(filter?: {
    stateId?: string;
    districtId?: string;
    category?: string;
  }): CulturalEventItem[];
  listAdminEvents(): CulturalEventAdmin[];
  createCulturalEvent(
    input: Partial<CulturalEventAdmin>,
    actor?: UserAccount | null
  ): CulturalEventAdmin;
  updateCulturalEvent(
    id: string,
    patch: Partial<CulturalEventAdmin>,
    actor?: UserAccount | null
  ): CulturalEventAdmin;
  publishCulturalEvent(id: string, actor: UserAccount): CulturalEventAdmin;
  updateCulturalEventStatus(
    id: string,
    status: EventWorkflowStatus,
    scheduleStatus?: EventScheduleStatus,
    cancellationReason?: string | null
  ): CulturalEventAdmin;
  submitPublicCulturalEvent(
    input: Partial<CulturalEventAdmin> & {
      submittedByPublicName: string;
      submittedByPublicContact: string;
    }
  ): CulturalEventAdmin;

  createCommunityEnquiry(input: {
    enquiryType: CommunityEnquiryType;
    culturalRecordId?: string | null;
    locationId?: string | null;
    eventId?: string | null;
    senderName: string;
    senderContact: string;
    message: string;
  }): CommunityEnquiryItem;
  generateTripPlan(input: TripPlannerRequest): TripPlan;
  saveTripPlan(plan: Partial<TripPlan> & { startDate: string }): TripPlan;
  updateTripPlan(id: string, patch: Partial<TripPlan>): TripPlan;
  getTripPlanById(id: string): TripPlan | null;

  listCommunityEnquiries(): CommunityEnquiryItem[];
  updateCommunityEnquiryStatus(
    id: string,
    status: "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED"
  ): CommunityEnquiryItem;

  listAdminRecords(filter?: {
    origin?: RecordOrigin;
    status?: RecordStatus;
  }): CulturalRecordAdmin[];
  getAdminRecordById(id: string): CulturalRecordAdmin | null;
  getAdminRecordBySlug(slug: string): CulturalRecordAdmin | null;
  createCulturalRecord(
    input: CreateRecordInput,
    actor: UserAccount
  ): CulturalRecordAdmin;
  updateCulturalRecord(
    id: string,
    patch: Partial<CreateRecordInput>,
    actor: UserAccount
  ): CulturalRecordAdmin;
  updateRightsPassport(
    recordId: string,
    input: UpdateRightsPassportInput,
    actor: UserAccount
  ): CulturalRecordAdmin;
  addProvenanceStep(
    recordId: string,
    input: AddProvenanceStepInput
  ): CulturalRecordAdmin;
  publishCulturalRecord(
    recordId: string,
    actor: UserAccount,
    notes?: string
  ): CulturalRecordAdmin;
  restrictOrWithdrawRecord(
    recordId: string,
    action: "RESTRICTED" | "WITHDRAWN",
    actor: UserAccount,
    reason: string
  ): CulturalRecordAdmin;

  listPublicRecords(filter?: {
    origin?: RecordOrigin;
    category?: string;
    stateId?: string;
    districtId?: string;
    cityTownId?: string;
    traditionId?: string;
  }): PublicCulturalRecord[];
  getPublicRecordBySlug(slug: string): PublicCulturalRecord | null;
  getMapDiscoveryPayload(includeDemo?: boolean): MapDiscoveryPayload;

  queryPublicTraditions(filter?: TraditionQueryFilter): TraditionDirectoryPayload;
  getPublicTraditionBySlug(slugOrId: string): TraditionDetail | null;
  listPublicSources(filter?: {
    traditionId?: string;
    culturalRecordId?: string;
    locationId?: string;
  }): SourceCitation[];
  listPublicMediaAssets(filter?: {
    traditionId?: string;
    culturalRecordId?: string;
    mediaType?: MediaAssetType | string;
  }): MediaAssetItem[];

  listAdminTraditions(): TraditionAdmin[];
  createTradition(
    input: Partial<TraditionAdmin>,
    actor?: UserAccount | null
  ): TraditionAdmin;
  updateTradition(
    idOrSlug: string,
    patch: Partial<TraditionAdmin>,
    actor?: UserAccount | null
  ): TraditionAdmin;
  addTraditionPlaceAssociation(
    input: Partial<TraditionPlaceAssociation> & {
      traditionId: string;
      locationId: string;
      stateId?: string;
    },
    actor?: UserAccount | null
  ): TraditionPlaceAssociation;
  removeTraditionPlaceAssociation(
    id: string,
    actor?: UserAccount | null
  ): boolean;
  listAdminSources(): SourceCitation[];
  createSourceCitation(
    input: Partial<SourceCitation>,
    actor?: UserAccount | null
  ): SourceCitation;
  listAdminMediaAssets(): MediaAssetItem[];
  createMediaAsset(
    input: Partial<MediaAssetItem>,
    actor?: UserAccount | null
  ): MediaAssetItem;
  updateMediaAsset(
    id: string,
    patch: Partial<MediaAssetItem>,
    actor?: UserAccount | null
  ): MediaAssetItem;

  listPractitioners(filter?: {
    q?: string;
    stateName?: string;
    traditionSlug?: string;
    availabilityStatus?: string;
    includeUnpublished?: boolean;
  }): PractitionerProfile[];
  getPractitionerBySlug(slugOrId: string): PractitionerProfile | null;
  createPractitioner(input: Partial<PractitionerProfile>): PractitionerProfile;
  updatePractitioner(
    idOrSlug: string,
    patch: Partial<PractitionerProfile>
  ): PractitionerProfile;

  listArtMartSellers(): ArtMartSeller[];
  getArtMartSellerBySlug(slugOrId: string): ArtMartSeller | null;
  listArtMartProducts(filter?: {
    q?: string;
    category?: string;
    stateName?: string;
    traditionSlug?: string;
    sellerId?: string;
    sortBy?: string;
    includeUnpublished?: boolean;
  }): ArtMartProduct[];
  getArtMartProductBySlug(slugOrId: string): ArtMartProduct | null;
  createArtMartProduct(input: Partial<ArtMartProduct>): ArtMartProduct;
  updateArtMartProduct(
    idOrSlug: string,
    patch: Partial<ArtMartProduct>
  ): ArtMartProduct;
  listArtMartOrders(buyerEmail?: string): ArtMartOrder[];
  createArtMartOrder(input: {
    buyerName: string;
    buyerEmail: string;
    shippingCity: string;
    shippingState: string;
    shippingAddressLabel: string;
    paymentMethodLabel?: string;
    items: Array<{ productId: string; quantity: number }>;
  }): ArtMartOrder;
  updateArtMartOrderStatus(
    id: string,
    status: ArtMartOrder["status"]
  ): ArtMartOrder;

  listIndustryMaterials(filter?: {
    q?: string;
    materialCategory?: string;
    includePending?: boolean;
  }): IndustryMaterialListing[];
  createIndustryMaterial(
    input: Partial<IndustryMaterialListing>
  ): IndustryMaterialListing;
  updateIndustryMaterialStatus(
    id: string,
    adminReviewStatus: IndustryMaterialListing["adminReviewStatus"],
    availabilityStatus?: IndustryMaterialListing["availabilityStatus"]
  ): IndustryMaterialListing;
  listIndustryRequests(materialId?: string): IndustryMaterialRequest[];
  createIndustryRequest(
    input: Partial<IndustryMaterialRequest> & {
      materialId: string;
      artisanName: string;
      intendedCraftUse: string;
    }
  ): IndustryMaterialRequest;
  updateIndustryRequestStatus(
    id: string,
    collaborationStatus: IndustryMaterialRequest["collaborationStatus"],
    adminReviewerNote?: string,
    linkedArtMartProductId?: string | null
  ): IndustryMaterialRequest;

  listEcosystemResources(filter?: {
    q?: string;
    organisationType?: string;
    relationshipStatus?: string;
    stateScope?: string;
  }): EcosystemResourceItem[];
  createEcosystemResource(
    input: Partial<EcosystemResourceItem>
  ): EcosystemResourceItem;
  updateEcosystemResource(
    id: string,
    patch: Partial<EcosystemResourceItem>
  ): EcosystemResourceItem;

  queryHerCraftDirectory(filter?: {
    q?: string;
    craftCategory?: string;
    enterpriseType?: string;
    stateName?: string;
    districtName?: string;
    traditionSlug?: string;
    opportunityType?: string;
    includePending?: boolean;
  }): HerCraftDirectoryPayload;
  getHerCraftEnterpriseBySlug(
    slugOrId: string,
    includePending?: boolean
  ): {
    enterprise: HerCraftEnterprise;
    relatedProducts: ArtMartProduct[];
    linkedPractitioner: PractitionerProfile | null;
    opportunities: HerCraftOpportunity[];
  } | null;
  createHerCraftEnterprise(
    input: Partial<HerCraftEnterprise>,
    actor?: UserAccount | null
  ): HerCraftEnterprise;
  updateHerCraftEnterprise(
    idOrSlug: string,
    patch: Partial<HerCraftEnterprise>,
    actor?: UserAccount | null
  ): HerCraftEnterprise;
  createHerCraftOpportunity(
    input: Partial<HerCraftOpportunity>,
    actor?: UserAccount | null
  ): HerCraftOpportunity;
  updateHerCraftOpportunity(
    id: string,
    patch: Partial<HerCraftOpportunity>,
    actor?: UserAccount | null
  ): HerCraftOpportunity;
}

export function evaluateMediaPublicationGate(asset: MediaAssetItem): {
  allowed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (asset.publicationStatus !== "PUBLISHED") {
    reasons.push(`Media workflow status is "${asset.publicationStatus}" (must be PUBLISHED).`);
  }
  if (asset.rightsStatus === "RESTRICTED") {
    reasons.push("Media rights status is RESTRICTED and cannot be published publicly.");
  } else if (asset.rightsStatus === "UNVERIFIED") {
    reasons.push("Media rights and licence status is UNVERIFIED.");
  } else if (asset.rightsStatus === "OPEN_LICENSE_VERIFIED") {
    if (!asset.licenseIdentifier?.trim()) {
      reasons.push("OPEN_LICENSE_VERIFIED media must specify a licenseIdentifier (e.g. CC BY-SA 4.0, CC0 1.0).");
    }
    if (!asset.sourcePageUrl?.trim()) {
      reasons.push("OPEN_LICENSE_VERIFIED media must include a verifiable sourcePageUrl.");
    }
    if (!asset.attributionText?.trim()) {
      reasons.push("OPEN_LICENSE_VERIFIED media must include attributionText.");
    }
    if (!asset.directMediaUrl?.trim() && !asset.embedUrl?.trim()) {
      reasons.push("OPEN_LICENSE_VERIFIED media must include a directMediaUrl or embedUrl.");
    }
  } else if (asset.rightsStatus === "EMBED_ONLY") {
    if (!asset.embedUrl?.trim()) {
      reasons.push("EMBED_ONLY media must specify an approved institutional embedUrl.");
    }
    if (!asset.sourcePageUrl?.trim()) {
      reasons.push("EMBED_ONLY media must specify the official sourcePageUrl.");
    }
  } else if (
    asset.rightsStatus === "PERMISSION_REQUIRED" ||
    asset.rightsStatus === "CONSENT_REQUIRED"
  ) {
    if (!asset.permissionEvidence?.trim()) {
      reasons.push(
        `Written permission or signed consent evidence is required for ${asset.rightsStatus} media.`
      );
    }
  }
  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function formatEvidenceStatusLabel(status: EvidenceStatus): string {
  switch (status) {
    case "OFFICIAL_INSTITUTIONAL":
      return "Official / Institutional Documentation";
    case "ACADEMIC_SPECIALIST":
      return "Academic / Specialist Research";
    case "PRACTITIONER_CONFIRMED":
      return "Practitioner-Confirmed Knowledge";
    case "COMMUNITY_CONTRIBUTED":
      return "Community-Contributed (Review Pending)";
    default:
      return "Unverified / Incomplete Information";
  }
}


export const TRADITION_SLUG_ALIASES: Record<string, string> = {
  "powada-and-gondhal-oral-balladry": "powada-and-gondhal",
  "powada-and-gondhal": "powada-and-gondhal-oral-balladry",
  "mallakhamb-maharashtra": "mallakhamb",
  "mallakhamb": "mallakhamb-maharashtra",
  "kushti-and-talim-tradition-kolhapur": "kushti-and-mardani-khel",
  "kushti-and-mardani-khel": "kushti-and-talim-tradition-kolhapur",
  "odissi-classical-dance": "odissi",
  "odissi": "odissi-classical-dance",
  "pattachitra-scroll-painting": "pattachitra",
  "pattachitra": "pattachitra-scroll-painting",
  "madhubani-mithila-painting": "madhubani-painting",
  "madhubani-painting": "madhubani-mithila-painting",
  "garba-of-gujarat": "garba",
  "garba": "garba-of-gujarat",
  "bihu-festival-and-dance-assam": "bihu",
  "bihu": "bihu-festival-and-dance-assam",
  "patan-patola-double-ikat": "patan-patola",
  "patan-patola": "patan-patola-double-ikat",
};

function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

function toMapRecordSummary(r: PublicCulturalRecord): MapRecordSummary {
  return {
    id: r.id,
    slug: r.slug,
    traditionSlug: r.traditionSlug || null,
    heroImageUrl: r.heroImageUrl || null,
    name: r.titleEn,
    nameMr: r.titleMr || undefined,
    category: r.category,
    description: r.summaryEn,
    recordOrigin: r.recordOrigin,
    originBadgeLabel: r.originBadgeLabel,
    verificationStateLabel: r.verificationStateLabel,
    sourceAttribution: r.sourceAttribution,
    sourceUrl: r.sourceUrl,
    creditedPractitionerLabel: r.creditedPractitionerLabel,
    displayLocationLabel: r.displayLocationLabel,
    locationGranularity: r.locationGranularity,
    stateName: r.stateName,
    districtName: r.districtName,
    talukaName: r.talukaName,
    cityTownName: r.cityTownName,
    publicCenter: r.publicCenter,
  };
}

export function evaluateEventPublicationGate(event: CulturalEventAdmin): {
  allowed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (
    event.isPrivateOrRestrictedCeremony ||
    event.visitorAccess === "RESTRICTED_OR_PRIVATE"
  ) {
    reasons.push(
      "Private or restricted ceremonies cannot be published to the public Cultural Calendar."
    );
  }
  if (!event.sourceAttribution || !event.sourceAttribution.trim()) {
    reasons.push(
      "A documented source or official organizer attribution is required before publishing an event."
    );
  }
  if (!event.titleEn || !event.titleEn.trim()) {
    reasons.push("Event title (English) is required.");
  }
  if (!event.startDate || !event.startDate.trim()) {
    reasons.push("Event start date is required.");
  }
  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function toPublicCulturalEvent(
  event: CulturalEventAdmin,
  loc: {
    state?: GeoLocation | null;
    district?: GeoLocation | null;
    taluka?: GeoLocation | null;
    cityTown?: GeoLocation | null;
  },
  linkedRecord?: CulturalRecordAdmin | null
): CulturalEventItem {
  const stateName = loc.state?.nameEn || event.stateName || "Maharashtra";
  const rawDistrictName = loc.district?.nameEn || event.districtName || null;
  const rawTalukaName = loc.taluka?.nameEn || event.talukaName || null;
  const rawCityTownName = loc.cityTown?.nameEn || event.cityTownName || null;

  const stateCenter = loc.state
    ? { lat: loc.state.centerLat, lng: loc.state.centerLng }
    : { lat: 19.2, lng: 75.3 };
  const districtCenter = loc.district
    ? { lat: loc.district.centerLat, lng: loc.district.centerLng }
    : null;
  const talukaCenter = loc.taluka
    ? { lat: loc.taluka.centerLat, lng: loc.taluka.centerLng }
    : null;
  const cityCenter = loc.cityTown
    ? { lat: loc.cityTown.centerLat, lng: loc.cityTown.centerLng }
    : null;

  let exposedDistrictName: string | null = rawDistrictName;
  let exposedTalukaName: string | null = rawTalukaName;
  let exposedCityTownName: string | null = rawCityTownName;
  let exposedVenueLabel = event.venueLabel || rawCityTownName || stateName;
  let publicCenter: { lat: number; lng: number } | null = null;

  switch (event.locationGranularity) {
    case "HIDDEN":
      exposedDistrictName = null;
      exposedTalukaName = null;
      exposedCityTownName = null;
      exposedVenueLabel = `${stateName} (Protected Location — Exact Venue Masked)`;
      publicCenter = null;
      break;
    case "DISTRICT":
      exposedDistrictName = rawDistrictName;
      exposedTalukaName = null;
      exposedCityTownName = null;
      exposedVenueLabel = `${rawDistrictName || stateName} (District-level visibility)`;
      publicCenter = districtCenter || stateCenter;
      break;
    case "TALUKA":
      exposedDistrictName = rawDistrictName;
      exposedTalukaName = rawTalukaName;
      exposedCityTownName = null;
      publicCenter = talukaCenter || districtCenter || stateCenter;
      break;
    case "CITY_TOWN":
    case "VILLAGE":
      publicCenter =
        event.center || cityCenter || talukaCenter || districtCenter || stateCenter;
      break;
    case "EXACT_WORKSHOP":
      if (
        event.exactLatPrivate !== null &&
        event.exactLatPrivate !== undefined &&
        event.exactLngPrivate !== null &&
        event.exactLngPrivate !== undefined
      ) {
        publicCenter = {
          lat: Number(event.exactLatPrivate),
          lng: Number(event.exactLngPrivate),
        };
      } else {
        publicCenter =
          event.center || cityCenter || talukaCenter || districtCenter || stateCenter;
      }
      break;
    default:
      publicCenter =
        event.center || cityCenter || talukaCenter || districtCenter || stateCenter;
      break;
  }

  return {
    id: event.id,
    titleEn: event.titleEn,
    titleMr: event.titleMr || "",
    category: event.category,
    eventType: event.eventType || "CULTURAL_GATHERING",
    descriptionEn: event.descriptionEn,
    descriptionMr: event.descriptionMr || "",
    culturalRecordId: linkedRecord ? linkedRecord.id : event.culturalRecordId || null,
    culturalRecordSlug: linkedRecord
      ? linkedRecord.slug
      : event.culturalRecordSlug || null,
    culturalRecordTitle: linkedRecord
      ? linkedRecord.titleEn
      : event.culturalRecordTitle || null,
    stateId: event.stateId,
    districtId: exposedDistrictName ? event.districtId : null,
    talukaId: exposedTalukaName ? event.talukaId : null,
    cityTownId: exposedCityTownName ? event.cityTownId : null,
    stateName,
    districtName: exposedDistrictName,
    talukaName: exposedTalukaName,
    cityTownName: exposedCityTownName,
    venueLabel: exposedVenueLabel,
    locationGranularity: event.locationGranularity || "CITY_TOWN",
    center: publicCenter || districtCenter || stateCenter,
    publicCenter,
    startDate: event.startDate,
    endDate: event.endDate || null,
    startTime: event.startTime || null,
    endTime: event.endTime || null,
    timezone: event.timezone || "Asia/Kolkata",
    scheduleStatus: event.scheduleStatus || "CONFIRMED",
    cancellationReason: event.cancellationReason || null,
    isRecurringTradition: Boolean(event.isRecurringTradition),
    recurrencePattern: event.recurrencePattern || "SINGLE_OCCURRENCE",
    recurrenceNote: event.recurrenceNote || "",
    occurrences: event.occurrences || [],
    organizerDisplay: event.organizerDisplay || "Regional Cultural Organizer",
    organizerContactAuthorized: Boolean(event.organizerContactAuthorized),
    organizerPublicContact: event.organizerContactAuthorized
      ? event.organizerPublicContact || null
      : null,
    organizerWebsiteUrl: event.organizerContactAuthorized
      ? event.organizerWebsiteUrl || null
      : event.organizerWebsiteUrl || null,
    sourceAttribution: event.sourceAttribution || "",
    sourceUrl: event.sourceUrl || null,
    lastVerifiedAt: event.lastVerifiedAt || null,
    verifiedByDisplay: event.verifiedByDisplay || null,
    visitorAccess: event.visitorAccess || "ACCESS_NOT_ESTABLISHED",
    visitorAccessNote: event.visitorAccessNote || "",
    registrationRequirement: event.registrationRequirement || "NOT_ESTABLISHED",
    etiquetteNotes: event.etiquetteNotes || "",
    photographyRule: event.photographyRule || "PERMISSION_REQUIRED_ON_SITE",
    entryFeeInfo: event.entryFeeInfo || null,
    accessibilityInfo: event.accessibilityInfo || null,
    coverImageUrl: event.coverImageUrl || null,
    approvedMediaUrls: event.approvedMediaUrls || [],
    relatedPractitioners: event.relatedPractitioners || [],
    visitorInterests: event.visitorInterests || [],
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export class ModularCultureMapRepository implements CultureMapRepository {
  public readonly driverName: SqliteDriverName;
  public readonly dbPath: string;
  public migratedFromPortableCount = 0;
  private sqliteDb: SqliteDatabaseAdapter | null = null;
  private users = new Map<string, UserWithPasswordHash>();
  private locations = new Map<string, GeoLocation>();
  private records = new Map<string, CulturalRecordAdmin>();
  private events = new Map<string, CulturalEventAdmin>();
  private enquiries = new Map<string, CommunityEnquiryItem>();
  private tripPlans = new Map<string, TripPlan>();
  private traditions = new Map<string, TraditionAdmin>();
  private traditionPlaces = new Map<string, TraditionPlaceAssociation>();
  private sources = new Map<string, SourceCitation>();
  private mediaAssets = new Map<string, MediaAssetItem>();
  private practitioners = new Map<string, PractitionerProfile>();
  private artMartSellers = new Map<string, ArtMartSeller>();
  private artMartProducts = new Map<string, ArtMartProduct>();
  private artMartOrders = new Map<string, ArtMartOrder>();
  private industryMaterials = new Map<string, IndustryMaterialListing>();
  private industryRequests = new Map<string, IndustryMaterialRequest>();
  private ecosystemResources = new Map<string, EcosystemResourceItem>();
  private herCraftEnterprises = new Map<string, HerCraftEnterprise>();
  private herCraftOpportunities = new Map<string, HerCraftOpportunity>();
  private jsonPersistencePath: string | null = null;

  constructor(options?: { dbPath?: string; inMemoryOnly?: boolean }) {
    const dbPath =
      options?.dbPath ||
      process.env.SQLITE_DB_PATH ||
      path.resolve(process.cwd(), "data", "bharat_culturemap.sqlite");
    this.dbPath = dbPath;

    if (!options?.inMemoryOnly) {
      const opened = openSqliteDatabase(dbPath);
      this.sqliteDb = opened.adapter;
      this.driverName = opened.driverName;
      if (!opened.adapter) {
        this.jsonPersistencePath = `${dbPath}.portable.json`;
      }
    } else {
      this.driverName = "portable-file-store";
    }

    this.initializeStore();
  }

  public close(): void {
    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = null;
    }
  }

  public runMigrations(): string[] {
    if (this.sqliteDb) {
      return applySchemaMigrations(this.sqliteDb);
    }
    return [
      "0001_initial_schema",
      "0002_geography_events_enquiries",
      "0003_cultural_calendar",
      "0004_trip_planner",
      "0005_traditions_sources_media",
      "0006_demo_ecosystem_marketplace",
    ];
  }

  private loadFromSqlite(): void {
    if (!this.sqliteDb) return;

    const userRows = this.sqliteDb.prepare("SELECT * FROM users").all();
    for (const row of userRows) {
      const userRole = (row.role || "PUBLIC_USER") as UserRole;
      this.users.set(row.id, {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        fullName: row.full_name,
        role: userRole,
        accountType: defaultPersonaForRole(
          userRole,
          row.account_type as AccountPersonaType | undefined
        ),
        bio: row.bio || "",
        phone: row.phone || "",
        locationLabel: row.location_label || "",
        organisationOrGuild: row.organisation_or_guild || "",
        preferredLanguage: row.preferred_language || "English",
        linkedPractitionerId: row.linked_practitioner_id || null,
        linkedSellerId: row.linked_seller_id || null,
        linkedHerCraftId: row.linked_hercraft_id || null,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      });
    }

    const locRows = this.sqliteDb.prepare("SELECT * FROM locations").all();
    for (const row of locRows) {
      this.locations.set(row.id, {
        id: row.id,
        level: row.level,
        nameEn: row.name_en,
        nameMr: row.name_mr || undefined,
        abbr: row.abbr || undefined,
        parentId: row.parent_id || null,
        centerLat: Number(row.center_lat),
        centerLng: Number(row.center_lng),
        defaultZoom: Number(row.default_zoom),
      });
    }

    const recRows = this.sqliteDb
      .prepare("SELECT * FROM cultural_records")
      .all();
    const passStmt = this.sqliteDb.prepare(
      "SELECT * FROM rights_passports WHERE cultural_record_id = ?"
    );
    const vocabStmt = this.sqliteDb.prepare(
      "SELECT * FROM heritage_vocabulary WHERE cultural_record_id = ?"
    );
    const provStmt = this.sqliteDb.prepare(
      "SELECT * FROM provenance_logs WHERE cultural_record_id = ? ORDER BY created_at ASC"
    );

    for (const r of recRows) {
      const pRow = passStmt.get(r.id);
      const vRows = vocabStmt.all(r.id);
      const lRows = provStmt.all(r.id);

      const passport: CulturalRightsPassport = pRow
        ? {
            id: pRow.id,
            culturalRecordId: r.id,
            version: Number(pRow.version),
            consentTakingPart: Boolean(pRow.consent_taking_part),
            consentBeingRecorded: Boolean(pRow.consent_being_recorded),
            consentPublicUse: Boolean(pRow.consent_public_use),
            consentMode: pRow.consent_mode,
            witnessNamePrivate: pRow.witness_name_private || null,
            consentSignedAt: pRow.consent_signed_at || null,
            statements: JSON.parse(pRow.statements_json || "{}"),
            identityDisplay: pRow.identity_display,
            locationGranularity: pRow.location_granularity,
            audioVideoAccess: pRow.audio_video_access,
            translationScope: pRow.translation_scope,
            allowedTranslationLanguages: JSON.parse(
              pRow.allowed_translation_languages_json || "[]"
            ),
            aiUse: pRow.ai_use,
            downloadReuse: pRow.download_reuse,
            commercialUse: pRow.commercial_use,
            contactMode: pRow.contact_mode,
            withdrawalStatus: pRow.withdrawal_status,
            practitionerConfirmedAt: pRow.practitioner_confirmed_at || null,
            preReleaseReconfirmedAt: pRow.pre_release_reconfirmed_at || null,
            updatedAt: pRow.updated_at,
          }
        : createDefaultRightsPassport(`pass-${r.id}`, r.id, r.record_origin);

      this.records.set(r.id, {
        id: r.id,
        slug: r.slug,
        traditionId: r.tradition_id || null,
        traditionSlug: r.tradition_slug || null,
        recordOrigin: r.record_origin,
        status: r.status,
        unescoDomain: r.unesco_domain,
        category: r.category,
        isWomenLed: Boolean(r.is_women_led),
        isSacredOrRestricted: Boolean(r.is_sacred_or_restricted),
        practitionerFullNamePrivate: r.practitioner_full_name_private || "",
        practitionerChosenName: r.practitioner_chosen_name || "",
        practitionerCommunityName: r.practitioner_community_name || "",
        practitionerVillagePrivate: r.practitioner_village_private || "",
        practitionerTaluka: r.practitioner_taluka || "",
        practitionerPhonePrivate: r.practitioner_phone_private || "",
        practitionerAddressPrivate: r.practitioner_address_private || "",
        stateId: r.state_id,
        districtId: r.district_id || null,
        talukaId: r.taluka_id || null,
        cityTownId: r.city_town_id || null,
        sourceAttribution: r.source_attribution || null,
        sourceUrl: r.source_url || null,
        exactLatPrivate:
          r.exact_lat_private !== null && r.exact_lat_private !== undefined
            ? Number(r.exact_lat_private)
            : null,
        exactLngPrivate:
          r.exact_lng_private !== null && r.exact_lng_private !== undefined
            ? Number(r.exact_lng_private)
            : null,
        titleEn: r.title_en,
        titleMr: r.title_mr || "",
        subtitleEn: r.subtitle_en || "",
        summaryEn: r.summary_en,
        summaryMr: r.summary_mr || "",
        practiceContextEn: r.practice_context_en || "",
        practiceContextMr: r.practice_context_mr || "",
        tags: JSON.parse(r.tags_json || "[]"),
        heroImageUrl: r.hero_image_url,
        originalVoiceLanguage: r.original_voice_language,
        originalVoiceAudioUrl: r.original_voice_audio_url || null,
        originalVoiceTranscriptMr: r.original_voice_transcript_mr || null,
        mediationM1SubtitlesEn: r.mediation_m1_subtitles_en || null,
        mediationM2SyntheticContextText:
          r.mediation_m2_synthetic_context_text || null,
        mediationM3HumanStoryCompanionText:
          r.mediation_m3_human_story_companion_text || null,
        mediationM3NarratorCredit: r.mediation_m3_narrator_credit || null,
        storyCompanionPrompts: JSON.parse(
          r.story_companion_prompts_json || "[]"
        ),
        vocabulary: vRows.map((v: any) => ({
          id: v.id,
          culturalRecordId: v.cultural_record_id,
          termRoman: v.term_roman,
          termDevanagari: v.term_devanagari,
          languageCode: v.language_code,
          meaningEn: v.meaning_en,
          meaningMr: v.meaning_mr || "",
          misunderstoodNote: v.misunderstood_note || "",
        })),
        rightsPassport: passport,
        provenanceLogs: lRows.map((l: any) => ({
          id: l.id,
          culturalRecordId: l.cultural_record_id,
          stepType: l.step_type,
          performedByUserId: l.performed_by_user_id || null,
          performedByRole: l.performed_by_role,
          performedByDisplay: l.performed_by_display,
          practitionerApproved: Boolean(l.practitioner_approved),
          practitionerApprovedAt: l.practitioner_approved_at || null,
          versionLabel: l.version_label,
          notes: l.notes,
          createdAt: l.created_at,
        })),
        publishedAt: r.published_at || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }

    try {
      const evtRows = this.sqliteDb.prepare("SELECT * FROM cultural_events").all();
      for (const e of evtRows) {
        const st = this.locations.get(e.state_id);
        const dist = e.district_id ? this.locations.get(e.district_id) : null;
        const tal = e.taluka_id ? this.locations.get(e.taluka_id) : null;
        const ct = e.city_town_id ? this.locations.get(e.city_town_id) : null;
        const linkedRec = e.cultural_record_id
          ? this.records.get(e.cultural_record_id) || null
          : null;
        const wfStatus = (e.workflow_status || e.status || "PUBLISHED") as EventWorkflowStatus;
        const adminEvt: CulturalEventAdmin = {
          id: e.id,
          titleEn: e.title_en,
          titleMr: e.title_mr || "",
          category: e.category,
          eventType: e.event_type || "CULTURAL_GATHERING",
          descriptionEn: e.description_en,
          descriptionMr: e.description_mr || "",
          culturalRecordId: e.cultural_record_id || null,
          culturalRecordSlug: linkedRec?.slug || null,
          culturalRecordTitle: linkedRec?.titleEn || null,
          stateId: e.state_id,
          districtId: e.district_id || null,
          talukaId: e.taluka_id || null,
          cityTownId: e.city_town_id || null,
          stateName: st?.nameEn || "Maharashtra",
          districtName: dist?.nameEn || null,
          talukaName: tal?.nameEn || null,
          cityTownName: ct?.nameEn || null,
          venueLabel: e.venue_label || "",
          locationGranularity: e.location_granularity || "CITY_TOWN",
          center: { lat: Number(e.center_lat), lng: Number(e.center_lng) },
          publicCenter: { lat: Number(e.center_lat), lng: Number(e.center_lng) },
          exactLatPrivate:
            e.exact_lat_private !== null && e.exact_lat_private !== undefined
              ? Number(e.exact_lat_private)
              : null,
          exactLngPrivate:
            e.exact_lng_private !== null && e.exact_lng_private !== undefined
              ? Number(e.exact_lng_private)
              : null,
          startDate: e.start_date,
          endDate: e.end_date || null,
          startTime: e.start_time || null,
          endTime: e.end_time || null,
          timezone: e.timezone || "Asia/Kolkata",
          scheduleStatus: e.schedule_status || "CONFIRMED",
          cancellationReason: e.cancellation_reason || null,
          isRecurringTradition: Boolean(e.is_recurring_tradition),
          recurrencePattern: e.recurrence_pattern || "SINGLE_OCCURRENCE",
          recurrenceNote: e.recurrence_note || "",
          occurrences: JSON.parse(e.occurrences_json || "[]"),
          organizerDisplay: e.organizer_display || "",
          organizerContactAuthorized: Boolean(e.organizer_contact_authorized),
          organizerPublicContact: e.organizer_public_contact || null,
          organizerWebsiteUrl: e.organizer_website_url || null,
          organizerPrivateContact: e.organizer_private_contact || "",
          sourceAttribution: e.source_attribution || "",
          sourceUrl: e.source_url || null,
          lastVerifiedAt: e.last_verified_at || null,
          verifiedByDisplay: e.verified_by_display || null,
          visitorAccess: e.visitor_access || "OPEN_PUBLIC",
          visitorAccessNote: e.visitor_access_note || "",
          registrationRequirement: e.registration_requirement || "NONE",
          etiquetteNotes: e.etiquette_notes || "",
          photographyRule: e.photography_rule || "PERMISSION_REQUIRED_ON_SITE",
          entryFeeInfo: e.entry_fee_info || null,
          accessibilityInfo: e.accessibility_info || null,
          coverImageUrl: e.cover_image_url || null,
          approvedMediaUrls: JSON.parse(e.approved_media_urls_json || "[]"),
          relatedPractitioners: JSON.parse(e.related_practitioners_json || "[]"),
          visitorInterests: JSON.parse(e.visitor_interests_json || "[]"),
          isPrivateOrRestrictedCeremony: Boolean(
            e.is_private_or_restricted_ceremony
          ),
          reviewNotes: e.review_notes || "",
          submittedByPublicName: e.submitted_by_public_name || null,
          submittedByPublicContact: e.submitted_by_public_contact || null,
          status: wfStatus,
          eventPublicationGate: { allowed: true, reasons: [] },
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        };
        adminEvt.eventPublicationGate = evaluateEventPublicationGate(adminEvt);
        this.events.set(e.id, adminEvt);
      }
    } catch {
      // Ignore if cultural_events table not yet created
    }

    try {
      const enqRows = this.sqliteDb
        .prepare("SELECT * FROM community_enquiries ORDER BY created_at DESC")
        .all();
      for (const q of enqRows) {
        this.enquiries.set(q.id, {
          id: q.id,
          enquiryType: q.enquiry_type,
          culturalRecordId: q.cultural_record_id || null,
          locationId: q.location_id || null,
          eventId: q.event_id || null,
          senderName: q.sender_name,
          senderContact: q.sender_contact,
          message: q.message,
          status: q.status,
          createdAt: q.created_at,
        });
      }
    } catch {
      // Ignore if community_enquiries table not yet created
    }

    try {
      const tpRows = this.sqliteDb
        .prepare("SELECT * FROM trip_plans ORDER BY updated_at DESC")
        .all();
      for (const row of tpRows) {
        this.tripPlans.set(row.id, {
          id: row.id,
          title: row.title,
          startDate: row.start_date,
          endDate: row.end_date,
          durationDays: Number(row.duration_days),
          stateId: row.state_id,
          districtId: row.district_id || null,
          placeId: row.place_id || null,
          regionLabel: row.region_label,
          selectedCategories: JSON.parse(row.selected_categories_json || "[]"),
          selectedInterests: JSON.parse(row.selected_interests_json || "[]"),
          confirmedOnly: Boolean(row.confirmed_only),
          days: JSON.parse(row.days_json || "[]"),
          availableCandidates: JSON.parse(
            row.available_candidates_json || "[]"
          ),
          excludedSafeguardSummary: JSON.parse(
            row.excluded_safeguard_summary_json || "[]"
          ),
          disclaimer: row.disclaimer,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    } catch {
      // Ignore if trip_plans table not yet created
    }

    try {
      const tpAssocRows = this.sqliteDb
        .prepare("SELECT * FROM tradition_places")
        .all();
      for (const row of tpAssocRows) {
        const loc = this.locations.get(row.location_id);
        const st = this.locations.get(row.state_id);
        const dist = row.district_id
          ? this.locations.get(row.district_id)
          : null;
        this.traditionPlaces.set(row.id, {
          id: row.id,
          traditionId: row.tradition_id,
          locationId: row.location_id,
          locationNameEn: loc?.nameEn || row.location_id,
          locationNameMr: loc?.nameMr,
          locationLevel: loc?.level || "CITY_TOWN",
          stateId: row.state_id,
          stateName: st?.nameEn || "India",
          districtId: row.district_id || null,
          districtName: dist?.nameEn || null,
          center: {
            lat: loc?.centerLat ?? st?.centerLat ?? 21.15,
            lng: loc?.centerLng ?? st?.centerLng ?? 79.0,
          },
          relationshipRole: row.relationship_role || "PRIMARY_PRACTICE_REGION",
          regionalVariantName: row.regional_variant_name || "",
          notes: row.notes || "",
          isPrimary: Boolean(row.is_primary),
        });
      }
    } catch {
      // Ignore if tradition_places table not yet created
    }

    try {
      const srcRows = this.sqliteDb
        .prepare("SELECT * FROM source_citations ORDER BY created_at ASC")
        .all();
      for (const row of srcRows) {
        this.sources.set(row.id, {
          id: row.id,
          traditionId: row.tradition_id || null,
          culturalRecordId: row.cultural_record_id || null,
          locationId: row.location_id || null,
          sourceTitle: row.source_title,
          sourceOrganisation: row.source_organisation,
          sourceUrl: row.source_url,
          sourceType: row.source_type || "OFFICIAL_INSTITUTIONAL",
          publicationOrInscribedDate: row.publication_or_inscribed_date || null,
          specificFactsSupported: row.specific_facts_supported,
          retrievalDate: row.retrieval_date,
          attributionOrReuseTerms: row.attribution_or_reuse_terms || "",
          evidenceStatus: row.evidence_status || "OFFICIAL_INSTITUTIONAL",
          reviewStatus: row.review_status || "VERIFIED",
          reviewedBy: row.reviewed_by || "Cultural Research Desk",
          lastReviewedAt: row.last_reviewed_at,
          createdAt: row.created_at,
        });
      }
    } catch {
      // Ignore if source_citations table not yet created
    }

    try {
      const mediaRows = this.sqliteDb
        .prepare("SELECT * FROM media_assets ORDER BY created_at ASC")
        .all();
      for (const row of mediaRows) {
        const asset: MediaAssetItem = {
          id: row.id,
          traditionId: row.tradition_id || null,
          culturalRecordId: row.cultural_record_id || null,
          locationId: row.location_id || null,
          mediaType: row.media_type,
          title: row.title,
          caption: row.caption || "",
          altText: row.alt_text || row.title,
          creatorOrPerformer: row.creator_or_performer || "",
          sourceOrganisation: row.source_organisation,
          sourcePageUrl: row.source_page_url,
          directMediaUrl: row.direct_media_url || null,
          embedUrl: row.embed_url || null,
          licenseIdentifier: row.license_identifier,
          licenseUrl: row.license_url || null,
          attributionText: row.attribution_text,
          rightsStatus: row.rights_status,
          permissionEvidence: row.permission_evidence || "",
          language: row.language || "",
          transcriptOrSummary: row.transcript_or_summary || "",
          retrievalDate: row.retrieval_date,
          reviewedAt: row.reviewed_at || null,
          reviewedBy: row.reviewed_by || "",
          publicationStatus: row.publication_status || "PUBLISHED",
          isPrimaryHero: Boolean(row.is_primary_hero),
          createdAt: row.created_at,
        };
        asset.mediaPublicationGate = evaluateMediaPublicationGate(asset);
        this.mediaAssets.set(row.id, asset);
      }
    } catch {
      // Ignore if media_assets table not yet created
    }

    try {
      const tradRows = this.sqliteDb
        .prepare("SELECT * FROM traditions ORDER BY name_en ASC")
        .all();
      for (const row of tradRows) {
        const evStatus = (row.evidence_status ||
          "OFFICIAL_INSTITUTIONAL") as EvidenceStatus;
        this.traditions.set(row.id, {
          id: row.id,
          slug: row.slug,
          nameEn: row.name_en,
          nameNative: row.name_native || "",
          nativeScriptLang: row.native_script_lang || "",
          alternativeNames: JSON.parse(row.alternative_names_json || "[]"),
          traditionCategory: row.tradition_category,
          legacyCategory: row.legacy_category || "Craft",
          subcategory: row.subcategory || "",
          unescoDomain: row.unesco_domain || "Traditional craftsmanship",
          unescoStatus: row.unesco_status || null,
          giTagStatus: row.gi_tag_status || null,
          languages: JSON.parse(row.languages_json || "[]"),
          summary: row.summary,
          culturalDescription: row.cultural_description || "",
          historicalBackground: row.historical_background || "",
          communityContext: row.community_context || "",
          techniquesAndMaterials: JSON.parse(
            row.techniques_and_materials_json || "[]"
          ),
          instrumentsOrForms: JSON.parse(
            row.instruments_or_forms_json || "[]"
          ),
          regionalVariations: JSON.parse(
            row.regional_variations_json || "[]"
          ),
          learningOpportunities: JSON.parse(
            row.learning_opportunities_json || "[]"
          ),
          evidenceStatus: evStatus,
          evidenceStatusLabel: formatEvidenceStatusLabel(evStatus),
          verificationNotes: row.verification_notes || "",
          lastReviewedAt: row.last_reviewed_at,
          reviewedByDisplay: row.reviewed_by_display || "Cultural Research Desk",
          consentAndAccessNote: row.consent_and_access_note || "",
          isSacredOrRestricted: Boolean(row.is_sacred_or_restricted),
          status: row.status || "PUBLISHED",
          primaryHeroMedia: null,
          places: [],
          statesRepresented: [],
          sourceCount: 0,
          mediaCount: 0,
          practitionerRecordCount: 0,
          sources: [],
          mediaAssets: [],
          allMediaAssetsAdmin: [],
          linkedRecords: [],
          relatedEvents: [],
          relatedTraditions: [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    } catch {
      // Ignore if traditions table not yet created
    }

    try {
      const practRows = this.sqliteDb
        .prepare("SELECT * FROM practitioner_profiles ORDER BY display_name ASC")
        .all();
      for (const row of practRows) {
        this.practitioners.set(row.id, {
          id: row.id,
          slug: row.slug,
          displayName: row.display_name,
          roleTitle: row.role_title,
          shortBio: row.short_bio,
          fullNarrative: row.full_narrative,
          stateName: row.state_name,
          districtName: row.district_name || null,
          cityName: row.city_name || null,
          placeId: row.place_id || null,
          languages: JSON.parse(row.languages_json || "[]"),
          specialisations: JSON.parse(row.specialisations_json || "[]"),
          traditionIds: JSON.parse(row.tradition_ids_json || "[]"),
          traditionSlugs: JSON.parse(row.tradition_slugs_json || "[]"),
          traditionTitles: JSON.parse(row.tradition_titles_json || "[]"),
          yearsOfPractice: Number(row.years_of_practice || 5),
          lineageNote: row.lineage_note || "",
          availabilityStatus: row.availability_status || "OPEN_FOR_WORKSHOPS",
          profileImageUrl: row.profile_image_url || "",
          profileImageCredit: row.profile_image_credit || "",
          workshops: JSON.parse(row.workshops_json || "[]"),
          verificationBadge: row.verification_badge || "",
          publicationStatus: row.publication_status || "PUBLISHED",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          demoDisclaimer: row.demo_disclaimer || "",
          ownerUserId: row.owner_user_id || null,
        });
      }
    } catch {
      // Ignore if practitioner_profiles table not yet created
    }

    try {
      const sellerRows = this.sqliteDb
        .prepare("SELECT * FROM art_mart_sellers ORDER BY storefront_name ASC")
        .all();
      for (const row of sellerRows) {
        this.artMartSellers.set(row.id, {
          id: row.id,
          slug: row.slug,
          storefrontName: row.storefront_name,
          craftClusterLabel: row.craft_cluster_label,
          stateName: row.state_name,
          districtName: row.district_name || null,
          cityName: row.city_name || null,
          linkedPractitionerId: row.linked_practitioner_id || null,
          storySummary: row.story_summary,
          verificationNote: row.verification_note || "",
          ratingAverage: Number(row.rating_average || 4.8),
          completedDemoOrders: Number(row.completed_demo_orders || 0),
          publicationStatus: row.publication_status || "PUBLISHED",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          ownerUserId: row.owner_user_id || null,
        });
      }
    } catch {
      // Ignore if art_mart_sellers table not yet created
    }

    try {
      const prodRows = this.sqliteDb
        .prepare("SELECT * FROM art_mart_products ORDER BY title ASC")
        .all();
      for (const row of prodRows) {
        this.artMartProducts.set(row.id, {
          id: row.id,
          slug: row.slug,
          title: row.title,
          category: row.category,
          traditionId: row.tradition_id || null,
          traditionSlug: row.tradition_slug || null,
          traditionTitle: row.tradition_title || null,
          sellerId: row.seller_id,
          sellerSlug: row.seller_slug,
          sellerName: row.seller_name,
          regionLabel: row.region_label,
          stateName: row.state_name,
          districtName: row.district_name || null,
          priceInr: Number(row.price_inr || 0),
          stockQuantity: Number(row.stock_quantity || 0),
          materialsUsed: row.materials_used || "",
          makingProcess: row.making_process || "",
          provenanceNote: row.provenance_note || "",
          description: row.description || "",
          imageUrl: row.image_url || "",
          galleryUrls: JSON.parse(row.gallery_urls_json || "[]"),
          imageCredit: row.image_credit || "",
          industryCollaborationId: row.industry_collaboration_id || null,
          approvalStatus: row.approval_status || "APPROVED",
          publicationStatus: row.publication_status || "PUBLISHED",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          demoDisclaimer: row.demo_disclaimer || "",
        });
      }
    } catch {
      // Ignore if art_mart_products table not yet created
    }

    try {
      const ordRows = this.sqliteDb
        .prepare("SELECT * FROM art_mart_orders ORDER BY created_at DESC")
        .all();
      for (const row of ordRows) {
        this.artMartOrders.set(row.id, {
          id: row.id,
          orderNumber: row.order_number,
          buyerName: row.buyer_name,
          buyerEmail: row.buyer_email,
          shippingCity: row.shipping_city,
          shippingState: row.shipping_state,
          shippingAddressLabel: row.shipping_address_label,
          paymentMethodLabel: row.payment_method_label,
          status: row.status || "CONFIRMED",
          totalInr: Number(row.total_inr || 0),
          items: JSON.parse(row.items_json || "[]"),
          simulationDisclaimer: row.simulation_disclaimer || "",
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    } catch {
      // Ignore if art_mart_orders table not yet created
    }

    try {
      const matRows = this.sqliteDb
        .prepare("SELECT * FROM industry_materials ORDER BY created_at DESC")
        .all();
      for (const row of matRows) {
        this.industryMaterials.set(row.id, {
          id: row.id,
          title: row.title,
          industryOrgLabel: row.industry_org_label,
          materialCategory: row.material_category,
          quantityAvailableLabel: row.quantity_available_label,
          conditionLabel: row.condition_label,
          locationCity: row.location_city,
          locationState: row.location_state,
          pricingTerms: row.pricing_terms || "DONATION_FREE",
          priceNote: row.price_note || "",
          safetyRestrictions: row.safety_restrictions || "",
          suggestedTraditions: JSON.parse(row.suggested_traditions_json || "[]"),
          adminReviewStatus: row.admin_review_status || "APPROVED",
          availabilityStatus: row.availability_status || "AVAILABLE",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          demoDisclaimer: row.demo_disclaimer || "",
          createdAt: row.created_at,
        });
      }
    } catch {
      // Ignore if industry_materials table not yet created
    }

    try {
      const reqRows = this.sqliteDb
        .prepare("SELECT * FROM industry_requests ORDER BY created_at DESC")
        .all();
      for (const row of reqRows) {
        this.industryRequests.set(row.id, {
          id: row.id,
          materialId: row.material_id,
          materialTitle: row.material_title,
          artisanName: row.artisan_name,
          artisanEmail: row.artisan_email,
          traditionTitle: row.tradition_title,
          requestedQuantityLabel: row.requested_quantity_label,
          intendedCraftUse: row.intended_craft_use,
          collaborationStatus:
            row.collaboration_status || "SUBMITTED_BY_ARTISAN",
          adminReviewerNote: row.admin_reviewer_note || "",
          linkedArtMartProductId: row.linked_art_mart_product_id || null,
          linkedArtMartProductSlug: row.linked_art_mart_product_slug || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    } catch {
      // Ignore if industry_requests table not yet created
    }

    try {
      const ecoRows = this.sqliteDb
        .prepare("SELECT * FROM ecosystem_resources ORDER BY title ASC")
        .all();
      for (const row of ecoRows) {
        this.ecosystemResources.set(row.id, {
          id: row.id,
          title: row.title,
          resourceCategory: row.resource_category,
          organisationType: row.organisation_type,
          relationshipStatus: row.relationship_status,
          stateScope: row.state_scope,
          summary: row.summary,
          eligibilityDetails: row.eligibility_details,
          officialUrl: row.official_url,
          lastReviewedDate: row.last_reviewed_date,
          publicationStatus: row.publication_status || "PUBLISHED",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          demoDisclaimer: row.demo_disclaimer || "",
        });
      }
    } catch {
      // Ignore if ecosystem_resources table not yet created
    }

    try {
      const hcEntRows = this.sqliteDb
        .prepare("SELECT * FROM hercraft_enterprises ORDER BY enterprise_name ASC")
        .all();
      for (const row of hcEntRows) {
        this.herCraftEnterprises.set(row.id, {
          id: row.id,
          slug: row.slug,
          enterpriseName: row.enterprise_name,
          leaderOrCollectiveLabel: row.leader_or_collective_label,
          enterpriseType: row.enterprise_type || "WOMEN_SHG",
          craftCategory: row.craft_category,
          traditionId: row.tradition_id || null,
          traditionSlug: row.tradition_slug || null,
          traditionTitle: row.tradition_title || null,
          stateName: row.state_name,
          districtName: row.district_name || null,
          cityName: row.city_name || null,
          placeId: row.place_id || null,
          womenArtisansCount: Number(row.women_artisans_count || 1),
          foundedYear: Number(row.founded_year || 2020),
          shortSummary: row.short_summary,
          storyNarrative: row.story_narrative || "",
          signatureCrafts: JSON.parse(row.signature_crafts_json || "[]"),
          productsAndTechniques: JSON.parse(
            row.products_and_techniques_json || "[]"
          ),
          trainingAndWorkshops: JSON.parse(
            row.training_and_workshops_json || "[]"
          ),
          supportNeeds: JSON.parse(row.support_needs_json || "[]"),
          linkedArtMartProductIds: JSON.parse(
            row.linked_art_mart_product_ids_json || "[]"
          ),
          linkedPractitionerId: row.linked_practitioner_id || null,
          heroImageUrl: row.hero_image_url || "",
          imageCredit: row.image_credit || "",
          sourceAttribution: row.source_attribution || "",
          sourceUrl: row.source_url || "",
          contactOrEnquiryNote: row.contact_or_enquiry_note || "",
          approvalStatus: row.approval_status || "APPROVED",
          publicationStatus: row.publication_status || "PUBLISHED",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          demoDisclaimer: row.demo_disclaimer || "",
          ownerUserId: row.owner_user_id || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    } catch {
      // Ignore if hercraft_enterprises table not yet created
    }

    try {
      const hcOppRows = this.sqliteDb
        .prepare("SELECT * FROM hercraft_opportunities ORDER BY created_at DESC")
        .all();
      for (const row of hcOppRows) {
        this.herCraftOpportunities.set(row.id, {
          id: row.id,
          title: row.title,
          opportunityType: row.opportunity_type || "GOVERNMENT_SCHEME",
          organiserName: row.organiser_name,
          organiserType: row.organiser_type || "GOVERNMENT_MINISTRY",
          relationshipStatus:
            row.relationship_status || "OFFICIAL_PUBLIC_SOURCE",
          stateScope: row.state_scope || "All India",
          eligibilitySummary: row.eligibility_summary,
          benefitSummary: row.benefit_summary,
          applicationOrOfficialUrl: row.application_or_official_url,
          deadlineOrCycleLabel:
            row.deadline_or_cycle_label || "Rolling / Annual Cycle",
          approvalStatus: row.approval_status || "APPROVED",
          publicationStatus: row.publication_status || "PUBLISHED",
          recordOrigin: row.record_origin || "DEMO_SAMPLE",
          demoDisclaimer: row.demo_disclaimer || "",
          createdAt: row.created_at,
        });
      }
    } catch {
      // Ignore if hercraft_opportunities table not yet created
    }
  }

  private initializeStore(): void {
    if (this.sqliteDb) {
      this.loadFromSqlite();

      // If a legacy portable-file-store snapshot exists alongside the SQLite DB,
      // back it up first and merge any users/locations/records into SQLite so no
      // existing data is ever erased, overwritten, or abandoned.
      const legacyPortablePath = `${this.dbPath}.portable.json`;
      if (fs.existsSync(legacyPortablePath)) {
        try {
          const backupPath = `${this.dbPath}.portable.backup.json`;
          if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(legacyPortablePath, backupPath);
          }
          const raw = JSON.parse(fs.readFileSync(legacyPortablePath, "utf8"));
          let migratedCount = 0;

          for (const u of (raw.users || []) as UserWithPasswordHash[]) {
            if (!this.users.has(u.id)) {
              this.users.set(u.id, u);
              migratedCount += 1;
            }
          }
          for (const l of (raw.locations || []) as GeoLocation[]) {
            if (!this.locations.has(l.id)) {
              this.locations.set(l.id, l);
              migratedCount += 1;
            }
          }
          for (const r of (raw.records || []) as CulturalRecordAdmin[]) {
            const existing = this.records.get(r.id);
            if (!existing || (r.updatedAt && r.updatedAt > existing.updatedAt)) {
              this.records.set(r.id, r);
              migratedCount += 1;
            }
          }

          if (migratedCount > 0) {
            this.migratedFromPortableCount = migratedCount;
            this.persistSnapshot();
          }
        } catch {
          // Ignore unreadable legacy snapshot after backup attempt
        }
      }
    } else if (
      this.jsonPersistencePath &&
      fs.existsSync(this.jsonPersistencePath)
    ) {
      try {
        const raw = JSON.parse(
          fs.readFileSync(this.jsonPersistencePath, "utf8")
        );
        for (const u of raw.users || []) this.users.set(u.id, u);
        for (const l of raw.locations || []) this.locations.set(l.id, l);
        for (const r of raw.records || []) this.records.set(r.id, r);
        for (const e of raw.events || []) this.events.set(e.id, e);
        for (const q of raw.enquiries || []) this.enquiries.set(q.id, q);
        for (const tp of raw.tripPlans || []) this.tripPlans.set(tp.id, tp);
        for (const tr of raw.traditions || []) this.traditions.set(tr.id, tr);
        for (const tpa of raw.traditionPlaces || []) this.traditionPlaces.set(tpa.id, tpa);
        for (const sc of raw.sources || []) this.sources.set(sc.id, sc);
        for (const ma of raw.mediaAssets || []) {
          ma.mediaPublicationGate = evaluateMediaPublicationGate(ma);
          this.mediaAssets.set(ma.id, ma);
        }
        for (const pr of raw.practitioners || []) this.practitioners.set(pr.id, pr);
        for (const s of raw.artMartSellers || []) this.artMartSellers.set(s.id, s);
        for (const p of raw.artMartProducts || []) this.artMartProducts.set(p.id, p);
        for (const o of raw.artMartOrders || []) this.artMartOrders.set(o.id, o);
        for (const m of raw.industryMaterials || []) this.industryMaterials.set(m.id, m);
        for (const rq of raw.industryRequests || []) this.industryRequests.set(rq.id, rq);
        for (const ec of raw.ecosystemResources || []) this.ecosystemResources.set(ec.id, ec);
        for (const he of raw.herCraftEnterprises || []) this.herCraftEnterprises.set(he.id, he);
        for (const ho of raw.herCraftOpportunities || []) this.herCraftOpportunities.set(ho.id, ho);
      } catch {
        // Ignore corrupt snapshot and re-seed
      }
    }

    const seed = buildInitialSeedBundle();
    const tradSeed = buildTraditionsSeedBundle();
    let needsPersist = false;

    for (const loc of seed.locations) {
      if (!this.locations.has(loc.id)) {
        this.locations.set(loc.id, loc);
        needsPersist = true;
      }
    }

    for (const tr of tradSeed.traditions) {
      const existingTrad = this.traditions.get(tr.id);
      if (!existingTrad) {
        this.traditions.set(tr.id, tr);
        needsPersist = true;
      } else if (existingTrad.slug !== tr.slug) {
        existingTrad.slug = tr.slug;
        needsPersist = true;
      }
    }

    for (const tpa of tradSeed.traditionPlaces) {
      if (!this.traditionPlaces.has(tpa.id)) {
        this.traditionPlaces.set(tpa.id, tpa);
        needsPersist = true;
      }
    }

    for (const sc of tradSeed.sources) {
      if (!this.sources.has(sc.id)) {
        this.sources.set(sc.id, sc);
        needsPersist = true;
      }
    }

    for (const ma of tradSeed.mediaAssets) {
      if (!this.mediaAssets.has(ma.id)) {
        const assetWithGate = {
          ...ma,
          mediaPublicationGate: evaluateMediaPublicationGate(ma),
        };
        this.mediaAssets.set(ma.id, assetWithGate);
        needsPersist = true;
      }
    }

    // Ensure all seed demoRecords exist even when upgrading an older database that had fewer records,
    // so source_citations and media_assets foreign keys referencing cultural_records(id) never fail.
    for (const rec of seed.demoRecords) {
      if (!this.records.has(rec.id)) {
        this.records.set(rec.id, rec);
        needsPersist = true;
      }
    }

    // Upgrade any legacy DEMO_REFERENCE records that lacked sourceAttribution, had "Prototype placeholder",
    // or had the legacy Kolhapuri Chappal craft image assigned to an unrelated tradition
    const seedRecById = new Map(seed.demoRecords.map((r) => [r.id, r]));
    for (const existingRec of Array.from(this.records.values())) {
      if (existingRec.recordOrigin === "DEMO_REFERENCE") {
        const seedMatch = seedRecById.get(existingRec.id);
        if (
          !existingRec.sourceAttribution ||
          existingRec.practitionerChosenName === "Prototype placeholder"
        ) {
          existingRec.practitionerChosenName = "Community verification pending";
          existingRec.practitionerCommunityName =
            "Regional tradition bearers (verification in progress)";
          existingRec.sourceAttribution =
            seedMatch?.sourceAttribution ||
            "Ministry of Culture Cultural Atlas & Regional Gazetteer Reference";
          existingRec.sourceUrl =
            seedMatch?.sourceUrl || "https://indianculture.gov.in/";
          if (seedMatch?.talukaId && !existingRec.talukaId) {
            existingRec.talukaId = seedMatch.talukaId;
          }
          needsPersist = true;
        }
        if (seedMatch) {
          if (!existingRec.traditionId && seedMatch.traditionId) {
            existingRec.traditionId = seedMatch.traditionId;
            existingRec.traditionSlug = seedMatch.traditionSlug || null;
            needsPersist = true;
          }
          if (
            existingRec.id !== "rec-seed-kolhapur-1" &&
            existingRec.heroImageUrl === "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg"
          ) {
            existingRec.heroImageUrl = seedMatch.heroImageUrl;
            needsPersist = true;
          }
        }
      }
    }

    if (seed.initialEvents) {
      for (const evt of seed.initialEvents) {
        if (!this.events.has(evt.id)) {
          this.events.set(evt.id, evt);
          needsPersist = true;
        }
      }
    }

    for (const pr of DEMO_PRACTITIONERS) {
      if (!this.practitioners.has(pr.id)) {
        this.practitioners.set(pr.id, structuredClone(pr));
        needsPersist = true;
      }
    }
    for (const s of DEMO_ART_MART_SELLERS) {
      if (!this.artMartSellers.has(s.id)) {
        this.artMartSellers.set(s.id, structuredClone(s));
        needsPersist = true;
      }
    }
    for (const p of DEMO_ART_MART_PRODUCTS) {
      if (!this.artMartProducts.has(p.id)) {
        this.artMartProducts.set(p.id, structuredClone(p));
        needsPersist = true;
      }
    }
    for (const o of DEMO_ART_MART_ORDERS) {
      if (!this.artMartOrders.has(o.id)) {
        this.artMartOrders.set(o.id, structuredClone(o));
        needsPersist = true;
      }
    }
    for (const m of DEMO_INDUSTRY_MATERIALS) {
      if (!this.industryMaterials.has(m.id)) {
        this.industryMaterials.set(m.id, structuredClone(m));
        needsPersist = true;
      }
    }
    for (const rq of DEMO_INDUSTRY_REQUESTS) {
      if (!this.industryRequests.has(rq.id)) {
        this.industryRequests.set(rq.id, structuredClone(rq));
        needsPersist = true;
      }
    }
    for (const ec of DEMO_ECOSYSTEM_RESOURCES) {
      if (!this.ecosystemResources.has(ec.id)) {
        this.ecosystemResources.set(ec.id, structuredClone(ec));
        needsPersist = true;
      }
    }
    for (const he of DEMO_HERCRAFT_ENTERPRISES) {
      if (!this.herCraftEnterprises.has(he.id)) {
        this.herCraftEnterprises.set(he.id, structuredClone(he));
        needsPersist = true;
      }
    }
    for (const ho of DEMO_HERCRAFT_OPPORTUNITIES) {
      if (!this.herCraftOpportunities.has(ho.id)) {
        this.herCraftOpportunities.set(ho.id, structuredClone(ho));
        needsPersist = true;
      }
    }

    if (needsPersist) {
      this.persistSnapshot();
    }

    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    const bootstrapName =
      process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Project Lead (Super Admin)";

    if (this.users.size === 0 && bootstrapEmail && bootstrapPassword) {
      this.createUser({
        email: bootstrapEmail,
        password: bootstrapPassword,
        fullName: bootstrapName,
        role: "SUPER_ADMIN",
      });
    }
  }

  private persistSnapshot(): void {
    const validLocId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.locations.has(id.trim())
        ? id.trim()
        : null;
    const validRecId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.records.has(id.trim())
        ? id.trim()
        : null;
    const validTradId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.traditions.has(id.trim())
        ? id.trim()
        : null;
    const validUserId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.users.has(id.trim())
        ? id.trim()
        : null;
    const validEvtId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.events.has(id.trim())
        ? id.trim()
        : null;
    const validPractId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.practitioners.has(id.trim())
        ? id.trim()
        : null;
    const validSellerId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.artMartSellers.has(id.trim())
        ? id.trim()
        : null;
    const validMatId = (id?: string | null): string | null =>
      id && typeof id === "string" && id.trim() && this.industryMaterials.has(id.trim())
        ? id.trim()
        : null;

    if (this.sqliteDb) {
      const upsertUser = this.sqliteDb.prepare(`
        INSERT INTO users (
          id, email, password_hash, full_name, role, account_type,
          bio, phone, location_label, organisation_or_guild, preferred_language,
          linked_practitioner_id, linked_seller_id, linked_hercraft_id,
          is_active, created_at, updated_at
        )
        VALUES (
          @id, @email, @passwordHash, @fullName, @role, @accountType,
          @bio, @phone, @locationLabel, @organisationOrGuild, @preferredLanguage,
          @linkedPractitionerId, @linkedSellerId, @linkedHerCraftId,
          @isActive, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          email = excluded.email,
          password_hash = excluded.password_hash,
          full_name = excluded.full_name,
          role = excluded.role,
          account_type = excluded.account_type,
          bio = excluded.bio,
          phone = excluded.phone,
          location_label = excluded.location_label,
          organisation_or_guild = excluded.organisation_or_guild,
          preferred_language = excluded.preferred_language,
          linked_practitioner_id = excluded.linked_practitioner_id,
          linked_seller_id = excluded.linked_seller_id,
          linked_hercraft_id = excluded.linked_hercraft_id,
          is_active = excluded.is_active,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `);
      const upsertLoc = this.sqliteDb.prepare(`
        INSERT INTO locations (id, level, name_en, name_mr, abbr, parent_id, center_lat, center_lng, default_zoom)
        VALUES (@id, @level, @nameEn, @nameMr, @abbr, @parentId, @centerLat, @centerLng, @defaultZoom)
        ON CONFLICT(id) DO UPDATE SET
          level = excluded.level,
          name_en = excluded.name_en,
          name_mr = excluded.name_mr,
          abbr = excluded.abbr,
          parent_id = excluded.parent_id,
          center_lat = excluded.center_lat,
          center_lng = excluded.center_lng,
          default_zoom = excluded.default_zoom
      `);
      const upsertTrad = this.sqliteDb.prepare(`
        INSERT INTO traditions (
          id, slug, name_en, name_native, native_script_lang, alternative_names_json,
          tradition_category, legacy_category, subcategory, unesco_domain, unesco_status,
          gi_tag_status, languages_json, summary, cultural_description, historical_background,
          community_context, techniques_and_materials_json, instruments_or_forms_json,
          regional_variations_json, learning_opportunities_json, evidence_status,
          verification_notes, last_reviewed_at, reviewed_by_display, consent_and_access_note,
          is_sacred_or_restricted, status, created_at, updated_at
        ) VALUES (
          @id, @slug, @nameEn, @nameNative, @nativeScriptLang, @alternativeNamesJson,
          @traditionCategory, @legacyCategory, @subcategory, @unescoDomain, @unescoStatus,
          @giTagStatus, @languagesJson, @summary, @culturalDescription, @historicalBackground,
          @communityContext, @techniquesAndMaterialsJson, @instrumentsOrFormsJson,
          @regionalVariationsJson, @learningOpportunitiesJson, @evidenceStatus,
          @verificationNotes, @lastReviewedAt, @reviewedByDisplay, @consentAndAccessNote,
          @isSacredOrRestricted, @status, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          name_en = excluded.name_en,
          name_native = excluded.name_native,
          native_script_lang = excluded.native_script_lang,
          alternative_names_json = excluded.alternative_names_json,
          tradition_category = excluded.tradition_category,
          legacy_category = excluded.legacy_category,
          subcategory = excluded.subcategory,
          unesco_domain = excluded.unesco_domain,
          unesco_status = excluded.unesco_status,
          gi_tag_status = excluded.gi_tag_status,
          languages_json = excluded.languages_json,
          summary = excluded.summary,
          cultural_description = excluded.cultural_description,
          historical_background = excluded.historical_background,
          community_context = excluded.community_context,
          techniques_and_materials_json = excluded.techniques_and_materials_json,
          instruments_or_forms_json = excluded.instruments_or_forms_json,
          regional_variations_json = excluded.regional_variations_json,
          learning_opportunities_json = excluded.learning_opportunities_json,
          evidence_status = excluded.evidence_status,
          verification_notes = excluded.verification_notes,
          last_reviewed_at = excluded.last_reviewed_at,
          reviewed_by_display = excluded.reviewed_by_display,
          consent_and_access_note = excluded.consent_and_access_note,
          is_sacred_or_restricted = excluded.is_sacred_or_restricted,
          status = excluded.status,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `);
      const deleteAllTraditionPlaces = this.sqliteDb.prepare(
        "DELETE FROM tradition_places"
      );
      const insertTradPlace = this.sqliteDb.prepare(`
        INSERT INTO tradition_places (
          id, tradition_id, location_id, state_id, district_id, relationship_role,
          regional_variant_name, notes, is_primary
        ) VALUES (
          @id, @traditionId, @locationId, @stateId, @districtId, @relationshipRole,
          @regionalVariantName, @notes, @isPrimary
        )
      `);
      const upsertRec = this.sqliteDb.prepare(`
        INSERT INTO cultural_records (
          id, slug, tradition_id, tradition_slug, record_origin, status, unesco_domain, category, is_women_led, is_sacred_or_restricted,
          practitioner_full_name_private, practitioner_chosen_name, practitioner_community_name,
          practitioner_village_private, practitioner_taluka, practitioner_phone_private, practitioner_address_private,
          state_id, district_id, taluka_id, city_town_id, exact_lat_private, exact_lng_private,
          title_en, title_mr, subtitle_en, summary_en, summary_mr, practice_context_en, practice_context_mr,
          tags_json, hero_image_url, source_attribution, source_url, original_voice_language, original_voice_audio_url, original_voice_transcript_mr,
          mediation_m1_subtitles_en, mediation_m2_synthetic_context_text, mediation_m3_human_story_companion_text,
          mediation_m3_narrator_credit, story_companion_prompts_json, published_at, created_at, updated_at
        ) VALUES (
          @id, @slug, @traditionId, @traditionSlug, @recordOrigin, @status, @unescoDomain, @category, @isWomenLed, @isSacredOrRestricted,
          @practitionerFullNamePrivate, @practitionerChosenName, @practitionerCommunityName,
          @practitionerVillagePrivate, @practitionerTaluka, @practitionerPhonePrivate, @practitionerAddressPrivate,
          @stateId, @districtId, @talukaId, @cityTownId, @exactLatPrivate, @exactLngPrivate,
          @titleEn, @titleMr, @subtitleEn, @summaryEn, @summaryMr, @practiceContextEn, @practiceContextMr,
          @tagsJson, @heroImageUrl, @sourceAttribution, @sourceUrl, @originalVoiceLanguage, @originalVoiceAudioUrl, @originalVoiceTranscriptMr,
          @mediationM1SubtitlesEn, @mediationM2SyntheticContextText, @mediationM3HumanStoryCompanionText,
          @mediationM3NarratorCredit, @storyCompanionPromptsJson, @publishedAt, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          tradition_id = excluded.tradition_id,
          tradition_slug = excluded.tradition_slug,
          record_origin = excluded.record_origin,
          status = excluded.status,
          unesco_domain = excluded.unesco_domain,
          category = excluded.category,
          is_women_led = excluded.is_women_led,
          is_sacred_or_restricted = excluded.is_sacred_or_restricted,
          practitioner_full_name_private = excluded.practitioner_full_name_private,
          practitioner_chosen_name = excluded.practitioner_chosen_name,
          practitioner_community_name = excluded.practitioner_community_name,
          practitioner_village_private = excluded.practitioner_village_private,
          practitioner_taluka = excluded.practitioner_taluka,
          practitioner_phone_private = excluded.practitioner_phone_private,
          practitioner_address_private = excluded.practitioner_address_private,
          state_id = excluded.state_id,
          district_id = excluded.district_id,
          taluka_id = excluded.taluka_id,
          city_town_id = excluded.city_town_id,
          exact_lat_private = excluded.exact_lat_private,
          exact_lng_private = excluded.exact_lng_private,
          title_en = excluded.title_en,
          title_mr = excluded.title_mr,
          subtitle_en = excluded.subtitle_en,
          summary_en = excluded.summary_en,
          summary_mr = excluded.summary_mr,
          practice_context_en = excluded.practice_context_en,
          practice_context_mr = excluded.practice_context_mr,
          tags_json = excluded.tags_json,
          hero_image_url = excluded.hero_image_url,
          source_attribution = excluded.source_attribution,
          source_url = excluded.source_url,
          original_voice_language = excluded.original_voice_language,
          original_voice_audio_url = excluded.original_voice_audio_url,
          original_voice_transcript_mr = excluded.original_voice_transcript_mr,
          mediation_m1_subtitles_en = excluded.mediation_m1_subtitles_en,
          mediation_m2_synthetic_context_text = excluded.mediation_m2_synthetic_context_text,
          mediation_m3_human_story_companion_text = excluded.mediation_m3_human_story_companion_text,
          mediation_m3_narrator_credit = excluded.mediation_m3_narrator_credit,
          story_companion_prompts_json = excluded.story_companion_prompts_json,
          published_at = excluded.published_at,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `);
      const deleteConflictingPass = this.sqliteDb.prepare(
        "DELETE FROM rights_passports WHERE cultural_record_id = ? AND id != ?"
      );
      const upsertPass = this.sqliteDb.prepare(`
        INSERT INTO rights_passports (
          id, cultural_record_id, version, consent_taking_part, consent_being_recorded, consent_public_use,
          consent_mode, witness_name_private, consent_signed_at, statements_json,
          identity_display, location_granularity, audio_video_access, translation_scope,
          allowed_translation_languages_json, ai_use, download_reuse, commercial_use, contact_mode,
          withdrawal_status, practitioner_confirmed_at, pre_release_reconfirmed_at, updated_at
        ) VALUES (
          @id, @culturalRecordId, @version, @consentTakingPart, @consentBeingRecorded, @consentPublicUse,
          @consentMode, @witnessNamePrivate, @consentSignedAt, @statementsJson,
          @identityDisplay, @locationGranularity, @audioVideoAccess, @translationScope,
          @allowedTranslationLanguagesJson, @aiUse, @downloadReuse, @commercialUse, @contactMode,
          @withdrawalStatus, @practitionerConfirmedAt, @preReleaseReconfirmedAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          cultural_record_id = excluded.cultural_record_id,
          version = excluded.version,
          consent_taking_part = excluded.consent_taking_part,
          consent_being_recorded = excluded.consent_being_recorded,
          consent_public_use = excluded.consent_public_use,
          consent_mode = excluded.consent_mode,
          witness_name_private = excluded.witness_name_private,
          consent_signed_at = excluded.consent_signed_at,
          statements_json = excluded.statements_json,
          identity_display = excluded.identity_display,
          location_granularity = excluded.location_granularity,
          audio_video_access = excluded.audio_video_access,
          translation_scope = excluded.translation_scope,
          allowed_translation_languages_json = excluded.allowed_translation_languages_json,
          ai_use = excluded.ai_use,
          download_reuse = excluded.download_reuse,
          commercial_use = excluded.commercial_use,
          contact_mode = excluded.contact_mode,
          withdrawal_status = excluded.withdrawal_status,
          practitioner_confirmed_at = excluded.practitioner_confirmed_at,
          pre_release_reconfirmed_at = excluded.pre_release_reconfirmed_at,
          updated_at = excluded.updated_at
      `);
      const deleteVocab = this.sqliteDb.prepare(
        "DELETE FROM heritage_vocabulary WHERE cultural_record_id = ?"
      );
      const insertVocab = this.sqliteDb.prepare(`
        INSERT INTO heritage_vocabulary (id, cultural_record_id, term_roman, term_devanagari, language_code, meaning_en, meaning_mr, misunderstood_note)
        VALUES (@id, @culturalRecordId, @termRoman, @termDevanagari, @languageCode, @meaningEn, @meaningMr, @misunderstoodNote)
      `);
      const upsertProv = this.sqliteDb.prepare(`
        INSERT INTO provenance_logs (
          id, cultural_record_id, step_type, performed_by_user_id, performed_by_role, performed_by_display,
          practitioner_approved, practitioner_approved_at, version_label, notes, created_at
        ) VALUES (
          @id, @culturalRecordId, @stepType, @performedByUserId, @performedByRole, @performedByDisplay,
          @practitionerApproved, @practitionerApprovedAt, @versionLabel, @notes, @createdAt
        )
        ON CONFLICT(id) DO UPDATE SET
          cultural_record_id = excluded.cultural_record_id,
          step_type = excluded.step_type,
          performed_by_user_id = excluded.performed_by_user_id,
          performed_by_role = excluded.performed_by_role,
          performed_by_display = excluded.performed_by_display,
          practitioner_approved = excluded.practitioner_approved,
          practitioner_approved_at = excluded.practitioner_approved_at,
          version_label = excluded.version_label,
          notes = excluded.notes,
          created_at = excluded.created_at
      `);
      const upsertEvt = this.sqliteDb.prepare(`
        INSERT INTO cultural_events (
          id, title_en, title_mr, category, event_type, description_en, description_mr,
          cultural_record_id, state_id, district_id, taluka_id, city_town_id, venue_label,
          location_granularity, center_lat, center_lng, exact_lat_private, exact_lng_private,
          start_date, end_date, start_time, end_time, timezone,
          schedule_status, cancellation_reason, is_recurring_tradition, recurrence_pattern,
          recurrence_note, occurrences_json, organizer_display, organizer_contact_authorized,
          organizer_public_contact, organizer_website_url, organizer_private_contact,
          source_attribution, source_url, last_verified_at, verified_by_display,
          visitor_access, visitor_access_note, registration_requirement, etiquette_notes,
          photography_rule, entry_fee_info, accessibility_info, cover_image_url,
          approved_media_urls_json, related_practitioners_json, visitor_interests_json,
          is_private_or_restricted_ceremony, review_notes, submitted_by_public_name,
          submitted_by_public_contact, status, workflow_status, created_at, updated_at
        ) VALUES (
          @id, @titleEn, @titleMr, @category, @eventType, @descriptionEn, @descriptionMr,
          @culturalRecordId, @stateId, @districtId, @talukaId, @cityTownId, @venueLabel,
          @locationGranularity, @centerLat, @centerLng, @exactLatPrivate, @exactLngPrivate,
          @startDate, @endDate, @startTime, @endTime, @timezone,
          @scheduleStatus, @cancellationReason, @isRecurringTradition, @recurrencePattern,
          @recurrenceNote, @occurrencesJson, @organizerDisplay, @organizerContactAuthorized,
          @organizerPublicContact, @organizerWebsiteUrl, @organizerPrivateContact,
          @sourceAttribution, @sourceUrl, @lastVerifiedAt, @verifiedByDisplay,
          @visitorAccess, @visitorAccessNote, @registrationRequirement, @etiquetteNotes,
          @photographyRule, @entryFeeInfo, @accessibilityInfo, @coverImageUrl,
          @approvedMediaUrlsJson, @relatedPractitionersJson, @visitorInterestsJson,
          @isPrivateOrRestrictedCeremony, @reviewNotes, @submittedByPublicName,
          @submittedByPublicContact, @dbStatus, @workflowStatus, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          title_en = excluded.title_en,
          title_mr = excluded.title_mr,
          category = excluded.category,
          event_type = excluded.event_type,
          description_en = excluded.description_en,
          description_mr = excluded.description_mr,
          cultural_record_id = excluded.cultural_record_id,
          state_id = excluded.state_id,
          district_id = excluded.district_id,
          taluka_id = excluded.taluka_id,
          city_town_id = excluded.city_town_id,
          venue_label = excluded.venue_label,
          location_granularity = excluded.location_granularity,
          center_lat = excluded.center_lat,
          center_lng = excluded.center_lng,
          exact_lat_private = excluded.exact_lat_private,
          exact_lng_private = excluded.exact_lng_private,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          timezone = excluded.timezone,
          schedule_status = excluded.schedule_status,
          cancellation_reason = excluded.cancellation_reason,
          is_recurring_tradition = excluded.is_recurring_tradition,
          recurrence_pattern = excluded.recurrence_pattern,
          recurrence_note = excluded.recurrence_note,
          occurrences_json = excluded.occurrences_json,
          organizer_display = excluded.organizer_display,
          organizer_contact_authorized = excluded.organizer_contact_authorized,
          organizer_public_contact = excluded.organizer_public_contact,
          organizer_website_url = excluded.organizer_website_url,
          organizer_private_contact = excluded.organizer_private_contact,
          source_attribution = excluded.source_attribution,
          source_url = excluded.source_url,
          last_verified_at = excluded.last_verified_at,
          verified_by_display = excluded.verified_by_display,
          visitor_access = excluded.visitor_access,
          visitor_access_note = excluded.visitor_access_note,
          registration_requirement = excluded.registration_requirement,
          etiquette_notes = excluded.etiquette_notes,
          photography_rule = excluded.photography_rule,
          entry_fee_info = excluded.entry_fee_info,
          accessibility_info = excluded.accessibility_info,
          cover_image_url = excluded.cover_image_url,
          approved_media_urls_json = excluded.approved_media_urls_json,
          related_practitioners_json = excluded.related_practitioners_json,
          visitor_interests_json = excluded.visitor_interests_json,
          is_private_or_restricted_ceremony = excluded.is_private_or_restricted_ceremony,
          review_notes = excluded.review_notes,
          submitted_by_public_name = excluded.submitted_by_public_name,
          submitted_by_public_contact = excluded.submitted_by_public_contact,
          status = excluded.status,
          workflow_status = excluded.workflow_status,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `);
      const upsertEnq = this.sqliteDb.prepare(`
        INSERT INTO community_enquiries (
          id, enquiry_type, cultural_record_id, location_id, event_id,
          sender_name, sender_contact, message, status, created_at
        ) VALUES (
          @id, @enquiryType, @culturalRecordId, @locationId, @eventId,
          @senderName, @senderContact, @message, @status, @createdAt
        )
        ON CONFLICT(id) DO UPDATE SET
          enquiry_type = excluded.enquiry_type,
          cultural_record_id = excluded.cultural_record_id,
          location_id = excluded.location_id,
          event_id = excluded.event_id,
          sender_name = excluded.sender_name,
          sender_contact = excluded.sender_contact,
          message = excluded.message,
          status = excluded.status,
          created_at = excluded.created_at
      `);
      const upsertTrip = this.sqliteDb.prepare(`
        INSERT INTO trip_plans (
          id, title, start_date, end_date, duration_days, state_id, district_id,
          place_id, region_label, selected_categories_json, selected_interests_json,
          confirmed_only, days_json, available_candidates_json,
          excluded_safeguard_summary_json, disclaimer, created_at, updated_at
        ) VALUES (
          @id, @title, @startDate, @endDate, @durationDays, @stateId, @districtId,
          @placeId, @regionLabel, @selectedCategoriesJson, @selectedInterestsJson,
          @confirmedOnly, @daysJson, @availableCandidatesJson,
          @excludedSafeguardSummaryJson, @disclaimer, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          duration_days = excluded.duration_days,
          state_id = excluded.state_id,
          district_id = excluded.district_id,
          place_id = excluded.place_id,
          region_label = excluded.region_label,
          selected_categories_json = excluded.selected_categories_json,
          selected_interests_json = excluded.selected_interests_json,
          confirmed_only = excluded.confirmed_only,
          days_json = excluded.days_json,
          available_candidates_json = excluded.available_candidates_json,
          excluded_safeguard_summary_json = excluded.excluded_safeguard_summary_json,
          disclaimer = excluded.disclaimer,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `);
      const upsertSource = this.sqliteDb.prepare(`
        INSERT INTO source_citations (
          id, tradition_id, cultural_record_id, location_id, source_title, source_organisation,
          source_url, source_type, publication_or_inscribed_date, specific_facts_supported,
          retrieval_date, attribution_or_reuse_terms, evidence_status, review_status,
          reviewed_by, last_reviewed_at, created_at
        ) VALUES (
          @id, @traditionId, @culturalRecordId, @locationId, @sourceTitle, @sourceOrganisation,
          @sourceUrl, @sourceType, @publicationOrInscribedDate, @specificFactsSupported,
          @retrievalDate, @attributionOrReuseTerms, @evidenceStatus, @reviewStatus,
          @reviewedBy, @lastReviewedAt, @createdAt
        )
        ON CONFLICT(id) DO UPDATE SET
          tradition_id = excluded.tradition_id,
          cultural_record_id = excluded.cultural_record_id,
          location_id = excluded.location_id,
          source_title = excluded.source_title,
          source_organisation = excluded.source_organisation,
          source_url = excluded.source_url,
          source_type = excluded.source_type,
          publication_or_inscribed_date = excluded.publication_or_inscribed_date,
          specific_facts_supported = excluded.specific_facts_supported,
          retrieval_date = excluded.retrieval_date,
          attribution_or_reuse_terms = excluded.attribution_or_reuse_terms,
          evidence_status = excluded.evidence_status,
          review_status = excluded.review_status,
          reviewed_by = excluded.reviewed_by,
          last_reviewed_at = excluded.last_reviewed_at,
          created_at = excluded.created_at
      `);
      const upsertMedia = this.sqliteDb.prepare(`
        INSERT INTO media_assets (
          id, tradition_id, cultural_record_id, location_id, media_type, title, caption, alt_text,
          creator_or_performer, source_organisation, source_page_url, direct_media_url, embed_url,
          license_identifier, license_url, attribution_text, rights_status, permission_evidence,
          language, transcript_or_summary, retrieval_date, reviewed_at, reviewed_by,
          publication_status, is_primary_hero, created_at
        ) VALUES (
          @id, @traditionId, @culturalRecordId, @locationId, @mediaType, @title, @caption, @altText,
          @creatorOrPerformer, @sourceOrganisation, @sourcePageUrl, @directMediaUrl, @embedUrl,
          @licenseIdentifier, @licenseUrl, @attributionText, @rightsStatus, @permissionEvidence,
          @language, @transcriptOrSummary, @retrievalDate, @reviewedAt, @reviewedBy,
          @publicationStatus, @isPrimaryHero, @createdAt
        )
        ON CONFLICT(id) DO UPDATE SET
          tradition_id = excluded.tradition_id,
          cultural_record_id = excluded.cultural_record_id,
          location_id = excluded.location_id,
          media_type = excluded.media_type,
          title = excluded.title,
          caption = excluded.caption,
          alt_text = excluded.alt_text,
          creator_or_performer = excluded.creator_or_performer,
          source_organisation = excluded.source_organisation,
          source_page_url = excluded.source_page_url,
          direct_media_url = excluded.direct_media_url,
          embed_url = excluded.embed_url,
          license_identifier = excluded.license_identifier,
          license_url = excluded.license_url,
          attribution_text = excluded.attribution_text,
          rights_status = excluded.rights_status,
          permission_evidence = excluded.permission_evidence,
          language = excluded.language,
          transcript_or_summary = excluded.transcript_or_summary,
          retrieval_date = excluded.retrieval_date,
          reviewed_at = excluded.reviewed_at,
          reviewed_by = excluded.reviewed_by,
          publication_status = excluded.publication_status,
          is_primary_hero = excluded.is_primary_hero,
          created_at = excluded.created_at
      `);
      const upsertPract = this.sqliteDb.prepare(`
        INSERT INTO practitioner_profiles (
          id, slug, display_name, role_title, short_bio, full_narrative,
          state_name, district_name, city_name, place_id,
          languages_json, specialisations_json, tradition_ids_json, tradition_slugs_json, tradition_titles_json,
          years_of_practice, lineage_note, availability_status, profile_image_url, profile_image_credit,
          workshops_json, verification_badge, publication_status, record_origin, demo_disclaimer,
          owner_user_id, created_at, updated_at
        ) VALUES (
          @id, @slug, @displayName, @roleTitle, @shortBio, @fullNarrative,
          @stateName, @districtName, @cityName, @placeId,
          @languagesJson, @specialisationsJson, @traditionIdsJson, @traditionSlugsJson, @traditionTitlesJson,
          @yearsOfPractice, @lineageNote, @availabilityStatus, @profileImageUrl, @profileImageCredit,
          @workshopsJson, @verificationBadge, @publicationStatus, @recordOrigin, @demoDisclaimer,
          @ownerUserId, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          display_name = excluded.display_name,
          role_title = excluded.role_title,
          short_bio = excluded.short_bio,
          full_narrative = excluded.full_narrative,
          state_name = excluded.state_name,
          district_name = excluded.district_name,
          city_name = excluded.city_name,
          place_id = excluded.place_id,
          languages_json = excluded.languages_json,
          specialisations_json = excluded.specialisations_json,
          tradition_ids_json = excluded.tradition_ids_json,
          tradition_slugs_json = excluded.tradition_slugs_json,
          tradition_titles_json = excluded.tradition_titles_json,
          years_of_practice = excluded.years_of_practice,
          lineage_note = excluded.lineage_note,
          availability_status = excluded.availability_status,
          profile_image_url = excluded.profile_image_url,
          profile_image_credit = excluded.profile_image_credit,
          workshops_json = excluded.workshops_json,
          verification_badge = excluded.verification_badge,
          publication_status = excluded.publication_status,
          record_origin = excluded.record_origin,
          demo_disclaimer = excluded.demo_disclaimer,
          owner_user_id = excluded.owner_user_id,
          updated_at = excluded.updated_at
      `);
      const upsertSeller = this.sqliteDb.prepare(`
        INSERT INTO art_mart_sellers (
          id, slug, storefront_name, craft_cluster_label, state_name, district_name, city_name,
          linked_practitioner_id, story_summary, verification_note, rating_average,
          completed_demo_orders, publication_status, record_origin, owner_user_id, created_at, updated_at
        ) VALUES (
          @id, @slug, @storefrontName, @craftClusterLabel, @stateName, @districtName, @cityName,
          @linkedPractitionerId, @storySummary, @verificationNote, @ratingAverage,
          @completedDemoOrders, @publicationStatus, @recordOrigin, @ownerUserId, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          storefront_name = excluded.storefront_name,
          craft_cluster_label = excluded.craft_cluster_label,
          state_name = excluded.state_name,
          district_name = excluded.district_name,
          city_name = excluded.city_name,
          linked_practitioner_id = excluded.linked_practitioner_id,
          story_summary = excluded.story_summary,
          verification_note = excluded.verification_note,
          rating_average = excluded.rating_average,
          completed_demo_orders = excluded.completed_demo_orders,
          publication_status = excluded.publication_status,
          record_origin = excluded.record_origin,
          owner_user_id = excluded.owner_user_id,
          updated_at = excluded.updated_at
      `);
      const upsertProd = this.sqliteDb.prepare(`
        INSERT INTO art_mart_products (
          id, slug, title, category, tradition_id, tradition_slug, tradition_title,
          seller_id, seller_slug, seller_name, region_label, state_name, district_name,
          price_inr, stock_quantity, materials_used, making_process, provenance_note,
          description, image_url, gallery_urls_json, image_credit, industry_collaboration_id,
          approval_status, publication_status, record_origin, demo_disclaimer, created_at, updated_at
        ) VALUES (
          @id, @slug, @title, @category, @traditionId, @traditionSlug, @traditionTitle,
          @sellerId, @sellerSlug, @sellerName, @regionLabel, @stateName, @districtName,
          @priceInr, @stockQuantity, @materialsUsed, @makingProcess, @provenanceNote,
          @description, @imageUrl, @galleryUrlsJson, @imageCredit, @industryCollaborationId,
          @approvalStatus, @publicationStatus, @recordOrigin, @demoDisclaimer, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          title = excluded.title,
          category = excluded.category,
          tradition_id = excluded.tradition_id,
          tradition_slug = excluded.tradition_slug,
          tradition_title = excluded.tradition_title,
          seller_id = excluded.seller_id,
          seller_slug = excluded.seller_slug,
          seller_name = excluded.seller_name,
          region_label = excluded.region_label,
          state_name = excluded.state_name,
          district_name = excluded.district_name,
          price_inr = excluded.price_inr,
          stock_quantity = excluded.stock_quantity,
          materials_used = excluded.materials_used,
          making_process = excluded.making_process,
          provenance_note = excluded.provenance_note,
          description = excluded.description,
          image_url = excluded.image_url,
          gallery_urls_json = excluded.gallery_urls_json,
          image_credit = excluded.image_credit,
          industry_collaboration_id = excluded.industry_collaboration_id,
          approval_status = excluded.approval_status,
          publication_status = excluded.publication_status,
          record_origin = excluded.record_origin,
          demo_disclaimer = excluded.demo_disclaimer,
          updated_at = excluded.updated_at
      `);
      const upsertOrder = this.sqliteDb.prepare(`
        INSERT INTO art_mart_orders (
          id, order_number, buyer_name, buyer_email, shipping_city, shipping_state,
          shipping_address_label, payment_method_label, status, total_inr, items_json,
          simulation_disclaimer, created_at, updated_at
        ) VALUES (
          @id, @orderNumber, @buyerName, @buyerEmail, @shippingCity, @shippingState,
          @shippingAddressLabel, @paymentMethodLabel, @status, @totalInr, @itemsJson,
          @simulationDisclaimer, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          total_inr = excluded.total_inr,
          items_json = excluded.items_json,
          updated_at = excluded.updated_at
      `);
      const upsertIndMat = this.sqliteDb.prepare(`
        INSERT INTO industry_materials (
          id, title, industry_org_label, material_category, quantity_available_label,
          condition_label, location_city, location_state, pricing_terms, price_note,
          safety_restrictions, suggested_traditions_json, admin_review_status,
          availability_status, record_origin, demo_disclaimer, created_at
        ) VALUES (
          @id, @title, @industryOrgLabel, @materialCategory, @quantityAvailableLabel,
          @conditionLabel, @locationCity, @locationState, @pricingTerms, @priceNote,
          @safetyRestrictions, @suggestedTraditionsJson, @adminReviewStatus,
          @availabilityStatus, @recordOrigin, @demoDisclaimer, @createdAt
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          quantity_available_label = excluded.quantity_available_label,
          admin_review_status = excluded.admin_review_status,
          availability_status = excluded.availability_status
      `);
      const upsertIndReq = this.sqliteDb.prepare(`
        INSERT INTO industry_requests (
          id, material_id, material_title, artisan_name, artisan_email, tradition_title,
          requested_quantity_label, intended_craft_use, collaboration_status,
          admin_reviewer_note, linked_art_mart_product_id, linked_art_mart_product_slug,
          created_at, updated_at
        ) VALUES (
          @id, @materialId, @materialTitle, @artisanName, @artisanEmail, @traditionTitle,
          @requestedQuantityLabel, @intendedCraftUse, @collaborationStatus,
          @adminReviewerNote, @linkedArtMartProductId, @linkedArtMartProductSlug,
          @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          collaboration_status = excluded.collaboration_status,
          admin_reviewer_note = excluded.admin_reviewer_note,
          linked_art_mart_product_id = excluded.linked_art_mart_product_id,
          linked_art_mart_product_slug = excluded.linked_art_mart_product_slug,
          updated_at = excluded.updated_at
      `);
      const upsertEcoRes = this.sqliteDb.prepare(`
        INSERT INTO ecosystem_resources (
          id, title, resource_category, organisation_type, relationship_status,
          state_scope, summary, eligibility_details, official_url, last_reviewed_date,
          publication_status, record_origin, demo_disclaimer
        ) VALUES (
          @id, @title, @resourceCategory, @organisationType, @relationshipStatus,
          @stateScope, @summary, @eligibilityDetails, @officialUrl, @lastReviewedDate,
          @publicationStatus, @recordOrigin, @demoDisclaimer
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          resource_category = excluded.resource_category,
          organisation_type = excluded.organisation_type,
          relationship_status = excluded.relationship_status,
          state_scope = excluded.state_scope,
          summary = excluded.summary,
          eligibility_details = excluded.eligibility_details,
          official_url = excluded.official_url,
          last_reviewed_date = excluded.last_reviewed_date,
          publication_status = excluded.publication_status
      `);
      const upsertHerCraftEnt = this.sqliteDb.prepare(`
        INSERT INTO hercraft_enterprises (
          id, slug, enterprise_name, leader_or_collective_label, enterprise_type,
          craft_category, tradition_id, tradition_slug, tradition_title,
          state_name, district_name, city_name, place_id,
          women_artisans_count, founded_year, short_summary, story_narrative,
          signature_crafts_json, products_and_techniques_json,
          training_and_workshops_json, support_needs_json,
          linked_art_mart_product_ids_json, linked_practitioner_id,
          hero_image_url, image_credit, source_attribution, source_url,
          contact_or_enquiry_note, approval_status, publication_status,
          record_origin, demo_disclaimer, owner_user_id, created_at, updated_at
        ) VALUES (
          @id, @slug, @enterpriseName, @leaderOrCollectiveLabel, @enterpriseType,
          @craftCategory, @traditionId, @traditionSlug, @traditionTitle,
          @stateName, @districtName, @cityName, @placeId,
          @womenArtisansCount, @foundedYear, @shortSummary, @storyNarrative,
          @signatureCraftsJson, @productsAndTechniquesJson,
          @trainingAndWorkshopsJson, @supportNeedsJson,
          @linkedArtMartProductIdsJson, @linkedPractitionerId,
          @heroImageUrl, @imageCredit, @sourceAttribution, @sourceUrl,
          @contactOrEnquiryNote, @approvalStatus, @publicationStatus,
          @recordOrigin, @demoDisclaimer, @ownerUserId, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          enterprise_name = excluded.enterprise_name,
          leader_or_collective_label = excluded.leader_or_collective_label,
          enterprise_type = excluded.enterprise_type,
          craft_category = excluded.craft_category,
          tradition_id = excluded.tradition_id,
          tradition_slug = excluded.tradition_slug,
          tradition_title = excluded.tradition_title,
          state_name = excluded.state_name,
          district_name = excluded.district_name,
          city_name = excluded.city_name,
          place_id = excluded.place_id,
          women_artisans_count = excluded.women_artisans_count,
          founded_year = excluded.founded_year,
          short_summary = excluded.short_summary,
          story_narrative = excluded.story_narrative,
          signature_crafts_json = excluded.signature_crafts_json,
          products_and_techniques_json = excluded.products_and_techniques_json,
          training_and_workshops_json = excluded.training_and_workshops_json,
          support_needs_json = excluded.support_needs_json,
          linked_art_mart_product_ids_json = excluded.linked_art_mart_product_ids_json,
          linked_practitioner_id = excluded.linked_practitioner_id,
          hero_image_url = excluded.hero_image_url,
          image_credit = excluded.image_credit,
          source_attribution = excluded.source_attribution,
          source_url = excluded.source_url,
          contact_or_enquiry_note = excluded.contact_or_enquiry_note,
          approval_status = excluded.approval_status,
          publication_status = excluded.publication_status,
          owner_user_id = excluded.owner_user_id,
          updated_at = excluded.updated_at
      `);
      const upsertHerCraftOpp = this.sqliteDb.prepare(`
        INSERT INTO hercraft_opportunities (
          id, title, opportunity_type, organiser_name, organiser_type,
          relationship_status, state_scope, eligibility_summary, benefit_summary,
          application_or_official_url, deadline_or_cycle_label,
          approval_status, publication_status, record_origin, demo_disclaimer, created_at
        ) VALUES (
          @id, @title, @opportunityType, @organiserName, @organiserType,
          @relationshipStatus, @stateScope, @eligibilitySummary, @benefitSummary,
          @applicationOrOfficialUrl, @deadlineOrCycleLabel,
          @approvalStatus, @publicationStatus, @recordOrigin, @demoDisclaimer, @createdAt
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          opportunity_type = excluded.opportunity_type,
          organiser_name = excluded.organiser_name,
          organiser_type = excluded.organiser_type,
          relationship_status = excluded.relationship_status,
          state_scope = excluded.state_scope,
          eligibility_summary = excluded.eligibility_summary,
          benefit_summary = excluded.benefit_summary,
          application_or_official_url = excluded.application_or_official_url,
          deadline_or_cycle_label = excluded.deadline_or_cycle_label,
          approval_status = excluded.approval_status,
          publication_status = excluded.publication_status
      `);

      const levelOrder: Record<string, number> = {
        COUNTRY: 0,
        STATE: 1,
        DISTRICT: 2,
        TALUKA: 3,
        CITY_TOWN: 4,
        VILLAGE: 5,
      };
      const sortedLocations = Array.from(this.locations.values()).sort(
        (a, b) => (levelOrder[a.level] ?? 9) - (levelOrder[b.level] ?? 9)
      );
      const fallbackStateId = this.locations.has("loc-state-maharashtra")
        ? "loc-state-maharashtra"
        : sortedLocations[0]?.id || "loc-country-in";
      const nowIso = new Date().toISOString();

      const tx = this.sqliteDb.transaction(() => {
        // 1. Users
        for (const u of Array.from(this.users.values())) {
          upsertUser.run({
            id: u.id,
            email: u.email,
            passwordHash: u.passwordHash,
            fullName: u.fullName,
            role: u.role,
            accountType: defaultPersonaForRole(u.role, u.accountType),
            bio: u.bio || "",
            phone: u.phone || "",
            locationLabel: u.locationLabel || "",
            organisationOrGuild: u.organisationOrGuild || "",
            preferredLanguage: u.preferredLanguage || "English",
            linkedPractitionerId: u.linkedPractitionerId || null,
            linkedSellerId: u.linkedSellerId || null,
            linkedHerCraftId: u.linkedHerCraftId || null,
            isActive: u.isActive ? 1 : 0,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt || u.createdAt,
          });
        }
        // 2. Locations (top-down parent before child)
        for (const loc of sortedLocations) {
          upsertLoc.run({
            id: loc.id,
            level: loc.level,
            nameEn: loc.nameEn,
            nameMr: loc.nameMr || null,
            abbr: loc.abbr || null,
            parentId: validLocId(loc.parentId),
            centerLat: loc.centerLat,
            centerLng: loc.centerLng,
            defaultZoom: loc.defaultZoom,
          });
        }
        // 3. Traditions (must precede cultural_records, tradition_places, source_citations, media_assets, art_mart_products)
        for (const tr of Array.from(this.traditions.values())) {
          upsertTrad.run({
            id: tr.id,
            slug: tr.slug,
            nameEn: tr.nameEn,
            nameNative: tr.nameNative || "",
            nativeScriptLang: tr.nativeScriptLang || "",
            alternativeNamesJson: JSON.stringify(tr.alternativeNames || []),
            traditionCategory: tr.traditionCategory,
            legacyCategory: tr.legacyCategory || "Craft",
            subcategory: tr.subcategory || "",
            unescoDomain: tr.unescoDomain || "Traditional craftsmanship",
            unescoStatus: tr.unescoStatus || null,
            giTagStatus: tr.giTagStatus || null,
            languagesJson: JSON.stringify(tr.languages || []),
            summary: tr.summary,
            culturalDescription: tr.culturalDescription || "",
            historicalBackground: tr.historicalBackground || "",
            communityContext: tr.communityContext || "",
            techniquesAndMaterialsJson: JSON.stringify(
              tr.techniquesAndMaterials || []
            ),
            instrumentsOrFormsJson: JSON.stringify(tr.instrumentsOrForms || []),
            regionalVariationsJson: JSON.stringify(tr.regionalVariations || []),
            learningOpportunitiesJson: JSON.stringify(
              tr.learningOpportunities || []
            ),
            evidenceStatus: tr.evidenceStatus || "OFFICIAL_INSTITUTIONAL",
            verificationNotes: tr.verificationNotes || "",
            lastReviewedAt: tr.lastReviewedAt,
            reviewedByDisplay: tr.reviewedByDisplay || "Cultural Research Desk",
            consentAndAccessNote: tr.consentAndAccessNote || "",
            isSacredOrRestricted: tr.isSacredOrRestricted ? 1 : 0,
            status: tr.status || "PUBLISHED",
            createdAt: tr.createdAt,
            updatedAt: tr.updatedAt,
          });
        }
        // 4. Tradition Places
        deleteAllTraditionPlaces.run();
        for (const tpa of Array.from(this.traditionPlaces.values())) {
          const tId = validTradId(tpa.traditionId);
          const lId = validLocId(tpa.locationId);
          const sId = validLocId(tpa.stateId) || lId;
          if (!tId || !lId || !sId) continue;
          insertTradPlace.run({
            id: tpa.id,
            traditionId: tId,
            locationId: lId,
            stateId: sId,
            districtId: validLocId(tpa.districtId),
            relationshipRole: tpa.relationshipRole || "PRIMARY_PRACTICE_REGION",
            regionalVariantName: tpa.regionalVariantName || "",
            notes: tpa.notes || "",
            isPrimary: tpa.isPrimary ? 1 : 0,
          });
        }
        // 5. Cultural Records + Rights Passports + Vocabulary + Provenance Logs
        for (const r of Array.from(this.records.values())) {
          upsertRec.run({
            id: r.id,
            slug: r.slug,
            traditionId: validTradId(r.traditionId),
            traditionSlug: r.traditionSlug || null,
            recordOrigin: r.recordOrigin,
            status: r.status,
            unescoDomain: r.unescoDomain,
            category: r.category,
            isWomenLed: r.isWomenLed ? 1 : 0,
            isSacredOrRestricted: r.isSacredOrRestricted ? 1 : 0,
            practitionerFullNamePrivate: r.practitionerFullNamePrivate,
            practitionerChosenName: r.practitionerChosenName,
            practitionerCommunityName: r.practitionerCommunityName,
            practitionerVillagePrivate: r.practitionerVillagePrivate || "",
            practitionerTaluka: r.practitionerTaluka || "",
            practitionerPhonePrivate: r.practitionerPhonePrivate || "",
            practitionerAddressPrivate: r.practitionerAddressPrivate || "",
            stateId: validLocId(r.stateId) || fallbackStateId,
            districtId: validLocId(r.districtId),
            talukaId: validLocId(r.talukaId),
            cityTownId: validLocId(r.cityTownId),
            exactLatPrivate: r.exactLatPrivate ?? null,
            exactLngPrivate: r.exactLngPrivate ?? null,
            titleEn: r.titleEn,
            titleMr: r.titleMr,
            subtitleEn: r.subtitleEn,
            summaryEn: r.summaryEn,
            summaryMr: r.summaryMr,
            practiceContextEn: r.practiceContextEn,
            practiceContextMr: r.practiceContextMr,
            tagsJson: JSON.stringify(r.tags || []),
            heroImageUrl: r.heroImageUrl,
            sourceAttribution: r.sourceAttribution || null,
            sourceUrl: r.sourceUrl || null,
            originalVoiceLanguage: r.originalVoiceLanguage,
            originalVoiceAudioUrl: r.originalVoiceAudioUrl || null,
            originalVoiceTranscriptMr: r.originalVoiceTranscriptMr || null,
            mediationM1SubtitlesEn: r.mediationM1SubtitlesEn || null,
            mediationM2SyntheticContextText:
              r.mediationM2SyntheticContextText || null,
            mediationM3HumanStoryCompanionText:
              r.mediationM3HumanStoryCompanionText || null,
            mediationM3NarratorCredit: r.mediationM3NarratorCredit || null,
            storyCompanionPromptsJson: JSON.stringify(
              r.storyCompanionPrompts || []
            ),
            publishedAt: r.publishedAt || null,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          });

          const p = r.rightsPassport;
          deleteConflictingPass.run(r.id, p.id);
          upsertPass.run({
            id: p.id,
            culturalRecordId: r.id,
            version: p.version,
            consentTakingPart: p.consentTakingPart ? 1 : 0,
            consentBeingRecorded: p.consentBeingRecorded ? 1 : 0,
            consentPublicUse: p.consentPublicUse ? 1 : 0,
            consentMode: p.consentMode,
            witnessNamePrivate: p.witnessNamePrivate || null,
            consentSignedAt: p.consentSignedAt || null,
            statementsJson: JSON.stringify(p.statements),
            identityDisplay: p.identityDisplay,
            locationGranularity: p.locationGranularity,
            audioVideoAccess: p.audioVideoAccess,
            translationScope: p.translationScope,
            allowedTranslationLanguagesJson: JSON.stringify(
              p.allowedTranslationLanguages || []
            ),
            aiUse: p.aiUse,
            downloadReuse: p.downloadReuse,
            commercialUse: p.commercialUse,
            contactMode: p.contactMode,
            withdrawalStatus: p.withdrawalStatus,
            practitionerConfirmedAt: p.practitionerConfirmedAt || null,
            preReleaseReconfirmedAt: p.preReleaseReconfirmedAt || null,
            updatedAt: p.updatedAt,
          });

          deleteVocab.run(r.id);
          for (const v of r.vocabulary || []) {
            insertVocab.run({
              id: v.id,
              culturalRecordId: r.id,
              termRoman: v.termRoman,
              termDevanagari: v.termDevanagari,
              languageCode: v.languageCode,
              meaningEn: v.meaningEn,
              meaningMr: v.meaningMr || "",
              misunderstoodNote: v.misunderstoodNote || "",
            });
          }

          for (const l of r.provenanceLogs || []) {
            upsertProv.run({
              id: l.id,
              culturalRecordId: r.id,
              stepType: l.stepType,
              performedByUserId: validUserId(l.performedByUserId),
              performedByRole: l.performedByRole,
              performedByDisplay: l.performedByDisplay,
              practitionerApproved: l.practitionerApproved ? 1 : 0,
              practitionerApprovedAt: l.practitionerApprovedAt || null,
              versionLabel: l.versionLabel,
              notes: l.notes,
              createdAt: l.createdAt,
            });
          }
        }
        // 6. Cultural Events
        for (const e of Array.from(this.events.values())) {
          const dbStatus =
            e.status === "PUBLISHED"
              ? "PUBLISHED"
              : e.status === "ARCHIVED"
                ? "ARCHIVED"
                : "DRAFT";
          upsertEvt.run({
            id: e.id,
            titleEn: e.titleEn,
            titleMr: e.titleMr || "",
            category: e.category,
            eventType: e.eventType || "CULTURAL_GATHERING",
            descriptionEn: e.descriptionEn,
            descriptionMr: e.descriptionMr || "",
            culturalRecordId: validRecId(e.culturalRecordId),
            stateId: validLocId(e.stateId) || fallbackStateId,
            districtId: validLocId(e.districtId),
            talukaId: validLocId(e.talukaId),
            cityTownId: validLocId(e.cityTownId),
            venueLabel: e.venueLabel || "",
            locationGranularity: e.locationGranularity || "CITY_TOWN",
            centerLat: e.center.lat,
            centerLng: e.center.lng,
            exactLatPrivate: e.exactLatPrivate ?? null,
            exactLngPrivate: e.exactLngPrivate ?? null,
            startDate: e.startDate,
            endDate: e.endDate || null,
            startTime: e.startTime || null,
            endTime: e.endTime || null,
            timezone: e.timezone || "Asia/Kolkata",
            scheduleStatus: e.scheduleStatus || "CONFIRMED",
            cancellationReason: e.cancellationReason || null,
            isRecurringTradition: e.isRecurringTradition ? 1 : 0,
            recurrencePattern: e.recurrencePattern || "SINGLE_OCCURRENCE",
            recurrenceNote: e.recurrenceNote || "",
            occurrencesJson: JSON.stringify(e.occurrences || []),
            organizerDisplay: e.organizerDisplay || "",
            organizerContactAuthorized: e.organizerContactAuthorized ? 1 : 0,
            organizerPublicContact: e.organizerPublicContact || null,
            organizerWebsiteUrl: e.organizerWebsiteUrl || null,
            organizerPrivateContact: e.organizerPrivateContact || "",
            sourceAttribution: e.sourceAttribution || "",
            sourceUrl: e.sourceUrl || null,
            lastVerifiedAt: e.lastVerifiedAt || null,
            verifiedByDisplay: e.verifiedByDisplay || null,
            visitorAccess: e.visitorAccess || "OPEN_PUBLIC",
            visitorAccessNote: e.visitorAccessNote || "",
            registrationRequirement: e.registrationRequirement || "NONE",
            etiquetteNotes: e.etiquetteNotes || "",
            photographyRule: e.photographyRule || "PERMISSION_REQUIRED_ON_SITE",
            entryFeeInfo: e.entryFeeInfo || null,
            accessibilityInfo: e.accessibilityInfo || null,
            coverImageUrl: e.coverImageUrl || null,
            approvedMediaUrlsJson: JSON.stringify(e.approvedMediaUrls || []),
            relatedPractitionersJson: JSON.stringify(
              e.relatedPractitioners || []
            ),
            visitorInterestsJson: JSON.stringify(e.visitorInterests || []),
            isPrivateOrRestrictedCeremony: e.isPrivateOrRestrictedCeremony
              ? 1
              : 0,
            reviewNotes: e.reviewNotes || "",
            submittedByPublicName: e.submittedByPublicName || null,
            submittedByPublicContact: e.submittedByPublicContact || null,
            dbStatus,
            workflowStatus: e.status,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          });
        }
        // 7. Community Enquiries
        for (const q of Array.from(this.enquiries.values())) {
          upsertEnq.run({
            id: q.id,
            enquiryType: q.enquiryType,
            culturalRecordId: validRecId(q.culturalRecordId),
            locationId: validLocId(q.locationId),
            eventId: validEvtId(q.eventId),
            senderName: q.senderName,
            senderContact: q.senderContact,
            message: q.message,
            status: q.status,
            createdAt: q.createdAt,
          });
        }
        // 8. Trip Plans
        for (const tp of Array.from(this.tripPlans.values())) {
          upsertTrip.run({
            id: tp.id,
            title: tp.title,
            startDate: tp.startDate,
            endDate: tp.endDate,
            durationDays: tp.durationDays,
            stateId: validLocId(tp.stateId) || fallbackStateId,
            districtId: validLocId(tp.districtId),
            placeId: validLocId(tp.placeId),
            regionLabel: tp.regionLabel,
            selectedCategoriesJson: JSON.stringify(
              tp.selectedCategories || []
            ),
            selectedInterestsJson: JSON.stringify(tp.selectedInterests || []),
            confirmedOnly: tp.confirmedOnly ? 1 : 0,
            daysJson: JSON.stringify(tp.days || []),
            availableCandidatesJson: JSON.stringify(
              tp.availableCandidates || []
            ),
            excludedSafeguardSummaryJson: JSON.stringify(
              tp.excludedSafeguardSummary || []
            ),
            disclaimer: tp.disclaimer,
            createdAt: tp.createdAt,
            updatedAt: tp.updatedAt,
          });
        }
        // 9. Source Citations (FKs validated against traditions, cultural_records, locations)
        for (const sc of Array.from(this.sources.values())) {
          upsertSource.run({
            id: sc.id,
            traditionId: validTradId(sc.traditionId),
            culturalRecordId: validRecId(sc.culturalRecordId),
            locationId: validLocId(sc.locationId),
            sourceTitle: sc.sourceTitle,
            sourceOrganisation: sc.sourceOrganisation,
            sourceUrl: sc.sourceUrl,
            sourceType: sc.sourceType || "OFFICIAL_INSTITUTIONAL",
            publicationOrInscribedDate: sc.publicationOrInscribedDate || null,
            specificFactsSupported: sc.specificFactsSupported,
            retrievalDate: sc.retrievalDate,
            attributionOrReuseTerms: sc.attributionOrReuseTerms || "",
            evidenceStatus: sc.evidenceStatus || "OFFICIAL_INSTITUTIONAL",
            reviewStatus: sc.reviewStatus || "VERIFIED",
            reviewedBy: sc.reviewedBy || "Cultural Research Desk",
            lastReviewedAt: sc.lastReviewedAt,
            createdAt: sc.createdAt,
          });
        }
        // 10. Media Assets (FKs validated against traditions, cultural_records, locations)
        for (const ma of Array.from(this.mediaAssets.values())) {
          upsertMedia.run({
            id: ma.id,
            traditionId: validTradId(ma.traditionId),
            culturalRecordId: validRecId(ma.culturalRecordId),
            locationId: validLocId(ma.locationId),
            mediaType: ma.mediaType,
            title: ma.title,
            caption: ma.caption || "",
            altText: ma.altText || ma.title,
            creatorOrPerformer: ma.creatorOrPerformer || "",
            sourceOrganisation: ma.sourceOrganisation,
            sourcePageUrl: ma.sourcePageUrl,
            directMediaUrl: ma.directMediaUrl || null,
            embedUrl: ma.embedUrl || null,
            licenseIdentifier: ma.licenseIdentifier,
            licenseUrl: ma.licenseUrl || null,
            attributionText: ma.attributionText,
            rightsStatus: ma.rightsStatus,
            permissionEvidence: ma.permissionEvidence || "",
            language: ma.language || "",
            transcriptOrSummary: ma.transcriptOrSummary || "",
            retrievalDate: ma.retrievalDate,
            reviewedAt: ma.reviewedAt || null,
            reviewedBy: ma.reviewedBy || "",
            publicationStatus: ma.publicationStatus || "PUBLISHED",
            isPrimaryHero: ma.isPrimaryHero ? 1 : 0,
            createdAt: ma.createdAt,
          });
        }
        // 11. Practitioner Profiles
        for (const pr of Array.from(this.practitioners.values())) {
          upsertPract.run({
            id: pr.id,
            slug: pr.slug,
            displayName: pr.displayName,
            roleTitle: pr.roleTitle,
            shortBio: pr.shortBio,
            fullNarrative: pr.fullNarrative,
            stateName: pr.stateName,
            districtName: pr.districtName || null,
            cityName: pr.cityName || null,
            placeId: pr.placeId || null,
            languagesJson: JSON.stringify(pr.languages || []),
            specialisationsJson: JSON.stringify(pr.specialisations || []),
            traditionIdsJson: JSON.stringify(pr.traditionIds || []),
            traditionSlugsJson: JSON.stringify(pr.traditionSlugs || []),
            traditionTitlesJson: JSON.stringify(pr.traditionTitles || []),
            yearsOfPractice: pr.yearsOfPractice,
            lineageNote: pr.lineageNote || "",
            availabilityStatus: pr.availabilityStatus,
            profileImageUrl: pr.profileImageUrl || "",
            profileImageCredit: pr.profileImageCredit || "",
            workshopsJson: JSON.stringify(pr.workshops || []),
            verificationBadge: pr.verificationBadge || "",
            publicationStatus: pr.publicationStatus || "PUBLISHED",
            recordOrigin: pr.recordOrigin || "DEMO_SAMPLE",
            demoDisclaimer: pr.demoDisclaimer || "",
            ownerUserId: validUserId(pr.ownerUserId),
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
        // 12. Art-Mart Sellers
        for (const s of Array.from(this.artMartSellers.values())) {
          upsertSeller.run({
            id: s.id,
            slug: s.slug,
            storefrontName: s.storefrontName,
            craftClusterLabel: s.craftClusterLabel,
            stateName: s.stateName,
            districtName: s.districtName || null,
            cityName: s.cityName || null,
            linkedPractitionerId: validPractId(s.linkedPractitionerId),
            storySummary: s.storySummary,
            verificationNote: s.verificationNote || "",
            ratingAverage: s.ratingAverage,
            completedDemoOrders: s.completedDemoOrders,
            publicationStatus: s.publicationStatus || "PUBLISHED",
            recordOrigin: s.recordOrigin || "DEMO_SAMPLE",
            ownerUserId: validUserId(s.ownerUserId),
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
        // 13. Art-Mart Products
        for (const p of Array.from(this.artMartProducts.values())) {
          const validSeller = validSellerId(p.sellerId);
          if (!validSeller) continue;
          upsertProd.run({
            id: p.id,
            slug: p.slug,
            title: p.title,
            category: p.category,
            traditionId: validTradId(p.traditionId),
            traditionSlug: p.traditionSlug || null,
            traditionTitle: p.traditionTitle || null,
            sellerId: validSeller,
            sellerSlug: p.sellerSlug,
            sellerName: p.sellerName,
            regionLabel: p.regionLabel,
            stateName: p.stateName,
            districtName: p.districtName || null,
            priceInr: p.priceInr,
            stockQuantity: p.stockQuantity,
            materialsUsed: p.materialsUsed || "",
            makingProcess: p.makingProcess || "",
            provenanceNote: p.provenanceNote || "",
            description: p.description || "",
            imageUrl: p.imageUrl || "",
            galleryUrlsJson: JSON.stringify(p.galleryUrls || []),
            imageCredit: p.imageCredit || "",
            industryCollaborationId: p.industryCollaborationId || null,
            approvalStatus: p.approvalStatus || "APPROVED",
            publicationStatus: p.publicationStatus || "PUBLISHED",
            recordOrigin: p.recordOrigin || "DEMO_SAMPLE",
            demoDisclaimer: p.demoDisclaimer || "",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
        // 14. Art-Mart Orders
        for (const o of Array.from(this.artMartOrders.values())) {
          upsertOrder.run({
            id: o.id,
            orderNumber: o.orderNumber,
            buyerName: o.buyerName,
            buyerEmail: o.buyerEmail,
            shippingCity: o.shippingCity,
            shippingState: o.shippingState,
            shippingAddressLabel: o.shippingAddressLabel,
            paymentMethodLabel: o.paymentMethodLabel,
            status: o.status,
            totalInr: o.totalInr,
            itemsJson: JSON.stringify(o.items || []),
            simulationDisclaimer: o.simulationDisclaimer || "",
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
          });
        }
        // 15. Industry Materials
        for (const m of Array.from(this.industryMaterials.values())) {
          upsertIndMat.run({
            id: m.id,
            title: m.title,
            industryOrgLabel: m.industryOrgLabel,
            materialCategory: m.materialCategory,
            quantityAvailableLabel: m.quantityAvailableLabel,
            conditionLabel: m.conditionLabel,
            locationCity: m.locationCity,
            locationState: m.locationState,
            pricingTerms: m.pricingTerms,
            priceNote: m.priceNote || "",
            safetyRestrictions: m.safetyRestrictions || "",
            suggestedTraditionsJson: JSON.stringify(m.suggestedTraditions || []),
            adminReviewStatus: m.adminReviewStatus,
            availabilityStatus: m.availabilityStatus,
            recordOrigin: m.recordOrigin || "DEMO_SAMPLE",
            demoDisclaimer: m.demoDisclaimer || "",
            createdAt: m.createdAt,
          });
        }
        // 16. Industry Requests
        for (const rq of Array.from(this.industryRequests.values())) {
          const validMat = validMatId(rq.materialId);
          if (!validMat) continue;
          upsertIndReq.run({
            id: rq.id,
            materialId: validMat,
            materialTitle: rq.materialTitle,
            artisanName: rq.artisanName,
            artisanEmail: rq.artisanEmail,
            traditionTitle: rq.traditionTitle,
            requestedQuantityLabel: rq.requestedQuantityLabel,
            intendedCraftUse: rq.intendedCraftUse,
            collaborationStatus: rq.collaborationStatus,
            adminReviewerNote: rq.adminReviewerNote || "",
            linkedArtMartProductId: rq.linkedArtMartProductId || null,
            linkedArtMartProductSlug: rq.linkedArtMartProductSlug || null,
            createdAt: rq.createdAt,
            updatedAt: rq.updatedAt,
          });
        }
        // 17. Ecosystem Resources
        for (const ec of Array.from(this.ecosystemResources.values())) {
          upsertEcoRes.run({
            id: ec.id,
            title: ec.title,
            resourceCategory: ec.resourceCategory,
            organisationType: ec.organisationType,
            relationshipStatus: ec.relationshipStatus,
            stateScope: ec.stateScope,
            summary: ec.summary,
            eligibilityDetails: ec.eligibilityDetails,
            officialUrl: ec.officialUrl,
            lastReviewedDate: ec.lastReviewedDate,
            publicationStatus: ec.publicationStatus || "PUBLISHED",
            recordOrigin: ec.recordOrigin || "DEMO_SAMPLE",
            demoDisclaimer: ec.demoDisclaimer || "",
          });
        }
        // 18. HerCraft Enterprises
        for (const he of Array.from(this.herCraftEnterprises.values())) {
          upsertHerCraftEnt.run({
            id: he.id,
            slug: he.slug,
            enterpriseName: he.enterpriseName,
            leaderOrCollectiveLabel: he.leaderOrCollectiveLabel,
            enterpriseType: he.enterpriseType,
            craftCategory: he.craftCategory,
            traditionId: validTradId(he.traditionId),
            traditionSlug: he.traditionSlug || null,
            traditionTitle: he.traditionTitle || null,
            stateName: he.stateName,
            districtName: he.districtName || null,
            cityName: he.cityName || null,
            placeId: he.placeId || null,
            womenArtisansCount: he.womenArtisansCount,
            foundedYear: he.foundedYear,
            shortSummary: he.shortSummary,
            storyNarrative: he.storyNarrative || "",
            signatureCraftsJson: JSON.stringify(he.signatureCrafts || []),
            productsAndTechniquesJson: JSON.stringify(
              he.productsAndTechniques || []
            ),
            trainingAndWorkshopsJson: JSON.stringify(
              he.trainingAndWorkshops || []
            ),
            supportNeedsJson: JSON.stringify(he.supportNeeds || []),
            linkedArtMartProductIdsJson: JSON.stringify(
              he.linkedArtMartProductIds || []
            ),
            linkedPractitionerId: validPractId(he.linkedPractitionerId),
            heroImageUrl: he.heroImageUrl || "",
            imageCredit: he.imageCredit || "",
            sourceAttribution: he.sourceAttribution || "",
            sourceUrl: he.sourceUrl || "",
            contactOrEnquiryNote: he.contactOrEnquiryNote || "",
            approvalStatus: he.approvalStatus || "APPROVED",
            publicationStatus: he.publicationStatus || "PUBLISHED",
            recordOrigin: he.recordOrigin || "DEMO_SAMPLE",
            demoDisclaimer: he.demoDisclaimer || "",
            ownerUserId: validUserId(he.ownerUserId),
            createdAt: he.createdAt || nowIso,
            updatedAt: he.updatedAt || nowIso,
          });
        }
        // 19. HerCraft Opportunities
        for (const ho of Array.from(this.herCraftOpportunities.values())) {
          upsertHerCraftOpp.run({
            id: ho.id,
            title: ho.title,
            opportunityType: ho.opportunityType,
            organiserName: ho.organiserName,
            organiserType: ho.organiserType,
            relationshipStatus: ho.relationshipStatus,
            stateScope: ho.stateScope,
            eligibilitySummary: ho.eligibilitySummary,
            benefitSummary: ho.benefitSummary,
            applicationOrOfficialUrl: ho.applicationOrOfficialUrl,
            deadlineOrCycleLabel: ho.deadlineOrCycleLabel,
            approvalStatus: ho.approvalStatus || "APPROVED",
            publicationStatus: ho.publicationStatus || "PUBLISHED",
            recordOrigin: ho.recordOrigin || "DEMO_SAMPLE",
            demoDisclaimer: ho.demoDisclaimer || "",
            createdAt: ho.createdAt || nowIso,
          });
        }
      });
      tx();
    }

    if (this.jsonPersistencePath) {
      fs.mkdirSync(path.dirname(this.jsonPersistencePath), { recursive: true });
      fs.writeFileSync(
        this.jsonPersistencePath,
        JSON.stringify(
          {
            users: Array.from(this.users.values()),
            locations: Array.from(this.locations.values()),
            records: Array.from(this.records.values()),
            events: Array.from(this.events.values()),
            enquiries: Array.from(this.enquiries.values()),
            tripPlans: Array.from(this.tripPlans.values()),
            traditions: Array.from(this.traditions.values()),
            traditionPlaces: Array.from(this.traditionPlaces.values()),
            sources: Array.from(this.sources.values()),
            mediaAssets: Array.from(this.mediaAssets.values()),
            practitioners: Array.from(this.practitioners.values()),
            artMartSellers: Array.from(this.artMartSellers.values()),
            artMartProducts: Array.from(this.artMartProducts.values()),
            artMartOrders: Array.from(this.artMartOrders.values()),
            industryMaterials: Array.from(this.industryMaterials.values()),
            industryRequests: Array.from(this.industryRequests.values()),
            ecosystemResources: Array.from(this.ecosystemResources.values()),
            herCraftEnterprises: Array.from(this.herCraftEnterprises.values()),
            herCraftOpportunities: Array.from(this.herCraftOpportunities.values()),
          },
          null,
          2
        ),
        "utf8"
      );
    }
  }

  public countUsers(): number {
    return this.users.size;
  }

  public findUserByEmail(email: string): UserWithPasswordHash | null {
    const normalized = email.trim().toLowerCase();
    for (const user of Array.from(this.users.values())) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public findUserById(id: string): UserAccount | null {
    const u = this.users.get(id);
    if (!u) return null;
    const { passwordHash: _omitted, ...account } = u;
    return account;
  }

  public listUsers(): UserAccount[] {
    return Array.from(this.users.values()).map(
      ({ passwordHash: _omitted, ...account }) => account
    );
  }

  public createUser(input: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    accountType?: AccountPersonaType;
    bio?: string;
    phone?: string;
    locationLabel?: string;
    organisationOrGuild?: string;
    preferredLanguage?: string;
    linkedPractitionerId?: string | null;
    linkedSellerId?: string | null;
    linkedHerCraftId?: string | null;
  }): UserAccount {
    const existing = this.findUserByEmail(input.email);
    if (existing) {
      throw new Error(`User with email '${input.email}' already exists.`);
    }
    const id = `usr-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const record: UserWithPasswordHash = {
      id,
      email: input.email.trim().toLowerCase(),
      passwordHash: hashPassword(input.password),
      fullName: input.fullName.trim(),
      role: input.role,
      accountType: defaultPersonaForRole(input.role, input.accountType),
      bio: (input.bio || "").trim(),
      phone: (input.phone || "").trim(),
      locationLabel: (input.locationLabel || "").trim(),
      organisationOrGuild: (input.organisationOrGuild || "").trim(),
      preferredLanguage: (input.preferredLanguage || "English").trim(),
      linkedPractitionerId: input.linkedPractitionerId || null,
      linkedSellerId: input.linkedSellerId || null,
      linkedHerCraftId: input.linkedHerCraftId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, record);
    this.persistSnapshot();
    const { passwordHash: _omitted, ...account } = record;
    return account;
  }

  public updateUserProfile(
    userId: string,
    patch: {
      fullName?: string;
      bio?: string;
      phone?: string;
      locationLabel?: string;
      organisationOrGuild?: string;
      preferredLanguage?: string;
      accountType?: AccountPersonaType;
      currentPassword?: string;
      newPassword?: string;
    }
  ): UserAccount {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error("User account not found.");
    }
    if (patch.newPassword) {
      if (
        !patch.currentPassword ||
        !verifyPassword(patch.currentPassword, existing.passwordHash)
      ) {
        throw new Error("Current password is incorrect.");
      }
      const strength = validatePasswordStrength(patch.newPassword);
      if (!strength.valid) {
        throw new Error(strength.reason || "Invalid new password.");
      }
      existing.passwordHash = hashPassword(patch.newPassword);
    }
    if (patch.fullName !== undefined && patch.fullName.trim()) {
      existing.fullName = patch.fullName.trim();
    }
    if (patch.bio !== undefined) {
      existing.bio = patch.bio.trim();
    }
    if (patch.phone !== undefined) {
      existing.phone = patch.phone.trim();
    }
    if (patch.locationLabel !== undefined) {
      existing.locationLabel = patch.locationLabel.trim();
    }
    if (patch.organisationOrGuild !== undefined) {
      existing.organisationOrGuild = patch.organisationOrGuild.trim();
    }
    if (patch.preferredLanguage !== undefined && patch.preferredLanguage.trim()) {
      existing.preferredLanguage = patch.preferredLanguage.trim();
    }
    if (patch.accountType !== undefined) {
      // Self-service profile editing can only switch between non-staff public personas
      existing.accountType = sanitizePublicPersona(patch.accountType);
    }
    existing.updatedAt = new Date().toISOString();
    this.persistSnapshot();
    const { passwordHash: _omitted, ...account } = existing;
    return account;
  }

  public adminUpdateUser(
    userId: string,
    patch: {
      role?: UserRole;
      accountType?: AccountPersonaType;
      linkedPractitionerId?: string | null;
      linkedSellerId?: string | null;
      linkedHerCraftId?: string | null;
      isActive?: boolean;
      fullName?: string;
    }
  ): UserAccount {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error("User account not found.");
    }
    if (patch.role !== undefined) {
      existing.role = patch.role;
    }
    if (patch.accountType !== undefined) {
      existing.accountType = patch.accountType;
    }
    if (patch.linkedPractitionerId !== undefined) {
      existing.linkedPractitionerId = patch.linkedPractitionerId || null;
    }
    if (patch.linkedSellerId !== undefined) {
      existing.linkedSellerId = patch.linkedSellerId || null;
    }
    if (patch.linkedHerCraftId !== undefined) {
      existing.linkedHerCraftId = patch.linkedHerCraftId || null;
    }
    if (patch.isActive !== undefined) {
      existing.isActive = Boolean(patch.isActive);
    }
    if (patch.fullName !== undefined && patch.fullName.trim()) {
      existing.fullName = patch.fullName.trim();
    }
    existing.updatedAt = new Date().toISOString();
    this.persistSnapshot();
    const { passwordHash: _omitted, ...account } = existing;
    return account;
  }

  public listDemoAccounts(): DemoAccountSpec[] {
    return DEMO_ACCOUNTS.map((a) => ({ ...a }));
  }

  public loginOrProvisionDemoAccount(email: string): UserAccount {
    const normalized = email.trim().toLowerCase();
    const spec = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
    if (!spec) {
      throw new Error(`Demo account '${email}' is not in the local demonstration roster.`);
    }
    const existing = this.findUserByEmail(normalized);
    if (existing) {
      const { passwordHash: _omitted, ...account } = existing;
      return account;
    }
    return this.createUser({
      email: spec.email,
      password: "DemoPassword!2026",
      fullName: spec.fullName,
      role: spec.role,
      accountType: spec.accountType,
      linkedPractitionerId: spec.linkedPractitionerId || null,
      linkedSellerId: spec.linkedSellerId || null,
      linkedHerCraftId: spec.linkedHerCraftId || null,
    });
  }

  public listLocations(): GeoLocation[] {
    return Array.from(this.locations.values());
  }

  public getLocationById(id: string): GeoLocation | null {
    return this.locations.get(id) || null;
  }

  public listAdminRecords(filter?: {
    origin?: RecordOrigin;
    status?: RecordStatus;
  }): CulturalRecordAdmin[] {
    let list = Array.from(this.records.values());
    if (filter?.origin) {
      list = list.filter((r) => r.recordOrigin === filter.origin);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public getAdminRecordById(id: string): CulturalRecordAdmin | null {
    const rec = this.records.get(id);
    return rec ? structuredClone(rec) : null;
  }

  public getAdminRecordBySlug(slug: string): CulturalRecordAdmin | null {
    for (const rec of Array.from(this.records.values())) {
      if (rec.slug === slug) {
        return structuredClone(rec);
      }
    }
    return null;
  }

  public createCulturalRecord(
    input: CreateRecordInput,
    actor: UserAccount
  ): CulturalRecordAdmin {
    const id = `rec-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const origin: RecordOrigin = input.recordOrigin || "FIELD_VERIFIED";
    const slug = input.slug?.trim() || makeSlug(input.titleEn);

    if (this.getAdminRecordBySlug(slug)) {
      throw new Error(`A cultural record with slug '${slug}' already exists.`);
    }

    const passport = createDefaultRightsPassport(`pass-${id}`, id, origin);

    const vocabulary: HeritageVocabularyItem[] = (input.vocabulary || []).map(
      (v, idx) => ({
        id: `voc-${id}-${idx + 1}`,
        culturalRecordId: id,
        termRoman: v.termRoman,
        termDevanagari: v.termDevanagari,
        languageCode: v.languageCode || "mr",
        meaningEn: v.meaningEn,
        meaningMr: v.meaningMr || "",
        misunderstoodNote: v.misunderstoodNote || "",
      })
    );

    const initialLog: ProvenanceLogEntry = {
      id: `prov-${crypto.randomUUID()}`,
      culturalRecordId: id,
      stepType: "COLLECTED",
      performedByUserId: actor.id,
      performedByRole: actor.role,
      performedByDisplay: `${actor.fullName} (${actor.role})`,
      practitionerApproved: false,
      practitionerApprovedAt: null,
      versionLabel: "v1",
      notes: "Initial field documentation record created in Admin Panel.",
      createdAt: now,
    };

    const record: CulturalRecordAdmin = {
      id,
      slug,
      traditionId: input.traditionId ?? null,
      traditionSlug: input.traditionSlug ?? null,
      recordOrigin: origin,
      status: "DRAFT",
      unescoDomain: input.unescoDomain,
      category: input.category,
      isWomenLed: Boolean(input.isWomenLed),
      isSacredOrRestricted: Boolean(input.isSacredOrRestricted),
      practitionerFullNamePrivate: input.practitionerFullNamePrivate || "",
      practitionerChosenName: input.practitionerChosenName,
      practitionerCommunityName: input.practitionerCommunityName || "",
      practitionerVillagePrivate: input.practitionerVillagePrivate || "",
      practitionerTaluka: input.practitionerTaluka || "",
      practitionerPhonePrivate: input.practitionerPhonePrivate || "",
      practitionerAddressPrivate: input.practitionerAddressPrivate || "",
      stateId: input.stateId,
      districtId: input.districtId ?? null,
      talukaId: input.talukaId ?? null,
      cityTownId: input.cityTownId ?? null,
      sourceAttribution: input.sourceAttribution ?? null,
      sourceUrl: input.sourceUrl ?? null,
      exactLatPrivate:
        input.exactLatPrivate !== undefined && input.exactLatPrivate !== null
          ? Number(input.exactLatPrivate)
          : null,
      exactLngPrivate:
        input.exactLngPrivate !== undefined && input.exactLngPrivate !== null
          ? Number(input.exactLngPrivate)
          : null,
      titleEn: input.titleEn,
      titleMr: input.titleMr || "",
      subtitleEn: input.subtitleEn || "",
      summaryEn: input.summaryEn,
      summaryMr: input.summaryMr || "",
      practiceContextEn: input.practiceContextEn || "",
      practiceContextMr: input.practiceContextMr || "",
      tags: input.tags || [],
      heroImageUrl: input.heroImageUrl ?? "",
      originalVoiceLanguage: input.originalVoiceLanguage || "Marathi",
      originalVoiceAudioUrl: input.originalVoiceAudioUrl ?? null,
      originalVoiceTranscriptMr: input.originalVoiceTranscriptMr ?? null,
      mediationM1SubtitlesEn: input.mediationM1SubtitlesEn ?? null,
      mediationM2SyntheticContextText:
        input.mediationM2SyntheticContextText ?? null,
      mediationM3HumanStoryCompanionText:
        input.mediationM3HumanStoryCompanionText ?? null,
      mediationM3NarratorCredit: input.mediationM3NarratorCredit ?? null,
      storyCompanionPrompts: input.storyCompanionPrompts || [
        {
          question: "What is this practice?",
          answer: input.summaryEn,
        },
        {
          question: "What should visitors respect?",
          answer:
            "Free, prior, sustained, and informed consent recorded on the Cultural Rights Passport.",
        },
      ],
      vocabulary,
      rightsPassport: passport,
      provenanceLogs: [initialLog],
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.records.set(id, record);
    this.persistSnapshot();
    return structuredClone(record);
  }

  public updateCulturalRecord(
    id: string,
    patch: Partial<CreateRecordInput>,
    _actor: UserAccount
  ): CulturalRecordAdmin {
    const existing = this.records.get(id);
    if (!existing) {
      throw new Error(`Cultural record '${id}' not found.`);
    }
    const now = new Date().toISOString();

    if (patch.traditionId !== undefined) existing.traditionId = patch.traditionId;
    if (patch.traditionSlug !== undefined) existing.traditionSlug = patch.traditionSlug;
    if (patch.titleEn !== undefined) existing.titleEn = patch.titleEn;
    if (patch.titleMr !== undefined) existing.titleMr = patch.titleMr;
    if (patch.subtitleEn !== undefined) existing.subtitleEn = patch.subtitleEn;
    if (patch.summaryEn !== undefined) existing.summaryEn = patch.summaryEn;
    if (patch.summaryMr !== undefined) existing.summaryMr = patch.summaryMr;
    if (patch.practiceContextEn !== undefined)
      existing.practiceContextEn = patch.practiceContextEn;
    if (patch.practiceContextMr !== undefined)
      existing.practiceContextMr = patch.practiceContextMr;
    if (patch.category !== undefined) existing.category = patch.category;
    if (patch.unescoDomain !== undefined)
      existing.unescoDomain = patch.unescoDomain;
    if (patch.isWomenLed !== undefined)
      existing.isWomenLed = Boolean(patch.isWomenLed);
    if (patch.isSacredOrRestricted !== undefined) {
      existing.isSacredOrRestricted = Boolean(patch.isSacredOrRestricted);
      if (
        existing.isSacredOrRestricted &&
        existing.status === "PUBLISHED"
      ) {
        existing.status = "RESTRICTED";
      }
    }
    if (patch.practitionerFullNamePrivate !== undefined)
      existing.practitionerFullNamePrivate = patch.practitionerFullNamePrivate;
    if (patch.practitionerChosenName !== undefined)
      existing.practitionerChosenName = patch.practitionerChosenName;
    if (patch.practitionerCommunityName !== undefined)
      existing.practitionerCommunityName = patch.practitionerCommunityName;
    if (patch.practitionerVillagePrivate !== undefined)
      existing.practitionerVillagePrivate = patch.practitionerVillagePrivate;
    if (patch.practitionerTaluka !== undefined)
      existing.practitionerTaluka = patch.practitionerTaluka;
    if (patch.practitionerPhonePrivate !== undefined)
      existing.practitionerPhonePrivate = patch.practitionerPhonePrivate;
    if (patch.practitionerAddressPrivate !== undefined)
      existing.practitionerAddressPrivate = patch.practitionerAddressPrivate;
    if (patch.stateId !== undefined) existing.stateId = patch.stateId;
    if (patch.districtId !== undefined) existing.districtId = patch.districtId;
    if (patch.talukaId !== undefined) existing.talukaId = patch.talukaId;
    if (patch.cityTownId !== undefined) existing.cityTownId = patch.cityTownId;
    if (patch.heroImageUrl !== undefined) existing.heroImageUrl = patch.heroImageUrl;
    if (patch.sourceAttribution !== undefined) existing.sourceAttribution = patch.sourceAttribution;
    if (patch.sourceUrl !== undefined) existing.sourceUrl = patch.sourceUrl;
    if (patch.exactLatPrivate !== undefined) {
      existing.exactLatPrivate =
        patch.exactLatPrivate !== null ? Number(patch.exactLatPrivate) : null;
    }
    if (patch.exactLngPrivate !== undefined) {
      existing.exactLngPrivate =
        patch.exactLngPrivate !== null ? Number(patch.exactLngPrivate) : null;
    }
    if (patch.tags !== undefined) existing.tags = patch.tags;
    if (patch.originalVoiceLanguage !== undefined)
      existing.originalVoiceLanguage = patch.originalVoiceLanguage;
    if (patch.originalVoiceAudioUrl !== undefined)
      existing.originalVoiceAudioUrl = patch.originalVoiceAudioUrl;
    if (patch.originalVoiceTranscriptMr !== undefined)
      existing.originalVoiceTranscriptMr = patch.originalVoiceTranscriptMr;
    if (patch.mediationM1SubtitlesEn !== undefined)
      existing.mediationM1SubtitlesEn = patch.mediationM1SubtitlesEn;
    if (patch.mediationM2SyntheticContextText !== undefined)
      existing.mediationM2SyntheticContextText =
        patch.mediationM2SyntheticContextText;
    if (patch.mediationM3HumanStoryCompanionText !== undefined)
      existing.mediationM3HumanStoryCompanionText =
        patch.mediationM3HumanStoryCompanionText;
    if (patch.mediationM3NarratorCredit !== undefined)
      existing.mediationM3NarratorCredit = patch.mediationM3NarratorCredit;
    if (patch.storyCompanionPrompts !== undefined)
      existing.storyCompanionPrompts = patch.storyCompanionPrompts;
    if (patch.vocabulary !== undefined) {
      existing.vocabulary = patch.vocabulary.map((v, idx) => ({
        id: `voc-${existing.id}-${idx + 1}`,
        culturalRecordId: existing.id,
        termRoman: v.termRoman,
        termDevanagari: v.termDevanagari,
        languageCode: v.languageCode || "mr",
        meaningEn: v.meaningEn,
        meaningMr: v.meaningMr || "",
        misunderstoodNote: v.misunderstoodNote || "",
      }));
    }

    existing.updatedAt = now;
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public updateRightsPassport(
    recordId: string,
    input: UpdateRightsPassportInput,
    actor: UserAccount
  ): CulturalRecordAdmin {
    const existing = this.records.get(recordId);
    if (!existing) {
      throw new Error(`Cultural record '${recordId}' not found.`);
    }
    const now = new Date().toISOString();
    const pass = existing.rightsPassport;

    if (input.consentTakingPart !== undefined)
      pass.consentTakingPart = input.consentTakingPart;
    if (input.consentBeingRecorded !== undefined)
      pass.consentBeingRecorded = input.consentBeingRecorded;
    if (input.consentPublicUse !== undefined)
      pass.consentPublicUse = input.consentPublicUse;
    if (input.consentMode !== undefined) pass.consentMode = input.consentMode;
    if (input.witnessNamePrivate !== undefined)
      pass.witnessNamePrivate = input.witnessNamePrivate;
    if (input.consentSignedAt !== undefined)
      pass.consentSignedAt = input.consentSignedAt;

    if (input.statements) {
      pass.statements = {
        ...pass.statements,
        ...input.statements,
      };
    }

    if (input.identityDisplay !== undefined)
      pass.identityDisplay = input.identityDisplay;
    if (input.locationGranularity !== undefined)
      pass.locationGranularity = input.locationGranularity;
    if (input.audioVideoAccess !== undefined)
      pass.audioVideoAccess = input.audioVideoAccess;
    if (input.translationScope !== undefined)
      pass.translationScope = input.translationScope;
    if (input.allowedTranslationLanguages !== undefined)
      pass.allowedTranslationLanguages = input.allowedTranslationLanguages;
    if (input.aiUse !== undefined) pass.aiUse = input.aiUse;
    if (input.downloadReuse !== undefined)
      pass.downloadReuse = input.downloadReuse;
    if (input.commercialUse !== undefined)
      pass.commercialUse = input.commercialUse;
    if (input.contactMode !== undefined) pass.contactMode = input.contactMode;
    if (input.withdrawalStatus !== undefined) {
      pass.withdrawalStatus = input.withdrawalStatus;
      if (input.withdrawalStatus === "RESTRICTED") {
        existing.status = "RESTRICTED";
      } else if (input.withdrawalStatus === "REMOVED") {
        existing.status = "WITHDRAWN";
      }
    }
    if (input.practitionerConfirmedAt !== undefined)
      pass.practitionerConfirmedAt = input.practitionerConfirmedAt;
    if (input.preReleaseReconfirmedAt !== undefined)
      pass.preReleaseReconfirmedAt = input.preReleaseReconfirmedAt;

    pass.version += 1;
    pass.updatedAt = now;
    existing.updatedAt = now;

    const allStatementsTrue = Object.values(pass.statements).every(Boolean);
    if (
      pass.consentTakingPart &&
      pass.consentBeingRecorded &&
      pass.consentPublicUse &&
      allStatementsTrue
    ) {
      if (existing.status === "DRAFT") {
        existing.status = "CONSENT_RECORDED";
      }
      const alreadyHasConsentLog = existing.provenanceLogs.some(
        (l) => l.stepType === "CONSENTED" && l.practitionerApproved
      );
      if (!alreadyHasConsentLog) {
        existing.provenanceLogs.push({
          id: `prov-${crypto.randomUUID()}`,
          culturalRecordId: existing.id,
          stepType: "CONSENTED",
          performedByUserId: actor.id,
          performedByRole: actor.role,
          performedByDisplay: `${actor.fullName} (${actor.role})`,
          practitionerApproved: true,
          practitionerApprovedAt: pass.practitionerConfirmedAt || now,
          versionLabel: `v${pass.version}`,
          notes: `Informed consent & Rights Passport (mode: ${pass.consentMode}) recorded.`,
          createdAt: now,
        });
      }
    }

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public addProvenanceStep(
    recordId: string,
    input: AddProvenanceStepInput
  ): CulturalRecordAdmin {
    const existing = this.records.get(recordId);
    if (!existing) {
      throw new Error(`Cultural record '${recordId}' not found.`);
    }
    const now = new Date().toISOString();
    const entry: ProvenanceLogEntry = {
      id: `prov-${crypto.randomUUID()}`,
      culturalRecordId: existing.id,
      stepType: input.stepType,
      performedByUserId: input.performedByUserId,
      performedByRole: input.performedByRole,
      performedByDisplay: input.performedByDisplay,
      practitionerApproved: input.practitionerApproved,
      practitionerApprovedAt: input.practitionerApproved ? now : null,
      versionLabel: input.versionLabel || `v${existing.rightsPassport.version}`,
      notes: input.notes,
      createdAt: now,
    };
    existing.provenanceLogs.push(entry);

    if (
      input.stepType === "TRANSCRIBED" ||
      input.stepType === "TRANSLATED" ||
      input.stepType === "NARRATED"
    ) {
      if (
        existing.status === "DRAFT" ||
        existing.status === "CONSENT_RECORDED"
      ) {
        existing.status = "UNDER_REVIEW";
      }
    } else if (input.stepType === "APPROVED" && input.practitionerApproved) {
      existing.status = "PRACTITIONER_APPROVED";
      if (!existing.rightsPassport.practitionerConfirmedAt) {
        existing.rightsPassport.practitionerConfirmedAt = now;
      }
      existing.rightsPassport.preReleaseReconfirmedAt = now;
    }

    existing.updatedAt = now;
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public publishCulturalRecord(
    recordId: string,
    actor: UserAccount,
    notes?: string
  ): CulturalRecordAdmin {
    const existing = this.records.get(recordId);
    if (!existing) {
      throw new Error(`Cultural record '${recordId}' not found.`);
    }

    const gate = evaluatePublicationGate(existing);
    if (!gate.allowed) {
      throw new ConsentGateError(gate.reasons);
    }

    const now = new Date().toISOString();
    existing.status = "PUBLISHED";
    existing.publishedAt = now;
    existing.updatedAt = now;

    existing.provenanceLogs.push({
      id: `prov-${crypto.randomUUID()}`,
      culturalRecordId: existing.id,
      stepType: "PUBLISHED",
      performedByUserId: actor.id,
      performedByRole: actor.role,
      performedByDisplay: `${actor.fullName} (${actor.role})`,
      practitionerApproved: true,
      practitionerApprovedAt: now,
      versionLabel: `v${existing.rightsPassport.version}`,
      notes:
        notes ||
        "Published to public CultureMap after passing all Cultural Rights Passport and Provenance checks.",
      createdAt: now,
    });

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public restrictOrWithdrawRecord(
    recordId: string,
    action: "RESTRICTED" | "WITHDRAWN",
    actor: UserAccount,
    reason: string
  ): CulturalRecordAdmin {
    const existing = this.records.get(recordId);
    if (!existing) {
      throw new Error(`Cultural record '${recordId}' not found.`);
    }
    const now = new Date().toISOString();
    existing.status = action;
    existing.rightsPassport.withdrawalStatus =
      action === "WITHDRAWN" ? "REMOVED" : "RESTRICTED";
    existing.rightsPassport.version += 1;
    existing.rightsPassport.updatedAt = now;
    existing.updatedAt = now;

    existing.provenanceLogs.push({
      id: `prov-${crypto.randomUUID()}`,
      culturalRecordId: existing.id,
      stepType: action === "WITHDRAWN" ? "REMOVED" : "RESTRICTED",
      performedByUserId: actor.id,
      performedByRole: actor.role,
      performedByDisplay: `${actor.fullName} (${actor.role})`,
      practitionerApproved: true,
      practitionerApprovedAt: now,
      versionLabel: `v${existing.rightsPassport.version}`,
      notes: reason || `Record ${action.toLowerCase()} per Rights Passport protocol.`,
      createdAt: now,
    });

    this.persistSnapshot();
    return structuredClone(existing);
  }

  private isPubliclyVisible(record: CulturalRecordAdmin): boolean {
    if (record.status !== "PUBLISHED") return false;
    const gate = evaluatePublicationGate(record);
    return gate.allowed;
  }

  public listPublicRecords(filter?: {
    origin?: RecordOrigin;
    category?: string;
    stateId?: string;
    districtId?: string;
    cityTownId?: string;
    traditionId?: string;
  }): PublicCulturalRecord[] {
    const visible = Array.from(this.records.values()).filter((r) => {
      if (!this.isPubliclyVisible(r)) return false;
      if (filter?.origin && r.recordOrigin !== filter.origin) return false;
      if (
        filter?.category &&
        filter.category !== "All" &&
        r.category !== filter.category
      ) {
        return false;
      }
      if (filter?.stateId && r.stateId !== filter.stateId) return false;
      if (filter?.districtId && r.districtId !== filter.districtId) return false;
      if (filter?.cityTownId && r.cityTownId !== filter.cityTownId) return false;
      if (
        filter?.traditionId &&
        r.traditionId !== filter.traditionId &&
        r.traditionSlug !== filter.traditionId
      ) {
        return false;
      }
      return true;
    });

    visible.sort((a, b) => {
      if (a.recordOrigin !== b.recordOrigin) {
        return a.recordOrigin === "FIELD_VERIFIED" ? -1 : 1;
      }
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    });

    return visible.map((r) =>
      toPublicCulturalRecord(r, {
        state: this.locations.get(r.stateId),
        district: r.districtId ? this.locations.get(r.districtId) : null,
        taluka: r.talukaId ? this.locations.get(r.talukaId) : null,
        cityTown: r.cityTownId ? this.locations.get(r.cityTownId) : null,
      })
    );
  }

  public getPublicRecordBySlug(slug: string): PublicCulturalRecord | null {
    const rec = this.getAdminRecordBySlug(slug);
    if (!rec || !this.isPubliclyVisible(rec)) {
      return null;
    }
    return toPublicCulturalRecord(rec, {
      state: this.locations.get(rec.stateId),
      district: rec.districtId ? this.locations.get(rec.districtId) : null,
      taluka: rec.talukaId ? this.locations.get(rec.talukaId) : null,
      cityTown: rec.cityTownId ? this.locations.get(rec.cityTownId) : null,
    });
  }

  public createLocation(input: {
    id?: string;
    level: GeoLocation["level"];
    nameEn: string;
    nameMr?: string;
    abbr?: string;
    parentId: string | null;
    centerLat: number;
    centerLng: number;
    defaultZoom?: number;
  }): GeoLocation {
    const slug = input.nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = input.id?.trim() || `loc-${input.level.toLowerCase()}-${slug}`;
    const loc: GeoLocation = {
      id,
      level: input.level,
      nameEn: input.nameEn.trim(),
      nameMr: input.nameMr?.trim() || undefined,
      abbr: input.abbr?.trim() || undefined,
      parentId: input.parentId || null,
      centerLat: Number(input.centerLat),
      centerLng: Number(input.centerLng),
      defaultZoom:
        input.defaultZoom ??
        (input.level === "STATE"
          ? 7
          : input.level === "DISTRICT"
            ? 9
            : input.level === "TALUKA"
              ? 11
              : 12),
    };
    this.locations.set(id, loc);
    this.persistSnapshot();
    return loc;
  }

  private collectDescendantLocationIds(rootId: string): Set<string> {
    const ids = new Set<string>([rootId]);
    const allLocs = Array.from(this.locations.values());
    let added = true;
    while (added) {
      added = false;
      for (const l of allLocs) {
        if (l.parentId && ids.has(l.parentId) && !ids.has(l.id)) {
          ids.add(l.id);
          added = true;
        }
      }
    }
    return ids;
  }

  public getGeographyMetadata(): GeographyDatasetMetadata {
    const allLocations = Array.from(this.locations.values());
    const publicRecords = this.listPublicRecords();

    const populatedPlaceIds = new Set<string>();
    for (const r of Array.from(this.records.values())) {
      if (!this.isPubliclyVisible(r)) continue;
      if (r.stateId) populatedPlaceIds.add(r.stateId);
      if (r.districtId) populatedPlaceIds.add(r.districtId);
      if (r.talukaId) populatedPlaceIds.add(r.talukaId);
      if (r.cityTownId) populatedPlaceIds.add(r.cityTownId);
    }
    for (const tp of Array.from(this.traditionPlaces.values())) {
      const tr = this.traditions.get(tp.traditionId);
      if (!tr || tr.status !== "PUBLISHED" || tr.isSacredOrRestricted) continue;
      if (tp.locationId) populatedPlaceIds.add(tp.locationId);
      if (tp.stateId) populatedPlaceIds.add(tp.stateId);
      if (tp.districtId) populatedPlaceIds.add(tp.districtId);
    }
    if (publicRecords.length > 0) {
      populatedPlaceIds.add("loc-country-in");
    }

    return buildGeographyDatasetMetadata(
      allLocations,
      populatedPlaceIds.size
    );
  }

  public getPlaceDetail(idOrSlug: string): PlaceDetailPayload | null {
    const query = decodeURIComponent(idOrSlug).trim();
    const queryLower = query.toLowerCase();
    const allLocations = Array.from(this.locations.values());

    let place = this.locations.get(query) || null;
    if (!place) {
      place =
        allLocations.find(
          (l) =>
            l.id.toLowerCase() === queryLower ||
            l.nameEn.toLowerCase() === queryLower ||
            l.nameEn
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") === queryLower
        ) || null;
    }
    if (!place) return null;

    const breadcrumbs: GeoLocation[] = [];
    const visited = new Set<string>();
    let cursor: GeoLocation | null = place;
    while (cursor && !visited.has(cursor.id)) {
      visited.add(cursor.id);
      breadcrumbs.unshift(cursor);
      cursor = cursor.parentId
        ? this.locations.get(cursor.parentId) || null
        : null;
    }

    const parentPlace = place.parentId
      ? this.locations.get(place.parentId) || null
      : null;

    const directChildren = allLocations.filter((l) => l.parentId === place!.id);
    const allVisibleAdminRecs = Array.from(this.records.values()).filter((r) =>
      this.isPubliclyVisible(r)
    );
    const allPublicEvents = this.listPublicEvents();

    const matchesPlaceTree = (
      rec: CulturalRecordAdmin,
      treeIds: Set<string>,
      targetPlace: GeoLocation
    ): boolean => {
      if (targetPlace.level === "COUNTRY") return true;
      if (rec.stateId && treeIds.has(rec.stateId)) return true;
      if (rec.districtId && treeIds.has(rec.districtId)) return true;
      if (rec.talukaId && treeIds.has(rec.talukaId)) return true;
      if (rec.cityTownId && treeIds.has(rec.cityTownId)) return true;
      if (
        targetPlace.level === "TALUKA" &&
        rec.districtId === targetPlace.parentId &&
        rec.practitionerTaluka &&
        targetPlace.nameEn
          .toLowerCase()
          .startsWith(rec.practitionerTaluka.toLowerCase())
      ) {
        return true;
      }
      return false;
    };

    const matchesEventTree = (
      evt: CulturalEventItem,
      treeIds: Set<string>,
      targetPlace: GeoLocation
    ): boolean => {
      if (targetPlace.level === "COUNTRY") return true;
      if (evt.stateId && treeIds.has(evt.stateId)) return true;
      if (evt.districtId && treeIds.has(evt.districtId)) return true;
      if (evt.talukaId && treeIds.has(evt.talukaId)) return true;
      if (evt.cityTownId && treeIds.has(evt.cityTownId)) return true;
      return false;
    };

    const childPlaces: PlaceChildSummary[] = directChildren.map((child) => {
      const childTreeIds = this.collectDescendantLocationIds(child.id);
      const childRecs = allVisibleAdminRecs.filter((r) =>
        matchesPlaceTree(r, childTreeIds, child)
      );
      const practitionerApprovedCount = childRecs.filter(
        (r) => r.recordOrigin === "FIELD_VERIFIED"
      ).length;
      const referenceCount = childRecs.filter(
        (r) => r.recordOrigin === "DEMO_REFERENCE"
      ).length;
      const upcomingEventsCount = allPublicEvents.filter((e) =>
        matchesEventTree(e, childTreeIds, child)
      ).length;

      const coverageStatus: PlaceChildSummary["coverageStatus"] =
        practitionerApprovedCount > 0
          ? "PRACTITIONER_APPROVED"
          : referenceCount > 0
            ? "REFERENCE_DOCUMENTED"
            : "COLLECTION_IN_PROGRESS";

      return {
        ...child,
        recordCount: childRecs.length,
        practitionerApprovedCount,
        referenceCount,
        upcomingEventsCount,
        coverageStatus,
      };
    });

    const levelOrder: Record<string, number> = {
      STATE: 1,
      DISTRICT: 2,
      TALUKA: 3,
      CITY_TOWN: 4,
      VILLAGE: 5,
    };
    childPlaces.sort((a, b) => {
      const lo = (levelOrder[a.level] || 9) - (levelOrder[b.level] || 9);
      if (lo !== 0) return lo;
      if (b.recordCount !== a.recordCount) return b.recordCount - a.recordCount;
      return a.nameEn.localeCompare(b.nameEn);
    });

    const placeTreeIds = this.collectDescendantLocationIds(place.id);
    const matchingAdminRecords = allVisibleAdminRecs.filter((r) => {
      if (
        place!.level !== "COUNTRY" &&
        place!.level !== "STATE" &&
        r.rightsPassport.locationGranularity === "HIDDEN"
      ) {
        return false;
      }
      if (
        (place!.level === "CITY_TOWN" ||
          place!.level === "VILLAGE" ||
          place!.level === "TALUKA") &&
        r.recordOrigin === "FIELD_VERIFIED" &&
        r.rightsPassport.locationGranularity === "DISTRICT"
      ) {
        return false;
      }
      return matchesPlaceTree(r, placeTreeIds, place!);
    });

    const publicRecords = matchingAdminRecords.map((r) =>
      toPublicCulturalRecord(r, {
        state: this.locations.get(r.stateId),
        district: r.districtId ? this.locations.get(r.districtId) : null,
        taluka: r.talukaId ? this.locations.get(r.talukaId) : null,
        cityTown: r.cityTownId ? this.locations.get(r.cityTownId) : null,
      })
    );

    const placeEvents = allPublicEvents.filter((e) =>
      matchesEventTree(e, placeTreeIds, place!)
    );

    const practitionerApprovedCount = publicRecords.filter(
      (r) => r.recordOrigin === "FIELD_VERIFIED"
    ).length;
    const referenceCount = publicRecords.filter(
      (r) => r.recordOrigin === "DEMO_REFERENCE"
    ).length;
    const childPlacesWithRecords = childPlaces.filter(
      (c) => c.recordCount > 0
    ).length;

    const statusLabel =
      practitionerApprovedCount > 0
        ? "Practitioner-approved records available"
        : referenceCount > 0
          ? "Reference information available · Community verification pending"
          : "Collection in progress";

    const allPubTraditions = this.queryPublicTraditions({ pageSize: 200 }).traditions;
    const placeTraditions = allPubTraditions.filter((t) => {
      if (place!.level === "COUNTRY") return true;
      return t.places.some(
        (tp) =>
          placeTreeIds.has(tp.locationId) ||
          placeTreeIds.has(tp.stateId) ||
          (tp.districtId && placeTreeIds.has(tp.districtId))
      );
    });

    return {
      place,
      breadcrumbs,
      parentPlace,
      childPlaces,
      records: publicRecords,
      traditions: placeTraditions,
      events: placeEvents,
      coverageSummary: {
        totalPublishedRecords: publicRecords.length,
        practitionerApprovedCount,
        referenceCount,
        upcomingEventsCount: placeEvents.length,
        childPlacesTotal: childPlaces.length,
        childPlacesWithRecords,
        statusLabel,
      },
      datasetMetadata: this.getGeographyMetadata(),
    };
  }

  private isEventPubliclyVisible(event: CulturalEventAdmin): boolean {
    if (event.status !== "PUBLISHED") return false;
    const gate = evaluateEventPublicationGate(event);
    return gate.allowed;
  }

  private serializePublicEvent(event: CulturalEventAdmin): CulturalEventItem {
    const linkedRecord = event.culturalRecordId
      ? this.records.get(event.culturalRecordId) || null
      : null;
    return toPublicCulturalEvent(
      event,
      {
        state: this.locations.get(event.stateId),
        district: event.districtId
          ? this.locations.get(event.districtId)
          : null,
        taluka: event.talukaId ? this.locations.get(event.talukaId) : null,
        cityTown: event.cityTownId
          ? this.locations.get(event.cityTownId)
          : null,
      },
      linkedRecord
    );
  }

  public getPublicEventById(id: string): CulturalEventItem | null {
    const evt = this.events.get(id);
    if (!evt || !this.isEventPubliclyVisible(evt)) {
      return null;
    }
    return this.serializePublicEvent(evt);
  }

  public getAdminEventById(id: string): CulturalEventAdmin | null {
    const evt = this.events.get(id);
    if (!evt) return null;
    const clone = structuredClone(evt);
    clone.eventPublicationGate = evaluateEventPublicationGate(clone);
    return clone;
  }

  public queryPublicCalendar(
    filter?: CalendarQueryFilter
  ): CalendarQueryPayload {
    const allPublished = Array.from(this.events.values())
      .filter((e) => this.isEventPubliclyVisible(e))
      .map((e) => this.serializePublicEvent(e));

    const interestSet = new Set<string>();
    for (const e of allPublished) {
      for (const tag of e.visitorInterests || []) {
        interestSet.add(tag);
      }
    }

    const facets = {
      totalPublished: allPublished.length,
      confirmedCount: allPublished.filter(
        (e) => e.scheduleStatus === "CONFIRMED"
      ).length,
      provisionalCount: allPublished.filter(
        (e) => e.scheduleStatus === "PROVISIONAL"
      ).length,
      seasonalEstimateCount: allPublished.filter(
        (e) => e.scheduleStatus === "SEASONAL_ESTIMATE"
      ).length,
      cancelledCount: allPublished.filter(
        (e) => e.scheduleStatus === "CANCELLED"
      ).length,
      pastCount: allPublished.filter((e) => e.scheduleStatus === "PAST").length,
      recurringTraditionsCount: allPublished.filter(
        (e) => e.isRecurringTradition
      ).length,
      visitorInterests: Array.from(interestSet).sort(),
    };

    const includePast = filter?.includePast !== false;
    const includeCancelled = filter?.includeCancelled !== false;
    const q = (filter?.q || "").trim().toLowerCase();

    const filtered = allPublished.filter((e) => {
      if (!includePast && e.scheduleStatus === "PAST") return false;
      if (!includeCancelled && e.scheduleStatus === "CANCELLED") return false;

      if (filter?.stateId && e.stateId !== filter.stateId) return false;
      if (filter?.districtId && e.districtId !== filter.districtId)
        return false;
      if (filter?.placeId) {
        const pid = filter.placeId;
        if (
          e.stateId !== pid &&
          e.districtId !== pid &&
          e.talukaId !== pid &&
          e.cityTownId !== pid
        ) {
          return false;
        }
      }
      if (
        filter?.category &&
        filter.category !== "All" &&
        e.category !== filter.category
      ) {
        return false;
      }
      if (
        filter?.scheduleStatus &&
        filter.scheduleStatus !== "ALL" &&
        e.scheduleStatus !== filter.scheduleStatus
      ) {
        return false;
      }
      if (
        filter?.visitorInterest &&
        filter.visitorInterest !== "All" &&
        !(e.visitorInterests || []).includes(filter.visitorInterest)
      ) {
        return false;
      }
      if (filter?.onlyRecurring && !e.isRecurringTradition) {
        return false;
      }

      // Date boundary filtering: check primary [startDate, endDate] or any occurrence
      if (filter?.dateFrom || filter?.dateTo) {
        const from = filter.dateFrom || "0000-01-01";
        const to = filter.dateTo || "9999-12-31";
        const evtStart = e.startDate;
        const evtEnd = e.endDate || e.startDate;
        const primaryOverlaps = evtStart <= to && evtEnd >= from;
        const occOverlaps = (e.occurrences || []).some((occ) => {
          const oStart = occ.startDate;
          const oEnd = occ.endDate || occ.startDate;
          return oStart <= to && oEnd >= from;
        });
        if (!primaryOverlaps && !occOverlaps) return false;
      }

      if (q) {
        const haystack = [
          e.titleEn,
          e.titleMr,
          e.descriptionEn,
          e.descriptionMr,
          e.category,
          e.stateName,
          e.districtName || "",
          e.talukaName || "",
          e.cityTownName || "",
          e.venueLabel,
          e.culturalRecordTitle || "",
          ...(e.visitorInterests || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const page = Math.max(1, Number(filter?.page || 1));
    const pageSize = Math.max(1, Math.min(50, Number(filter?.pageSize || 12)));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const pagedEvents = filtered.slice(offset, offset + pageSize);

    return {
      events: pagedEvents,
      total,
      page,
      pageSize,
      totalPages,
      facets,
    };
  }

  public listPublicEvents(filter?: {
    stateId?: string;
    districtId?: string;
    category?: string;
  }): CulturalEventItem[] {
    return this.queryPublicCalendar({
      stateId: filter?.stateId,
      districtId: filter?.districtId,
      category: filter?.category,
      page: 1,
      pageSize: 50,
    }).events;
  }

  public listAdminEvents(): CulturalEventAdmin[] {
    return Array.from(this.events.values())
      .map((e) => {
        const clone = structuredClone(e);
        clone.eventPublicationGate = evaluateEventPublicationGate(clone);
        return clone;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  public createCulturalEvent(
    input: Partial<CulturalEventAdmin>,
    actor?: UserAccount | null
  ): CulturalEventAdmin {
    const id = input.id?.trim() || `evt-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const stateId = input.stateId || "loc-state-maharashtra";
    const districtId =
      input.districtId !== undefined
        ? input.districtId
        : "loc-district-kolhapur-district";
    const talukaId = input.talukaId ?? null;
    const cityTownId =
      input.cityTownId !== undefined ? input.cityTownId : "loc-city-kolhapur";

    const st = this.locations.get(stateId);
    const dist = districtId ? this.locations.get(districtId) : null;
    const tal = talukaId ? this.locations.get(talukaId) : null;
    const ct = cityTownId ? this.locations.get(cityTownId) : null;

    const linkedRec = input.culturalRecordId
      ? this.records.get(input.culturalRecordId) || null
      : null;

    const center = input.center || {
      lat: ct?.centerLat || tal?.centerLat || dist?.centerLat || st?.centerLat || 16.705,
      lng: ct?.centerLng || tal?.centerLng || dist?.centerLng || st?.centerLng || 74.2433,
    };

    const startDate = (input.startDate || "2026-12-01").trim();
    const endDate = input.endDate ? input.endDate.trim() : startDate;
    const scheduleStatus: EventScheduleStatus =
      input.scheduleStatus || "PROVISIONAL";

    const occurrences: CulturalEventOccurrence[] =
      Array.isArray(input.occurrences) && input.occurrences.length > 0
        ? input.occurrences.map((occ, idx) => ({
            id: occ.id || `occ-${id}-${idx + 1}`,
            eventId: id,
            label: occ.label || `Occurrence ${idx + 1}`,
            startDate: occ.startDate || startDate,
            endDate: occ.endDate || endDate,
            startTime: occ.startTime || input.startTime || null,
            endTime: occ.endTime || input.endTime || null,
            scheduleStatus: occ.scheduleStatus || scheduleStatus,
            verificationNote: occ.verificationNote || "",
          }))
        : [
            {
              id: `occ-${id}-1`,
              eventId: id,
              label: input.titleEn || "Primary Schedule Window",
              startDate,
              endDate,
              startTime: input.startTime || null,
              endTime: input.endTime || null,
              scheduleStatus,
              verificationNote:
                input.recurrenceNote ||
                "Verify final timings with the official organizer prior to attendance.",
            },
          ];

    const event: CulturalEventAdmin = {
      id,
      titleEn: (input.titleEn || "Community Cultural Gathering").trim(),
      titleMr: (input.titleMr || "").trim(),
      category: input.category || "Festival",
      eventType: input.eventType || "CULTURAL_GATHERING",
      descriptionEn: (
        input.descriptionEn ||
        "Cultural program documented in the Bharat CultureMap calendar."
      ).trim(),
      descriptionMr: (input.descriptionMr || "").trim(),
      culturalRecordId: linkedRec ? linkedRec.id : input.culturalRecordId || null,
      culturalRecordSlug: linkedRec
        ? linkedRec.slug
        : input.culturalRecordSlug || null,
      culturalRecordTitle: linkedRec
        ? linkedRec.titleEn
        : input.culturalRecordTitle || null,
      stateId,
      districtId,
      talukaId,
      cityTownId,
      stateName: st?.nameEn || "Maharashtra",
      districtName: dist?.nameEn || null,
      talukaName: tal?.nameEn || null,
      cityTownName: ct?.nameEn || null,
      venueLabel: (input.venueLabel || ct?.nameEn || "Community Venue").trim(),
      locationGranularity: input.locationGranularity || "CITY_TOWN",
      center,
      publicCenter: center,
      exactLatPrivate:
        input.exactLatPrivate !== undefined && input.exactLatPrivate !== null
          ? Number(input.exactLatPrivate)
          : null,
      exactLngPrivate:
        input.exactLngPrivate !== undefined && input.exactLngPrivate !== null
          ? Number(input.exactLngPrivate)
          : null,
      startDate,
      endDate,
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      timezone: input.timezone || "Asia/Kolkata",
      scheduleStatus,
      cancellationReason: input.cancellationReason || null,
      isRecurringTradition: Boolean(input.isRecurringTradition),
      recurrencePattern: input.recurrencePattern || "SINGLE_OCCURRENCE",
      recurrenceNote: input.recurrenceNote || "",
      occurrences,
      organizerDisplay: (
        input.organizerDisplay || "Regional Cultural Organizer"
      ).trim(),
      organizerContactAuthorized: Boolean(input.organizerContactAuthorized),
      organizerPublicContact: input.organizerPublicContact || null,
      organizerWebsiteUrl: input.organizerWebsiteUrl || null,
      organizerPrivateContact: input.organizerPrivateContact || "",
      sourceAttribution: (input.sourceAttribution || "").trim(),
      sourceUrl: input.sourceUrl || null,
      lastVerifiedAt:
        input.lastVerifiedAt !== undefined
          ? input.lastVerifiedAt
          : actor
            ? now
            : null,
      verifiedByDisplay:
        input.verifiedByDisplay ||
        (actor ? `${actor.fullName} (${actor.role})` : null),
      visitorAccess: input.visitorAccess || "ACCESS_NOT_ESTABLISHED",
      visitorAccessNote: input.visitorAccessNote || "",
      registrationRequirement:
        input.registrationRequirement || "NOT_ESTABLISHED",
      etiquetteNotes: input.etiquetteNotes || "",
      photographyRule: input.photographyRule || "PERMISSION_REQUIRED_ON_SITE",
      entryFeeInfo: input.entryFeeInfo || null,
      accessibilityInfo: input.accessibilityInfo || null,
      coverImageUrl: input.coverImageUrl ?? null,
      approvedMediaUrls: Array.isArray(input.approvedMediaUrls)
        ? input.approvedMediaUrls
        : [],
      relatedPractitioners: Array.isArray(input.relatedPractitioners)
        ? input.relatedPractitioners
        : [],
      visitorInterests: Array.isArray(input.visitorInterests)
        ? input.visitorInterests
        : [],
      isPrivateOrRestrictedCeremony: Boolean(
        input.isPrivateOrRestrictedCeremony
      ),
      reviewNotes: input.reviewNotes || "",
      submittedByPublicName: input.submittedByPublicName || null,
      submittedByPublicContact: input.submittedByPublicContact || null,
      status: input.status || "DRAFT",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    };

    const gate = evaluateEventPublicationGate(event);
    event.eventPublicationGate = gate;
    if (event.status === "PUBLISHED" && !gate.allowed) {
      event.status = "DRAFT";
    }

    this.events.set(id, event);
    this.persistSnapshot();
    return structuredClone(event);
  }

  public updateCulturalEvent(
    id: string,
    patch: Partial<CulturalEventAdmin>,
    actor?: UserAccount | null
  ): CulturalEventAdmin {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error(`Cultural event "${id}" not found.`);
    }
    const now = new Date().toISOString();

    if (patch.titleEn !== undefined) existing.titleEn = patch.titleEn.trim();
    if (patch.titleMr !== undefined) existing.titleMr = patch.titleMr.trim();
    if (patch.category !== undefined) existing.category = patch.category;
    if (patch.eventType !== undefined) existing.eventType = patch.eventType;
    if (patch.descriptionEn !== undefined)
      existing.descriptionEn = patch.descriptionEn.trim();
    if (patch.descriptionMr !== undefined)
      existing.descriptionMr = patch.descriptionMr.trim();
    if (patch.culturalRecordId !== undefined) {
      existing.culturalRecordId = patch.culturalRecordId;
      const linked = patch.culturalRecordId
        ? this.records.get(patch.culturalRecordId) || null
        : null;
      existing.culturalRecordSlug = linked?.slug || null;
      existing.culturalRecordTitle = linked?.titleEn || null;
    }
    if (patch.stateId !== undefined) existing.stateId = patch.stateId;
    if (patch.districtId !== undefined) existing.districtId = patch.districtId;
    if (patch.talukaId !== undefined) existing.talukaId = patch.talukaId;
    if (patch.cityTownId !== undefined) existing.cityTownId = patch.cityTownId;

    const st = this.locations.get(existing.stateId);
    const dist = existing.districtId
      ? this.locations.get(existing.districtId)
      : null;
    const tal = existing.talukaId
      ? this.locations.get(existing.talukaId)
      : null;
    const ct = existing.cityTownId
      ? this.locations.get(existing.cityTownId)
      : null;
    existing.stateName = st?.nameEn || existing.stateName;
    existing.districtName = dist?.nameEn || null;
    existing.talukaName = tal?.nameEn || null;
    existing.cityTownName = ct?.nameEn || null;

    if (patch.venueLabel !== undefined)
      existing.venueLabel = patch.venueLabel.trim();
    if (patch.locationGranularity !== undefined)
      existing.locationGranularity = patch.locationGranularity;
    if (patch.center !== undefined) existing.center = patch.center;
    if (patch.exactLatPrivate !== undefined) {
      existing.exactLatPrivate =
        patch.exactLatPrivate !== null ? Number(patch.exactLatPrivate) : null;
    }
    if (patch.exactLngPrivate !== undefined) {
      existing.exactLngPrivate =
        patch.exactLngPrivate !== null ? Number(patch.exactLngPrivate) : null;
    }
    if (patch.startDate !== undefined) existing.startDate = patch.startDate;
    if (patch.endDate !== undefined) existing.endDate = patch.endDate;
    if (patch.startTime !== undefined) existing.startTime = patch.startTime;
    if (patch.endTime !== undefined) existing.endTime = patch.endTime;
    if (patch.scheduleStatus !== undefined)
      existing.scheduleStatus = patch.scheduleStatus;
    if (patch.cancellationReason !== undefined)
      existing.cancellationReason = patch.cancellationReason;
    if (patch.isRecurringTradition !== undefined)
      existing.isRecurringTradition = Boolean(patch.isRecurringTradition);
    if (patch.recurrencePattern !== undefined)
      existing.recurrencePattern = patch.recurrencePattern;
    if (patch.recurrenceNote !== undefined)
      existing.recurrenceNote = patch.recurrenceNote;
    if (patch.occurrences !== undefined)
      existing.occurrences = patch.occurrences;
    if (patch.organizerDisplay !== undefined)
      existing.organizerDisplay = patch.organizerDisplay;
    if (patch.organizerContactAuthorized !== undefined)
      existing.organizerContactAuthorized = Boolean(
        patch.organizerContactAuthorized
      );
    if (patch.organizerPublicContact !== undefined)
      existing.organizerPublicContact = patch.organizerPublicContact;
    if (patch.organizerWebsiteUrl !== undefined)
      existing.organizerWebsiteUrl = patch.organizerWebsiteUrl;
    if (patch.organizerPrivateContact !== undefined)
      existing.organizerPrivateContact = patch.organizerPrivateContact;
    if (patch.sourceAttribution !== undefined)
      existing.sourceAttribution = patch.sourceAttribution;
    if (patch.sourceUrl !== undefined) existing.sourceUrl = patch.sourceUrl;
    if (patch.lastVerifiedAt !== undefined)
      existing.lastVerifiedAt = patch.lastVerifiedAt;
    else if (actor) existing.lastVerifiedAt = now;
    if (actor) {
      existing.verifiedByDisplay = `${actor.fullName} (${actor.role})`;
    }
    if (patch.visitorAccess !== undefined)
      existing.visitorAccess = patch.visitorAccess;
    if (patch.visitorAccessNote !== undefined)
      existing.visitorAccessNote = patch.visitorAccessNote;
    if (patch.registrationRequirement !== undefined)
      existing.registrationRequirement = patch.registrationRequirement;
    if (patch.etiquetteNotes !== undefined)
      existing.etiquetteNotes = patch.etiquetteNotes;
    if (patch.photographyRule !== undefined)
      existing.photographyRule = patch.photographyRule;
    if (patch.entryFeeInfo !== undefined)
      existing.entryFeeInfo = patch.entryFeeInfo;
    if (patch.accessibilityInfo !== undefined)
      existing.accessibilityInfo = patch.accessibilityInfo;
    if (patch.coverImageUrl !== undefined)
      existing.coverImageUrl = patch.coverImageUrl;
    if (patch.approvedMediaUrls !== undefined)
      existing.approvedMediaUrls = patch.approvedMediaUrls;
    if (patch.relatedPractitioners !== undefined)
      existing.relatedPractitioners = patch.relatedPractitioners;
    if (patch.visitorInterests !== undefined)
      existing.visitorInterests = patch.visitorInterests;
    if (patch.isPrivateOrRestrictedCeremony !== undefined) {
      existing.isPrivateOrRestrictedCeremony = Boolean(
        patch.isPrivateOrRestrictedCeremony
      );
    }
    if (patch.reviewNotes !== undefined)
      existing.reviewNotes = patch.reviewNotes;
    if (patch.status !== undefined) existing.status = patch.status;

    const gate = evaluateEventPublicationGate(existing);
    existing.eventPublicationGate = gate;
    if (existing.status === "PUBLISHED" && !gate.allowed) {
      existing.status = "UNPUBLISHED";
    }

    existing.updatedAt = now;
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public publishCulturalEvent(
    id: string,
    actor: UserAccount
  ): CulturalEventAdmin {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error(`Cultural event "${id}" not found.`);
    }
    const gate = evaluateEventPublicationGate(existing);
    if (!gate.allowed) {
      throw new ConsentGateError(gate.reasons);
    }
    const now = new Date().toISOString();
    existing.status = "PUBLISHED";
    existing.lastVerifiedAt = now;
    existing.verifiedByDisplay = `${actor.fullName} (${actor.role})`;
    existing.updatedAt = now;
    existing.eventPublicationGate = gate;
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public updateCulturalEventStatus(
    id: string,
    status: EventWorkflowStatus,
    scheduleStatus?: EventScheduleStatus,
    cancellationReason?: string | null
  ): CulturalEventAdmin {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error(`Cultural event "${id}" not found.`);
    }
    if (status === "PUBLISHED") {
      const gate = evaluateEventPublicationGate(existing);
      if (!gate.allowed) {
        throw new ConsentGateError(gate.reasons);
      }
    }
    existing.status = status;
    if (scheduleStatus !== undefined) {
      existing.scheduleStatus = scheduleStatus;
    }
    if (cancellationReason !== undefined) {
      existing.cancellationReason = cancellationReason;
    }
    existing.updatedAt = new Date().toISOString();
    existing.eventPublicationGate = evaluateEventPublicationGate(existing);
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public submitPublicCulturalEvent(
    input: Partial<CulturalEventAdmin> & {
      submittedByPublicName: string;
      submittedByPublicContact: string;
    }
  ): CulturalEventAdmin {
    return this.createCulturalEvent(
      {
        ...input,
        status: "UNDER_REVIEW",
        scheduleStatus: input.scheduleStatus || "PROVISIONAL",
        visitorAccess: input.visitorAccess || "ACCESS_NOT_ESTABLISHED",
        organizerContactAuthorized: false,
        lastVerifiedAt: null,
        verifiedByDisplay: null,
        submittedByPublicName: input.submittedByPublicName.trim(),
        submittedByPublicContact: input.submittedByPublicContact.trim(),
      },
      null
    );
  }

  private addDaysIso(isoDate: string, daysToAdd: number): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y || 2026, (m || 11) - 1, (d || 1) + daysToAdd));
    return dt.toISOString().slice(0, 10);
  }

  public generateTripPlan(input: TripPlannerRequest): TripPlan {
    const startDate = (input.startDate || new Date().toISOString().slice(0, 10)).trim();
    const durationDays = Math.max(
      1,
      Math.min(7, Number(input.durationDays || 3))
    );
    const endDate =
      input.endDate?.trim() || this.addDaysIso(startDate, durationDays - 1);

    const stateId = input.stateId || "loc-state-maharashtra";
    const districtId = input.districtId || null;
    const placeId = input.placeId || null;
    const selectedCategories = (input.categories || []).filter(
      (c) => c && c !== "All"
    );
    const selectedInterests = (input.visitorInterests || []).filter(
      (i) => i && i !== "All"
    );
    const confirmedOnly = Boolean(input.confirmedOnly);

    const stLoc = this.locations.get(stateId);
    const distLoc = districtId ? this.locations.get(districtId) : null;
    const placeLoc = placeId ? this.locations.get(placeId) : null;
    const regionLabel = [
      placeLoc?.nameEn,
      distLoc?.nameEn,
      stLoc?.nameEn || "Maharashtra",
    ]
      .filter(Boolean)
      .join(", ");

    const excludedSafeguardSummary: Array<{ titleEn: string; reason: string }> =
      [];
    const eligibleEvents: Array<{
      raw: CulturalEventItem;
      item: TripItineraryItem;
    }> = [];

    for (const adminEvt of Array.from(this.events.values())) {
      if (!this.isEventPubliclyVisible(adminEvt)) continue;
      if (stateId && adminEvt.stateId !== stateId) continue;
      if (districtId && adminEvt.districtId !== districtId) continue;
      if (
        placeId &&
        adminEvt.cityTownId !== placeId &&
        adminEvt.talukaId !== placeId &&
        adminEvt.districtId !== placeId
      ) {
        continue;
      }

      if (
        adminEvt.isPrivateOrRestrictedCeremony ||
        adminEvt.visitorAccess === "RESTRICTED_OR_PRIVATE"
      ) {
        excludedSafeguardSummary.push({
          titleEn: adminEvt.titleEn,
          reason:
            "Restricted or private ceremony — never included in visitor itineraries.",
        });
        continue;
      }
      if (adminEvt.visitorAccess === "LOCAL_COMMUNITY_ONLY") {
        excludedSafeguardSummary.push({
          titleEn: adminEvt.titleEn,
          reason:
            "Local community observance only — not open to domestic or international tourists.",
        });
        continue;
      }
      if (adminEvt.visitorAccess === "ACCESS_NOT_ESTABLISHED") {
        excludedSafeguardSummary.push({
          titleEn: adminEvt.titleEn,
          reason:
            "Visitor access permissions not yet established — excluded from suggested itineraries until confirmed.",
        });
        continue;
      }
      if (
        adminEvt.scheduleStatus === "CANCELLED" ||
        adminEvt.scheduleStatus === "PAST"
      ) {
        excludedSafeguardSummary.push({
          titleEn: adminEvt.titleEn,
          reason: `Event status is ${adminEvt.scheduleStatus}.`,
        });
        continue;
      }
      if (adminEvt.locationGranularity === "HIDDEN") {
        excludedSafeguardSummary.push({
          titleEn: adminEvt.titleEn,
          reason:
            "Venue location is protected (HIDDEN granularity) per community privacy rules.",
        });
        continue;
      }
      if (confirmedOnly && adminEvt.scheduleStatus !== "CONFIRMED") {
        excludedSafeguardSummary.push({
          titleEn: adminEvt.titleEn,
          reason: `Excluded by Confirmed-Dates-Only filter (current status: ${adminEvt.scheduleStatus}).`,
        });
        continue;
      }

      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(adminEvt.category)
      ) {
        continue;
      }
      if (
        selectedInterests.length > 0 &&
        !selectedInterests.some((tag) =>
          (adminEvt.visitorInterests || []).includes(tag)
        )
      ) {
        continue;
      }

      const pubEvt = this.serializePublicEvent(adminEvt);
      const dateCertainty =
        pubEvt.scheduleStatus === "CONFIRMED"
          ? "CONFIRMED_DATE"
          : pubEvt.scheduleStatus === "PROVISIONAL"
            ? "PROVISIONAL_DATE"
            : "SEASONAL_ESTIMATE_WINDOW";
      const dateCertaintyLabel =
        pubEvt.scheduleStatus === "CONFIRMED"
          ? "Confirmed Event Schedule"
          : pubEvt.scheduleStatus === "PROVISIONAL"
            ? "Provisional Date — Reconfirm with Official Source Before Travel"
            : "Seasonal Estimate Window — Not a Fixed Confirmed Date";

      const visitorAccessLabel =
        pubEvt.visitorAccess === "DOMESTIC_AND_FOREIGN_PERMITTED"
          ? "Open to Domestic & International Visitors"
          : pubEvt.visitorAccess === "OPEN_PUBLIC"
            ? "Open Public Gathering"
            : "Advance Registration / Organizer Permit Required (No Walk-In)";

      const targetPlaceId =
        pubEvt.cityTownId ||
        pubEvt.talukaId ||
        pubEvt.districtId ||
        pubEvt.stateId;
      const targetPlaceName =
        pubEvt.cityTownName ||
        pubEvt.talukaName ||
        pubEvt.districtName ||
        pubEvt.stateName;

      eligibleEvents.push({
        raw: pubEvt,
        item: {
          id: `trip-item-evt-${pubEvt.id}`,
          itemType: "CULTURAL_EVENT",
          eventId: pubEvt.id,
          culturalRecordId: pubEvt.culturalRecordId,
          culturalRecordSlug: pubEvt.culturalRecordSlug,
          culturalRecordTitle: pubEvt.culturalRecordTitle,
          titleEn: pubEvt.titleEn,
          titleMr: pubEvt.titleMr,
          category: pubEvt.category,
          summaryEn: pubEvt.descriptionEn,
          placeId: targetPlaceId,
          placeName: targetPlaceName,
          venueLabel: pubEvt.venueLabel,
          locationGranularity: pubEvt.locationGranularity,
          publicCenter: pubEvt.publicCenter,
          dateCertainty,
          dateCertaintyLabel,
          scheduleWindowLabel: `${pubEvt.startDate}${
            pubEvt.endDate && pubEvt.endDate !== pubEvt.startDate
              ? ` → ${pubEvt.endDate}`
              : ""
          }${pubEvt.startTime ? ` (${pubEvt.startTime}${pubEvt.endTime ? `–${pubEvt.endTime}` : ""})` : ""}`,
          visitorAccess: pubEvt.visitorAccess,
          visitorAccessLabel,
          registrationRequirement: pubEvt.registrationRequirement,
          etiquetteNotes:
            pubEvt.etiquetteNotes ||
            "Follow local community etiquette and ask permission before photographing.",
          photographyRule: pubEvt.photographyRule,
          sourceAttribution: pubEvt.sourceAttribution,
          sourceUrl: pubEvt.sourceUrl,
          lastVerifiedAt: pubEvt.lastVerifiedAt,
          verificationStateLabel:
            pubEvt.scheduleStatus === "CONFIRMED"
              ? "Verified Event Schedule"
              : "Provisional / Seasonal Schedule (Reconfirm Required)",
        },
      });
    }

    const eligiblePractices: TripItineraryItem[] = [];
    if (!confirmedOnly) {
      for (const rec of Array.from(this.records.values())) {
        if (!this.isPubliclyVisible(rec)) continue;
        if (rec.isSacredOrRestricted) continue;
        if (rec.rightsPassport.locationGranularity === "HIDDEN") continue;
        if (rec.rightsPassport.contactMode === "UNAVAILABLE") continue;
        if (stateId && rec.stateId !== stateId) continue;
        if (districtId && rec.districtId !== districtId) continue;
        if (
          placeId &&
          rec.cityTownId !== placeId &&
          rec.talukaId !== placeId &&
          rec.districtId !== placeId
        ) {
          continue;
        }
        if (
          selectedCategories.length > 0 &&
          !selectedCategories.includes(rec.category)
        ) {
          continue;
        }

        const pubRec = toPublicCulturalRecord(rec, {
          state: this.locations.get(rec.stateId),
          district: rec.districtId ? this.locations.get(rec.districtId) : null,
          taluka: rec.talukaId ? this.locations.get(rec.talukaId) : null,
          cityTown: rec.cityTownId ? this.locations.get(rec.cityTownId) : null,
        });

        const targetPlaceId =
          (pubRec.cityTownName && rec.cityTownId) ||
          rec.talukaId ||
          rec.districtId ||
          rec.stateId;
        const targetPlaceName =
          pubRec.cityTownName ||
          pubRec.talukaName ||
          pubRec.districtName ||
          pubRec.stateName;

        eligiblePractices.push({
          id: `trip-item-rec-${pubRec.id}`,
          itemType: "PRACTICE_EXPERIENCE",
          eventId: null,
          culturalRecordId: pubRec.id,
          culturalRecordSlug: pubRec.slug,
          culturalRecordTitle: pubRec.titleEn,
          titleEn: `${pubRec.titleEn} — Cultural Context & Practice Discovery`,
          titleMr: pubRec.titleMr,
          category: pubRec.category,
          summaryEn: pubRec.summaryEn,
          placeId: targetPlaceId,
          placeName: targetPlaceName,
          venueLabel: pubRec.displayLocationLabel,
          locationGranularity: pubRec.locationGranularity,
          publicCenter: pubRec.publicCenter,
          dateCertainty: "FLEXIBLE_PRACTICE_VISIT",
          dateCertaintyLabel:
            pubRec.recordOrigin === "FIELD_VERIFIED"
              ? "Practitioner-Approved Record · Advance Moderated Enquiry Required (No Automatic Booking)"
              : "Reference Cultural Context · Advance Moderated Enquiry Required (Not a Confirmed Workshop)",
          scheduleWindowLabel:
            "Flexible daytime study / moderated enquiry required prior to any workshop visit",
          visitorAccess: "INVITATION_OR_PERMIT_REQUIRED",
          visitorAccessLabel:
            pubRec.publicRightsCard.contactMode === "DIRECT"
              ? "Direct Practitioner Contact Permitted"
              : "Moderated Enquiry Required Before Visiting",
          registrationRequirement: "MODERATED_ENQUIRY_REQUIRED",
          etiquetteNotes:
            "Respect Cultural Rights Passport boundaries, working hours, and sacred/private exclusions. Never visit a workshop without prior confirmation.",
          photographyRule: "PERMISSION_REQUIRED_ON_SITE",
          sourceAttribution:
            pubRec.sourceAttribution ||
            "Bharat CultureMap Cultural Rights Registry",
          sourceUrl: pubRec.sourceUrl,
          lastVerifiedAt: pubRec.publishedAt,
          verificationStateLabel: pubRec.verificationStateLabel,
        });
      }
    }

    const days: TripPlanDay[] = [];
    const usedPracticeIds = new Set<string>();

    for (let i = 0; i < durationDays; i++) {
      const isoDate = this.addDaysIso(startDate, i);
      const dayItems: TripItineraryItem[] = [];

      for (const { raw, item } of eligibleEvents) {
        const evtStart = raw.startDate;
        const evtEnd = raw.endDate || raw.startDate;
        const matchesDay =
          (isoDate >= evtStart && isoDate <= evtEnd) ||
          (raw.occurrences || []).some((occ) => {
            const oStart = occ.startDate;
            const oEnd = occ.endDate || occ.startDate;
            return isoDate >= oStart && isoDate <= oEnd;
          });
        if (matchesDay) {
          dayItems.push(structuredClone(item));
        }
      }

      for (const prac of eligiblePractices) {
        if (dayItems.length >= 2) break;
        if (usedPracticeIds.has(prac.id)) continue;
        usedPracticeIds.add(prac.id);
        dayItems.push(structuredClone(prac));
      }

      days.push({
        dayNumber: i + 1,
        isoDate,
        items: dayItems,
      });
    }

    const availableCandidates: TripItineraryItem[] = [
      ...eligibleEvents.map((e) => structuredClone(e.item)),
      ...eligiblePractices.slice(0, 12).map((p) => structuredClone(p)),
    ];

    const now = new Date().toISOString();
    return {
      id: `trip-${crypto.randomUUID()}`,
      title:
        input.title?.trim() ||
        `${regionLabel} Cultural Discovery Plan (${durationDays} ${
          durationDays === 1 ? "Day" : "Days"
        })`,
      startDate,
      endDate,
      durationDays,
      stateId,
      districtId,
      placeId,
      regionLabel,
      selectedCategories,
      selectedInterests,
      confirmedOnly,
      days,
      availableCandidates,
      excludedSafeguardSummary,
      disclaimer:
        "This itinerary is a cultural planning guide generated from published Bharat CultureMap records. Transport times, local transit, event capacity, and practitioner availability are NOT automatically confirmed or booked. Always verify provisional dates and submit a moderated enquiry before visiting workshops.",
      createdAt: now,
      updatedAt: now,
    };
  }

  public saveTripPlan(
    input: Partial<TripPlan> & { startDate: string }
  ): TripPlan {
    const generated = this.generateTripPlan({
      title: input.title,
      startDate: input.startDate,
      durationDays: input.durationDays || input.days?.length || 3,
      endDate: input.endDate,
      stateId: input.stateId,
      districtId: input.districtId,
      placeId: input.placeId,
      categories: input.selectedCategories,
      visitorInterests: input.selectedInterests,
      confirmedOnly: input.confirmedOnly,
    });

    const id = input.id?.trim() || generated.id;
    const now = new Date().toISOString();
    const plan: TripPlan = {
      ...generated,
      id,
      title: input.title?.trim() || generated.title,
      days: Array.isArray(input.days) ? input.days : generated.days,
      createdAt: input.createdAt || now,
      updatedAt: now,
    };

    this.tripPlans.set(id, plan);
    this.persistSnapshot();
    return structuredClone(plan);
  }

  public updateTripPlan(id: string, patch: Partial<TripPlan>): TripPlan {
    const existing = this.tripPlans.get(id);
    if (!existing) {
      throw new Error(`Trip plan "${id}" not found.`);
    }
    const now = new Date().toISOString();
    if (patch.title !== undefined) existing.title = patch.title.trim();
    if (patch.days !== undefined) existing.days = patch.days;
    if (patch.startDate !== undefined) existing.startDate = patch.startDate;
    if (patch.endDate !== undefined) existing.endDate = patch.endDate;
    if (patch.durationDays !== undefined)
      existing.durationDays = Number(patch.durationDays);
    existing.updatedAt = now;
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public getTripPlanById(id: string): TripPlan | null {
    const found = this.tripPlans.get(id);
    return found ? structuredClone(found) : null;
  }

  public createCommunityEnquiry(input: {
    enquiryType: CommunityEnquiryType;
    culturalRecordId?: string | null;
    locationId?: string | null;
    eventId?: string | null;
    senderName: string;
    senderContact: string;
    message: string;
  }): CommunityEnquiryItem {
    const id = `enq-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const item: CommunityEnquiryItem = {
      id,
      enquiryType: input.enquiryType,
      culturalRecordId: input.culturalRecordId ?? null,
      locationId: input.locationId ?? null,
      eventId: input.eventId ?? null,
      senderName: input.senderName.trim(),
      senderContact: input.senderContact.trim(),
      message: input.message.trim(),
      status: "PENDING_REVIEW",
      createdAt: now,
    };
    this.enquiries.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public listCommunityEnquiries(): CommunityEnquiryItem[] {
    return Array.from(this.enquiries.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  public updateCommunityEnquiryStatus(
    id: string,
    status: "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED"
  ): CommunityEnquiryItem {
    const existing = this.enquiries.get(id);
    if (!existing) {
      throw new Error(`Enquiry "${id}" not found.`);
    }
    existing.status = status;
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public getMapDiscoveryPayload(includeDemo = true): MapDiscoveryPayload {
    const allLocations = Array.from(this.locations.values());
    const states = allLocations.filter((l) => l.level === "STATE");
    const districts = allLocations.filter((l) => l.level === "DISTRICT");
    const talukas = allLocations.filter((l) => l.level === "TALUKA");
    const citiesAndVillages = allLocations.filter(
      (l) => l.level === "CITY_TOWN" || l.level === "VILLAGE"
    );

    const publicRecords = this.listPublicRecords().filter(
      (r) => includeDemo || r.recordOrigin === "FIELD_VERIFIED"
    );
    const publicEvents = this.listPublicEvents();

    const citiesPayload: MapDiscoveryPayload["cities"] = {};
    for (const city of citiesAndVillages) {
      const parentLoc = city.parentId
        ? this.locations.get(city.parentId) || null
        : null;
      const district =
        parentLoc?.level === "DISTRICT"
          ? parentLoc
          : parentLoc?.parentId
            ? this.locations.get(parentLoc.parentId) || null
            : null;
      const taluka = parentLoc?.level === "TALUKA" ? parentLoc : null;
      const state = district?.parentId
        ? this.locations.get(district.parentId) || null
        : null;

      const isDistrictHeadquarters =
        district &&
        district.nameEn.toLowerCase().startsWith(city.nameEn.toLowerCase());

      const cityRecs = publicRecords.filter((r) => {
        if (r.locationGranularity === "HIDDEN") return false;
        if (r.cityTownName === city.nameEn) return true;
        if (
          isDistrictHeadquarters &&
          r.locationGranularity === "DISTRICT" &&
          r.districtName === district?.nameEn &&
          !r.cityTownName
        ) {
          return true;
        }
        return false;
      });

      const fieldVerifiedCount = cityRecs.filter(
        (r) => r.recordOrigin === "FIELD_VERIFIED"
      ).length;
      const demoCount = cityRecs.filter(
        (r) => r.recordOrigin === "DEMO_REFERENCE"
      ).length;

      citiesPayload[city.nameEn] = {
        id: city.id,
        name: city.nameEn,
        nameMr: city.nameMr,
        level: city.level,
        state: state?.nameEn || "India",
        district: district?.nameEn || null,
        taluka: taluka?.nameEn || null,
        center: { lat: city.centerLat, lng: city.centerLng },
        records: cityRecs.map(toMapRecordSummary),
        fieldVerifiedCount,
        demoCount,
      };
    }

    const statesPayload: MapDiscoveryPayload["states"] = states.map((st) => {
      const stateDistricts = districts.filter((d) => d.parentId === st.id);
      const stateRecords = publicRecords.filter(
        (r) => r.stateName === st.nameEn
      );

      const districtEntries = stateDistricts.map((d) => {
        const distTalukas = talukas.filter((t) => t.parentId === d.id);
        const distLocalities = citiesAndVillages.filter(
          (c) => c.parentId === d.id
        );
        const distCities = distLocalities.map((c) => c.nameEn);
        const distRecords = stateRecords.filter(
          (r) =>
            r.locationGranularity !== "HIDDEN" && r.districtName === d.nameEn
        );

        const subdistrictEntries = distTalukas.map((t) => {
          const talRecs = distRecords.filter(
            (r) =>
              r.talukaName &&
              t.nameEn.toLowerCase().startsWith(r.talukaName.toLowerCase())
          );
          return {
            id: t.id,
            name: t.nameEn,
            nameMr: t.nameMr,
            center: { lat: t.centerLat, lng: t.centerLng },
            recordCount: talRecs.length,
          };
        });

        const localityEntries = distLocalities.map((loc) => {
          const locRecs = citiesPayload[loc.nameEn]?.records || [];
          return {
            id: loc.id,
            name: loc.nameEn,
            nameMr: loc.nameMr,
            level: loc.level,
            center: { lat: loc.centerLat, lng: loc.centerLng },
            recordCount: locRecs.length,
          };
        });

        return {
          id: d.id,
          name: d.nameEn,
          nameMr: d.nameMr,
          center: { lat: d.centerLat, lng: d.centerLng },
          cities: distCities,
          subdistricts: subdistrictEntries,
          localities: localityEntries,
          records: distRecords.map(toMapRecordSummary),
          recordCount: distRecords.length,
          fieldVerifiedCount: distRecords.filter(
            (r) => r.recordOrigin === "FIELD_VERIFIED"
          ).length,
          demoCount: distRecords.filter(
            (r) => r.recordOrigin === "DEMO_REFERENCE"
          ).length,
        };
      });

      const stateCityNames = districtEntries.flatMap((d) => d.cities);
      return {
        id: st.id,
        name: st.nameEn,
        nameMr: st.nameMr,
        abbr: st.abbr || st.nameEn.slice(0, 2).toUpperCase(),
        center: { lat: st.centerLat, lng: st.centerLng },
        districts: districtEntries,
        cities: stateCityNames,
        recordCount: stateRecords.length,
        fieldVerifiedCount: stateRecords.filter(
          (r) => r.recordOrigin === "FIELD_VERIFIED"
        ).length,
        demoCount: stateRecords.filter(
          (r) => r.recordOrigin === "DEMO_REFERENCE"
        ).length,
      };
    });

    const fieldVerifiedPublished = publicRecords.filter(
      (r) => r.recordOrigin === "FIELD_VERIFIED"
    ).length;
    const demoReferencePublished = publicRecords.filter(
      (r) => r.recordOrigin === "DEMO_REFERENCE"
    ).length;
    const datasetMetadata = this.getGeographyMetadata();

    const allPubTraditions = this.queryPublicTraditions({ pageSize: 100 }).traditions;

    return {
      states: statesPayload,
      cities: citiesPayload,
      events: publicEvents,
      traditions: allPubTraditions,
      datasetMetadata,
      stats: {
        totalPublished: publicRecords.length,
        fieldVerifiedPublished,
        demoReferencePublished,
        statesRepresented: statesPayload.filter((s) => s.recordCount > 0)
          .length,
        districtsRepresented: districts.length,
        categoriesCount: CULTURE_CATEGORIES.length,
        totalLocations: datasetMetadata.counts.totalPlaces,
        statesAndUtsCount: datasetMetadata.counts.statesAndUts,
        talukasCount: datasetMetadata.counts.subdistrictsAndTalukas,
        citiesAndVillagesCount: datasetMetadata.counts.citiesTownsAndVillages,
        placesWithRecordsCount:
          datasetMetadata.counts.placesWithCulturalRecords,
        placesCollectionInProgressCount:
          datasetMetadata.counts.placesCollectionInProgress,
        upcomingEventsPublished: publicEvents.length,
        traditionsPublished: Array.from(this.traditions.values()).filter(
          (t) => t.status === "PUBLISHED" && !t.isSacredOrRestricted
        ).length,
        verifiedSourcesCount: Array.from(this.sources.values()).filter(
          (s) => s.reviewStatus === "VERIFIED"
        ).length,
        verifiedMediaAssetsCount: Array.from(this.mediaAssets.values()).filter(
          (m) => this.isMediaAssetPubliclyVisible(m)
        ).length,
      },
    };
  }

  private isMediaAssetPubliclyVisible(asset: MediaAssetItem): boolean {
    if (asset.publicationStatus !== "PUBLISHED") return false;
    const gate = evaluateMediaPublicationGate(asset);
    return gate.allowed;
  }

  private hydrateTraditionSummary(trad: TraditionAdmin): TraditionSummary {
    const places = Array.from(this.traditionPlaces.values())
      .filter((tp) => tp.traditionId === trad.id)
      .map((tp) => {
        const loc = this.locations.get(tp.locationId);
        const st = this.locations.get(tp.stateId);
        const dist = tp.districtId ? this.locations.get(tp.districtId) : null;
        return {
          ...tp,
          locationNameEn: loc?.nameEn || tp.locationNameEn,
          locationNameMr: loc?.nameMr || tp.locationNameMr,
          locationLevel: loc?.level || tp.locationLevel,
          stateName: st?.nameEn || tp.stateName,
          districtName: dist?.nameEn ?? tp.districtName ?? null,
          center: {
            lat: loc?.centerLat ?? st?.centerLat ?? tp.center.lat,
            lng: loc?.centerLng ?? st?.centerLng ?? tp.center.lng,
          },
        };
      });

    const statesRepresented = Array.from(
      new Set(places.map((p) => p.stateName).filter(Boolean))
    );

    const sources = Array.from(this.sources.values()).filter(
      (s) => s.traditionId === trad.id && s.reviewStatus !== "FLAGGED"
    );

    const publicMedia = Array.from(this.mediaAssets.values())
      .filter(
        (m) => m.traditionId === trad.id && this.isMediaAssetPubliclyVisible(m)
      )
      .map((m) => ({
        ...m,
        mediaPublicationGate: evaluateMediaPublicationGate(m),
      }));

    const primaryHeroMedia =
      publicMedia.find((m) => m.isPrimaryHero && m.mediaType === "IMAGE") ||
      publicMedia.find((m) => m.mediaType === "IMAGE") ||
      null;

    const linkedRecords = Array.from(this.records.values()).filter(
      (r) =>
        this.isPubliclyVisible(r) &&
        (r.traditionId === trad.id || r.traditionSlug === trad.slug)
    );

    return {
      id: trad.id,
      slug: trad.slug,
      nameEn: trad.nameEn,
      nameNative: trad.nameNative,
      nativeScriptLang: trad.nativeScriptLang,
      alternativeNames: trad.alternativeNames || [],
      traditionCategory: trad.traditionCategory,
      legacyCategory: trad.legacyCategory,
      subcategory: trad.subcategory,
      unescoDomain: trad.unescoDomain,
      unescoStatus: trad.unescoStatus,
      giTagStatus: trad.giTagStatus,
      languages: trad.languages || [],
      summary: trad.summary,
      evidenceStatus: trad.evidenceStatus,
      evidenceStatusLabel: formatEvidenceStatusLabel(trad.evidenceStatus),
      lastReviewedAt: trad.lastReviewedAt,
      reviewedByDisplay: trad.reviewedByDisplay,
      primaryHeroMedia,
      places,
      statesRepresented,
      sourceCount: sources.length,
      mediaCount: publicMedia.length,
      practitionerRecordCount: linkedRecords.length,
      status: trad.status,
    };
  }

  private hydrateTraditionDetail(trad: TraditionAdmin): TraditionDetail {
    const summary = this.hydrateTraditionSummary(trad);
    const sources = Array.from(this.sources.values())
      .filter((s) => s.traditionId === trad.id && s.reviewStatus !== "FLAGGED")
      .sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle));

    const mediaAssets = Array.from(this.mediaAssets.values())
      .filter(
        (m) => m.traditionId === trad.id && this.isMediaAssetPubliclyVisible(m)
      )
      .map((m) => ({
        ...m,
        mediaPublicationGate: evaluateMediaPublicationGate(m),
      }))
      .sort((a, b) => Number(b.isPrimaryHero) - Number(a.isPrimaryHero));

    const linkedAdminRecs = Array.from(this.records.values()).filter(
      (r) =>
        this.isPubliclyVisible(r) &&
        (r.traditionId === trad.id || r.traditionSlug === trad.slug)
    );

    const linkedRecords = linkedAdminRecs.map((r) =>
      toPublicCulturalRecord(r, {
        state: this.locations.get(r.stateId),
        district: r.districtId ? this.locations.get(r.districtId) : null,
        taluka: r.talukaId ? this.locations.get(r.talukaId) : null,
        cityTown: r.cityTownId ? this.locations.get(r.cityTownId) : null,
      })
    );

    const linkedRecIds = new Set(linkedRecords.map((r) => r.id));
    const placeStateIds = new Set(summary.places.map((p) => p.stateId));
    const allPubEvents = this.listPublicEvents();
    const relatedEvents = allPubEvents.filter(
      (e) =>
        (e.culturalRecordId && linkedRecIds.has(e.culturalRecordId)) ||
        (placeStateIds.has(e.stateId) && e.category === trad.legacyCategory)
    );

    const relatedTraditions = Array.from(this.traditions.values())
      .filter(
        (other) =>
          other.id !== trad.id &&
          other.status === "PUBLISHED" &&
          !other.isSacredOrRestricted &&
          (other.traditionCategory === trad.traditionCategory ||
            other.legacyCategory === trad.legacyCategory)
      )
      .slice(0, 4)
      .map((other) => this.hydrateTraditionSummary(other));

    return {
      ...summary,
      culturalDescription: trad.culturalDescription,
      historicalBackground: trad.historicalBackground,
      communityContext: trad.communityContext,
      techniquesAndMaterials: trad.techniquesAndMaterials || [],
      instrumentsOrForms: trad.instrumentsOrForms || [],
      regionalVariations: trad.regionalVariations || [],
      learningOpportunities: trad.learningOpportunities || [],
      verificationNotes: trad.verificationNotes,
      consentAndAccessNote: trad.consentAndAccessNote,
      isSacredOrRestricted: trad.isSacredOrRestricted,
      status: trad.status,
      sources,
      mediaAssets,
      linkedRecords,
      relatedEvents,
      relatedTraditions,
      createdAt: trad.createdAt,
      updatedAt: trad.updatedAt,
    };
  }

  public queryPublicTraditions(
    filter?: TraditionQueryFilter
  ): TraditionDirectoryPayload {
    const allPublished = Array.from(this.traditions.values())
      .filter((t) => t.status === "PUBLISHED" && !t.isSacredOrRestricted)
      .map((t) => this.hydrateTraditionSummary(t));

    const categoryMap = new Map<string, number>();
    const stateMap = new Map<string, { stateId: string; stateName: string; count: number }>();
    const langSet = new Set<string>();
    const evidenceMap = new Map<EvidenceStatus, number>();

    for (const t of allPublished) {
      categoryMap.set(
        t.traditionCategory,
        (categoryMap.get(t.traditionCategory) || 0) + 1
      );
      for (const p of t.places) {
        const prev = stateMap.get(p.stateId);
        if (prev) {
          prev.count += 1;
        } else {
          stateMap.set(p.stateId, {
            stateId: p.stateId,
            stateName: p.stateName,
            count: 1,
          });
        }
      }
      for (const lang of t.languages) {
        if (lang) langSet.add(lang);
      }
      evidenceMap.set(
        t.evidenceStatus,
        (evidenceMap.get(t.evidenceStatus) || 0) + 1
      );
    }

    const q = (filter?.q || "").trim().toLowerCase();
    const filtered = allPublished.filter((t) => {
      if (filter?.traditionCategory && filter.traditionCategory !== "All") {
        const norm = (s: string) =>
          s
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
        if (norm(t.traditionCategory) !== norm(filter.traditionCategory)) {
          return false;
        }
      }
      if (
        filter?.legacyCategory &&
        filter.legacyCategory !== "All" &&
        t.legacyCategory !== filter.legacyCategory
      ) {
        return false;
      }
      if (
        filter?.stateId &&
        filter.stateId !== "All" &&
        !t.places.some((p) => p.stateId === filter.stateId)
      ) {
        return false;
      }
      if (
        filter?.districtId &&
        filter.districtId !== "All" &&
        !t.places.some((p) => p.districtId === filter.districtId)
      ) {
        return false;
      }
      if (filter?.placeId && filter.placeId !== "All") {
        const treeIds = this.collectDescendantLocationIds(filter.placeId);
        const matchesPlace = t.places.some(
          (p) =>
            treeIds.has(p.locationId) ||
            treeIds.has(p.stateId) ||
            (p.districtId && treeIds.has(p.districtId))
        );
        if (!matchesPlace) return false;
      }
      if (
        filter?.language &&
        filter.language !== "All" &&
        !t.languages.some(
          (l) => l.toLowerCase() === filter.language!.toLowerCase()
        )
      ) {
        return false;
      }
      if (
        filter?.evidenceStatus &&
        filter.evidenceStatus !== "ALL" &&
        t.evidenceStatus !== filter.evidenceStatus
      ) {
        return false;
      }
      if (filter?.hasVerifiedMedia && t.mediaCount === 0) {
        return false;
      }
      if (q) {
        const haystack = [
          t.nameEn,
          t.nameNative,
          ...(t.alternativeNames || []),
          t.traditionCategory,
          t.legacyCategory,
          t.subcategory,
          t.summary,
          ...(t.languages || []),
          ...(t.statesRepresented || []),
          ...t.places.map(
            (p) =>
              `${p.locationNameEn} ${p.districtName || ""} ${p.stateName} ${
                p.regionalVariantName || ""
              }`
          ),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => a.nameEn.localeCompare(b.nameEn));

    const page = Math.max(1, Number(filter?.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filter?.pageSize || 24)));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const paged = filtered.slice(offset, offset + pageSize);

    return {
      traditions: paged,
      total,
      page,
      pageSize,
      totalPages,
      facets: {
        totalPublished: allPublished.length,
        categories: Array.from(categoryMap.entries()).map(
          ([category, count]) => ({
            category: category as TraditionDirectoryCategory,
            count,
          })
        ),
        states: Array.from(stateMap.values()).sort((a, b) =>
          a.stateName.localeCompare(b.stateName)
        ),
        languages: Array.from(langSet).sort(),
        evidenceStatuses: Array.from(evidenceMap.entries()).map(
          ([status, count]) => ({ status, count })
        ),
        withVerifiedMediaCount: allPublished.filter((t) => t.mediaCount > 0)
          .length,
        multiRegionCount: allPublished.filter((t) => t.places.length > 1)
          .length,
      },
    };
  }

  public getPublicTraditionBySlug(slug: string): TraditionDetail | null {
    const clean = decodeURIComponent(slug).trim().toLowerCase();
    const alias = TRADITION_SLUG_ALIASES[clean];
    for (const trad of Array.from(this.traditions.values())) {
      const tSlug = trad.slug.toLowerCase();
      const tId = trad.id.toLowerCase();
      if (
        (tSlug === clean ||
          tId === clean ||
          (alias && tSlug === alias)) &&
        trad.status === "PUBLISHED" &&
        !trad.isSacredOrRestricted
      ) {
        return this.hydrateTraditionDetail(trad);
      }
    }
    return null;
  }

  public listAdminTraditions(): TraditionAdmin[] {
    return Array.from(this.traditions.values())
      .map((t) => {
        const detail = this.hydrateTraditionDetail(t);
        const allMediaAssetsAdmin = Array.from(this.mediaAssets.values())
          .filter((m) => m.traditionId === t.id)
          .map((m) => ({
            ...m,
            mediaPublicationGate: evaluateMediaPublicationGate(m),
          }));
        return {
          ...detail,
          isSacredOrRestricted: Boolean(t.isSacredOrRestricted),
          allMediaAssetsAdmin,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      })
      .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }

  public createTradition(
    input: Partial<TraditionAdmin>,
    actor?: UserAccount | null
  ): TraditionAdmin {
    const nameEn = (input.nameEn || "").trim();
    if (!nameEn) {
      throw new Error("Tradition canonical name (nameEn) is required.");
    }
    const slug = input.slug?.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    for (const existing of Array.from(this.traditions.values())) {
      if (existing.slug === slug) {
        throw new Error(`Tradition with slug '${slug}' already exists.`);
      }
    }
    const id = input.id?.trim() || `trad-${slug}`;
    const now = new Date().toISOString();
    const evStatus: EvidenceStatus =
      input.evidenceStatus || "OFFICIAL_INSTITUTIONAL";

    const trad: TraditionAdmin = {
      id,
      slug,
      nameEn,
      nameNative: (input.nameNative || "").trim(),
      nativeScriptLang: (input.nativeScriptLang || "").trim(),
      alternativeNames: Array.isArray(input.alternativeNames)
        ? input.alternativeNames
        : [],
      traditionCategory:
        input.traditionCategory || "Crafts, handloom and textiles",
      legacyCategory: input.legacyCategory || "Craft",
      subcategory: (input.subcategory || "").trim(),
      unescoDomain: input.unescoDomain || "Traditional craftsmanship",
      unescoStatus: input.unescoStatus ?? null,
      giTagStatus: input.giTagStatus ?? null,
      languages: Array.isArray(input.languages) ? input.languages : [],
      summary: (input.summary || `${nameEn} living cultural heritage tradition.`).trim(),
      culturalDescription: (input.culturalDescription || "").trim(),
      historicalBackground: (input.historicalBackground || "").trim(),
      communityContext: (input.communityContext || "").trim(),
      techniquesAndMaterials: Array.isArray(input.techniquesAndMaterials)
        ? input.techniquesAndMaterials
        : [],
      instrumentsOrForms: Array.isArray(input.instrumentsOrForms)
        ? input.instrumentsOrForms
        : [],
      regionalVariations: Array.isArray(input.regionalVariations)
        ? input.regionalVariations
        : [],
      learningOpportunities: Array.isArray(input.learningOpportunities)
        ? input.learningOpportunities
        : [],
      evidenceStatus: evStatus,
      evidenceStatusLabel: formatEvidenceStatusLabel(evStatus),
      verificationNotes: (input.verificationNotes || "").trim(),
      lastReviewedAt: input.lastReviewedAt || now.slice(0, 10),
      reviewedByDisplay:
        input.reviewedByDisplay ||
        (actor ? `${actor.fullName} (${actor.role})` : "Cultural Research Desk"),
      consentAndAccessNote: (
        input.consentAndAccessNote ||
        "Public cultural reference entry. Direct practitioner engagement requires moderated enquiry and consent."
      ).trim(),
      isSacredOrRestricted: Boolean(input.isSacredOrRestricted),
      status: input.isSacredOrRestricted
        ? "RESTRICTED"
        : input.status || "PUBLISHED",
      primaryHeroMedia: null,
      places: [],
      statesRepresented: [],
      sourceCount: 0,
      mediaCount: 0,
      practitionerRecordCount: 0,
      sources: [],
      mediaAssets: [],
      allMediaAssetsAdmin: [],
      linkedRecords: [],
      relatedEvents: [],
      relatedTraditions: [],
      createdAt: now,
      updatedAt: now,
    };

    this.traditions.set(id, trad);

    if (Array.isArray(input.places) && input.places.length > 0) {
      for (const p of input.places) {
        if (p.locationId && p.stateId) {
          this.addTraditionPlaceAssociation({
            traditionId: id,
            locationId: p.locationId,
            stateId: p.stateId,
            districtId: p.districtId ?? null,
            relationshipRole: p.relationshipRole || "PRIMARY_PRACTICE_REGION",
            regionalVariantName: p.regionalVariantName || "",
            notes: p.notes || "",
            isPrimary: Boolean(p.isPrimary),
          });
        }
      }
    }

    this.persistSnapshot();
    return (
      this.listAdminTraditions().find((t) => t.id === id) ||
      structuredClone(trad)
    );
  }

  public updateTradition(
    id: string,
    patch: Partial<TraditionAdmin>,
    actor?: UserAccount | null
  ): TraditionAdmin {
    const existing = this.traditions.get(id);
    if (!existing) {
      throw new Error(`Tradition '${id}' not found.`);
    }
    const now = new Date().toISOString();

    if (patch.nameEn !== undefined) existing.nameEn = patch.nameEn.trim();
    if (patch.nameNative !== undefined)
      existing.nameNative = patch.nameNative.trim();
    if (patch.nativeScriptLang !== undefined)
      existing.nativeScriptLang = patch.nativeScriptLang.trim();
    if (patch.alternativeNames !== undefined)
      existing.alternativeNames = patch.alternativeNames;
    if (patch.traditionCategory !== undefined)
      existing.traditionCategory = patch.traditionCategory;
    if (patch.legacyCategory !== undefined)
      existing.legacyCategory = patch.legacyCategory;
    if (patch.subcategory !== undefined)
      existing.subcategory = patch.subcategory.trim();
    if (patch.unescoDomain !== undefined)
      existing.unescoDomain = patch.unescoDomain;
    if (patch.unescoStatus !== undefined)
      existing.unescoStatus = patch.unescoStatus;
    if (patch.giTagStatus !== undefined)
      existing.giTagStatus = patch.giTagStatus;
    if (patch.languages !== undefined) existing.languages = patch.languages;
    if (patch.summary !== undefined) existing.summary = patch.summary.trim();
    if (patch.culturalDescription !== undefined)
      existing.culturalDescription = patch.culturalDescription.trim();
    if (patch.historicalBackground !== undefined)
      existing.historicalBackground = patch.historicalBackground.trim();
    if (patch.communityContext !== undefined)
      existing.communityContext = patch.communityContext.trim();
    if (patch.techniquesAndMaterials !== undefined)
      existing.techniquesAndMaterials = patch.techniquesAndMaterials;
    if (patch.instrumentsOrForms !== undefined)
      existing.instrumentsOrForms = patch.instrumentsOrForms;
    if (patch.regionalVariations !== undefined)
      existing.regionalVariations = patch.regionalVariations;
    if (patch.learningOpportunities !== undefined)
      existing.learningOpportunities = patch.learningOpportunities;
    if (patch.evidenceStatus !== undefined) {
      existing.evidenceStatus = patch.evidenceStatus;
      existing.evidenceStatusLabel = formatEvidenceStatusLabel(
        patch.evidenceStatus
      );
    }
    if (patch.verificationNotes !== undefined)
      existing.verificationNotes = patch.verificationNotes.trim();
    if (patch.consentAndAccessNote !== undefined)
      existing.consentAndAccessNote = patch.consentAndAccessNote.trim();
    if (patch.isSacredOrRestricted !== undefined) {
      existing.isSacredOrRestricted = Boolean(patch.isSacredOrRestricted);
      if (existing.isSacredOrRestricted) {
        existing.status = "RESTRICTED";
      }
    }
    if (patch.status !== undefined && !existing.isSacredOrRestricted) {
      existing.status = patch.status;
    }
    existing.lastReviewedAt = patch.lastReviewedAt || now.slice(0, 10);
    if (actor) {
      existing.reviewedByDisplay = `${actor.fullName} (${actor.role})`;
    }
    existing.updatedAt = now;

    this.persistSnapshot();
    return (
      this.listAdminTraditions().find((t) => t.id === id) ||
      structuredClone(existing)
    );
  }

  public addTraditionPlaceAssociation(
    input: Partial<TraditionPlaceAssociation> & {
      traditionId: string;
      locationId: string;
      stateId?: string;
    },
    _actor?: UserAccount | null
  ): TraditionPlaceAssociation {
    const resolvedStateId = input.stateId || input.locationId;
    const loc = this.locations.get(input.locationId);
    const st = this.locations.get(resolvedStateId);
    const dist = input.districtId ? this.locations.get(input.districtId) : null;
    const id = `tp-${crypto.randomUUID()}`;
    const assoc: TraditionPlaceAssociation = {
      id,
      traditionId: input.traditionId,
      locationId: input.locationId,
      locationNameEn: loc?.nameEn || input.locationId,
      locationNameMr: loc?.nameMr,
      locationLevel: loc?.level || "CITY_TOWN",
      stateId: resolvedStateId,
      stateName: st?.nameEn || "India",
      districtId: input.districtId ?? null,
      districtName: dist?.nameEn ?? null,
      center: {
        lat: loc?.centerLat ?? st?.centerLat ?? 21.15,
        lng: loc?.centerLng ?? st?.centerLng ?? 79.0,
      },
      relationshipRole: input.relationshipRole || "PRIMARY_PRACTICE_REGION",
      regionalVariantName: input.regionalVariantName || "",
      notes: input.notes || "",
      isPrimary: Boolean(input.isPrimary),
    };
    this.traditionPlaces.set(id, assoc);
    this.persistSnapshot();
    return structuredClone(assoc);
  }

  public removeTraditionPlaceAssociation(
    id: string,
    _actor?: UserAccount | null
  ): boolean {
    const deleted = this.traditionPlaces.delete(id);
    this.persistSnapshot();
    return deleted;
  }

  public listPublicSources(filter?: {
    traditionId?: string;
    culturalRecordId?: string;
    locationId?: string;
  }): SourceCitation[] {
    return Array.from(this.sources.values())
      .filter((s) => {
        if (s.reviewStatus === "FLAGGED") return false;
        if (filter?.traditionId && s.traditionId !== filter.traditionId)
          return false;
        if (
          filter?.culturalRecordId &&
          s.culturalRecordId !== filter.culturalRecordId
        )
          return false;
        if (filter?.locationId && s.locationId !== filter.locationId)
          return false;
        return true;
      })
      .sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle));
  }

  public listAdminSources(): SourceCitation[] {
    return Array.from(this.sources.values()).sort((a, b) =>
      b.lastReviewedAt.localeCompare(a.lastReviewedAt)
    );
  }

  public createSourceCitation(
    input: Partial<SourceCitation>,
    actor?: UserAccount | null
  ): SourceCitation {
    const sourceTitle = (input.sourceTitle || "").trim();
    const sourceUrl = (input.sourceUrl || "").trim();
    if (!sourceTitle || !sourceUrl) {
      throw new Error("Source title and source URL are required.");
    }
    const id = input.id?.trim() || `src-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const item: SourceCitation = {
      id,
      traditionId: input.traditionId ?? null,
      culturalRecordId: input.culturalRecordId ?? null,
      locationId: input.locationId ?? null,
      sourceTitle,
      sourceOrganisation: (
        input.sourceOrganisation || "Official Cultural Documentation"
      ).trim(),
      sourceUrl,
      sourceType: input.sourceType || "OFFICIAL_INSTITUTIONAL",
      publicationOrInscribedDate: input.publicationOrInscribedDate ?? null,
      specificFactsSupported: (
        input.specificFactsSupported ||
        "Supports cultural classification, regional association, and historical context."
      ).trim(),
      retrievalDate: input.retrievalDate || today,
      attributionOrReuseTerms: (
        input.attributionOrReuseTerms || "Cited with institutional attribution."
      ).trim(),
      evidenceStatus: input.evidenceStatus || "OFFICIAL_INSTITUTIONAL",
      reviewStatus: input.reviewStatus || "VERIFIED",
      reviewedBy:
        input.reviewedBy ||
        (actor ? `${actor.fullName} (${actor.role})` : "Cultural Research Desk"),
      lastReviewedAt: input.lastReviewedAt || today,
      createdAt: now,
    };
    this.sources.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public listPublicMediaAssets(filter?: {
    traditionId?: string;
    culturalRecordId?: string;
    mediaType?: MediaAssetType | string;
  }): MediaAssetItem[] {
    return Array.from(this.mediaAssets.values())
      .filter((m) => {
        if (!this.isMediaAssetPubliclyVisible(m)) return false;
        if (filter?.traditionId && m.traditionId !== filter.traditionId)
          return false;
        if (
          filter?.culturalRecordId &&
          m.culturalRecordId !== filter.culturalRecordId
        )
          return false;
        if (filter?.mediaType && m.mediaType !== filter.mediaType) return false;
        return true;
      })
      .map((m) => ({
        ...m,
        mediaPublicationGate: evaluateMediaPublicationGate(m),
      }));
  }

  public listAdminMediaAssets(): MediaAssetItem[] {
    return Array.from(this.mediaAssets.values())
      .map((m) => ({
        ...m,
        mediaPublicationGate: evaluateMediaPublicationGate(m),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public createMediaAsset(
    input: Partial<MediaAssetItem>,
    actor?: UserAccount | null
  ): MediaAssetItem {
    const title = (input.title || "").trim();
    if (!title) {
      throw new Error("Media asset title is required.");
    }
    const id = input.id?.trim() || `med-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const asset: MediaAssetItem = {
      id,
      traditionId: input.traditionId ?? null,
      culturalRecordId: input.culturalRecordId ?? null,
      locationId: input.locationId ?? null,
      mediaType: input.mediaType || "IMAGE",
      title,
      caption: (input.caption || "").trim(),
      altText: (input.altText || title).trim(),
      creatorOrPerformer: (input.creatorOrPerformer || "").trim(),
      sourceOrganisation: (input.sourceOrganisation || "").trim(),
      sourcePageUrl: (input.sourcePageUrl || "").trim(),
      directMediaUrl: input.directMediaUrl ?? null,
      embedUrl: input.embedUrl ?? null,
      licenseIdentifier: (input.licenseIdentifier || "").trim(),
      licenseUrl: input.licenseUrl ?? null,
      attributionText: (input.attributionText || "").trim(),
      rightsStatus: input.rightsStatus || "UNVERIFIED",
      permissionEvidence: (input.permissionEvidence || "").trim(),
      language: (input.language || "").trim(),
      transcriptOrSummary: (input.transcriptOrSummary || "").trim(),
      retrievalDate: input.retrievalDate || today,
      reviewedAt: actor ? today : input.reviewedAt ?? null,
      reviewedBy:
        input.reviewedBy ||
        (actor ? `${actor.fullName} (${actor.role})` : ""),
      publicationStatus: input.publicationStatus || "DRAFT",
      isPrimaryHero: Boolean(input.isPrimaryHero),
      createdAt: now,
    };

    const gate = evaluateMediaPublicationGate(asset);
    asset.mediaPublicationGate = gate;
    if (asset.publicationStatus === "PUBLISHED" && !gate.allowed) {
      asset.publicationStatus = "UNPUBLISHED";
    }

    this.mediaAssets.set(id, asset);
    this.persistSnapshot();
    return structuredClone(asset);
  }

  public updateMediaAsset(
    id: string,
    patch: Partial<MediaAssetItem>,
    actor?: UserAccount | null
  ): MediaAssetItem {
    const existing = this.mediaAssets.get(id);
    if (!existing) {
      throw new Error(`Media asset '${id}' not found.`);
    }
    const today = new Date().toISOString().slice(0, 10);
    if (patch.traditionId !== undefined)
      existing.traditionId = patch.traditionId;
    if (patch.culturalRecordId !== undefined)
      existing.culturalRecordId = patch.culturalRecordId;
    if (patch.locationId !== undefined) existing.locationId = patch.locationId;
    if (patch.mediaType !== undefined) existing.mediaType = patch.mediaType;
    if (patch.title !== undefined) existing.title = patch.title.trim();
    if (patch.caption !== undefined) existing.caption = patch.caption.trim();
    if (patch.altText !== undefined) existing.altText = patch.altText.trim();
    if (patch.creatorOrPerformer !== undefined)
      existing.creatorOrPerformer = patch.creatorOrPerformer.trim();
    if (patch.sourceOrganisation !== undefined)
      existing.sourceOrganisation = patch.sourceOrganisation.trim();
    if (patch.sourcePageUrl !== undefined)
      existing.sourcePageUrl = patch.sourcePageUrl.trim();
    if (patch.directMediaUrl !== undefined)
      existing.directMediaUrl = patch.directMediaUrl;
    if (patch.embedUrl !== undefined) existing.embedUrl = patch.embedUrl;
    if (patch.licenseIdentifier !== undefined)
      existing.licenseIdentifier = patch.licenseIdentifier.trim();
    if (patch.licenseUrl !== undefined) existing.licenseUrl = patch.licenseUrl;
    if (patch.attributionText !== undefined)
      existing.attributionText = patch.attributionText.trim();
    if (patch.rightsStatus !== undefined)
      existing.rightsStatus = patch.rightsStatus;
    if (patch.permissionEvidence !== undefined)
      existing.permissionEvidence = patch.permissionEvidence.trim();
    if (patch.language !== undefined) existing.language = patch.language.trim();
    if (patch.transcriptOrSummary !== undefined)
      existing.transcriptOrSummary = patch.transcriptOrSummary.trim();
    if (patch.isPrimaryHero !== undefined)
      existing.isPrimaryHero = Boolean(patch.isPrimaryHero);
    if (patch.publicationStatus !== undefined)
      existing.publicationStatus = patch.publicationStatus;

    if (actor) {
      existing.reviewedAt = today;
      existing.reviewedBy = `${actor.fullName} (${actor.role})`;
    }

    const gate = evaluateMediaPublicationGate(existing);
    existing.mediaPublicationGate = gate;
    if (existing.publicationStatus === "PUBLISHED" && !gate.allowed) {
      throw new ConsentGateError(gate.reasons);
    }

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public listPractitioners(filter?: {
    q?: string;
    stateName?: string;
    traditionSlug?: string;
    availabilityStatus?: string;
    includeUnpublished?: boolean;
  }): PractitionerProfile[] {
    const q = (filter?.q || "").trim().toLowerCase();
    return Array.from(this.practitioners.values())
      .filter((p) => {
        if (!filter?.includeUnpublished && p.publicationStatus !== "PUBLISHED") {
          return false;
        }
        if (
          filter?.stateName &&
          filter.stateName !== "All" &&
          p.stateName.toLowerCase() !== filter.stateName.toLowerCase()
        ) {
          return false;
        }
        if (
          filter?.traditionSlug &&
          filter.traditionSlug !== "All" &&
          !p.traditionSlugs.includes(filter.traditionSlug)
        ) {
          return false;
        }
        if (
          filter?.availabilityStatus &&
          filter.availabilityStatus !== "All" &&
          p.availabilityStatus !== filter.availabilityStatus
        ) {
          return false;
        }
        if (q) {
          const hay = [
            p.displayName,
            p.roleTitle,
            p.shortBio,
            p.stateName,
            p.districtName || "",
            p.cityName || "",
            ...p.languages,
            ...p.specialisations,
            ...p.traditionTitles,
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((p) => structuredClone(p));
  }

  public getPractitionerBySlug(slugOrId: string): PractitionerProfile | null {
    const clean = decodeURIComponent(slugOrId).trim().toLowerCase();
    for (const p of Array.from(this.practitioners.values())) {
      if (p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean) {
        return structuredClone(p);
      }
    }
    return null;
  }

  public createPractitioner(
    input: Partial<PractitionerProfile>
  ): PractitionerProfile {
    const displayName = (input.displayName || "").trim();
    if (!displayName) {
      throw new Error("Practitioner display name is required.");
    }
    const slug = input.slug?.trim() || makeSlug(displayName);
    const id = input.id?.trim() || `pract-${crypto.randomUUID()}`;
    const item: PractitionerProfile = {
      id,
      slug,
      displayName,
      roleTitle: (input.roleTitle || "Cultural Practitioner (Demo)").trim(),
      shortBio: (
        input.shortBio ||
        "Illustrative practitioner profile created in the demonstration environment."
      ).trim(),
      fullNarrative: (
        input.fullNarrative ||
        input.shortBio ||
        "Illustrative biography for demonstration testing."
      ).trim(),
      stateName: (input.stateName || "Maharashtra").trim(),
      districtName: input.districtName ?? "Kolhapur District",
      cityName: input.cityName ?? "Kolhapur",
      placeId: input.placeId ?? "loc-city-kolhapur",
      languages: Array.isArray(input.languages) ? input.languages : ["Marathi"],
      specialisations: Array.isArray(input.specialisations)
        ? input.specialisations
        : [],
      traditionIds: Array.isArray(input.traditionIds) ? input.traditionIds : [],
      traditionSlugs: Array.isArray(input.traditionSlugs)
        ? input.traditionSlugs
        : [],
      traditionTitles: Array.isArray(input.traditionTitles)
        ? input.traditionTitles
        : [],
      yearsOfPractice: Number(input.yearsOfPractice || 10),
      lineageNote: (
        input.lineageNote || "Illustrative lineage note (Demo Sample)."
      ).trim(),
      availabilityStatus: input.availabilityStatus || "OPEN_FOR_WORKSHOPS",
      profileImageUrl:
        input.profileImageUrl ||
        "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
      profileImageCredit:
        input.profileImageCredit ||
        "Demonstration profile illustration (Wikimedia Commons CC BY-SA)",
      workshops: Array.isArray(input.workshops) ? input.workshops : [],
      verificationBadge:
        input.verificationBadge ||
        "DEMO_SAMPLE — Fictional practitioner profile for interface demonstration.",
      publicationStatus: input.publicationStatus || "PUBLISHED",
      recordOrigin: "DEMO_SAMPLE",
      demoDisclaimer:
        input.demoDisclaimer ||
        "DEMONSTRATION PROFILE — Illustrative persona; not a real individual.",
      ownerUserId: input.ownerUserId || null,
    };
    this.practitioners.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public updatePractitioner(
    idOrSlug: string,
    patch: Partial<PractitionerProfile>
  ): PractitionerProfile {
    const found = this.getPractitionerBySlug(idOrSlug);
    if (!found) {
      throw new Error(`Practitioner '${idOrSlug}' not found.`);
    }
    const existing = this.practitioners.get(found.id)!;
    if (patch.displayName !== undefined)
      existing.displayName = patch.displayName.trim();
    if (patch.roleTitle !== undefined)
      existing.roleTitle = patch.roleTitle.trim();
    if (patch.shortBio !== undefined) existing.shortBio = patch.shortBio.trim();
    if (patch.fullNarrative !== undefined)
      existing.fullNarrative = patch.fullNarrative.trim();
    if (patch.stateName !== undefined)
      existing.stateName = patch.stateName.trim();
    if (patch.districtName !== undefined)
      existing.districtName = patch.districtName;
    if (patch.cityName !== undefined) existing.cityName = patch.cityName;
    if (patch.languages !== undefined) existing.languages = patch.languages;
    if (patch.specialisations !== undefined)
      existing.specialisations = patch.specialisations;
    if (patch.traditionIds !== undefined)
      existing.traditionIds = patch.traditionIds;
    if (patch.traditionSlugs !== undefined)
      existing.traditionSlugs = patch.traditionSlugs;
    if (patch.traditionTitles !== undefined)
      existing.traditionTitles = patch.traditionTitles;
    if (patch.yearsOfPractice !== undefined)
      existing.yearsOfPractice = Number(patch.yearsOfPractice);
    if (patch.lineageNote !== undefined)
      existing.lineageNote = patch.lineageNote;
    if (patch.availabilityStatus !== undefined)
      existing.availabilityStatus = patch.availabilityStatus;
    if (patch.profileImageUrl !== undefined)
      existing.profileImageUrl = patch.profileImageUrl;
    if (patch.workshops !== undefined) existing.workshops = patch.workshops;
    if (patch.publicationStatus !== undefined)
      existing.publicationStatus = patch.publicationStatus;

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public listArtMartSellers(): ArtMartSeller[] {
    return Array.from(this.artMartSellers.values()).map((s) =>
      structuredClone(s)
    );
  }

  public getArtMartSellerBySlug(slugOrId: string): ArtMartSeller | null {
    const clean = decodeURIComponent(slugOrId).trim().toLowerCase();
    for (const s of Array.from(this.artMartSellers.values())) {
      if (s.slug.toLowerCase() === clean || s.id.toLowerCase() === clean) {
        return structuredClone(s);
      }
    }
    return null;
  }

  public listArtMartProducts(filter?: {
    q?: string;
    category?: string;
    stateName?: string;
    traditionSlug?: string;
    sellerId?: string;
    sortBy?: string;
    includeUnpublished?: boolean;
  }): ArtMartProduct[] {
    const q = (filter?.q || "").trim().toLowerCase();
    const list = Array.from(this.artMartProducts.values()).filter((p) => {
      if (!filter?.includeUnpublished && p.publicationStatus !== "PUBLISHED") {
        return false;
      }
      if (
        filter?.category &&
        filter.category !== "All" &&
        p.category !== filter.category
      ) {
        return false;
      }
      if (
        filter?.stateName &&
        filter.stateName !== "All" &&
        p.stateName.toLowerCase() !== filter.stateName.toLowerCase()
      ) {
        return false;
      }
      if (
        filter?.traditionSlug &&
        filter.traditionSlug !== "All" &&
        p.traditionSlug !== filter.traditionSlug
      ) {
        return false;
      }
      if (
        filter?.sellerId &&
        filter.sellerId !== "All" &&
        p.sellerId !== filter.sellerId &&
        p.sellerSlug !== filter.sellerId
      ) {
        return false;
      }
      if (q) {
        const hay = [
          p.title,
          p.category,
          p.traditionTitle || "",
          p.sellerName,
          p.regionLabel,
          p.stateName,
          p.materialsUsed,
          p.description,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filter?.sortBy === "price_asc") {
      list.sort((a, b) => a.priceInr - b.priceInr);
    } else if (filter?.sortBy === "price_desc") {
      list.sort((a, b) => b.priceInr - a.priceInr);
    } else if (filter?.sortBy === "stock_desc") {
      list.sort((a, b) => b.stockQuantity - a.stockQuantity);
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list.map((p) => structuredClone(p));
  }

  public getArtMartProductBySlug(slugOrId: string): ArtMartProduct | null {
    const clean = decodeURIComponent(slugOrId).trim().toLowerCase();
    for (const p of Array.from(this.artMartProducts.values())) {
      if (p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean) {
        return structuredClone(p);
      }
    }
    return null;
  }

  public createArtMartProduct(input: Partial<ArtMartProduct>): ArtMartProduct {
    const title = (input.title || "").trim();
    if (!title) {
      throw new Error("Product title is required.");
    }
    const seller =
      (input.sellerId && this.artMartSellers.get(input.sellerId)) ||
      Array.from(this.artMartSellers.values())[0];
    if (!seller) {
      throw new Error("No Art-Mart seller storefront available.");
    }
    const id = input.id?.trim() || `prod-${crypto.randomUUID()}`;
    const slug = input.slug?.trim() || makeSlug(title);
    const item: ArtMartProduct = {
      id,
      slug,
      title,
      category: (input.category || "Leather & Footwear Craft").trim(),
      traditionId: input.traditionId ?? "trad-kolhapuri-chappal",
      traditionSlug: input.traditionSlug ?? "kolhapuri-chappal",
      traditionTitle: input.traditionTitle ?? "Kolhapuri Chappal",
      sellerId: seller.id,
      sellerSlug: seller.slug,
      sellerName: seller.storefrontName,
      regionLabel: (
        input.regionLabel || `${seller.cityName || seller.stateName}`
      ).trim(),
      stateName: (input.stateName || seller.stateName).trim(),
      districtName: input.districtName ?? seller.districtName,
      priceInr: Math.max(50, Number(input.priceInr || 1500)),
      stockQuantity: Math.max(0, Number(input.stockQuantity ?? 10)),
      materialsUsed: (
        input.materialsUsed ||
        "Traditional regionally sourced natural materials (Demo Sample)."
      ).trim(),
      makingProcess: (
        input.makingProcess ||
        "Hand-crafted in small batches following documented guild techniques."
      ).trim(),
      provenanceNote: (
        input.provenanceNote ||
        "Illustrative demonstration craft product linked to Bharat CultureMap tradition registry."
      ).trim(),
      description: (
        input.description ||
        `${title} — illustrative Art-Mart craft listing.`
      ).trim(),
      imageUrl:
        input.imageUrl ||
        "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
      galleryUrls: Array.isArray(input.galleryUrls)
        ? input.galleryUrls
        : [
            input.imageUrl ||
              "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
          ],
      imageCredit:
        input.imageCredit ||
        "Wikimedia Commons Open-Licence Demonstration Asset",
      industryCollaborationId: input.industryCollaborationId ?? null,
      approvalStatus: input.approvalStatus || "APPROVED",
      publicationStatus: input.publicationStatus || "PUBLISHED",
      recordOrigin: "DEMO_SAMPLE",
      demoDisclaimer:
        "DEMONSTRATION LISTING — Illustrative craft product and price. No real money is collected.",
    };
    this.artMartProducts.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public updateArtMartProduct(
    idOrSlug: string,
    patch: Partial<ArtMartProduct>
  ): ArtMartProduct {
    const found = this.getArtMartProductBySlug(idOrSlug);
    if (!found) {
      throw new Error(`Art-Mart product '${idOrSlug}' not found.`);
    }
    const existing = this.artMartProducts.get(found.id)!;
    if (patch.title !== undefined) existing.title = patch.title.trim();
    if (patch.category !== undefined) existing.category = patch.category.trim();
    if (patch.priceInr !== undefined)
      existing.priceInr = Math.max(0, Number(patch.priceInr));
    if (patch.stockQuantity !== undefined)
      existing.stockQuantity = Math.max(0, Number(patch.stockQuantity));
    if (patch.materialsUsed !== undefined)
      existing.materialsUsed = patch.materialsUsed.trim();
    if (patch.makingProcess !== undefined)
      existing.makingProcess = patch.makingProcess.trim();
    if (patch.provenanceNote !== undefined)
      existing.provenanceNote = patch.provenanceNote.trim();
    if (patch.description !== undefined)
      existing.description = patch.description.trim();
    if (patch.imageUrl !== undefined) existing.imageUrl = patch.imageUrl.trim();
    if (patch.approvalStatus !== undefined)
      existing.approvalStatus = patch.approvalStatus;
    if (patch.publicationStatus !== undefined)
      existing.publicationStatus = patch.publicationStatus;

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public listArtMartOrders(buyerEmail?: string): ArtMartOrder[] {
    const cleanEmail = (buyerEmail || "").trim().toLowerCase();
    return Array.from(this.artMartOrders.values())
      .filter((o) => !cleanEmail || o.buyerEmail.toLowerCase() === cleanEmail)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((o) => structuredClone(o));
  }

  public createArtMartOrder(input: {
    buyerName: string;
    buyerEmail: string;
    shippingCity: string;
    shippingState: string;
    shippingAddressLabel: string;
    paymentMethodLabel?: string;
    items: Array<{ productId: string; quantity: number }>;
  }): ArtMartOrder {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("Order must contain at least one craft product.");
    }
    const orderItems: ArtMartOrderItem[] = [];
    let totalInr = 0;

    for (const line of input.items) {
      const qty = Math.max(1, Number(line.quantity || 1));
      const prod = this.artMartProducts.get(line.productId);
      if (!prod) {
        throw new Error(`Product '${line.productId}' not found.`);
      }
      if (prod.stockQuantity < qty) {
        throw new Error(
          `Insufficient demo stock for '${prod.title}' (available: ${prod.stockQuantity}, requested: ${qty}).`
        );
      }
    }

    for (const line of input.items) {
      const qty = Math.max(1, Number(line.quantity || 1));
      const prod = this.artMartProducts.get(line.productId)!;
      prod.stockQuantity -= qty;
      const lineTotal = prod.priceInr * qty;
      totalInr += lineTotal;
      orderItems.push({
        productId: prod.id,
        productTitle: prod.title,
        sellerId: prod.sellerId,
        sellerName: prod.sellerName,
        quantity: qty,
        unitPriceInr: prod.priceInr,
        lineTotalInr: lineTotal,
      });
    }

    const id = `ord-demo-${crypto.randomUUID().slice(0, 8)}`;
    const orderNumber = `BCM-DEMO-2026-${1000 + this.artMartOrders.size + 1}`;
    const now = new Date().toISOString();
    const order: ArtMartOrder = {
      id,
      orderNumber,
      buyerName: (input.buyerName || "Demo Patron").trim(),
      buyerEmail: (
        input.buyerEmail || "buyer.demo@bharat-culturemap.local"
      ).trim(),
      shippingCity: (input.shippingCity || "Kolhapur").trim(),
      shippingState: (input.shippingState || "Maharashtra").trim(),
      shippingAddressLabel: (
        input.shippingAddressLabel || "Demo Delivery Address"
      ).trim(),
      paymentMethodLabel:
        input.paymentMethodLabel ||
        "SIMULATED_SANDBOX_PAYMENT (Zero real money transferred)",
      status: "CONFIRMED",
      totalInr,
      items: orderItems,
      simulationDisclaimer:
        "SIMULATED DEMONSTRATION ORDER — No real payment gateway charge or physical shipment occurs.",
      createdAt: now,
      updatedAt: now,
    };

    this.artMartOrders.set(id, order);
    this.persistSnapshot();
    return structuredClone(order);
  }

  public updateArtMartOrderStatus(
    id: string,
    status: ArtMartOrder["status"]
  ): ArtMartOrder {
    const existing = this.artMartOrders.get(id);
    if (!existing) {
      throw new Error(`Order '${id}' not found.`);
    }
    const previousStatus = existing.status;
    existing.status = status;
    existing.updatedAt = new Date().toISOString();

    // Restore demo stock automatically if an active order is cancelled
    if (previousStatus !== "CANCELLED_DEMO" && status === "CANCELLED_DEMO") {
      for (const item of existing.items) {
        const prod = this.artMartProducts.get(item.productId);
        if (prod) {
          prod.stockQuantity += item.quantity;
        }
      }
    }

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public listIndustryMaterials(filter?: {
    q?: string;
    materialCategory?: string;
    includePending?: boolean;
  }): IndustryMaterialListing[] {
    const q = (filter?.q || "").trim().toLowerCase();
    return Array.from(this.industryMaterials.values())
      .filter((m) => {
        if (!filter?.includePending && m.adminReviewStatus !== "APPROVED") {
          return false;
        }
        if (
          filter?.materialCategory &&
          filter.materialCategory !== "All" &&
          m.materialCategory !== filter.materialCategory
        ) {
          return false;
        }
        if (q) {
          const hay = [
            m.title,
            m.industryOrgLabel,
            m.materialCategory,
            m.locationCity,
            m.locationState,
            ...m.suggestedTraditions,
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((m) => structuredClone(m));
  }

  public createIndustryMaterial(
    input: Partial<IndustryMaterialListing>
  ): IndustryMaterialListing {
    const title = (input.title || "").trim();
    if (!title) {
      throw new Error("Surplus material listing title is required.");
    }
    const id = input.id?.trim() || `ita-mat-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const item: IndustryMaterialListing = {
      id,
      title,
      industryOrgLabel: (
        input.industryOrgLabel || "Illustrative Industrial Partner (Demo)"
      ).trim(),
      materialCategory: (
        input.materialCategory || "Vegetable-Tanned Leather & Hide Offcuts"
      ).trim(),
      quantityAvailableLabel: (
        input.quantityAvailableLabel || "50 kg clean offcuts"
      ).trim(),
      conditionLabel: (
        input.conditionLabel || "Clean, non-hazardous surplus batch"
      ).trim(),
      locationCity: (input.locationCity || "Kolhapur").trim(),
      locationState: (input.locationState || "Maharashtra").trim(),
      pricingTerms: input.pricingTerms || "DONATION_FREE",
      priceNote: (
        input.priceNote || "Free circular-economy allocation for artisans (Demo)."
      ).trim(),
      safetyRestrictions: (
        input.safetyRestrictions ||
        "Verified non-toxic and safe for hand-craft studio use."
      ).trim(),
      suggestedTraditions: Array.isArray(input.suggestedTraditions)
        ? input.suggestedTraditions
        : ["Kolhapuri Chappal"],
      adminReviewStatus: input.adminReviewStatus || "PENDING_ADMIN_REVIEW",
      availabilityStatus: input.availabilityStatus || "AVAILABLE",
      recordOrigin: "DEMO_SAMPLE",
      demoDisclaimer:
        "DEMONSTRATION SURPLUS LISTING — Illustrative Industry-to-Art record.",
      createdAt: now,
    };
    this.industryMaterials.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public updateIndustryMaterialStatus(
    id: string,
    adminReviewStatus: IndustryMaterialListing["adminReviewStatus"],
    availabilityStatus?: IndustryMaterialListing["availabilityStatus"]
  ): IndustryMaterialListing {
    const existing = this.industryMaterials.get(id);
    if (!existing) {
      throw new Error(`Industry material '${id}' not found.`);
    }
    existing.adminReviewStatus = adminReviewStatus;
    if (availabilityStatus !== undefined) {
      existing.availabilityStatus = availabilityStatus;
    }
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public listIndustryRequests(materialId?: string): IndustryMaterialRequest[] {
    return Array.from(this.industryRequests.values())
      .filter((r) => !materialId || r.materialId === materialId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((r) => structuredClone(r));
  }

  public createIndustryRequest(
    input: Partial<IndustryMaterialRequest> & {
      materialId: string;
      artisanName: string;
      intendedCraftUse: string;
    }
  ): IndustryMaterialRequest {
    const mat = this.industryMaterials.get(input.materialId);
    if (!mat) {
      throw new Error(`Material listing '${input.materialId}' not found.`);
    }
    const id = input.id?.trim() || `ita-req-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const reqItem: IndustryMaterialRequest = {
      id,
      materialId: mat.id,
      materialTitle: mat.title,
      artisanName: input.artisanName.trim(),
      artisanEmail: (
        input.artisanEmail || "seller.demo@bharat-culturemap.local"
      ).trim(),
      traditionTitle: (input.traditionTitle || "Kolhapuri Chappal").trim(),
      requestedQuantityLabel: (
        input.requestedQuantityLabel || "15 kg sample batch"
      ).trim(),
      intendedCraftUse: input.intendedCraftUse.trim(),
      collaborationStatus: "SUBMITTED_BY_ARTISAN",
      adminReviewerNote:
        "Submitted in demonstration workflow; awaiting admin or industry review.",
      linkedArtMartProductId: null,
      linkedArtMartProductSlug: null,
      createdAt: now,
      updatedAt: now,
    };
    this.industryRequests.set(id, reqItem);
    this.persistSnapshot();
    return structuredClone(reqItem);
  }

  public updateIndustryRequestStatus(
    id: string,
    collaborationStatus: IndustryMaterialRequest["collaborationStatus"],
    adminReviewerNote?: string,
    linkedArtMartProductId?: string | null
  ): IndustryMaterialRequest {
    const existing = this.industryRequests.get(id);
    if (!existing) {
      throw new Error(`Industry request '${id}' not found.`);
    }
    existing.collaborationStatus = collaborationStatus;
    if (adminReviewerNote !== undefined) {
      existing.adminReviewerNote = adminReviewerNote.trim();
    }
    if (linkedArtMartProductId !== undefined) {
      existing.linkedArtMartProductId = linkedArtMartProductId;
      const prod = linkedArtMartProductId
        ? this.artMartProducts.get(linkedArtMartProductId) || null
        : null;
      existing.linkedArtMartProductSlug = prod ? prod.slug : null;
      if (prod) {
        prod.industryCollaborationId = existing.id;
      }
    }
    existing.updatedAt = new Date().toISOString();
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public listEcosystemResources(filter?: {
    q?: string;
    organisationType?: string;
    relationshipStatus?: string;
    stateScope?: string;
  }): EcosystemResourceItem[] {
    const q = (filter?.q || "").trim().toLowerCase();
    return Array.from(this.ecosystemResources.values())
      .filter((r) => {
        if (
          filter?.organisationType &&
          filter.organisationType !== "All" &&
          r.organisationType !== filter.organisationType
        ) {
          return false;
        }
        if (
          filter?.relationshipStatus &&
          filter.relationshipStatus !== "All" &&
          r.relationshipStatus !== filter.relationshipStatus
        ) {
          return false;
        }
        if (
          filter?.stateScope &&
          filter.stateScope !== "All" &&
          !r.stateScope.toLowerCase().includes(filter.stateScope.toLowerCase())
        ) {
          return false;
        }
        if (q) {
          const hay = [
            r.title,
            r.resourceCategory,
            r.organisationType,
            r.stateScope,
            r.summary,
            r.eligibilityDetails,
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((r) => structuredClone(r));
  }

  public createEcosystemResource(
    input: Partial<EcosystemResourceItem>
  ): EcosystemResourceItem {
    const title = (input.title || "").trim();
    if (!title) {
      throw new Error("Ecosystem resource title is required.");
    }
    const id = input.id?.trim() || `eco-${crypto.randomUUID().slice(0, 8)}`;
    const today = new Date().toISOString().slice(0, 10);
    const item: EcosystemResourceItem = {
      id,
      title,
      resourceCategory: (
        input.resourceCategory || "Artisan Welfare & Cluster Support"
      ).trim(),
      organisationType: input.organisationType || "NGO_FOUNDATION",
      relationshipStatus:
        input.relationshipStatus || "ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR",
      stateScope: (input.stateScope || "Maharashtra").trim(),
      summary: (
        input.summary || "Illustrative ecosystem resource entry."
      ).trim(),
      eligibilityDetails: (
        input.eligibilityDetails ||
        "Practitioners, craft guilds, and cultural researchers."
      ).trim(),
      officialUrl: (input.officialUrl || "https://example.org/demo-resource").trim(),
      lastReviewedDate: input.lastReviewedDate || today,
      publicationStatus: input.publicationStatus || "PUBLISHED",
      recordOrigin: "DEMO_SAMPLE",
      demoDisclaimer:
        input.demoDisclaimer ||
        "DEMONSTRATION RESOURCE ENTRY — Illustrative ecosystem record.",
    };
    this.ecosystemResources.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public updateEcosystemResource(
    id: string,
    patch: Partial<EcosystemResourceItem>
  ): EcosystemResourceItem {
    const existing = this.ecosystemResources.get(id);
    if (!existing) {
      throw new Error(`Ecosystem resource '${id}' not found.`);
    }
    if (patch.title !== undefined) existing.title = patch.title.trim();
    if (patch.resourceCategory !== undefined)
      existing.resourceCategory = patch.resourceCategory.trim();
    if (patch.organisationType !== undefined)
      existing.organisationType = patch.organisationType;
    if (patch.relationshipStatus !== undefined)
      existing.relationshipStatus = patch.relationshipStatus;
    if (patch.stateScope !== undefined)
      existing.stateScope = patch.stateScope.trim();
    if (patch.summary !== undefined) existing.summary = patch.summary.trim();
    if (patch.eligibilityDetails !== undefined)
      existing.eligibilityDetails = patch.eligibilityDetails.trim();
    if (patch.officialUrl !== undefined)
      existing.officialUrl = patch.officialUrl.trim();
    if (patch.lastReviewedDate !== undefined)
      existing.lastReviewedDate = patch.lastReviewedDate;
    if (patch.publicationStatus !== undefined)
      existing.publicationStatus = patch.publicationStatus;

    this.persistSnapshot();
    return structuredClone(existing);
  }

  public queryHerCraftDirectory(filter?: {
    q?: string;
    craftCategory?: string;
    enterpriseType?: string;
    stateName?: string;
    districtName?: string;
    traditionSlug?: string;
    opportunityType?: string;
    includePending?: boolean;
  }): HerCraftDirectoryPayload {
    const q = (filter?.q || "").trim().toLowerCase();
    const allEnts = Array.from(this.herCraftEnterprises.values());
    const publishedEnts = allEnts.filter(
      (e) =>
        e.publicationStatus === "PUBLISHED" && e.approvalStatus === "APPROVED"
    );
    const pendingCount = allEnts.filter(
      (e) => e.approvalStatus === "PENDING_REVIEW"
    ).length;

    const filteredEnts = allEnts
      .filter((e) => {
        if (
          !filter?.includePending &&
          (e.publicationStatus !== "PUBLISHED" ||
            e.approvalStatus !== "APPROVED")
        ) {
          return false;
        }
        if (
          filter?.craftCategory &&
          filter.craftCategory !== "All" &&
          e.craftCategory !== filter.craftCategory
        ) {
          return false;
        }
        if (
          filter?.enterpriseType &&
          filter.enterpriseType !== "All" &&
          e.enterpriseType !== filter.enterpriseType
        ) {
          return false;
        }
        if (
          filter?.stateName &&
          filter.stateName !== "All" &&
          e.stateName.toLowerCase() !== filter.stateName.toLowerCase()
        ) {
          return false;
        }
        if (filter?.districtName && filter.districtName !== "All") {
          const reqDist = filter.districtName.toLowerCase().replace(/\s+district$/i, "").trim();
          const entDist = (e.districtName || "").toLowerCase().replace(/\s+district$/i, "").trim();
          if (!entDist.includes(reqDist) && !reqDist.includes(entDist)) {
            return false;
          }
        }
        if (
          filter?.traditionSlug &&
          filter.traditionSlug !== "All" &&
          e.traditionSlug !== filter.traditionSlug
        ) {
          return false;
        }
        if (q) {
          const hay = [
            e.enterpriseName,
            e.leaderOrCollectiveLabel,
            e.craftCategory,
            e.traditionTitle || "",
            e.stateName,
            e.districtName || "",
            e.cityName || "",
            e.shortSummary,
            ...e.signatureCrafts,
            ...e.productsAndTechniques,
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((e) => structuredClone(e));

    const filteredOpps = Array.from(this.herCraftOpportunities.values())
      .filter((o) => {
        if (
          !filter?.includePending &&
          (o.publicationStatus !== "PUBLISHED" ||
            o.approvalStatus !== "APPROVED")
        ) {
          return false;
        }
        if (
          filter?.opportunityType &&
          filter.opportunityType !== "All" &&
          o.opportunityType !== filter.opportunityType
        ) {
          return false;
        }
        if (q) {
          const hay = [
            o.title,
            o.organiserName,
            o.stateScope,
            o.eligibilitySummary,
            o.benefitSummary,
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((o) => structuredClone(o));

    const linkedProductIdSet = new Set(
      filteredEnts.flatMap((e) => e.linkedArtMartProductIds)
    );
    const featuredProducts = Array.from(this.artMartProducts.values())
      .filter(
        (p) =>
          p.publicationStatus === "PUBLISHED" &&
          (linkedProductIdSet.has(p.id) ||
            filteredEnts.some((e) => e.traditionSlug === p.traditionSlug))
      )
      .map((p) => structuredClone(p));

    const statesRepresented = Array.from(
      new Set(publishedEnts.map((e) => e.stateName))
    ).sort();
    const craftCategories = Array.from(
      new Set(publishedEnts.map((e) => e.craftCategory))
    ).sort();
    const enterpriseTypes = Array.from(
      new Set(publishedEnts.map((e) => e.enterpriseType))
    ).sort();
    const totalWomenArtisansRepresented = publishedEnts.reduce(
      (sum, e) => sum + (Number(e.womenArtisansCount) || 0),
      0
    );

    return {
      enterprises: filteredEnts,
      opportunities: filteredOpps,
      featuredProducts,
      facets: {
        totalPublishedEnterprises: publishedEnts.length,
        pendingReviewEnterprises: pendingCount,
        totalWomenArtisansRepresented,
        statesRepresented,
        craftCategories,
        enterpriseTypes,
      },
    };
  }

  public getHerCraftEnterpriseBySlug(
    slugOrId: string,
    includePending = false
  ): {
    enterprise: HerCraftEnterprise;
    relatedProducts: ArtMartProduct[];
    linkedPractitioner: PractitionerProfile | null;
    opportunities: HerCraftOpportunity[];
  } | null {
    const clean = decodeURIComponent(slugOrId).trim().toLowerCase();
    for (const ent of Array.from(this.herCraftEnterprises.values())) {
      if (ent.slug.toLowerCase() === clean || ent.id.toLowerCase() === clean) {
        if (
          !includePending &&
          (ent.publicationStatus !== "PUBLISHED" ||
            ent.approvalStatus !== "APPROVED")
        ) {
          return null;
        }
        const relatedProducts = Array.from(this.artMartProducts.values())
          .filter(
            (p) =>
              p.publicationStatus === "PUBLISHED" &&
              (ent.linkedArtMartProductIds.includes(p.id) ||
                (ent.traditionSlug && p.traditionSlug === ent.traditionSlug))
          )
          .map((p) => structuredClone(p));
        const linkedPractitioner = ent.linkedPractitionerId
          ? this.practitioners.get(ent.linkedPractitionerId) || null
          : null;
        const opportunities = Array.from(this.herCraftOpportunities.values())
          .filter(
            (o) =>
              o.publicationStatus === "PUBLISHED" &&
              (o.stateScope.includes("All India") ||
                o.stateScope
                  .toLowerCase()
                  .includes(ent.stateName.toLowerCase()))
          )
          .map((o) => structuredClone(o));
        return {
          enterprise: structuredClone(ent),
          relatedProducts,
          linkedPractitioner: linkedPractitioner
            ? structuredClone(linkedPractitioner)
            : null,
          opportunities,
        };
      }
    }
    return null;
  }

  public createHerCraftEnterprise(
    input: Partial<HerCraftEnterprise>,
    actor?: UserAccount | null
  ): HerCraftEnterprise {
    const enterpriseName = (input.enterpriseName || "").trim();
    if (!enterpriseName) {
      throw new Error("HerCraft enterprise name is required.");
    }
    const id = input.id?.trim() || `hc-ent-${crypto.randomUUID().slice(0, 8)}`;
    const slug = input.slug?.trim() || makeSlug(enterpriseName);
    const now = new Date().toISOString();
    const isStaff = actor ? RBAC.canModerateEcosystemOrHerCraft(actor.role) : false;

    const item: HerCraftEnterprise = {
      id,
      slug,
      enterpriseName,
      leaderOrCollectiveLabel: (
        input.leaderOrCollectiveLabel ||
        "Women-Led Artisan Collective (Demo Submission)"
      ).trim(),
      enterpriseType: input.enterpriseType || "WOMEN_SHG",
      craftCategory: (
        input.craftCategory || "Handloom & Textile Heritage"
      ).trim(),
      traditionId: input.traditionId ?? "trad-kolhapuri-chappal",
      traditionSlug: input.traditionSlug ?? "kolhapuri-chappal",
      traditionTitle: input.traditionTitle ?? "Kolhapuri Chappal",
      stateName: (input.stateName || "Maharashtra").trim(),
      districtName: input.districtName ?? "Kolhapur District",
      cityName: input.cityName ?? "Kolhapur",
      placeId: input.placeId ?? "loc-city-kolhapur",
      womenArtisansCount: Math.max(1, Number(input.womenArtisansCount || 12)),
      foundedYear: Number(input.foundedYear || 2021),
      shortSummary: (
        input.shortSummary ||
        "Illustrative women-led cultural enterprise submitted to the HerCraft directory."
      ).trim(),
      storyNarrative: (
        input.storyNarrative ||
        input.shortSummary ||
        "Illustrative women-led cultural enterprise narrative."
      ).trim(),
      signatureCrafts: Array.isArray(input.signatureCrafts)
        ? input.signatureCrafts
        : ["Traditional Handcrafted Heritage Work"],
      productsAndTechniques: Array.isArray(input.productsAndTechniques)
        ? input.productsAndTechniques
        : ["Regionally sourced natural materials and hand tools"],
      trainingAndWorkshops: Array.isArray(input.trainingAndWorkshops)
        ? input.trainingAndWorkshops
        : [],
      supportNeeds: Array.isArray(input.supportNeeds)
        ? input.supportNeeds
        : ["GI registration & exhibition access"],
      linkedArtMartProductIds: Array.isArray(input.linkedArtMartProductIds)
        ? input.linkedArtMartProductIds
        : [],
      linkedPractitionerId: input.linkedPractitionerId ?? null,
      heroImageUrl:
        input.heroImageUrl ||
        "https://upload.wikimedia.org/wikipedia/commons/8/8a/Indian_chappal%2C_Kolhapur%2C_late_20th_century_-_Bata_Shoe_Museum_-_DSC00445.JPG",
      imageCredit:
        input.imageCredit ||
        "Wikimedia Commons Open-Licence Demonstration Asset",
      sourceAttribution: (
        input.sourceAttribution ||
        "Submitted via Bharat CultureMap HerCraft Directory (Demo Sample)"
      ).trim(),
      sourceUrl: (input.sourceUrl || "https://indianculture.gov.in/").trim(),
      contactOrEnquiryNote: (
        input.contactOrEnquiryNote ||
        "Enquiries routed via Bharat CultureMap moderated community queue."
      ).trim(),
      approvalStatus:
        isStaff && input.approvalStatus ? input.approvalStatus : "PENDING_REVIEW",
      publicationStatus:
        isStaff && input.publicationStatus ? input.publicationStatus : "DRAFT",
      recordOrigin: "DEMO_SAMPLE",
      demoDisclaimer:
        "DEMONSTRATION ENTERPRISE PROFILE — Fictional women-led enterprise record for interface testing.",
      ownerUserId: actor?.id || input.ownerUserId || null,
      createdAt: now,
      updatedAt: now,
    };

    this.herCraftEnterprises.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public updateHerCraftEnterprise(
    idOrSlug: string,
    patch: Partial<HerCraftEnterprise>,
    actor?: UserAccount | null
  ): HerCraftEnterprise {
    const found = this.getHerCraftEnterpriseBySlug(idOrSlug, true);
    if (!found) {
      throw new Error(`HerCraft enterprise '${idOrSlug}' not found.`);
    }
    const existing = this.herCraftEnterprises.get(found.enterprise.id)!;
    const isStaff = actor
      ? RBAC.canModerateEcosystemOrHerCraft(actor.role)
      : false;

    if (patch.enterpriseName !== undefined)
      existing.enterpriseName = patch.enterpriseName.trim();
    if (patch.leaderOrCollectiveLabel !== undefined)
      existing.leaderOrCollectiveLabel = patch.leaderOrCollectiveLabel.trim();
    if (patch.enterpriseType !== undefined)
      existing.enterpriseType = patch.enterpriseType;
    if (patch.craftCategory !== undefined)
      existing.craftCategory = patch.craftCategory.trim();
    if (patch.stateName !== undefined)
      existing.stateName = patch.stateName.trim();
    if (patch.districtName !== undefined)
      existing.districtName = patch.districtName;
    if (patch.cityName !== undefined) existing.cityName = patch.cityName;
    if (patch.womenArtisansCount !== undefined)
      existing.womenArtisansCount = Math.max(
        1,
        Number(patch.womenArtisansCount)
      );
    if (patch.shortSummary !== undefined)
      existing.shortSummary = patch.shortSummary.trim();
    if (patch.storyNarrative !== undefined)
      existing.storyNarrative = patch.storyNarrative.trim();
    if (patch.signatureCrafts !== undefined)
      existing.signatureCrafts = patch.signatureCrafts;
    if (patch.productsAndTechniques !== undefined)
      existing.productsAndTechniques = patch.productsAndTechniques;
    if (patch.trainingAndWorkshops !== undefined)
      existing.trainingAndWorkshops = patch.trainingAndWorkshops;
    if (patch.supportNeeds !== undefined)
      existing.supportNeeds = patch.supportNeeds;
    if (patch.linkedArtMartProductIds !== undefined)
      existing.linkedArtMartProductIds = patch.linkedArtMartProductIds;
    if (isStaff) {
      if (patch.approvalStatus !== undefined)
        existing.approvalStatus = patch.approvalStatus;
      if (patch.publicationStatus !== undefined)
        existing.publicationStatus = patch.publicationStatus;
    }
    existing.updatedAt = new Date().toISOString();
    this.persistSnapshot();
    return structuredClone(existing);
  }

  public createHerCraftOpportunity(
    input: Partial<HerCraftOpportunity>,
    actor?: UserAccount | null
  ): HerCraftOpportunity {
    const title = (input.title || "").trim();
    if (!title) {
      throw new Error("HerCraft opportunity title is required.");
    }
    const id = input.id?.trim() || `hc-opp-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const isStaff = actor
      ? RBAC.canModerateEcosystemOrHerCraft(actor.role)
      : false;

    const item: HerCraftOpportunity = {
      id,
      title,
      opportunityType: input.opportunityType || "GOVERNMENT_SCHEME",
      organiserName: (
        input.organiserName || "Cultural Craft Support Institution (Demo)"
      ).trim(),
      organiserType: input.organiserType || "NGO_FOUNDATION",
      relationshipStatus:
        input.relationshipStatus || "ILLUSTRATIVE_DEMO_PROGRAM",
      stateScope: (input.stateScope || "Maharashtra").trim(),
      eligibilitySummary: (
        input.eligibilitySummary || "Women-led SHGs and craft cooperatives."
      ).trim(),
      benefitSummary: (
        input.benefitSummary ||
        "Training, toolkit, or exhibition support (Demonstration entry)."
      ).trim(),
      applicationOrOfficialUrl: (
        input.applicationOrOfficialUrl || "https://handicrafts.nic.in/"
      ).trim(),
      deadlineOrCycleLabel: (
        input.deadlineOrCycleLabel || "Rolling Cycle"
      ).trim(),
      approvalStatus:
        isStaff && input.approvalStatus ? input.approvalStatus : "PENDING_REVIEW",
      publicationStatus:
        isStaff && input.publicationStatus ? input.publicationStatus : "DRAFT",
      recordOrigin: "DEMO_SAMPLE",
      demoDisclaimer:
        "DEMONSTRATION OPPORTUNITY ENTRY — Illustrative HerCraft opportunity.",
      createdAt: now,
    };

    this.herCraftOpportunities.set(id, item);
    this.persistSnapshot();
    return structuredClone(item);
  }

  public updateHerCraftOpportunity(
    id: string,
    patch: Partial<HerCraftOpportunity>,
    actor?: UserAccount | null
  ): HerCraftOpportunity {
    const existing = this.herCraftOpportunities.get(id);
    if (!existing) {
      throw new Error(`HerCraft opportunity '${id}' not found.`);
    }
    const isStaff = actor
      ? RBAC.canModerateEcosystemOrHerCraft(actor.role)
      : false;
    if (patch.title !== undefined) existing.title = patch.title.trim();
    if (patch.opportunityType !== undefined)
      existing.opportunityType = patch.opportunityType;
    if (patch.organiserName !== undefined)
      existing.organiserName = patch.organiserName.trim();
    if (patch.stateScope !== undefined)
      existing.stateScope = patch.stateScope.trim();
    if (patch.eligibilitySummary !== undefined)
      existing.eligibilitySummary = patch.eligibilitySummary.trim();
    if (patch.benefitSummary !== undefined)
      existing.benefitSummary = patch.benefitSummary.trim();
    if (patch.applicationOrOfficialUrl !== undefined)
      existing.applicationOrOfficialUrl = patch.applicationOrOfficialUrl.trim();
    if (patch.deadlineOrCycleLabel !== undefined)
      existing.deadlineOrCycleLabel = patch.deadlineOrCycleLabel.trim();
    if (isStaff) {
      if (patch.approvalStatus !== undefined)
        existing.approvalStatus = patch.approvalStatus;
      if (patch.publicationStatus !== undefined)
        existing.publicationStatus = patch.publicationStatus;
    }
    this.persistSnapshot();
    return structuredClone(existing);
  }

}

let defaultRepositoryInstance: CultureMapRepository | null = null;

export function getRepository(): CultureMapRepository {
  if (!defaultRepositoryInstance) {
    defaultRepositoryInstance = new ModularCultureMapRepository();
  }
  return defaultRepositoryInstance;
}
