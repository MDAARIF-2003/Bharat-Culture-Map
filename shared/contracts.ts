import {
  AiUseOption,
  AudioVideoAccessOption,
  CommercialUseOption,
  ConsentMode,
  ContactModeOption,
  CultureCategory,
  DownloadReuseOption,
  EvidenceStatus,
  IdentityDisplayOption,
  LocationGranularityOption,
  MediaPublicationStatus,
  MediaRightsStatus,
  MediaType,
  ProvenanceStep,
  RecordOrigin,
  RecordStatus,
  SourceType,
  TraditionDirectoryCategory,
  TraditionWorkflowStatus,
  TranslationScopeOption,
  AccountPersonaType,
  PublicRegistrationPersona,
  StaffRole,
  UnescoDomain,
  UserRole,
  EventRecurrencePattern,
  EventScheduleStatus,
  EventWorkflowStatus,
  PhotographyRuleOption,
  RegistrationRequirementOption,
  VisitorAccessOption,
  WithdrawalStatusOption,
} from "./const";

export type {
  AccountPersonaType,
  PublicRegistrationPersona,
  StaffRole,
  UserRole,
};

export interface UserAccount {
  id: string;
  email: string;
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
  isDemoAccount?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GeoLocation {
  id: string;
  level: "COUNTRY" | "STATE" | "DISTRICT" | "TALUKA" | "CITY_TOWN" | "VILLAGE";
  nameEn: string;
  nameMr?: string;
  abbr?: string;
  parentId: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
}

export interface GeographyDatasetSource {
  name: string;
  publisher: string;
  license: string;
  url: string;
}

export interface GeographyDatasetMetadata {
  title: string;
  version: string;
  sources: GeographyDatasetSource[];
  coverageNote: string;
  counts: {
    countries: number;
    statesAndUts: number;
    districts: number;
    subdistrictsAndTalukas: number;
    citiesTownsAndVillages: number;
    totalPlaces: number;
    placesWithCulturalRecords: number;
    placesCollectionInProgress: number;
  };
}

// =============================================================================
// SOURCE & FACT-VERIFICATION SYSTEM (Section G)
// =============================================================================

export interface SourceCitation {
  id: string;
  traditionId: string | null;
  culturalRecordId: string | null;
  locationId: string | null;
  sourceTitle: string;
  sourceOrganisation: string;
  sourceUrl: string;
  sourceType: SourceType;
  publicationOrInscribedDate: string | null;
  specificFactsSupported: string;
  retrievalDate: string;
  attributionOrReuseTerms: string;
  evidenceStatus: EvidenceStatus;
  reviewStatus: "VERIFIED" | "PENDING_REVIEW" | "FLAGGED";
  reviewedBy: string;
  lastReviewedAt: string;
  createdAt: string;
}

// =============================================================================
// REUSABLE MEDIA REGISTRY & RIGHTS GATE (Section F)
// =============================================================================

export interface MediaAssetItem {
  id: string;
  traditionId: string | null;
  culturalRecordId: string | null;
  locationId: string | null;
  mediaType: MediaType;
  title: string;
  caption: string;
  altText: string;
  creatorOrPerformer: string;
  sourceOrganisation: string;
  sourcePageUrl: string;
  directMediaUrl: string | null;
  embedUrl: string | null;
  licenseIdentifier: string;
  licenseUrl: string | null;
  attributionText: string;
  rightsStatus: MediaRightsStatus;
  permissionEvidence: string;
  language: string;
  transcriptOrSummary: string;
  retrievalDate: string;
  reviewedAt: string | null;
  reviewedBy: string;
  publicationStatus: MediaPublicationStatus;
  isPrimaryHero: boolean;
  mediaPublicationGate?: {
    allowed: boolean;
    reasons: string[];
  };
  createdAt: string;
}

// =============================================================================
// TRADITION EXPLORER & MULTI-REGION SPATIAL RELATIONSHIPS (Sections C, D, E)
// =============================================================================

export interface TraditionPlaceAssociation {
  id: string;
  traditionId: string;
  locationId: string;
  locationNameEn: string;
  locationNameMr?: string;
  locationLevel: GeoLocation["level"];
  stateId: string;
  stateName: string;
  districtId: string | null;
  districtName: string | null;
  center: { lat: number; lng: number };
  relationshipRole:
    | "PRIMARY_PRACTICE_REGION"
    | "GI_REGISTERED_CLUSTER"
    | "REGIONAL_STYLE_HUB"
    | "HISTORICAL_OR_FESTIVAL_CENTER"
    | "HISTORICAL_OR_DISPERSION_REGION";
  regionalVariantName: string;
  notes: string;
  isPrimary: boolean;
}

export interface TraditionRegionalVariation {
  name?: string;
  regionLabel: string;
  description?: string;
  distinctiveFeatures?: string;
}

export interface TraditionLearningOpportunity {
  title: string;
  format: string;
  institutionOrContext: string;
  accessNote: string;
  enquiryType: CommunityEnquiryType;
}

export interface TraditionSummary {
  id: string;
  slug: string;
  nameEn: string;
  nameNative: string;
  nativeScriptLang: string;
  alternativeNames: string[];
  traditionCategory: TraditionDirectoryCategory;
  legacyCategory: CultureCategory;
  subcategory: string;
  unescoDomain: UnescoDomain;
  unescoStatus: string | null;
  giTagStatus: string | null;
  languages: string[];
  summary: string;
  evidenceStatus: EvidenceStatus;
  evidenceStatusLabel: string;
  lastReviewedAt: string;
  reviewedByDisplay: string;
  primaryHeroMedia: MediaAssetItem | null;
  places: TraditionPlaceAssociation[];
  statesRepresented: string[];
  sourceCount: number;
  mediaCount: number;
  practitionerRecordCount: number;
  status: TraditionWorkflowStatus;
}

export interface TraditionDetail extends TraditionSummary {
  culturalDescription: string;
  historicalBackground: string;
  communityContext: string;
  techniquesAndMaterials: string[];
  instrumentsOrForms: string[];
  regionalVariations: TraditionRegionalVariation[];
  learningOpportunities: Array<TraditionLearningOpportunity | string>;
  relatedTraditionSlugs?: string[];
  consentAndAccessNote: string;
  verificationNotes: string;
  isSacredOrRestricted: boolean;
  sources: SourceCitation[];
  mediaAssets: MediaAssetItem[];
  linkedRecords: PublicCulturalRecord[];
  relatedEvents: CulturalEventItem[];
  relatedTraditions: TraditionSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface TraditionAdmin extends TraditionDetail {
  isSacredOrRestricted: boolean;
  allMediaAssetsAdmin: MediaAssetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TraditionQueryFilter {
  q?: string;
  traditionCategory?: string;
  legacyCategory?: string;
  stateId?: string;
  districtId?: string;
  placeId?: string;
  language?: string;
  evidenceStatus?: string;
  onlyMultiRegion?: boolean;
  onlyWithVerifiedMedia?: boolean;
  hasVerifiedMedia?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TraditionDirectoryPayload {
  traditions: TraditionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    totalPublished: number;
    totalPublishedTraditions?: number;
    multiRegionCount: number;
    multiRegionTraditionsCount?: number;
    withVerifiedMediaCount: number;
    states: Array<{
      stateId: string;
      stateName: string;
      count: number;
    }>;
    evidenceStatuses: Array<{
      status: EvidenceStatus;
      count: number;
    }>;
    categories: Array<{
      category: TraditionDirectoryCategory;
      count: number;
    }>;
    languages: string[];
  };
}

export interface CulturalEventOccurrence {
  id: string;
  eventId: string;
  label: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  scheduleStatus: EventScheduleStatus;
  verificationNote: string;
}

export interface CulturalEventItem {
  id: string;
  titleEn: string;
  titleMr: string;
  category: CultureCategory;
  eventType: string;
  descriptionEn: string;
  descriptionMr: string;
  culturalRecordId: string | null;
  culturalRecordSlug: string | null;
  culturalRecordTitle: string | null;
  traditionSlug?: string | null;
  stateId: string;
  districtId: string | null;
  talukaId: string | null;
  cityTownId: string | null;
  stateName: string;
  districtName: string | null;
  talukaName: string | null;
  cityTownName: string | null;
  venueLabel: string;
  locationGranularity: LocationGranularityOption;
  center: { lat: number; lng: number };
  publicCenter: { lat: number; lng: number } | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  scheduleStatus: EventScheduleStatus;
  cancellationReason: string | null;
  isRecurringTradition: boolean;
  recurrencePattern: EventRecurrencePattern;
  recurrenceNote: string;
  occurrences: CulturalEventOccurrence[];
  organizerDisplay: string;
  organizerContactAuthorized: boolean;
  organizerPublicContact: string | null;
  organizerWebsiteUrl: string | null;
  sourceAttribution: string;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  verifiedByDisplay: string | null;
  visitorAccess: VisitorAccessOption;
  visitorAccessNote: string;
  registrationRequirement: RegistrationRequirementOption;
  etiquetteNotes: string;
  photographyRule: PhotographyRuleOption;
  entryFeeInfo: string | null;
  accessibilityInfo: string | null;
  coverImageUrl: string | null;
  approvedMediaUrls: string[];
  relatedPractitioners: string[];
  visitorInterests: string[];
  status: EventWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CulturalEventAdmin extends CulturalEventItem {
  isPrivateOrRestrictedCeremony: boolean;
  organizerPrivateContact: string;
  exactLatPrivate: number | null;
  exactLngPrivate: number | null;
  reviewNotes: string;
  submittedByPublicName: string | null;
  submittedByPublicContact: string | null;
  eventPublicationGate: {
    allowed: boolean;
    reasons: string[];
  };
}

export interface CalendarQueryFilter {
  stateId?: string;
  districtId?: string;
  placeId?: string;
  category?: string;
  scheduleStatus?: string;
  visitorInterest?: string;
  dateFrom?: string;
  dateTo?: string;
  includePast?: boolean;
  includeCancelled?: boolean;
  onlyRecurring?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface CalendarQueryPayload {
  events: CulturalEventItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    totalPublished: number;
    confirmedCount: number;
    provisionalCount: number;
    seasonalEstimateCount: number;
    cancelledCount: number;
    pastCount: number;
    recurringTraditionsCount: number;
    visitorInterests: string[];
  };
}

export type CommunityEnquiryType =
  | "WORKSHOP_ENQUIRY"
  | "PRACTITIONER_NOMINATION"
  | "MAKERS_ENQUIRY"
  | "PLACE_CONTRIBUTION"
  | "GENERAL_CONTACT";

export interface CommunityEnquiryItem {
  id: string;
  enquiryType: CommunityEnquiryType;
  culturalRecordId: string | null;
  locationId: string | null;
  eventId: string | null;
  senderName: string;
  senderContact: string;
  message: string;
  status: "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED";
  createdAt: string;
}

export interface ConsentStatementsPartB {
  voluntaryParticipation: boolean;
  rightToWithdraw: boolean;
  interviewAndRecording: boolean;
  nothingPublicWithoutApproval: boolean;
  sacredPrivateExcluded: boolean;
  noExternalAiOrVoiceCloning: boolean;
  fairCompensationIndependentOfConsent: boolean;
}

export interface CulturalRightsPassport {
  id: string;
  culturalRecordId: string;
  version: number;
  consentTakingPart: boolean;
  consentBeingRecorded: boolean;
  consentPublicUse: boolean;
  consentMode: ConsentMode;
  witnessNamePrivate?: string | null;
  consentSignedAt?: string | null;
  statements: ConsentStatementsPartB;
  identityDisplay: IdentityDisplayOption;
  locationGranularity: LocationGranularityOption;
  audioVideoAccess: AudioVideoAccessOption;
  translationScope: TranslationScopeOption;
  allowedTranslationLanguages: string[];
  aiUse: AiUseOption;
  downloadReuse: DownloadReuseOption;
  commercialUse: CommercialUseOption;
  contactMode: ContactModeOption;
  withdrawalStatus: WithdrawalStatusOption;
  practitionerConfirmedAt?: string | null;
  preReleaseReconfirmedAt?: string | null;
  updatedAt: string;
}

export interface ProvenanceLogEntry {
  id: string;
  culturalRecordId: string;
  stepType: ProvenanceStep;
  performedByUserId: string | null;
  performedByRole: string;
  performedByDisplay: string;
  practitionerApproved: boolean;
  practitionerApprovedAt: string | null;
  versionLabel: string;
  notes: string;
  createdAt: string;
}

export interface HeritageVocabularyItem {
  id: string;
  culturalRecordId: string;
  termRoman: string;
  termDevanagari: string;
  languageCode: string;
  meaningEn: string;
  meaningMr?: string;
  misunderstoodNote?: string;
}

export interface StoryCompanionItem {
  question: string;
  answer: string;
}

export interface CulturalRecordAdmin {
  id: string;
  slug: string;
  traditionId?: string | null;
  traditionSlug?: string | null;
  recordOrigin: RecordOrigin;
  status: RecordStatus;
  unescoDomain: UnescoDomain;
  category: CultureCategory;
  isWomenLed: boolean;
  isSacredOrRestricted: boolean;
  practitionerFullNamePrivate: string;
  practitionerChosenName: string;
  practitionerCommunityName: string;
  practitionerVillagePrivate?: string;
  practitionerTaluka?: string;
  practitionerPhonePrivate?: string;
  practitionerAddressPrivate?: string;
  stateId: string;
  districtId: string | null;
  talukaId?: string | null;
  cityTownId: string | null;
  exactLatPrivate?: number | null;
  exactLngPrivate?: number | null;
  titleEn: string;
  titleMr: string;
  subtitleEn: string;
  summaryEn: string;
  summaryMr: string;
  practiceContextEn: string;
  practiceContextMr: string;
  tags: string[];
  heroImageUrl: string;
  sourceAttribution?: string | null;
  sourceUrl?: string | null;
  originalVoiceLanguage: string;
  originalVoiceAudioUrl?: string | null;
  originalVoiceTranscriptMr?: string | null;
  mediationM1SubtitlesEn?: string | null;
  mediationM2SyntheticContextText?: string | null;
  mediationM3HumanStoryCompanionText?: string | null;
  mediationM3NarratorCredit?: string | null;
  storyCompanionPrompts: StoryCompanionItem[];
  vocabulary: HeritageVocabularyItem[];
  rightsPassport: CulturalRightsPassport;
  provenanceLogs: ProvenanceLogEntry[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCulturalRecord {
  id: string;
  slug: string;
  traditionId?: string | null;
  traditionSlug?: string | null;
  recordOrigin: RecordOrigin;
  originBadgeLabel: string;
  verificationStateLabel: string;
  sourceAttribution: string | null;
  sourceUrl: string | null;
  unescoDomain: UnescoDomain;
  category: CultureCategory;
  isWomenLed: boolean;
  titleEn: string;
  titleMr: string;
  subtitleEn: string;
  summaryEn: string;
  summaryMr: string;
  practiceContextEn: string;
  practiceContextMr: string;
  tags: string[];
  heroImageUrl: string;
  verifiedMedia?: MediaAssetItem[];
  sources?: SourceCitation[];
  creditedPractitionerLabel: string;
  communityLabel: string;
  displayLocationLabel: string;
  locationGranularity: LocationGranularityOption;
  stateName: string;
  districtName: string | null;
  talukaName?: string | null;
  cityTownName: string | null;
  publicCenter: { lat: number; lng: number } | null;
  originalVoiceLanguage: string;
  canPlayAudioVideo: boolean;
  originalVoiceAudioUrl: string | null;
  originalVoiceTranscriptMr: string | null;
  translationPermitted: boolean;
  mediationM1SubtitlesEn: string | null;
  mediationM2SyntheticContextText: string | null;
  mediationM3HumanStoryCompanionText: string | null;
  mediationM3NarratorCredit: string | null;
  storyCompanionPrompts: StoryCompanionItem[];
  vocabulary: HeritageVocabularyItem[];
  publicRightsCard: {
    version: number;
    recordOrigin: RecordOrigin;
    identityDisplay: IdentityDisplayOption;
    locationGranularity: LocationGranularityOption;
    audioVideoAccess: AudioVideoAccessOption;
    translationScope: TranslationScopeOption;
    aiUse: AiUseOption;
    downloadReuse: DownloadReuseOption;
    commercialUse: CommercialUseOption;
    contactMode: ContactModeOption;
    withdrawalStatus: WithdrawalStatusOption;
    practitionerApproved: boolean;
    preReleaseReconfirmed: boolean;
  };
  provenanceChain: Array<{
    stepType: ProvenanceStep;
    performedByRole: string;
    practitionerApproved: boolean;
    versionLabel: string;
    notes: string;
    createdAt: string;
  }>;
  publishedAt: string | null;
}

export interface MapRecordSummary {
  id: string;
  slug: string;
  traditionSlug?: string | null;
  name: string;
  nameMr?: string;
  category: CultureCategory;
  description: string;
  recordOrigin: RecordOrigin;
  originBadgeLabel: string;
  verificationStateLabel: string;
  sourceAttribution: string | null;
  sourceUrl: string | null;
  heroImageUrl?: string | null;
  mediaAttribution?: string | null;
  creditedPractitionerLabel: string;
  displayLocationLabel: string;
  locationGranularity: LocationGranularityOption;
  stateName: string;
  districtName: string | null;
  talukaName?: string | null;
  cityTownName: string | null;
  publicCenter: { lat: number; lng: number } | null;
}

export interface PlaceChildSummary extends GeoLocation {
  recordCount: number;
  practitionerApprovedCount: number;
  referenceCount: number;
  upcomingEventsCount: number;
  traditionCount?: number;
  coverageStatus:
    | "PRACTITIONER_APPROVED"
    | "REFERENCE_DOCUMENTED"
    | "COLLECTION_IN_PROGRESS";
}

export interface PlaceDetailPayload {
  place: GeoLocation;
  breadcrumbs: GeoLocation[];
  parentPlace: GeoLocation | null;
  childPlaces: PlaceChildSummary[];
  records: PublicCulturalRecord[];
  traditions?: TraditionSummary[];
  events: CulturalEventItem[];
  coverageSummary: {
    totalPublishedRecords: number;
    practitionerApprovedCount: number;
    referenceCount: number;
    upcomingEventsCount: number;
    traditionsCount?: number;
    childPlacesTotal: number;
    childPlacesWithRecords: number;
    statusLabel: string;
  };
  datasetMetadata: GeographyDatasetMetadata;
}

export interface MapDiscoveryPayload {
  states: Array<{
    id: string;
    name: string;
    nameMr?: string;
    abbr: string;
    center: { lat: number; lng: number };
    districts: Array<{
      id: string;
      name: string;
      nameMr?: string;
      center: { lat: number; lng: number };
      cities: string[];
      subdistricts?: Array<{
        id: string;
        name: string;
        nameMr?: string;
        center: { lat: number; lng: number };
        recordCount: number;
      }>;
      localities?: Array<{
        id: string;
        name: string;
        nameMr?: string;
        level: GeoLocation["level"];
        center: { lat: number; lng: number };
        recordCount: number;
      }>;
      records: MapRecordSummary[];
      traditions?: TraditionSummary[];
      recordCount: number;
      fieldVerifiedCount: number;
      demoCount: number;
    }>;
    cities: string[];
    traditions?: TraditionSummary[];
    recordCount: number;
    fieldVerifiedCount: number;
    demoCount: number;
  }>;
  cities: Record<
    string,
    {
      id: string;
      name: string;
      nameMr?: string;
      level?: GeoLocation["level"];
      state: string;
      district: string | null;
      taluka?: string | null;
      center: { lat: number; lng: number };
      records: MapRecordSummary[];
      traditions?: TraditionSummary[];
      fieldVerifiedCount: number;
      demoCount: number;
    }
  >;
  traditions?: TraditionSummary[];
  events: CulturalEventItem[];
  datasetMetadata: GeographyDatasetMetadata;
  stats: {
    totalPublished: number;
    fieldVerifiedPublished: number;
    demoReferencePublished: number;
    statesRepresented: number;
    districtsRepresented: number;
    categoriesCount: number;
    totalLocations: number;
    statesAndUtsCount: number;
    talukasCount: number;
    citiesAndVillagesCount: number;
    placesWithRecordsCount: number;
    placesCollectionInProgressCount: number;
    upcomingEventsPublished: number;
    traditionsPublished?: number;
    traditionsPublishedCount?: number;
    multiRegionTraditionsCount?: number;
    verifiedSourcesCount?: number;
    verifiedMediaCount?: number;
    verifiedMediaAssetsCount?: number;
  };
}

export type TripDateCertainty =
  | "CONFIRMED_DATE"
  | "PROVISIONAL_DATE"
  | "SEASONAL_ESTIMATE_WINDOW"
  | "FLEXIBLE_PRACTICE_VISIT";

export interface TripItineraryItem {
  id: string;
  itemType: "CULTURAL_EVENT" | "PRACTICE_EXPERIENCE";
  eventId: string | null;
  culturalRecordId: string | null;
  culturalRecordSlug: string | null;
  culturalRecordTitle: string | null;
  traditionSlug?: string | null;
  titleEn: string;
  titleMr: string;
  category: CultureCategory;
  summaryEn: string;
  placeId: string;
  placeName: string;
  venueLabel: string;
  locationGranularity: LocationGranularityOption;
  publicCenter: { lat: number; lng: number } | null;
  dateCertainty: TripDateCertainty;
  dateCertaintyLabel: string;
  scheduleWindowLabel: string;
  visitorAccess: VisitorAccessOption;
  visitorAccessLabel: string;
  registrationRequirement: RegistrationRequirementOption;
  etiquetteNotes: string;
  photographyRule: PhotographyRuleOption;
  sourceAttribution: string;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  verificationStateLabel: string;
  visitorNotes?: string;
}

export interface TripPlanDay {
  dayNumber: number;
  isoDate: string;
  items: TripItineraryItem[];
}

export interface TripPlannerRequest {
  title?: string;
  startDate: string;
  durationDays?: number;
  endDate?: string;
  stateId?: string;
  districtId?: string | null;
  placeId?: string | null;
  categories?: string[];
  visitorInterests?: string[];
  confirmedOnly?: boolean;
}

export interface TripPlan {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  stateId: string;
  districtId: string | null;
  placeId: string | null;
  regionLabel: string;
  selectedCategories: string[];
  selectedInterests: string[];
  confirmedOnly: boolean;
  days: TripPlanDay[];
  availableCandidates: TripItineraryItem[];
  excludedSafeguardSummary: Array<{
    titleEn: string;
    reason: string;
  }>;
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}


// =============================================================================
// PRACTITIONERS & TEACHERS MODULE (Section 6)
// =============================================================================

export interface PractitionerWorkshopItem {
  id: string;
  title: string;
  mode: "IN_PERSON" | "ONLINE" | "HYBRID";
  durationLabel: string;
  feeInr: number;
  nextSessionLabel: string;
  skillLevel: string;
  summary: string;
}

export interface PractitionerProfile {
  id: string;
  slug: string;
  displayName: string;
  roleTitle: string;
  shortBio: string;
  fullNarrative: string;
  stateName: string;
  districtName: string | null;
  cityName: string | null;
  placeId: string | null;
  languages: string[];
  specialisations: string[];
  traditionIds: string[];
  traditionSlugs: string[];
  traditionTitles: string[];
  yearsOfPractice: number;
  lineageNote: string;
  availabilityStatus:
    | "OPEN_FOR_WORKSHOPS"
    | "AVAILABLE_FOR_APPRENTICESHIP"
    | "BY_ENQUIRY_ONLY"
    | "SEASONAL_BREAK";
  profileImageUrl: string;
  profileImageCredit: string;
  workshops: PractitionerWorkshopItem[];
  verificationBadge: string;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  demoDisclaimer: string;
  ownerUserId?: string | null;
}

// =============================================================================
// ART-MART CRAFT MARKETPLACE MODULE (Section 5)
// =============================================================================

export interface ArtMartSeller {
  id: string;
  slug: string;
  storefrontName: string;
  craftClusterLabel: string;
  stateName: string;
  districtName: string | null;
  cityName: string | null;
  linkedPractitionerId: string | null;
  storySummary: string;
  verificationNote: string;
  ratingAverage: number;
  completedDemoOrders: number;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  ownerUserId?: string | null;
}

export interface ArtMartProduct {
  id: string;
  slug: string;
  title: string;
  category: string;
  traditionId: string | null;
  traditionSlug: string | null;
  traditionTitle: string | null;
  sellerId: string;
  sellerSlug: string;
  sellerName: string;
  regionLabel: string;
  stateName: string;
  districtName: string | null;
  priceInr: number;
  stockQuantity: number;
  materialsUsed: string;
  makingProcess: string;
  provenanceNote: string;
  description: string;
  imageUrl: string;
  galleryUrls: string[];
  imageCredit: string;
  industryCollaborationId: string | null;
  approvalStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  demoDisclaimer: string;
}

export interface ArtMartOrderItem {
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  unitPriceInr: number;
  lineTotalInr: number;
}

export interface ArtMartOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  shippingCity: string;
  shippingState: string;
  shippingAddressLabel: string;
  paymentMethodLabel: string;
  status:
    | "CONFIRMED"
    | "DISPATCHED_DEMO"
    | "COMPLETED_DEMO"
    | "CANCELLED_DEMO";
  totalInr: number;
  items: ArtMartOrderItem[];
  simulationDisclaimer: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// INDUSTRY-TO-ART MATERIAL CIRCULARITY & COLLABORATION MODULE (Section 8)
// =============================================================================

export interface IndustryMaterialListing {
  id: string;
  title: string;
  industryOrgLabel: string;
  materialCategory: string;
  quantityAvailableLabel: string;
  conditionLabel: string;
  locationCity: string;
  locationState: string;
  pricingTerms:
    | "DONATION_FREE"
    | "NOMINAL_RECOVERY_COST"
    | "SPONSORED_CSR_GRANT";
  priceNote: string;
  safetyRestrictions: string;
  suggestedTraditions: string[];
  adminReviewStatus: "PENDING_ADMIN_REVIEW" | "APPROVED" | "ARCHIVED";
  availabilityStatus: "AVAILABLE" | "PARTIALLY_ALLOCATED" | "FULLY_ALLOCATED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  demoDisclaimer: string;
  createdAt: string;
}

export interface IndustryMaterialRequest {
  id: string;
  materialId: string;
  materialTitle: string;
  artisanName: string;
  artisanEmail: string;
  traditionTitle: string;
  requestedQuantityLabel: string;
  intendedCraftUse: string;
  collaborationStatus:
    | "SUBMITTED_BY_ARTISAN"
    | "REVIEWED_BY_ADMIN_OR_INDUSTRY"
    | "ALLOCATED_TO_ARTISAN"
    | "IN_CRAFT_PRODUCTION"
    | "CRAFT_PRODUCT_LISTED_ON_ART_MART"
    | "DECLINED";
  adminReviewerNote: string;
  linkedArtMartProductId: string | null;
  linkedArtMartProductSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// GOVERNMENT, NGO & INSTITUTIONAL ECOSYSTEM RESOURCES (Section 8)
// =============================================================================

export interface EcosystemResourceItem {
  id: string;
  title: string;
  resourceCategory: string;
  organisationType:
    | "GOVERNMENT_MINISTRY"
    | "STATUTORY_BOARD"
    | "CULTURAL_ACADEMY"
    | "ACADEMIC_INSTITUTION"
    | "NGO_FOUNDATION"
    | "CSR_INDUSTRY_PARTNER";
  relationshipStatus:
    | "OFFICIAL_PUBLIC_SOURCE"
    | "ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR"
    | "DEMO_SIMULATED_PARTNER";
  stateScope: string;
  summary: string;
  eligibilityDetails: string;
  officialUrl: string;
  lastReviewedDate: string;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  demoDisclaimer: string;
}

// =============================================================================
// HERCRAFT — WOMEN-LED CULTURAL ENTERPRISES, COLLECTIVES & OPPORTUNITIES
// =============================================================================

export interface HerCraftWorkshopItem {
  id: string;
  title: string;
  mode: "IN_PERSON" | "ONLINE" | "HYBRID";
  durationLabel: string;
  feeInr: number;
  scheduleLabel: string;
  skillLevel: string;
  summary: string;
}

export interface HerCraftEnterprise {
  id: string;
  slug: string;
  enterpriseName: string;
  leaderOrCollectiveLabel: string;
  enterpriseType:
    | "WOMEN_SHG"
    | "ARTISAN_COOPERATIVE"
    | "MASTER_ARTISAN_STUDIO"
    | "CULINARY_COLLECTIVE"
    | "TEXTILE_WEAVERS_GUILD";
  craftCategory: string;
  traditionId: string | null;
  traditionSlug: string | null;
  traditionTitle: string | null;
  stateName: string;
  districtName: string | null;
  cityName: string | null;
  placeId: string | null;
  womenArtisansCount: number;
  foundedYear: number;
  shortSummary: string;
  storyNarrative: string;
  signatureCrafts: string[];
  productsAndTechniques: string[];
  trainingAndWorkshops: HerCraftWorkshopItem[];
  supportNeeds: string[];
  linkedArtMartProductIds: string[];
  linkedPractitionerId: string | null;
  heroImageUrl: string;
  imageCredit: string;
  sourceAttribution: string;
  sourceUrl: string;
  contactOrEnquiryNote: string;
  approvalStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  demoDisclaimer: string;
  ownerUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HerCraftOpportunity {
  id: string;
  title: string;
  opportunityType:
    | "GOVERNMENT_SCHEME"
    | "TRAINING_FELLOWSHIP"
    | "MICRO_GRANT_OR_CREDIT"
    | "EXHIBITION_AND_MARKET"
    | "INCUBATION_PROGRAM";
  organiserName: string;
  organiserType: string;
  relationshipStatus:
    | "OFFICIAL_PUBLIC_SOURCE"
    | "ILLUSTRATIVE_DEMO_PROGRAM";
  stateScope: string;
  eligibilitySummary: string;
  benefitSummary: string;
  applicationOrOfficialUrl: string;
  deadlineOrCycleLabel: string;
  approvalStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  recordOrigin: "DEMO_SAMPLE" | "FIELD_VERIFIED";
  demoDisclaimer: string;
  createdAt: string;
}

export interface HerCraftDirectoryPayload {
  enterprises: HerCraftEnterprise[];
  opportunities: HerCraftOpportunity[];
  featuredProducts: ArtMartProduct[];
  facets: {
    totalPublishedEnterprises: number;
    pendingReviewEnterprises: number;
    totalWomenArtisansRepresented: number;
    statesRepresented: string[];
    craftCategories: string[];
    enterpriseTypes: string[];
  };
}
