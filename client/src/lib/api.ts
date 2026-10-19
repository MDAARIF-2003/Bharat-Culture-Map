import type {
  AccountPersonaType,
  ArtMartOrder,
  ArtMartProduct,
  ArtMartSeller,
  CalendarQueryFilter,
  CalendarQueryPayload,
  CommunityEnquiryItem,
  CommunityEnquiryType,
  CulturalEventAdmin,
  CulturalEventItem,
  CulturalRecordAdmin,
  EcosystemResourceItem,
  HerCraftDirectoryPayload,
  HerCraftEnterprise,
  HerCraftOpportunity,
  GeoLocation,
  GeographyDatasetMetadata,
  IndustryMaterialListing,
  IndustryMaterialRequest,
  MapDiscoveryPayload,
  MediaAssetItem,
  PlaceDetailPayload,
  PractitionerProfile,
  PublicCulturalRecord,
  SourceCitation,
  TraditionAdmin,
  TraditionDetail,
  TraditionDirectoryPayload,
  TraditionPlaceAssociation,
  TraditionQueryFilter,
  TripPlan,
  TripPlannerRequest,
  UserAccount,
} from "@shared/contracts";
import type {
  EventScheduleStatus,
  EventWorkflowStatus,
  MediaAssetType,
} from "@shared/const";

export interface AdminRecordWithGate extends CulturalRecordAdmin {
  publicationGate: {
    allowed: boolean;
    reasons: string[];
  };
}

export interface DemoAccountInfo {
  email: string;
  fullName: string;
  role: UserAccount["role"];
  accountType: AccountPersonaType;
  linkedPractitionerId?: string | null;
  linkedSellerId?: string | null;
  linkedHerCraftId?: string | null;
  description: string;
}

async function requestJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const resp = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(
      data.error || `Request failed (${resp.status})`
    ) as Error & {
      status?: number;
      reasons?: string[];
      code?: string;
    };
    err.status = resp.status;
    err.reasons = data.reasons;
    err.code = data.code;
    throw err;
  }
  return data as T;
}

export const apiClient = {
  // Auth & Demo Personas
  getAuthStatus() {
    return requestJson<{
      needsBootstrap: boolean;
      user: UserAccount | null;
      driver: string;
      demoModeEnabled?: boolean;
    }>("/api/v1/auth/status");
  },
  getMe() {
    return requestJson<{ user: UserAccount }>("/api/v1/auth/me");
  },
  updateProfile(input: {
    fullName?: string;
    bio?: string;
    phone?: string;
    locationLabel?: string;
    organisationOrGuild?: string;
    preferredLanguage?: string;
    accountType?: AccountPersonaType;
    currentPassword?: string;
    newPassword?: string;
  }) {
    return requestJson<{ user: UserAccount }>("/api/v1/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  getDemoAccounts() {
    return requestJson<{
      demoAccounts: DemoAccountInfo[];
      demoModeEnabled?: boolean;
    }>("/api/v1/auth/demo-accounts");
  },
  demoLogin(email: string) {
    return requestJson<{ user: UserAccount; token: string }>(
      "/api/v1/auth/demo-login",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  },
  registerAccount(input: {
    email: string;
    password: string;
    fullName: string;
    accountType?: AccountPersonaType;
    bio?: string;
    phone?: string;
    locationLabel?: string;
    organisationOrGuild?: string;
    preferredLanguage?: string;
  }) {
    return requestJson<{ user: UserAccount; token: string }>(
      "/api/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  bootstrapSuperAdmin(input: {
    email: string;
    password: string;
    fullName: string;
  }) {
    return requestJson<{ user: UserAccount; token: string }>(
      "/api/v1/auth/bootstrap",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  login(input: { email: string; password: string }) {
    return requestJson<{ user: UserAccount; token: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  logout() {
    return requestJson<{ success: boolean }>("/api/v1/auth/logout", {
      method: "POST",
    });
  },

  // Public Discovery, Places, Traditions, Cultural Calendar & Enquiries
  getLocations() {
    return requestJson<{ locations: GeoLocation[] }>(
      "/api/v1/public/locations"
    );
  },
  getGeographyMetadata() {
    return requestJson<{ metadata: GeographyDatasetMetadata }>(
      "/api/v1/public/geography-metadata"
    );
  },
  getPlaceDetail(idOrSlug: string) {
    return requestJson<PlaceDetailPayload>(
      `/api/v1/public/places/${encodeURIComponent(idOrSlug)}`
    );
  },
  getMapDiscovery(includeDemo = true) {
    return requestJson<MapDiscoveryPayload>(
      `/api/v1/public/map?includeDemo=${includeDemo ? "true" : "false"}`
    );
  },
  queryPublicTraditions(params?: TraditionQueryFilter) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.traditionCategory && params.traditionCategory !== "All")
      search.set("traditionCategory", params.traditionCategory);
    if (params?.legacyCategory && params.legacyCategory !== "All")
      search.set("legacyCategory", params.legacyCategory);
    if (params?.stateId && params.stateId !== "All")
      search.set("stateId", params.stateId);
    if (params?.districtId && params.districtId !== "All")
      search.set("districtId", params.districtId);
    if (params?.placeId && params.placeId !== "All")
      search.set("placeId", params.placeId);
    if (params?.language && params.language !== "All")
      search.set("language", params.language);
    if (params?.evidenceStatus && params.evidenceStatus !== "ALL")
      search.set("evidenceStatus", params.evidenceStatus);
    if (params?.hasVerifiedMedia) search.set("hasVerifiedMedia", "true");
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    const qs = search.toString();
    return requestJson<TraditionDirectoryPayload>(
      `/api/v1/public/traditions${qs ? `?${qs}` : ""}`
    );
  },
  getPublicTraditionBySlug(slug: string) {
    return requestJson<{ tradition: TraditionDetail }>(
      `/api/v1/public/traditions/${encodeURIComponent(slug)}`
    );
  },
  listPublicSources(params?: {
    traditionId?: string;
    culturalRecordId?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.traditionId) search.set("traditionId", params.traditionId);
    if (params?.culturalRecordId)
      search.set("culturalRecordId", params.culturalRecordId);
    const qs = search.toString();
    return requestJson<{ sources: SourceCitation[] }>(
      `/api/v1/public/sources${qs ? `?${qs}` : ""}`
    );
  },
  listPublicMediaAssets(params?: {
    traditionId?: string;
    culturalRecordId?: string;
    mediaType?: MediaAssetType;
  }) {
    const search = new URLSearchParams();
    if (params?.traditionId) search.set("traditionId", params.traditionId);
    if (params?.culturalRecordId)
      search.set("culturalRecordId", params.culturalRecordId);
    if (params?.mediaType) search.set("mediaType", params.mediaType);
    const qs = search.toString();
    return requestJson<{ mediaAssets: MediaAssetItem[] }>(
      `/api/v1/public/media-assets${qs ? `?${qs}` : ""}`
    );
  },
  listPublicRecords(params?: {
    origin?: "FIELD_VERIFIED" | "DEMO_REFERENCE";
    category?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.origin) search.set("origin", params.origin);
    if (params?.category) search.set("category", params.category);
    const qs = search.toString();
    return requestJson<{ records: PublicCulturalRecord[] }>(
      `/api/v1/public/records${qs ? `?${qs}` : ""}`
    );
  },
  getPublicRecordBySlug(slug: string) {
    return requestJson<{ record: PublicCulturalRecord }>(
      `/api/v1/public/records/${encodeURIComponent(slug)}`
    );
  },
  queryPublicCalendar(params?: CalendarQueryFilter) {
    const search = new URLSearchParams();
    if (params?.stateId) search.set("stateId", params.stateId);
    if (params?.districtId) search.set("districtId", params.districtId);
    if (params?.placeId) search.set("placeId", params.placeId);
    if (params?.category) search.set("category", params.category);
    if (params?.scheduleStatus)
      search.set("scheduleStatus", params.scheduleStatus);
    if (params?.visitorInterest)
      search.set("visitorInterest", params.visitorInterest);
    if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
    if (params?.dateTo) search.set("dateTo", params.dateTo);
    if (params?.includePast !== undefined)
      search.set("includePast", String(params.includePast));
    if (params?.includeCancelled !== undefined)
      search.set("includeCancelled", String(params.includeCancelled));
    if (params?.onlyRecurring !== undefined)
      search.set("onlyRecurring", String(params.onlyRecurring));
    if (params?.q) search.set("q", params.q);
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    const qs = search.toString();
    return requestJson<CalendarQueryPayload>(
      `/api/v1/public/calendar${qs ? `?${qs}` : ""}`
    );
  },
  getPublicEventById(id: string) {
    return requestJson<{
      event: CulturalEventItem;
      linkedRecord: PublicCulturalRecord | null;
    }>(`/api/v1/public/calendar/${encodeURIComponent(id)}`);
  },
  submitPublicCalendarEvent(input: Record<string, unknown>) {
    return requestJson<{
      eventId: string;
      status: EventWorkflowStatus;
      message: string;
    }>("/api/v1/public/calendar/submit", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  generateTripPlan(input: TripPlannerRequest) {
    return requestJson<{ plan: TripPlan }>(
      "/api/v1/public/trip-planner/generate",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  saveTripPlan(input: Partial<TripPlan> & { startDate: string }) {
    return requestJson<{ plan: TripPlan }>("/api/v1/public/trip-plans", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateTripPlan(id: string, patch: Partial<TripPlan>) {
    return requestJson<{ plan: TripPlan }>(
      `/api/v1/public/trip-plans/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(patch),
      }
    );
  },
  getTripPlanById(id: string) {
    return requestJson<{ plan: TripPlan }>(
      `/api/v1/public/trip-plans/${encodeURIComponent(id)}`
    );
  },
  listPublicEvents(params?: {
    stateId?: string;
    districtId?: string;
    category?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.stateId) search.set("stateId", params.stateId);
    if (params?.districtId) search.set("districtId", params.districtId);
    if (params?.category) search.set("category", params.category);
    const qs = search.toString();
    return requestJson<{ events: CulturalEventItem[] }>(
      `/api/v1/public/events${qs ? `?${qs}` : ""}`
    );
  },
  submitCommunityEnquiry(input: {
    enquiryType: CommunityEnquiryType;
    culturalRecordId?: string | null;
    locationId?: string | null;
    eventId?: string | null;
    senderName: string;
    senderContact: string;
    message: string;
  }) {
    return requestJson<{ enquiry: CommunityEnquiryItem }>(
      "/api/v1/public/enquiries",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },

  // Practitioners & Teachers
  listPractitioners(params?: {
    q?: string;
    stateName?: string;
    traditionSlug?: string;
    availabilityStatus?: string;
    includeUnpublished?: boolean;
  }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.stateName && params.stateName !== "All")
      search.set("stateName", params.stateName);
    if (params?.traditionSlug && params.traditionSlug !== "All")
      search.set("traditionSlug", params.traditionSlug);
    if (params?.availabilityStatus && params.availabilityStatus !== "All")
      search.set("availabilityStatus", params.availabilityStatus);
    if (params?.includeUnpublished) search.set("includeUnpublished", "true");
    const qs = search.toString();
    return requestJson<{ practitioners: PractitionerProfile[] }>(
      `/api/v1/public/practitioners${qs ? `?${qs}` : ""}`
    );
  },
  getPractitionerBySlug(slug: string) {
    return requestJson<{
      practitioner: PractitionerProfile;
      relatedProducts: ArtMartProduct[];
    }>(`/api/v1/public/practitioners/${encodeURIComponent(slug)}`);
  },
  createPractitioner(input: Partial<PractitionerProfile>) {
    return requestJson<{ practitioner: PractitionerProfile }>(
      "/api/v1/practitioners",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updatePractitioner(idOrSlug: string, patch: Partial<PractitionerProfile>) {
    return requestJson<{ practitioner: PractitionerProfile }>(
      `/api/v1/practitioners/${encodeURIComponent(idOrSlug)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },

  // Art-Mart Marketplace
  listArtMartProducts(params?: {
    q?: string;
    category?: string;
    stateName?: string;
    traditionSlug?: string;
    sellerId?: string;
    sortBy?: string;
    includeUnpublished?: boolean;
  }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.category && params.category !== "All")
      search.set("category", params.category);
    if (params?.stateName && params.stateName !== "All")
      search.set("stateName", params.stateName);
    if (params?.traditionSlug && params.traditionSlug !== "All")
      search.set("traditionSlug", params.traditionSlug);
    if (params?.sellerId && params.sellerId !== "All")
      search.set("sellerId", params.sellerId);
    if (params?.sortBy) search.set("sortBy", params.sortBy);
    if (params?.includeUnpublished) search.set("includeUnpublished", "true");
    const qs = search.toString();
    return requestJson<{
      products: ArtMartProduct[];
      sellers: ArtMartSeller[];
    }>(`/api/v1/public/art-mart/products${qs ? `?${qs}` : ""}`);
  },
  getArtMartProductBySlug(slug: string) {
    return requestJson<{
      product: ArtMartProduct;
      seller: ArtMartSeller | null;
      relatedProducts: ArtMartProduct[];
    }>(`/api/v1/public/art-mart/products/${encodeURIComponent(slug)}`);
  },
  getArtMartSellerBySlug(slug: string) {
    return requestJson<{
      seller: ArtMartSeller;
      products: ArtMartProduct[];
    }>(`/api/v1/public/art-mart/sellers/${encodeURIComponent(slug)}`);
  },
  createArtMartProduct(input: Partial<ArtMartProduct>) {
    return requestJson<{ product: ArtMartProduct }>("/api/v1/art-mart/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateArtMartProduct(idOrSlug: string, patch: Partial<ArtMartProduct>) {
    return requestJson<{ product: ArtMartProduct }>(
      `/api/v1/art-mart/products/${encodeURIComponent(idOrSlug)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  listArtMartOrders(buyerEmail?: string) {
    const qs = buyerEmail
      ? `?buyerEmail=${encodeURIComponent(buyerEmail)}`
      : "";
    return requestJson<{ orders: ArtMartOrder[] }>(
      `/api/v1/art-mart/orders${qs}`
    );
  },
  createArtMartOrder(input: {
    buyerName: string;
    buyerEmail: string;
    shippingCity: string;
    shippingState: string;
    shippingAddressLabel: string;
    paymentMethodLabel?: string;
    items: Array<{ productId: string; quantity: number }>;
  }) {
    return requestJson<{ order: ArtMartOrder }>("/api/v1/art-mart/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateArtMartOrderStatus(id: string, status: ArtMartOrder["status"]) {
    return requestJson<{ order: ArtMartOrder }>(
      `/api/v1/art-mart/orders/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  },

  // Industry-to-Art & Government/Ecosystem Resources
  listIndustryMaterials(params?: {
    q?: string;
    materialCategory?: string;
    includePending?: boolean;
  }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.materialCategory && params.materialCategory !== "All")
      search.set("materialCategory", params.materialCategory);
    if (params?.includePending !== undefined)
      search.set("includePending", String(params.includePending));
    const qs = search.toString();
    return requestJson<{ materials: IndustryMaterialListing[] }>(
      `/api/v1/public/industry-materials${qs ? `?${qs}` : ""}`
    );
  },
  createIndustryMaterial(input: Partial<IndustryMaterialListing>) {
    return requestJson<{ material: IndustryMaterialListing }>(
      "/api/v1/industry-materials",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateIndustryMaterialStatus(
    id: string,
    adminReviewStatus: IndustryMaterialListing["adminReviewStatus"],
    availabilityStatus?: IndustryMaterialListing["availabilityStatus"]
  ) {
    return requestJson<{ material: IndustryMaterialListing }>(
      `/api/v1/industry-materials/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ adminReviewStatus, availabilityStatus }),
      }
    );
  },
  listIndustryRequests(materialId?: string) {
    const qs = materialId
      ? `?materialId=${encodeURIComponent(materialId)}`
      : "";
    return requestJson<{ requests: IndustryMaterialRequest[] }>(
      `/api/v1/public/industry-requests${qs}`
    );
  },
  createIndustryRequest(input: {
    materialId: string;
    artisanName: string;
    artisanEmail?: string;
    traditionTitle?: string;
    requestedQuantityLabel?: string;
    intendedCraftUse: string;
  }) {
    return requestJson<{ request: IndustryMaterialRequest }>(
      "/api/v1/industry-requests",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateIndustryRequestStatus(
    id: string,
    collaborationStatus: IndustryMaterialRequest["collaborationStatus"],
    adminReviewerNote?: string,
    linkedArtMartProductId?: string | null
  ) {
    return requestJson<{ request: IndustryMaterialRequest }>(
      `/api/v1/industry-requests/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          collaborationStatus,
          adminReviewerNote,
          linkedArtMartProductId,
        }),
      }
    );
  },
  listEcosystemResources(params?: {
    q?: string;
    organisationType?: string;
    relationshipStatus?: string;
    stateScope?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.organisationType && params.organisationType !== "All")
      search.set("organisationType", params.organisationType);
    if (params?.relationshipStatus && params.relationshipStatus !== "All")
      search.set("relationshipStatus", params.relationshipStatus);
    if (params?.stateScope && params.stateScope !== "All")
      search.set("stateScope", params.stateScope);
    const qs = search.toString();
    return requestJson<{ resources: EcosystemResourceItem[] }>(
      `/api/v1/public/ecosystem-resources${qs ? `?${qs}` : ""}`
    );
  },
  createEcosystemResource(input: Partial<EcosystemResourceItem>) {
    return requestJson<{ resource: EcosystemResourceItem }>(
      "/api/v1/ecosystem-resources",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateEcosystemResource(id: string, patch: Partial<EcosystemResourceItem>) {
    return requestJson<{ resource: EcosystemResourceItem }>(
      `/api/v1/ecosystem-resources/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },

  // Admin
  listUsers() {
    return requestJson<{ users: UserAccount[] }>("/api/v1/admin/users");
  },
  createUser(input: {
    email: string;
    password: string;
    fullName: string;
    role: UserAccount["role"];
    accountType?: AccountPersonaType;
  }) {
    return requestJson<{ user: UserAccount }>("/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  adminUpdateUser(
    id: string,
    patch: {
      role?: UserAccount["role"];
      accountType?: AccountPersonaType;
      linkedPractitionerId?: string | null;
      linkedSellerId?: string | null;
      linkedHerCraftId?: string | null;
      isActive?: boolean;
      fullName?: string;
    }
  ) {
    return requestJson<{ user: UserAccount }>(
      `/api/v1/admin/users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },

  // HerCraft — Women-Led Cultural Enterprises & Opportunities
  queryHerCraftDirectory(params?: {
    q?: string;
    craftCategory?: string;
    enterpriseType?: string;
    stateName?: string;
    districtName?: string;
    traditionSlug?: string;
    opportunityType?: string;
    includePending?: boolean;
  }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.craftCategory && params.craftCategory !== "All")
      search.set("craftCategory", params.craftCategory);
    if (params?.enterpriseType && params.enterpriseType !== "All")
      search.set("enterpriseType", params.enterpriseType);
    if (params?.stateName && params.stateName !== "All")
      search.set("stateName", params.stateName);
    if (params?.districtName && params.districtName !== "All")
      search.set("districtName", params.districtName);
    if (params?.traditionSlug && params.traditionSlug !== "All")
      search.set("traditionSlug", params.traditionSlug);
    if (params?.opportunityType && params.opportunityType !== "All")
      search.set("opportunityType", params.opportunityType);
    if (params?.includePending) search.set("includePending", "true");
    const qs = search.toString();
    return requestJson<HerCraftDirectoryPayload>(
      `/api/v1/public/hercraft${qs ? `?${qs}` : ""}`
    );
  },
  getHerCraftEnterpriseBySlug(slug: string) {
    return requestJson<{
      enterprise: HerCraftEnterprise;
      relatedProducts: ArtMartProduct[];
      linkedPractitioner: PractitionerProfile | null;
      opportunities: HerCraftOpportunity[];
    }>(`/api/v1/public/hercraft/${encodeURIComponent(slug)}`);
  },
  createHerCraftEnterprise(input: Partial<HerCraftEnterprise>) {
    return requestJson<{ enterprise: HerCraftEnterprise }>(
      "/api/v1/hercraft/enterprises",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateHerCraftEnterprise(
    idOrSlug: string,
    patch: Partial<HerCraftEnterprise>
  ) {
    return requestJson<{ enterprise: HerCraftEnterprise }>(
      `/api/v1/hercraft/enterprises/${encodeURIComponent(idOrSlug)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  createHerCraftOpportunity(input: Partial<HerCraftOpportunity>) {
    return requestJson<{ opportunity: HerCraftOpportunity }>(
      "/api/v1/hercraft/opportunities",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateHerCraftOpportunity(id: string, patch: Partial<HerCraftOpportunity>) {
    return requestJson<{ opportunity: HerCraftOpportunity }>(
      `/api/v1/hercraft/opportunities/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  listAdminRecords() {
    return requestJson<{ records: AdminRecordWithGate[] }>(
      "/api/v1/admin/records"
    );
  },
  createRecord(input: Record<string, unknown>) {
    return requestJson<{ record: AdminRecordWithGate }>(
      "/api/v1/admin/records",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateRecord(id: string, patch: Record<string, unknown>) {
    return requestJson<{ record: AdminRecordWithGate }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  updateRightsPassport(id: string, input: Record<string, unknown>) {
    return requestJson<{ record: AdminRecordWithGate }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}/rights-passport`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    );
  },
  submitReview(
    id: string,
    input: {
      stepType: "TRANSCRIBED" | "TRANSLATED" | "NARRATED";
      notes: string;
      versionLabel?: string;
      practitionerApproved?: boolean;
    }
  ) {
    return requestJson<{ record: AdminRecordWithGate }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}/review`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  recordPractitionerApproval(
    id: string,
    input: { notes: string; versionLabel?: string }
  ) {
    return requestJson<{ record: AdminRecordWithGate }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}/practitioner-approval`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  publishRecord(id: string, notes?: string) {
    return requestJson<{ record: AdminRecordWithGate }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}/publish`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    );
  },
  restrictOrWithdrawRecord(
    id: string,
    action: "RESTRICTED" | "WITHDRAWN",
    reason: string
  ) {
    return requestJson<{ record: AdminRecordWithGate }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}/restrict`,
      {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      }
    );
  },
  createLocation(input: {
    level: GeoLocation["level"];
    nameEn: string;
    nameMr?: string;
    abbr?: string;
    parentId: string | null;
    centerLat: number;
    centerLng: number;
  }) {
    return requestJson<{ location: GeoLocation }>("/api/v1/admin/locations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  listAdminEvents() {
    return requestJson<{ events: CulturalEventAdmin[] }>("/api/v1/admin/events");
  },
  createEvent(input: Record<string, unknown>) {
    return requestJson<{ event: CulturalEventAdmin }>("/api/v1/admin/events", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateEvent(id: string, patch: Record<string, unknown>) {
    return requestJson<{ event: CulturalEventAdmin }>(
      `/api/v1/admin/events/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  publishEvent(id: string) {
    return requestJson<{ event: CulturalEventAdmin }>(
      `/api/v1/admin/events/${encodeURIComponent(id)}/publish`,
      {
        method: "POST",
      }
    );
  },
  updateEventStatus(
    id: string,
    status: EventWorkflowStatus,
    scheduleStatus?: EventScheduleStatus,
    cancellationReason?: string | null
  ) {
    return requestJson<{ event: CulturalEventAdmin }>(
      `/api/v1/admin/events/${encodeURIComponent(id)}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status, scheduleStatus, cancellationReason }),
      }
    );
  },
  listAdminEnquiries() {
    return requestJson<{ enquiries: CommunityEnquiryItem[] }>(
      "/api/v1/admin/enquiries"
    );
  },
  updateEnquiryStatus(
    id: string,
    status: "PENDING_REVIEW" | "REVIEWED" | "ARCHIVED"
  ) {
    return requestJson<{ enquiry: CommunityEnquiryItem }>(
      `/api/v1/admin/enquiries/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  },

  // Admin: Traditions, Multi-Region Links, Sources & Media Assets
  listAdminTraditions() {
    return requestJson<{ traditions: TraditionAdmin[] }>(
      "/api/v1/admin/traditions"
    );
  },
  createTradition(input: Record<string, unknown>) {
    return requestJson<{ tradition: TraditionAdmin }>(
      "/api/v1/admin/traditions",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateTradition(id: string, patch: Record<string, unknown>) {
    return requestJson<{ tradition: TraditionAdmin }>(
      `/api/v1/admin/traditions/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  addTraditionPlaceAssociation(
    traditionId: string,
    input: {
      locationId: string;
      stateId: string;
      districtId?: string | null;
      relationshipRole?: TraditionPlaceAssociation["relationshipRole"];
      regionalVariantName?: string;
      notes?: string;
      isPrimary?: boolean;
    }
  ) {
    return requestJson<{ association: TraditionPlaceAssociation }>(
      `/api/v1/admin/traditions/${encodeURIComponent(traditionId)}/places`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  removeTraditionPlaceAssociation(assocId: string) {
    return requestJson<{ success: boolean }>(
      `/api/v1/admin/tradition-places/${encodeURIComponent(assocId)}`,
      {
        method: "DELETE",
      }
    );
  },
  listAdminSources() {
    return requestJson<{ sources: SourceCitation[] }>("/api/v1/admin/sources");
  },
  createSourceCitation(input: Record<string, unknown>) {
    return requestJson<{ source: SourceCitation }>("/api/v1/admin/sources", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  listAdminMediaAssets() {
    return requestJson<{ mediaAssets: MediaAssetItem[] }>(
      "/api/v1/admin/media-assets"
    );
  },
  createMediaAsset(input: Record<string, unknown>) {
    return requestJson<{ mediaAsset: MediaAssetItem }>(
      "/api/v1/admin/media-assets",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },
  updateMediaAsset(id: string, patch: Record<string, unknown>) {
    return requestJson<{ mediaAsset: MediaAssetItem }>(
      `/api/v1/admin/media-assets/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      }
    );
  },
  // Media Image Upload
  async uploadImage(file: File): Promise<{ url: string; fileName: string; size: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const res = await requestJson<{ url: string; fileName: string; size: number }>(
            "/api/v1/admin/upload",
            {
              method: "POST",
              body: JSON.stringify({
                fileData,
                fileName: file.name,
                mimeType: file.type,
              }),
            }
          );
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  },
  // Deletion APIs
  deleteRecord(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/records/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteTradition(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/traditions/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteEvent(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/events/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deletePractitioner(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/practitioners/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteArtMartProduct(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/art-mart/products/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteHerCraftEnterprise(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/hercraft/enterprises/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteMediaAsset(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/media-assets/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteSourceCitation(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/sources/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
  deleteUser(id: string) {
    return requestJson<{ success: boolean; id: string }>(
      `/api/v1/admin/users/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },
};
