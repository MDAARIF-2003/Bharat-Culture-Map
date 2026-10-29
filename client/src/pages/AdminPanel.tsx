import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiClient, type AdminRecordWithGate } from "@/lib/api";
import {
  AI_USE_OPTIONS,
  AUDIO_VIDEO_ACCESS_OPTIONS,
  COMMERCIAL_USE_OPTIONS,
  CONTACT_MODE_OPTIONS,
  CULTURE_CATEGORIES,
  DOWNLOAD_REUSE_OPTIONS,
  EVENT_RECURRENCE_PATTERNS,
  EVENT_SCHEDULE_STATUSES,
  IDENTITY_DISPLAY_OPTIONS,
  LOCATION_GRANULARITY_OPTIONS,
  PHOTOGRAPHY_RULE_OPTIONS,
  REGISTRATION_REQUIREMENT_OPTIONS,
  TRANSLATION_SCOPE_OPTIONS,
  UNESCO_DOMAINS,
  USER_ROLES,
  VISITOR_ACCESS_OPTIONS,
  EVIDENCE_STATUSES,
  MEDIA_RIGHTS_STATUSES,
  MEDIA_TYPES,
  SOURCE_TYPES,
  TRADITION_DIRECTORY_CATEGORIES,
  WITHDRAWAL_STATUS_OPTIONS,
  type EvidenceStatus,
  type EventRecurrencePattern,
  type MediaAssetType,
  type MediaRightsStatus,
  type SourceType,
  type TraditionDirectoryCategory,
  type EventScheduleStatus,
  type EventWorkflowStatus,
  type LocationGranularityOption,
  type PhotographyRuleOption,
  type RegistrationRequirementOption,
  type UserRole,
  type VisitorAccessOption,
} from "@shared/const";
import type {
  ArtMartProduct,
  CulturalEventAdmin,
  GeoLocation,
  HerCraftEnterprise,
  MediaAssetItem,
  PractitionerProfile,
  SourceCitation,
  TraditionAdmin,
  UserAccount,
} from "@shared/contracts";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  Edit2,
  FileCheck2,
  Image as ImageIcon,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
  XCircle,
  GraduationCap,
  Search,
  Copy,
  ExternalLink,
} from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EditTraditionModal from "@/components/admin/EditTraditionModal";
import EditPractitionerModal from "@/components/admin/EditPractitionerModal";
import EditProductModal from "@/components/admin/EditProductModal";
import EditHerCraftModal from "@/components/admin/EditHerCraftModal";
import AavishkarDossierModal from "@/components/AavishkarDossierModal";
import { VERIFIED_CULTURAL_IMAGES, VERIFIED_CULTURAL_IMAGE_LIST } from "@/lib/images";

const PART_B_STATEMENT_LABELS: Array<[string, string]> = [
  [
    "voluntaryParticipation",
    "I understand the purpose of this study and that taking part is voluntary.",
  ],
  [
    "rightToWithdraw",
    "I understand I may stop, correct, restrict or remove my record at any time, without penalty.",
  ],
  [
    "interviewAndRecording",
    "I agree to be interviewed and recorded as marked in Part C. I may refuse any question.",
  ],
  [
    "nothingPublicWithoutApproval",
    "I understand nothing will be made public until I have seen it and approved it.",
  ],
  [
    "sacredPrivateExcluded",
    "I understand that content I mark sacred, private or restricted will not be shown or indexed.",
  ],
  [
    "noExternalAiOrVoiceCloning",
    "I understand that my recordings will not be used to train external AI systems, and that my voice will not be cloned.",
  ],
  [
    "fairCompensationIndependentOfConsent",
    "I have been told what I will and will not receive for my time, and that this does not depend on my consent.",
  ],
];

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [dbDriver, setDbDriver] = useState("");

  // Auth form state
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authError, setAuthError] = useState("");

  // Admin workspace state
  const [activeTab, setActiveTab] = useState<
    "records" | "traditions" | "create" | "calendar" | "practitioners" | "artmart" | "hercraft" | "media" | "users"
  >("records");
  const [traditionsList, setTraditionsList] = useState<TraditionAdmin[]>([]);
  const [practitionersList, setPractitionersList] = useState<PractitionerProfile[]>([]);
  const [artMartProductsList, setArtMartProductsList] = useState<ArtMartProduct[]>([]);
  const [herCraftList, setHerCraftList] = useState<HerCraftEnterprise[]>([]);
  const [mediaAssetsList, setMediaAssetsList] = useState<MediaAssetItem[]>([]);
  const [sourcesList, setSourcesList] = useState<SourceCitation[]>([]);

  // Deletion Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "record" | "tradition" | "event" | "practitioner" | "product" | "hercraft" | "media" | "source" | "user";
    id: string;
    name: string;
  }>({
    open: false,
    type: "record",
    id: "",
    name: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Dedicated In-Place Entity Edit Modals State
  const [editTraditionModalOpen, setEditTraditionModalOpen] = useState(false);
  const [editTraditionTarget, setEditTraditionTarget] = useState<TraditionAdmin | null>(null);

  const [editPractitionerModalOpen, setEditPractitionerModalOpen] = useState(false);
  const [editPractitionerTarget, setEditPractitionerTarget] = useState<PractitionerProfile | null>(null);

  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editProductTarget, setEditProductTarget] = useState<ArtMartProduct | null>(null);

  const [editHerCraftModalOpen, setEditHerCraftModalOpen] = useState(false);
  const [editHerCraftTarget, setEditHerCraftTarget] = useState<HerCraftEnterprise | null>(null);

  // Aavishkar Research Convention Dossier Modal
  const [showDossierModal, setShowDossierModal] = useState(false);

  // Global Quick Filter / Search in Admin
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [copiedImageKey, setCopiedImageKey] = useState<string | null>(null);

  // New Practitioner Form State
  const [newPractName, setNewPractName] = useState("");
  const [newPractRole, setNewPractRole] = useState("");
  const [newPractBio, setNewPractBio] = useState("");
  const [newPractState, setNewPractState] = useState("Maharashtra");
  const [newPractCity, setNewPractCity] = useState("Kolhapur");
  const [newPractImage, setNewPractImage] = useState("");
  const [newPractYears, setNewPractYears] = useState(15);
  const [newPractAvailability, setNewPractAvailability] = useState("OPEN_FOR_WORKSHOPS");

  // New ArtMart Product Form State
  const [newProdTitle, setNewProdTitle] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Craft");
  const [newProdPrice, setNewProdPrice] = useState(1400);
  const [newProdImage, setNewProdImage] = useState("");
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdState, setNewProdState] = useState("Maharashtra");
  const [newProdStock, setNewProdStock] = useState(12);

  // New HerCraft Collective Form State
  const [newHerCraftName, setNewHerCraftName] = useState("");
  const [newHerCraftLeader, setNewHerCraftLeader] = useState("");
  const [newHerCraftCategory, setNewHerCraftCategory] = useState("Textile");
  const [newHerCraftState, setNewHerCraftState] = useState("Maharashtra");
  const [newHerCraftDistrict, setNewHerCraftDistrict] = useState("Kolhapur District");
  const [newHerCraftCity, setNewHerCraftCity] = useState("Kolhapur");
  const [newHerCraftArtisans, setNewHerCraftArtisans] = useState(14);
  const [newHerCraftSummary, setNewHerCraftSummary] = useState("");
  const [newHerCraftImage, setNewHerCraftImage] = useState("");

  const [selectedTraditionId, setSelectedTraditionId] = useState<string | null>(
    null
  );
  const [newTradNameEn, setNewTradNameEn] = useState("");
  const [newTradNameNative, setNewTradNameNative] = useState("");
  const [newTradCategory, setNewTradCategory] =
    useState<TraditionDirectoryCategory>("Crafts, handloom and textiles");
  const [newTradSubcategory, setNewTradSubcategory] = useState("");
  const [newTradSummary, setNewTradSummary] = useState("");
  const [newTradEvidenceStatus, setNewTradEvidenceStatus] =
    useState<EvidenceStatus>("OFFICIAL_INSTITUTIONAL");
  const [assocLocationId, setAssocLocationId] = useState("loc-city-kolhapur");
  const [assocStateId, setAssocStateId] = useState("loc-state-maharashtra");
  const [assocVariantName, setAssocVariantName] = useState("");
  const [srcTitle, setSrcTitle] = useState("");
  const [srcOrg, setSrcOrg] = useState("");
  const [srcUrl, setSrcUrl] = useState("");
  const [srcType, setSrcType] = useState<SourceType>("OFFICIAL_INSTITUTIONAL");
  const [srcFacts, setSrcFacts] = useState("");
  const [medTitle, setMedTitle] = useState("");
  const [medType, setMedType] = useState<MediaAssetType>("IMAGE");
  const [medCreator, setMedCreator] = useState("");
  const [medOrg, setMedOrg] = useState("Wikimedia Commons");
  const [medSourcePageUrl, setMedSourcePageUrl] = useState("");
  const [medDirectUrl, setMedDirectUrl] = useState("");
  const [medEmbedUrl, setMedEmbedUrl] = useState("");
  const [medLicense, setMedLicense] = useState("CC BY-SA 4.0");
  const [medLicenseUrl, setMedLicenseUrl] = useState(
    "https://creativecommons.org/licenses/by-sa/4.0/"
  );
  const [medAttribution, setMedAttribution] = useState("");
  const [medRightsStatus, setMedRightsStatus] = useState<MediaRightsStatus>(
    "OPEN_LICENSE_VERIFIED"
  );
  const [eventsList, setEventsList] = useState<CulturalEventAdmin[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [evtTitleEn, setEvtTitleEn] = useState("");
  const [evtTitleMr, setEvtTitleMr] = useState("");
  const [evtCategory, setEvtCategory] = useState("Festival");
  const [evtDescriptionEn, setEvtDescriptionEn] = useState("");
  const [evtDescriptionMr, setEvtDescriptionMr] = useState("");
  const [evtCulturalRecordId, setEvtCulturalRecordId] = useState("");
  const [evtStateId, setEvtStateId] = useState("loc-state-maharashtra");
  const [evtDistrictId, setEvtDistrictId] = useState(
    "loc-district-kolhapur-district"
  );
  const [evtCityTownId, setEvtCityTownId] = useState("loc-city-kolhapur");
  const [evtVenueLabel, setEvtVenueLabel] = useState("");
  const [evtLocationGranularity, setEvtLocationGranularity] =
    useState<LocationGranularityOption>("CITY_TOWN");
  const [evtStartDate, setEvtStartDate] = useState("2026-11-20");
  const [evtEndDate, setEvtEndDate] = useState("2026-11-20");
  const [evtStartTime, setEvtStartTime] = useState("10:00");
  const [evtEndTime, setEvtEndTime] = useState("17:00");
  const [evtScheduleStatus, setEvtScheduleStatus] =
    useState<EventScheduleStatus>("PROVISIONAL");
  const [evtCancellationReason, setEvtCancellationReason] = useState("");
  const [evtIsRecurring, setEvtIsRecurring] = useState(false);
  const [evtRecurrencePattern, setEvtRecurrencePattern] =
    useState<EventRecurrencePattern>("SINGLE_OCCURRENCE");
  const [evtRecurrenceNote, setEvtRecurrenceNote] = useState("");
  const [evtOrganizerDisplay, setEvtOrganizerDisplay] = useState("");
  const [evtOrganizerAuthorized, setEvtOrganizerAuthorized] = useState(false);
  const [evtOrganizerPublicContact, setEvtOrganizerPublicContact] =
    useState("");
  const [evtOrganizerPrivateContact, setEvtOrganizerPrivateContact] =
    useState("");
  const [evtSourceAttribution, setEvtSourceAttribution] = useState("");
  const [evtSourceUrl, setEvtSourceUrl] = useState("");
  const [evtVisitorAccess, setEvtVisitorAccess] =
    useState<VisitorAccessOption>("ACCESS_NOT_ESTABLISHED");
  const [evtVisitorAccessNote, setEvtVisitorAccessNote] = useState("");
  const [evtRegistrationReq, setEvtRegistrationReq] =
    useState<RegistrationRequirementOption>("NOT_ESTABLISHED");
  const [evtEtiquetteNotes, setEvtEtiquetteNotes] = useState("");
  const [evtPhotographyRule, setEvtPhotographyRule] =
    useState<PhotographyRuleOption>("PERMISSION_REQUIRED_ON_SITE");
  const [evtEntryFeeInfo, setEvtEntryFeeInfo] = useState("");
  const [evtAccessibilityInfo, setEvtAccessibilityInfo] = useState("");
  const [evtIsPrivateOrRestricted, setEvtIsPrivateOrRestricted] =
    useState(false);
  const [originFilter, setOriginFilter] = useState<
    "ALL" | "FIELD_VERIFIED" | "DEMO_REFERENCE"
  >("FIELD_VERIFIED");
  const [records, setRecords] = useState<AdminRecordWithGate[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [locations, setLocations] = useState<GeoLocation[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
    reasons?: string[];
  } | null>(null);

  // Create Record Form State
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newTitleMr, setNewTitleMr] = useState("");
  const [newSubtitleEn, setNewSubtitleEn] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Craft");
  const [newUnescoDomain, setNewUnescoDomain] = useState<string>(
    "Traditional craftsmanship"
  );
  const [newChosenName, setNewChosenName] = useState("");
  const [newFullNamePrivate, setNewFullNamePrivate] = useState("");
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newTaluka, setNewTaluka] = useState("Karveer");
  const [newVillagePrivate, setNewVillagePrivate] = useState("");
  const [newStateId, setNewStateId] = useState("loc-state-maharashtra");
  const [newDistrictId, setNewDistrictId] = useState(
    "loc-district-kolhapur-district"
  );
  const [newCityTownId, setNewCityTownId] = useState("loc-city-kolhapur");
  const [newIsWomenLed, setNewIsWomenLed] = useState(false);
  const [newIsSacredOrRestricted, setNewIsSacredOrRestricted] = useState(false);
  const [newSummaryEn, setNewSummaryEn] = useState("");
  const [newPracticeContextEn, setNewPracticeContextEn] = useState("");
  const [newOriginalTranscriptMr, setNewOriginalTranscriptMr] = useState("");
  const [newM1Subtitles, setNewM1Subtitles] = useState("");
  const [newM2Synthetic, setNewM2Synthetic] = useState("");
  const [newM3StoryCompanion, setNewM3StoryCompanion] = useState("");
  const [newM3Narrator, setNewM3Narrator] = useState("");
  const [newSourceAttribution, setNewSourceAttribution] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newHeroImageUrl, setNewHeroImageUrl] = useState("");

  // Edit Selected Record Form State
  const [editOpen, setEditOpen] = useState(false);
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editTitleMr, setEditTitleMr] = useState("");
  const [editSubtitleEn, setEditSubtitleEn] = useState("");
  const [editChosenName, setEditChosenName] = useState("");
  const [editCommunityName, setEditCommunityName] = useState("");
  const [editTaluka, setEditTaluka] = useState("");
  const [editSummaryEn, setEditSummaryEn] = useState("");
  const [editPracticeContextEn, setEditPracticeContextEn] = useState("");
  const [editHeroImageUrl, setEditHeroImageUrl] = useState("");
  const [editAudioUrl, setEditAudioUrl] = useState("");
  const [editTranscriptMr, setEditTranscriptMr] = useState("");
  const [editM3Text, setEditM3Text] = useState("");
  const [editExactLat, setEditExactLat] = useState("");
  const [editExactLng, setEditExactLng] = useState("");
  const [editSourceAttribution, setEditSourceAttribution] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");

  // Review / Approval / Restrict notes
  const [reviewStepType, setReviewStepType] = useState<
    "TRANSCRIBED" | "TRANSLATED" | "NARRATED"
  >("TRANSLATED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [restrictReason, setRestrictReason] = useState("");

  // Create User Form State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("FIELD_RESEARCHER");

  const loadWorkspaceData = async (currentUser: UserAccount) => {
    try {
      const [recResp, locResp, evtResp, tradResp, practList, prodList, herCraftResp, mediaResp, srcResp] = await Promise.all([
        apiClient.listAdminRecords(),
        apiClient.getLocations(),
        apiClient.listAdminEvents(),
        apiClient.listAdminTraditions(),
        apiClient.listPractitioners().then((r) => r.practitioners).catch(() => []),
        apiClient.listArtMartProducts({ includeUnpublished: true }).then((r) => r.products).catch(() => []),
        apiClient.queryHerCraftDirectory({ includePending: true }).catch(() => ({ enterprises: [] })),
        apiClient.listAdminMediaAssets().catch(() => ({ mediaAssets: [] })),
        apiClient.listAdminSources().catch(() => ({ sources: [] })),
      ]);
      setRecords(recResp.records);
      setLocations(locResp.locations);
      setEventsList(evtResp.events);
      setTraditionsList(tradResp.traditions);
      setPractitionersList(practList);
      setArtMartProductsList(prodList);
      setHerCraftList(herCraftResp.enterprises);
      setMediaAssetsList(mediaResp.mediaAssets);
      setSourcesList(srcResp.sources);
      if (!selectedTraditionId && tradResp.traditions.length > 0) {
        setSelectedTraditionId(tradResp.traditions[0].id);
      }
      if (!selectedEventId && evtResp.events.length > 0) {
        setSelectedEventId(evtResp.events[0].id);
      }
      if (!selectedRecordId && recResp.records.length > 0) {
        const firstField = recResp.records.find(
          (r: AdminRecordWithGate) => r.recordOrigin === "FIELD_VERIFIED"
        );
        setSelectedRecordId((firstField || recResp.records[0]).id);
      }
      if (currentUser.role === "SUPER_ADMIN") {
        const uResp = await apiClient.listUsers();
        setUsersList(uResp.users);
      }
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to load admin records.",
      });
    }
  };

  useEffect(() => {
    apiClient
      .getAuthStatus()
      .then((status) => {
        setNeedsBootstrap(status.needsBootstrap);
        setUser(status.user);
        setDbDriver(status.driver);
        if (status.user) {
          void loadWorkspaceData(status.user);
        }
      })
      .catch((err) => {
        setAuthError(err.message || "Could not verify authentication status.");
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (needsBootstrap) {
        const resp = await apiClient.bootstrapSuperAdmin({
          email: authEmail,
          password: authPassword,
          fullName: authFullName || "Project Lead (Super Admin)",
        });
        setNeedsBootstrap(false);
        setUser(resp.user);
        await loadWorkspaceData(resp.user);
      } else {
        const resp = await apiClient.login({
          email: authEmail,
          password: authPassword,
        });
        setUser(resp.user);
        await loadWorkspaceData(resp.user);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    }
  };

  const handleDemoAdminLogin = async () => {
    setAuthError("");
    try {
      const resp = await apiClient.demoLogin("admin.demo@bharat-culturemap.local");
      setUser(resp.user);
      await loadWorkspaceData(resp.user);
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in as Demo Super Admin.");
    }
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  const selectedRecord =
    records.find((r) => r.id === selectedRecordId) || null;
  const selectedEvent =
    eventsList.find((ev) => ev.id === selectedEventId) || null;

  useEffect(() => {
    if (!selectedEvent) return;
    setEvtTitleEn(selectedEvent.titleEn || "");
    setEvtTitleMr(selectedEvent.titleMr || "");
    setEvtCategory(selectedEvent.category || "Festival");
    setEvtDescriptionEn(selectedEvent.descriptionEn || "");
    setEvtDescriptionMr(selectedEvent.descriptionMr || "");
    setEvtCulturalRecordId(selectedEvent.culturalRecordId || "");
    setEvtStateId(selectedEvent.stateId || "loc-state-maharashtra");
    setEvtDistrictId(
      selectedEvent.districtId || "loc-district-kolhapur-district"
    );
    setEvtCityTownId(selectedEvent.cityTownId || "loc-city-kolhapur");
    setEvtVenueLabel(selectedEvent.venueLabel || "");
    setEvtLocationGranularity(selectedEvent.locationGranularity || "CITY_TOWN");
    setEvtStartDate(selectedEvent.startDate || "2026-11-20");
    setEvtEndDate(selectedEvent.endDate || selectedEvent.startDate || "");
    setEvtStartTime(selectedEvent.startTime || "");
    setEvtEndTime(selectedEvent.endTime || "");
    setEvtScheduleStatus(selectedEvent.scheduleStatus || "PROVISIONAL");
    setEvtCancellationReason(selectedEvent.cancellationReason || "");
    setEvtIsRecurring(Boolean(selectedEvent.isRecurringTradition));
    setEvtRecurrencePattern(
      selectedEvent.recurrencePattern || "SINGLE_OCCURRENCE"
    );
    setEvtRecurrenceNote(selectedEvent.recurrenceNote || "");
    setEvtOrganizerDisplay(selectedEvent.organizerDisplay || "");
    setEvtOrganizerAuthorized(Boolean(selectedEvent.organizerContactAuthorized));
    setEvtOrganizerPublicContact(selectedEvent.organizerPublicContact || "");
    setEvtOrganizerPrivateContact(selectedEvent.organizerPrivateContact || "");
    setEvtSourceAttribution(selectedEvent.sourceAttribution || "");
    setEvtSourceUrl(selectedEvent.sourceUrl || "");
    setEvtVisitorAccess(
      selectedEvent.visitorAccess || "ACCESS_NOT_ESTABLISHED"
    );
    setEvtVisitorAccessNote(selectedEvent.visitorAccessNote || "");
    setEvtRegistrationReq(
      selectedEvent.registrationRequirement || "NOT_ESTABLISHED"
    );
    setEvtEtiquetteNotes(selectedEvent.etiquetteNotes || "");
    setEvtPhotographyRule(
      selectedEvent.photographyRule || "PERMISSION_REQUIRED_ON_SITE"
    );
    setEvtEntryFeeInfo(selectedEvent.entryFeeInfo || "");
    setEvtAccessibilityInfo(selectedEvent.accessibilityInfo || "");
    setEvtIsPrivateOrRestricted(
      Boolean(selectedEvent.isPrivateOrRestrictedCeremony)
    );
  }, [selectedEvent?.id]);

  const updateEventInList = (updated: CulturalEventAdmin) => {
    setEventsList((prev) => {
      const exists = prev.some((ev) => ev.id === updated.id);
      if (!exists) return [updated, ...prev];
      return prev.map((ev) => (ev.id === updated.id ? updated : ev));
    });
    setSelectedEventId(updated.id);
  };

  const handleSaveEventChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setBanner(null);
    try {
      const { event: updated } = await apiClient.updateEvent(selectedEvent.id, {
        titleEn: evtTitleEn,
        titleMr: evtTitleMr,
        category: evtCategory,
        descriptionEn: evtDescriptionEn,
        descriptionMr: evtDescriptionMr,
        culturalRecordId: evtCulturalRecordId || null,
        stateId: evtStateId,
        districtId: evtDistrictId || null,
        cityTownId: evtCityTownId || null,
        venueLabel: evtVenueLabel,
        locationGranularity: evtLocationGranularity,
        startDate: evtStartDate,
        endDate: evtEndDate || evtStartDate,
        startTime: evtStartTime || null,
        endTime: evtEndTime || null,
        scheduleStatus: evtScheduleStatus,
        cancellationReason: evtCancellationReason || null,
        isRecurringTradition: evtIsRecurring,
        recurrencePattern: evtRecurrencePattern,
        recurrenceNote: evtRecurrenceNote,
        organizerDisplay: evtOrganizerDisplay,
        organizerContactAuthorized: evtOrganizerAuthorized,
        organizerPublicContact: evtOrganizerPublicContact || null,
        organizerPrivateContact: evtOrganizerPrivateContact,
        sourceAttribution: evtSourceAttribution,
        sourceUrl: evtSourceUrl || null,
        visitorAccess: evtVisitorAccess,
        visitorAccessNote: evtVisitorAccessNote,
        registrationRequirement: evtRegistrationReq,
        etiquetteNotes: evtEtiquetteNotes,
        photographyRule: evtPhotographyRule,
        entryFeeInfo: evtEntryFeeInfo || null,
        accessibilityInfo: evtAccessibilityInfo || null,
        isPrivateOrRestrictedCeremony: evtIsPrivateOrRestricted,
      });
      updateEventInList(updated);
      setBanner({
        type: "success",
        message: `Saved updates to cultural event "${updated.titleEn}".`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to update cultural event.",
        reasons: err.reasons,
      });
    }
  };

  const handleCreateNewEvent = async () => {
    setBanner(null);
    try {
      const { event: created } = await apiClient.createEvent({
        titleEn: "New Cultural Event Draft",
        titleMr: "",
        category: "Festival",
        descriptionEn: "Draft cultural event entry awaiting verification.",
        stateId: "loc-state-maharashtra",
        districtId: "loc-district-kolhapur-district",
        cityTownId: "loc-city-kolhapur",
        venueLabel: "Kolhapur District Venue",
        startDate: "2026-12-15",
        endDate: "2026-12-15",
        scheduleStatus: "PROVISIONAL",
        visitorAccess: "ACCESS_NOT_ESTABLISHED",
        sourceAttribution: "District Cultural Office Reference",
        status: "DRAFT",
      });
      updateEventInList(created);
      setBanner({
        type: "success",
        message: "Created new draft cultural event. Edit its details below.",
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to create event.",
      });
    }
  };

  const handlePublishEvent = async () => {
    if (!selectedEvent) return;
    setBanner(null);
    try {
      const { event: published } = await apiClient.publishEvent(
        selectedEvent.id
      );
      updateEventInList(published);
      setBanner({
        type: "success",
        message: `Published event "${published.titleEn}" to the public Cultural Calendar.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Event publication blocked by safeguard gate.",
        reasons: err.reasons,
      });
    }
  };

  const handleEventWorkflowChange = async (
    status: EventWorkflowStatus,
    scheduleStatus?: EventScheduleStatus
  ) => {
    if (!selectedEvent) return;
    setBanner(null);
    try {
      const { event: updated } = await apiClient.updateEventStatus(
        selectedEvent.id,
        status,
        scheduleStatus,
        evtCancellationReason || null
      );
      updateEventInList(updated);
      setBanner({
        type: "success",
        message: `Updated event status to ${updated.status} (${updated.scheduleStatus}).`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to change event status.",
        reasons: err.reasons,
      });
    }
  };

  useEffect(() => {
    if (!selectedRecord) return;
    setEditTitleEn(selectedRecord.titleEn || "");
    setEditTitleMr(selectedRecord.titleMr || "");
    setEditSubtitleEn(selectedRecord.subtitleEn || "");
    setEditChosenName(selectedRecord.practitionerChosenName || "");
    setEditCommunityName(selectedRecord.practitionerCommunityName || "");
    setEditTaluka(selectedRecord.practitionerTaluka || "");
    setEditSummaryEn(selectedRecord.summaryEn || "");
    setEditPracticeContextEn(selectedRecord.practiceContextEn || "");
    setEditHeroImageUrl(selectedRecord.heroImageUrl || "");
    setEditAudioUrl(selectedRecord.originalVoiceAudioUrl || "");
    setEditTranscriptMr(selectedRecord.originalVoiceTranscriptMr || "");
    setEditM3Text(selectedRecord.mediationM3HumanStoryCompanionText || "");
    setEditSourceAttribution(selectedRecord.sourceAttribution || "");
    setEditSourceUrl(selectedRecord.sourceUrl || "");
    setEditExactLat(
      selectedRecord.exactLatPrivate !== null &&
        selectedRecord.exactLatPrivate !== undefined
        ? String(selectedRecord.exactLatPrivate)
        : ""
    );
    setEditExactLng(
      selectedRecord.exactLngPrivate !== null &&
        selectedRecord.exactLngPrivate !== undefined
        ? String(selectedRecord.exactLngPrivate)
        : ""
    );
  }, [selectedRecord?.id]);

  const handleSaveRecordEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setBanner(null);
    try {
      const { record } = await apiClient.updateRecord(selectedRecord.id, {
        titleEn: editTitleEn,
        titleMr: editTitleMr,
        subtitleEn: editSubtitleEn,
        practitionerChosenName: editChosenName,
        practitionerCommunityName: editCommunityName,
        practitionerTaluka: editTaluka,
        summaryEn: editSummaryEn,
        practiceContextEn: editPracticeContextEn,
        heroImageUrl: editHeroImageUrl,
        originalVoiceAudioUrl: editAudioUrl || null,
        originalVoiceTranscriptMr: editTranscriptMr || null,
        mediationM3HumanStoryCompanionText: editM3Text || null,
        exactLatPrivate: editExactLat.trim() ? Number(editExactLat) : null,
        exactLngPrivate: editExactLng.trim() ? Number(editExactLng) : null,
        sourceAttribution: editSourceAttribution.trim() || null,
        sourceUrl: editSourceUrl.trim() || null,
      });
      updateSelectedInList(record);
      setEditOpen(false);
      setBanner({
        type: "success",
        message: `Saved updates to '${record.titleEn}'.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to update record.",
      });
    }
  };

  const updateSelectedInList = (updated: AdminRecordWithGate) => {
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      if (!exists) return [updated, ...prev];
      return prev.map((r) => (r.id === updated.id ? updated : r));
    });
    setSelectedRecordId(updated.id);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    try {
      const { record } = await apiClient.createRecord({
        recordOrigin: "FIELD_VERIFIED",
        titleEn: newTitleEn,
        titleMr: newTitleMr,
        subtitleEn: newSubtitleEn,
        category: newCategory,
        unescoDomain: newUnescoDomain,
        practitionerChosenName: newChosenName,
        practitionerFullNamePrivate: newFullNamePrivate,
        practitionerCommunityName: newCommunityName,
        practitionerTaluka: newTaluka,
        practitionerVillagePrivate: newVillagePrivate,
        stateId: newStateId,
        districtId: newDistrictId,
        cityTownId: newCityTownId,
        isWomenLed: newIsWomenLed,
        isSacredOrRestricted: newIsSacredOrRestricted,
        summaryEn: newSummaryEn,
        practiceContextEn: newPracticeContextEn,
        originalVoiceTranscriptMr: newOriginalTranscriptMr || null,
        mediationM1SubtitlesEn: newM1Subtitles || null,
        mediationM2SyntheticContextText: newM2Synthetic || null,
        mediationM3HumanStoryCompanionText: newM3StoryCompanion || null,
        mediationM3NarratorCredit: newM3Narrator || null,
        sourceAttribution: newSourceAttribution.trim() || null,
        sourceUrl: newSourceUrl.trim() || null,
        heroImageUrl: newHeroImageUrl.trim() || "",
      });
      updateSelectedInList(record);
      setOriginFilter("FIELD_VERIFIED");
      setActiveTab("records");
      setBanner({
        type: "success",
        message: `Created draft record '${record.titleEn}' with conservative Rights Passport defaults. Complete consent, review, and practitioner approval before publishing.`,
      });
      setNewTitleEn("");
      setNewTitleMr("");
      setNewSubtitleEn("");
      setNewChosenName("");
      setNewFullNamePrivate("");
      setNewCommunityName("");
      setNewHeroImageUrl("");
      setNewSummaryEn("");
      setNewPracticeContextEn("");
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to create record.",
      });
    }
  };

  const triggerDelete = (
    type: "record" | "tradition" | "event" | "practitioner" | "product" | "hercraft" | "media" | "source" | "user",
    id: string,
    name: string
  ) => {
    setDeleteModal({ open: true, type, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteLoading(true);
    try {
      if (deleteModal.type === "record") {
        await apiClient.deleteRecord(deleteModal.id);
        setRecords((prev) => prev.filter((r) => r.id !== deleteModal.id));
        if (selectedRecordId === deleteModal.id) {
          setSelectedRecordId(null);
        }
        setBanner({
          type: "success",
          message: `Record "${deleteModal.name}" deleted successfully.`,
        });
      } else if (deleteModal.type === "tradition") {
        await apiClient.deleteTradition(deleteModal.id);
        setTraditionsList((prev) => prev.filter((t) => t.id !== deleteModal.id && t.slug !== deleteModal.id));
        if (selectedTraditionId === deleteModal.id) {
          setSelectedTraditionId(null);
        }
        setBanner({
          type: "success",
          message: `Tradition "${deleteModal.name}" deleted successfully.`,
        });
      } else if (deleteModal.type === "event") {
        await apiClient.deleteEvent(deleteModal.id);
        setEventsList((prev) => prev.filter((e) => e.id !== deleteModal.id));
        if (selectedEventId === deleteModal.id) {
          setSelectedEventId(null);
        }
        setBanner({
          type: "success",
          message: `Event "${deleteModal.name}" deleted successfully.`,
        });
      } else if (deleteModal.type === "practitioner") {
        await apiClient.deletePractitioner(deleteModal.id);
        setPractitionersList((prev) => prev.filter((p) => p.id !== deleteModal.id && p.slug !== deleteModal.id));
        setBanner({
          type: "success",
          message: `Practitioner "${deleteModal.name}" deleted successfully.`,
        });
      } else if (deleteModal.type === "product") {
        await apiClient.deleteArtMartProduct(deleteModal.id);
        setArtMartProductsList((prev) => prev.filter((p) => p.id !== deleteModal.id && p.slug !== deleteModal.id));
        setBanner({
          type: "success",
          message: `Product "${deleteModal.name}" deleted successfully.`,
        });
      } else if (deleteModal.type === "hercraft") {
        await apiClient.deleteHerCraftEnterprise(deleteModal.id);
        setHerCraftList((prev) => prev.filter((h) => h.id !== deleteModal.id && h.slug !== deleteModal.id));
        setBanner({
          type: "success",
          message: `HerCraft Collective "${deleteModal.name}" deleted successfully.`,
        });
      } else if (deleteModal.type === "media") {
        await apiClient.deleteMediaAsset(deleteModal.id);
        setMediaAssetsList((prev) => prev.filter((m) => m.id !== deleteModal.id));
        setBanner({
          type: "success",
          message: `Media asset deleted successfully.`,
        });
      } else if (deleteModal.type === "source") {
        await apiClient.deleteSourceCitation(deleteModal.id);
        setSourcesList((prev) => prev.filter((s) => s.id !== deleteModal.id));
        setBanner({
          type: "success",
          message: `Source citation deleted successfully.`,
        });
      } else if (deleteModal.type === "user") {
        await apiClient.deleteUser(deleteModal.id);
        setUsersList((prev) => prev.filter((u) => u.id !== deleteModal.id));
        setBanner({
          type: "success",
          message: `User account deleted successfully.`,
        });
      }
      setDeleteModal({ open: false, type: "record", id: "", name: "" });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to delete item.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTraditionSaved = (updated: TraditionAdmin) => {
    setTraditionsList((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setBanner({
      type: "success",
      message: `Living tradition "${updated.nameEn}" updated successfully.`,
    });
  };

  const handlePractitionerSaved = (updated: PractitionerProfile) => {
    setPractitionersList((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setBanner({
      type: "success",
      message: `Living heritage practitioner "${updated.displayName}" updated successfully.`,
    });
  };

  const handleProductSaved = (updated: ArtMartProduct) => {
    setArtMartProductsList((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setBanner({
      type: "success",
      message: `Art-Mart product "${updated.title}" updated successfully.`,
    });
  };

  const handleHerCraftSaved = (updated: HerCraftEnterprise) => {
    setHerCraftList((prev) =>
      prev.map((h) => (h.id === updated.id ? updated : h))
    );
    setBanner({
      type: "success",
      message: `HerCraft collective "${updated.enterpriseName}" updated successfully.`,
    });
  };

  const handleCreatePractitioner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPractName.trim()) return;
    try {
      const slug = newPractName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const res = await apiClient.createPractitioner({
        slug,
        displayName: newPractName.trim(),
        roleTitle: newPractRole.trim() || "Master Artisan & Knowledge Bearer",
        shortBio: newPractBio.trim() || "Master practitioner preserving traditional craftsmanship and passing on ancestral knowledge.",
        fullNarrative: newPractBio.trim(),
        stateName: newPractState,
        cityName: newPractCity,
        profileImageUrl: newPractImage.trim(),
        yearsOfPractice: Number(newPractYears) || 15,
        availabilityStatus: newPractAvailability as any,
        verificationBadge: "VERIFIED_MASTER_ARTISAN",
        publicationStatus: "PUBLISHED",
      });
      setPractitionersList((prev) => [res.practitioner, ...prev]);
      setBanner({ type: "success", message: `Created practitioner profile "${res.practitioner.displayName}".` });
      setNewPractName("");
      setNewPractRole("");
      setNewPractBio("");
      setNewPractImage("");
    } catch (err: any) {
      setBanner({ type: "error", message: err?.message || "Failed to create practitioner." });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim()) return;
    try {
      const slug = newProdTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const res = await apiClient.createArtMartProduct({
        slug,
        title: newProdTitle.trim(),
        category: newProdCategory as any,
        priceInr: Number(newProdPrice) || 1200,
        imageUrl: newProdImage.trim(),
        description: newProdDescription.trim() || "Handcrafted traditional item produced by accredited guild artisans.",
        stateName: newProdState,
        stockQuantity: Number(newProdStock) || 10,
        approvalStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
      });
      setArtMartProductsList((prev) => [res.product, ...prev]);
      setBanner({ type: "success", message: `Created marketplace product "${res.product.title}".` });
      setNewProdTitle("");
      setNewProdPrice(1400);
      setNewProdImage("");
      setNewProdDescription("");
    } catch (err: any) {
      setBanner({ type: "error", message: err?.message || "Failed to create product." });
    }
  };

  const handleCreateHerCraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHerCraftName.trim()) return;
    try {
      const slug = newHerCraftName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const res = await apiClient.createHerCraftEnterprise({
        slug,
        enterpriseName: newHerCraftName.trim(),
        leaderOrCollectiveLabel: newHerCraftLeader.trim() || "Women Artisans SHG",
        craftCategory: newHerCraftCategory,
        stateName: newHerCraftState,
        districtName: newHerCraftDistrict,
        cityName: newHerCraftCity,
        womenArtisansCount: Number(newHerCraftArtisans) || 12,
        shortSummary: newHerCraftSummary.trim() || "Women-led craft collective empowering regional artisans.",
        heroImageUrl: newHerCraftImage.trim(),
        approvalStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
      });
      setHerCraftList((prev) => [res.enterprise, ...prev]);
      setBanner({ type: "success", message: `Created HerCraft collective "${res.enterprise.enterpriseName}".` });
      setNewHerCraftName("");
      setNewHerCraftLeader("");
      setNewHerCraftSummary("");
      setNewHerCraftImage("");
    } catch (err: any) {
      setBanner({ type: "error", message: err?.message || "Failed to create HerCraft enterprise." });
    }
  };

  const handlePassportPatch = async (patch: Record<string, unknown>) => {
    if (!selectedRecord) return;
    setBanner(null);
    try {
      const { record } = await apiClient.updateRightsPassport(
        selectedRecord.id,
        patch
      );
      updateSelectedInList(record);
      setBanner({
        type: "success",
        message: `Updated Cultural Rights Passport (v${record.rightsPassport.version}).`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to update Rights Passport.",
      });
    }
  };

  const handleGrantCompleteInformedConsent = async () => {
    if (!selectedRecord) return;
    const now = new Date().toISOString();
    await handlePassportPatch({
      consentTakingPart: true,
      consentBeingRecorded: true,
      consentPublicUse: true,
      consentMode: "WRITTEN_SIGNED",
      consentSignedAt: now,
      practitionerConfirmedAt: now,
      statements: {
        voluntaryParticipation: true,
        rightToWithdraw: true,
        interviewAndRecording: true,
        nothingPublicWithoutApproval: true,
        sacredPrivateExcluded: true,
        noExternalAiOrVoiceCloning: true,
        fairCompensationIndependentOfConsent: true,
      },
    });
  };

  const handleSubmitReview = async () => {
    if (!selectedRecord) return;
    setBanner(null);
    try {
      const { record } = await apiClient.submitReview(selectedRecord.id, {
        stepType: reviewStepType,
        notes:
          reviewNotes ||
          `Completed ${reviewStepType.toLowerCase()} verification and cultural context check.`,
        practitionerApproved: true,
      });
      updateSelectedInList(record);
      setReviewNotes("");
      setBanner({
        type: "success",
        message: `Logged '${reviewStepType}' review step in Provenance Chain.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to log review step.",
      });
    }
  };

  const handlePractitionerApproval = async () => {
    if (!selectedRecord) return;
    setBanner(null);
    try {
      const { record } = await apiClient.recordPractitionerApproval(
        selectedRecord.id,
        {
          notes:
            approvalNotes ||
            "Practitioner reviewed and approved the complete record and Rights Passport for public release.",
        }
      );
      updateSelectedInList(record);
      setApprovalNotes("");
      setBanner({
        type: "success",
        message:
          "Recorded sustained Practitioner Approval and pre-release re-confirmation.",
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to record practitioner approval.",
      });
    }
  };

  const handlePublish = async () => {
    if (!selectedRecord) return;
    setBanner(null);
    try {
      const { record } = await apiClient.publishRecord(selectedRecord.id);
      updateSelectedInList(record);
      setBanner({
        type: "success",
        message: `Published '${record.titleEn}'! It is now dynamically visible on the public CultureMap and Cultural Profile section.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Publication blocked by Consent Gate.",
        reasons: err.reasons,
      });
    }
  };

  const handleRestrictOrWithdraw = async (
    action: "RESTRICTED" | "WITHDRAWN"
  ) => {
    if (!selectedRecord) return;
    setBanner(null);
    try {
      const { record } = await apiClient.restrictOrWithdrawRecord(
        selectedRecord.id,
        action,
        restrictReason ||
          `Record ${action.toLowerCase()} via Cultural Rights Passport control.`
      );
      updateSelectedInList(record);
      setRestrictReason("");
      setBanner({
        type: "success",
        message: `Record '${record.titleEn}' is now ${action} and has been immediately removed from all public APIs.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || `Failed to mark record ${action}.`,
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    try {
      const { user: created } = await apiClient.createUser({
        email: newUserEmail,
        password: newUserPassword,
        fullName: newUserName,
        role: newUserRole,
      });
      setUsersList((prev) => [...prev, created]);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setBanner({
        type: "success",
        message: `Created user '${created.email}' with role '${created.role}'.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to create user.",
      });
    }
  };

  const selectedTradition =
    traditionsList.find((t) => t.id === selectedTraditionId) || null;

  const refreshAdminTraditions = async (selectId?: string) => {
    const resp = await apiClient.listAdminTraditions();
    setTraditionsList(resp.traditions);
    if (selectId) setSelectedTraditionId(selectId);
  };

  const handleCreateTradition = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    try {
      const { tradition } = await apiClient.createTradition({
        nameEn: newTradNameEn,
        nameNative: newTradNameNative,
        traditionCategory: newTradCategory,
        subcategory: newTradSubcategory,
        summary: newTradSummary,
        evidenceStatus: newTradEvidenceStatus,
      });
      await refreshAdminTraditions(tradition.id);
      setNewTradNameEn("");
      setNewTradNameNative("");
      setNewTradSubcategory("");
      setNewTradSummary("");
      setBanner({
        type: "success",
        message: `Created tradition "${tradition.nameEn}" in directory.`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to create tradition.",
      });
    }
  };

  const handleAddTraditionPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradition) return;
    setBanner(null);
    try {
      await apiClient.addTraditionPlaceAssociation(selectedTradition.id, {
        locationId: assocLocationId,
        stateId: assocStateId,
        regionalVariantName: assocVariantName,
        relationshipRole: "PRIMARY_PRACTICE_REGION",
      });
      await refreshAdminTraditions(selectedTradition.id);
      setAssocVariantName("");
      setBanner({
        type: "success",
        message: `Linked geographic place to "${selectedTradition.nameEn}".`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to link geographic place.",
      });
    }
  };

  const handleAddSourceCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradition) return;
    setBanner(null);
    try {
      await apiClient.createSourceCitation({
        traditionId: selectedTradition.id,
        sourceTitle: srcTitle,
        sourceOrganisation: srcOrg,
        sourceUrl: srcUrl,
        sourceType: srcType,
        specificFactsSupported: srcFacts,
        evidenceStatus: selectedTradition.evidenceStatus,
        reviewStatus: "VERIFIED",
      });
      await refreshAdminTraditions(selectedTradition.id);
      setSrcTitle("");
      setSrcOrg("");
      setSrcUrl("");
      setSrcFacts("");
      setBanner({
        type: "success",
        message: `Added verified source citation to "${selectedTradition.nameEn}".`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to add source citation.",
      });
    }
  };

  const handleAddMediaAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradition) return;
    setBanner(null);
    try {
      await apiClient.createMediaAsset({
        traditionId: selectedTradition.id,
        mediaType: medType,
        title: medTitle,
        creatorOrPerformer: medCreator,
        sourceOrganisation: medOrg,
        sourcePageUrl: medSourcePageUrl,
        directMediaUrl: medDirectUrl || null,
        embedUrl: medEmbedUrl || null,
        licenseIdentifier: medLicense,
        licenseUrl: medLicenseUrl || null,
        attributionText: medAttribution,
        rightsStatus: medRightsStatus,
        publicationStatus: "PUBLISHED",
      });
      await refreshAdminTraditions(selectedTradition.id);
      setMedTitle("");
      setMedCreator("");
      setMedSourcePageUrl("");
      setMedDirectUrl("");
      setMedEmbedUrl("");
      setMedAttribution("");
      setBanner({
        type: "success",
        message: `Registered media asset for "${selectedTradition.nameEn}".`,
      });
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "Failed to register media asset.",
        reasons: err.reasons,
      });
    }
  };

  const visibleRecords = records.filter((r) => {
    const originMatch = originFilter === "ALL" ? true : r.recordOrigin === originFilter;
    if (!originMatch) return false;
    if (!adminSearchQuery.trim()) return true;
    const q = adminSearchQuery.toLowerCase();
    return (
      r.titleEn.toLowerCase().includes(q) ||
      (r.titleMr && r.titleMr.toLowerCase().includes(q)) ||
      (r.practitionerChosenName && r.practitionerChosenName.toLowerCase().includes(q)) ||
      (r.practitionerCommunityName && r.practitionerCommunityName.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q))
    );
  });

  const states = locations.filter((l) => l.level === "STATE");
  const districts = locations.filter(
    (l) => l.level === "DISTRICT" && l.parentId === newStateId
  );
  const cities = locations.filter(
    (l) => l.level === "CITY_TOWN" && l.parentId === newDistrictId
  );

  if (loadingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#10121c] text-[#f3eee5]">
        <div className="eyebrow text-[#efb167]">
          VERIFYING GOVERNANCE SESSION…
        </div>
      </div>
    );
  }

  // ===========================================================================
  // LOGIN OR ONE-TIME SUPER ADMIN BOOTSTRAP SCREEN
  // ===========================================================================
  if (!user) {
    return (
      <div className="grain min-h-screen bg-[#10121c] px-4 py-16 text-[#f3eee5]">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => setLocation("/")}
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-white/60 hover:text-[#efb167]"
          >
            <ArrowLeft size={14} /> Return to Public CultureMap
          </button>

          <div className="glass rounded-[2rem] border border-white/15 p-8">
            <div className="eyebrow text-[#efb167]">
              BHARAT CULTUREMAP · GOVERNANCE
            </div>
            <h1 className="display mt-3 text-4xl text-white">
              {needsBootstrap
                ? "Initialize Super Admin"
                : "Administrator Sign-In"}
            </h1>
            <p className="mt-3 text-xs leading-5 text-white/55">
              {needsBootstrap
                ? "No administrator accounts exist in the database yet. Create the initial SUPER_ADMIN account to begin managing consented cultural records."
                : "Sign in with your authorized role account (SUPER_ADMIN, FIELD_RESEARCHER, LANGUAGE_REVIEWER, FOLKLORE_REVIEWER, or PRACTITIONER_APPROVER)."}
            </p>

            {authError && (
              <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {needsBootstrap && (
                <div>
                  <label className="eyebrow block text-white/60">
                    Full Name / Role Title
                  </label>
                  <input
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="Project Lead (Super Admin)"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#ef9d45]"
                  />
                </div>
              )}
              <div>
                <label className="eyebrow block text-white/60">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@bharat-culturemap.org"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#ef9d45]"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#ef9d45]"
                />
              </div>
              <button
                type="submit"
                className="button-lift w-full rounded-full bg-[#ef9d45] py-3 text-xs font-extrabold uppercase tracking-[.14em] text-[#251922]"
              >
                {needsBootstrap
                  ? "Bootstrap Super Admin & Enter"
                  : "Sign In to Admin Panel"}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <span className="h-px w-full bg-white/10" />
                <span className="absolute bg-[#171b29] px-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Or Instant Demo Access
                </span>
              </div>

              <button
                type="button"
                onClick={handleDemoAdminLogin}
                className="w-full rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-[#efb167] hover:bg-[#ef9d45] hover:text-[#251922] transition"
              >
                ⚡ 1-Click Demo Super Admin Sign-In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // AUTHENTICATED ADMIN & GOVERNANCE PANEL
  // ===========================================================================
  return (
    <div className="min-h-screen bg-[#10121c] pb-20 text-[#f3eee5]">
      <header className="border-b border-white/10 bg-[#151927] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/75 hover:border-[#ef9d45] hover:text-[#efb167]"
            >
              <ArrowLeft size={14} /> Public Site
            </button>
            <div>
              <div className="eyebrow text-[#efb167]">
                BHARAT CULTUREMAP · GOVERNANCE & CONSENT PANEL
              </div>
              <div className="font-serif text-xl text-white">
                Practitioner-Governed Documentation System
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/15 px-3 py-1.5 text-[#8ed5bd]">
              {user.fullName} · {user.role}
            </span>
            <span className="eyebrow hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/45 sm:inline-block">
              DB: {dbDriver}
            </span>
            <button
              onClick={() => void loadWorkspaceData(user)}
              className="rounded-full border border-white/10 p-2 text-white/65 hover:text-white"
              title="Refresh records"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowDossierModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:border-amber-300 hover:text-white transition shadow-sm"
              title="Open Avishkar Research Convention 2024-26 Statutory Dossier & Defense"
            >
              <GraduationCap size={14} className="text-amber-400" />
              Avishkar Research Dossier (HLFA)
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-red-400 hover:text-red-300"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-4 pt-6 md:px-8">
        {/* Admin Quick Command & Universal Action Toolbar */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-[#171d2d] to-[#121624] p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="Quick search across records, artisans, crafts, or tags..."
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:border-[#ef9d45] focus:outline-none"
            />
            {adminSearchQuery && (
              <button
                onClick={() => setAdminSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/40 mr-1 hidden sm:inline">Direct Admin Actions:</span>
            <button
              onClick={() => {
                setActiveTab("traditions");
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white/80 hover:border-[#ef9d45] hover:text-[#efb167] transition flex items-center gap-1 font-medium"
            >
              <Plus size={12} className="text-[#ef9d45]" /> Tradition
            </button>
            <button
              onClick={() => {
                setActiveTab("practitioners");
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white/80 hover:border-[#ef9d45] hover:text-[#efb167] transition flex items-center gap-1 font-medium"
            >
              <Plus size={12} className="text-[#57c5a9]" /> Practitioner
            </button>
            <button
              onClick={() => {
                setActiveTab("artmart");
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white/80 hover:border-[#ef9d45] hover:text-[#efb167] transition flex items-center gap-1 font-medium"
            >
              <Plus size={12} className="text-[#efb167]" /> Craft Product
            </button>
            <button
              onClick={() => {
                setActiveTab("hercraft");
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white/80 hover:border-[#ef9d45] hover:text-[#efb167] transition flex items-center gap-1 font-medium"
            >
              <Plus size={12} className="text-rose-400" /> HerCraft
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className="rounded-lg border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-2.5 py-1.5 text-[#8ed5bd] hover:bg-[#57c5a9]/20 transition flex items-center gap-1 font-medium"
            >
              <ImageIcon size={12} /> Media Library (9 High-Res)
            </button>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("records")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "records"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <FileCheck2 size={13} className="mr-1.5 inline" />
              Cultural Records & Consent Gate ({records.length})
            </button>
            <button
              onClick={() => setActiveTab("traditions")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "traditions"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              Traditions, Sources & Media ({traditionsList.length})
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "calendar"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <Calendar size={13} className="mr-1.5 inline" />
              Calendar ({eventsList.length})
            </button>
            <button
              onClick={() => setActiveTab("practitioners")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "practitioners"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <Users size={13} className="mr-1.5 inline" />
              Practitioners ({practitionersList.length})
            </button>
            <button
              onClick={() => setActiveTab("artmart")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "artmart"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <ShoppingBag size={13} className="mr-1.5 inline" />
              Art-Mart ({artMartProductsList.length})
            </button>
            <button
              onClick={() => setActiveTab("hercraft")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "hercraft"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <Sparkles size={13} className="mr-1.5 inline" />
              HerCraft ({herCraftList.length})
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "media"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <ImageIcon size={13} className="mr-1.5 inline" />
              Media Assets ({mediaAssetsList.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                activeTab === "create"
                  ? "bg-[#ef9d45] text-[#251922]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <Plus size={13} className="mr-1.5 inline" />
              Add Record
            </button>
            {user.role === "SUPER_ADMIN" && (
              <button
                onClick={() => setActiveTab("users")}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${
                  activeTab === "users"
                    ? "bg-[#ef9d45] text-[#251922]"
                    : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                <UserPlus size={13} className="mr-1.5 inline" />
                Role Accounts ({usersList.length})
              </button>
            )}
          </div>
        </div>

        {/* Status / Gate Error Banner */}
        {banner && (
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              banner.type === "success"
                ? "border-[#57c5a9]/45 bg-[#163239] text-[#b8e4d2]"
                : "border-red-400/50 bg-[#3b2229] text-red-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {banner.type === "success" ? (
                  <CheckCircle2 size={17} className="text-[#57c5a9]" />
                ) : (
                  <ShieldAlert size={17} className="text-red-300" />
                )}
                <span>{banner.message}</span>
              </div>
              <button
                onClick={() => setBanner(null)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
            {banner.reasons && banner.reasons.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-6 text-xs text-red-200">
                {banner.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 1: RECORDS & CONSENT GATE WORKFLOW
            =================================================================== */}
        {activeTab === "records" && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            {/* Left Sidebar: Record List */}
            <aside className="rounded-3xl border border-white/10 bg-[#151927] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow text-[#efb167]">RECORD INVENTORY</span>
                <button
                  onClick={() => setActiveTab("create")}
                  className="eyebrow text-[#8ed5bd] hover:underline"
                >
                  + New Field Record
                </button>
              </div>
              <div className="mb-4 flex gap-1.5">
                {(
                  [
                    ["FIELD_VERIFIED", "Field-Verified"],
                    ["DEMO_REFERENCE", "Reference Entry"],
                    ["ALL", "All"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setOriginFilter(val)}
                    className={`flex-1 rounded-xl py-1.5 text-[10px] font-bold uppercase tracking-[.08em] ${
                      originFilter === val
                        ? "bg-[#ef9d45] text-[#251922]"
                        : "bg-white/5 text-white/55 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
                {visibleRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center">
                    <div className="eyebrow text-[#efb167]">
                      NO FIELD RECORDS YET
                    </div>
                    <p className="mt-2 text-xs text-white/50">
                      No field-verified records have been added yet. Click below
                      to create your first Kolhapur record.
                    </p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="mt-4 rounded-full bg-[#ef9d45] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#251922]"
                    >
                      + Add Field Record
                    </button>
                  </div>
                ) : (
                  visibleRecords.map((rec) => {
                    const isSelected = rec.id === selectedRecordId;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => setSelectedRecordId(rec.id)}
                        className={`w-full rounded-2xl border p-3.5 text-left transition ${
                          isSelected
                            ? "border-[#ef9d45] bg-[#ef9d45]/12"
                            : "border-white/8 bg-white/[.03] hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif text-lg text-white">
                            {rec.titleEn}
                          </span>
                          <span
                            className={`eyebrow rounded-full px-2 py-0.5 text-[9px] ${
                              rec.status === "PUBLISHED"
                                ? "bg-[#57c5a9]/20 text-[#8ed5bd]"
                                : rec.status === "RESTRICTED" ||
                                    rec.status === "WITHDRAWN"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-[#ef9d45]/20 text-[#efb167]"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          Practitioner: {rec.practitionerChosenName}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
                          <span>{rec.category}</span>
                          <span>
                            {rec.recordOrigin === "FIELD_VERIFIED"
                              ? "FIELD-VERIFIED"
                              : "REFERENCE"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Column: Selected Record Governance & Consent Gate */}
            <div className="space-y-6">
              {!selectedRecord ? (
                <div className="rounded-3xl border border-white/10 bg-[#151927] p-8 text-center">
                  <p className="text-sm text-white/60">
                    Select a record on the left or create a new Field Cultural
                    Record to manage its Rights Passport and Provenance Chain.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Publication Gate Status Card */}
                  <div
                    className={`rounded-3xl border p-6 ${
                      selectedRecord.publicationGate.allowed
                        ? "border-[#57c5a9]/40 bg-[#163239]"
                        : "border-[#ef9d45]/40 bg-[#2b1f27]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="eyebrow flex items-center gap-2 text-[#efb167]">
                          {selectedRecord.publicationGate.allowed ? (
                            <>
                              <ShieldCheck
                                size={15}
                                className="text-[#57c5a9]"
                              />
                              <span className="text-[#8ed5bd]">
                                CONSENT GATE PASSED · CLEARED FOR PUBLIC RELEASE
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle
                                size={15}
                                className="text-[#ef9d45]"
                              />
                              <span>
                                PUBLICATION GATE BLOCKED · CONSENT OR PROVENANCE
                                INCOMPLETE
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className="display mt-2 text-3xl text-white">
                          {selectedRecord.titleEn}{" "}
                          {selectedRecord.titleMr ? (
                            <span className="font-sans text-xl text-[#efb167]">
                              ({selectedRecord.titleMr})
                            </span>
                          ) : null}
                        </h2>
                        <p className="mt-1 text-xs text-white/60">
                          Status: <strong>{selectedRecord.status}</strong> ·
                          Origin: <strong>{selectedRecord.recordOrigin}</strong>{" "}
                          · Slug: <code>{selectedRecord.slug}</code>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditOpen((v) => !v)}
                          className="rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-white/85 hover:border-[#ef9d45] hover:text-[#efb167]"
                        >
                          {editOpen ? "Close Editor" : "Edit Record Details"}
                        </button>
                        <button
                          type="button"
                          onClick={handlePublish}
                          className="button-lift rounded-full bg-[#ef9d45] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[.12em] text-[#251922]"
                        >
                          Publish to Public Website
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDelete("record", selectedRecord.id, selectedRecord.titleEn)}
                          className="rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-red-300 hover:bg-red-500 hover:text-white transition"
                        >
                          <Trash2 size={13} className="mr-1 inline" />
                          Delete Record
                        </button>
                      </div>
                    </div>

                    {!selectedRecord.publicationGate.allowed && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="eyebrow text-[#efb167]">
                          REQUIRED STEPS BEFORE PUBLICATION IS PERMITTED:
                        </div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/80">
                          {selectedRecord.publicationGate.reasons.map(
                            (reason, idx) => (
                              <li key={idx}>{reason}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* 1B. Inline Cultural Record Content & Media Editor */}
                  {editOpen && (
                    <form
                      onSubmit={handleSaveRecordEdit}
                      className="space-y-4 rounded-3xl border border-[#ef9d45]/35 bg-[#151927] p-6"
                    >
                      <div className="eyebrow text-[#efb167]">
                        EDIT CULTURAL RECORD CONTENT, MEDIA & PRIVATE COORDINATES
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="eyebrow block text-white/60">
                            Title (English) *
                          </label>
                          <input
                            required
                            value={editTitleEn}
                            onChange={(e) => setEditTitleEn(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Title (Marathi)
                          </label>
                          <input
                            value={editTitleMr}
                            onChange={(e) => setEditTitleMr(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Subtitle
                          </label>
                          <input
                            value={editSubtitleEn}
                            onChange={(e) => setEditSubtitleEn(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Practitioner Chosen Name *
                          </label>
                          <input
                            required
                            value={editChosenName}
                            onChange={(e) => setEditChosenName(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Community Name
                          </label>
                          <input
                            value={editCommunityName}
                            onChange={(e) => setEditCommunityName(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Taluka
                          </label>
                          <input
                            value={editTaluka}
                            onChange={(e) => setEditTaluka(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="eyebrow block text-white/60">
                            Summary *
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={editSummaryEn}
                            onChange={(e) => setEditSummaryEn(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Cultural Context
                          </label>
                          <textarea
                            rows={2}
                            value={editPracticeContextEn}
                            onChange={(e) =>
                              setEditPracticeContextEn(e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <ImageUploadField
                            label="Cover Hero Photo"
                            value={editHeroImageUrl}
                            onChange={setEditHeroImageUrl}
                            placeholder="Enter image URL or select from curated sample images"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Exact Workshop Lat (Private)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editExactLat}
                            onChange={(e) => setEditExactLat(e.target.value)}
                            placeholder="e.g. 16.5772"
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Exact Workshop Lng (Private)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editExactLng}
                            onChange={(e) => setEditExactLng(e.target.value)}
                            placeholder="e.g. 74.3158"
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="eyebrow block text-white/60">
                            Original Voice Audio URL
                          </label>
                          <input
                            value={editAudioUrl}
                            onChange={(e) => setEditAudioUrl(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Original Marathi Transcript
                          </label>
                          <input
                            value={editTranscriptMr}
                            onChange={(e) => setEditTranscriptMr(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Mode 3 Story Companion Text
                          </label>
                          <input
                            value={editM3Text}
                            onChange={(e) => setEditM3Text(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="eyebrow block text-white/60">
                            Source Attribution (Reference / Field Source)
                          </label>
                          <input
                            value={editSourceAttribution}
                            onChange={(e) =>
                              setEditSourceAttribution(e.target.value)
                            }
                            placeholder="e.g., GI Registry of India / State Gazetteer / Field Interview"
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="eyebrow block text-white/60">
                            Source Reference URL
                          </label>
                          <input
                            value={editSourceUrl}
                            onChange={(e) => setEditSourceUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditOpen(false)}
                          className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-full bg-[#57c5a9] px-5 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-[#102124]"
                        >
                          Save Record Changes
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. Cultural Rights Passport Editor (Instrument 6.1) */}
                  <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <div className="eyebrow text-[#efb167]">
                          INSTRUMENT 6.1 · CULTURAL RIGHTS PASSPORT (v
                          {selectedRecord.rightsPassport.version})
                        </div>
                        <h3 className="font-serif text-2xl text-white">
                          Free, Prior, Sustained & Informed Consent
                        </h3>
                      </div>
                      {selectedRecord.recordOrigin === "FIELD_VERIFIED" && (
                        <button
                          onClick={handleGrantCompleteInformedConsent}
                          className="rounded-full border border-[#57c5a9]/50 bg-[#57c5a9]/15 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.1em] text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
                        >
                          <Check size={13} className="mr-1 inline" />
                          Record Signed 3-Part Consent & All 7 Part-B Statements
                        </button>
                      )}
                    </div>

                    {/* Three-Part Core Consent */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          [
                            "consentTakingPart",
                            "Part 1: Consent to Take Part",
                            selectedRecord.rightsPassport.consentTakingPart,
                          ],
                          [
                            "consentBeingRecorded",
                            "Part 2: Consent to Be Recorded",
                            selectedRecord.rightsPassport.consentBeingRecorded,
                          ],
                          [
                            "consentPublicUse",
                            "Part 3: Consent for Public Use",
                            selectedRecord.rightsPassport.consentPublicUse,
                          ],
                        ] as const
                      ).map(([field, label, checked]) => (
                        <label
                          key={field}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3.5 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              void handlePassportPatch({
                                [field]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#ef9d45]"
                          />
                          <span className="font-semibold text-white/85">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Sacred / Restricted Content Toggle */}
                    <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/5 p-3.5">
                      <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-red-200">
                            Sacred or Restricted Content Flag (Hard Block)
                          </span>
                          <p className="mt-0.5 text-[11px] text-white/55">
                            If marked true by a practitioner or community elder,
                            this record is immediately restricted and blocked
                            from public release.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedRecord.isSacredOrRestricted}
                          onChange={async (e) => {
                            const { record } = await apiClient.updateRecord(
                              selectedRecord.id,
                              { isSacredOrRestricted: e.target.checked }
                            );
                            updateSelectedInList(record);
                          }}
                          className="h-4 w-4 accent-red-500"
                        />
                      </label>
                    </div>

                    {/* Part B: 7 Consent Statements */}
                    <div className="mt-6">
                      <div className="eyebrow mb-3 text-white/50">
                        PART B · 7 INFORMED CONSENT STATEMENTS (INITIALED BY
                        PRACTITIONER)
                      </div>
                      <div className="grid gap-2">
                        {PART_B_STATEMENT_LABELS.map(([key, text]) => {
                          const checked = Boolean(
                            (selectedRecord.rightsPassport.statements as any)?.[
                              key
                            ]
                          );
                          return (
                            <label
                              key={key}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[.02] px-3.5 py-2.5 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  void handlePassportPatch({
                                    statements: {
                                      [key]: e.target.checked,
                                    },
                                  })
                                }
                                className="mt-0.5 h-4 w-4 accent-[#57c5a9]"
                              />
                              <span className="text-white/75">{text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Part C: 9 Rights Passport Fields */}
                    <div className="mt-6">
                      <div className="eyebrow mb-3 text-white/50">
                        PART C · 9 CULTURAL RIGHTS PASSPORT FIELDS (DEFAULTS ARE
                        MOST PROTECTIVE)
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="eyebrow block text-white/55">
                            1. Identity Display
                          </label>
                          <select
                            value={
                              selectedRecord.rightsPassport.identityDisplay
                            }
                            onChange={(e) =>
                              void handlePassportPatch({
                                identityDisplay: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {IDENTITY_DISPLAY_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            2. Location Granularity
                          </label>
                          <select
                            value={
                              selectedRecord.rightsPassport.locationGranularity
                            }
                            onChange={(e) =>
                              void handlePassportPatch({
                                locationGranularity: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {LOCATION_GRANULARITY_OPTIONS.map((opt: LocationGranularityOption) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            3. Audio / Video Access
                          </label>
                          <select
                            value={
                              selectedRecord.rightsPassport.audioVideoAccess
                            }
                            onChange={(e) =>
                              void handlePassportPatch({
                                audioVideoAccess: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {AUDIO_VIDEO_ACCESS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            4. Translation Scope
                          </label>
                          <select
                            value={
                              selectedRecord.rightsPassport.translationScope
                            }
                            onChange={(e) =>
                              void handlePassportPatch({
                                translationScope: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {TRANSLATION_SCOPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            5. AI Use Boundary
                          </label>
                          <select
                            value={selectedRecord.rightsPassport.aiUse}
                            onChange={(e) =>
                              void handlePassportPatch({
                                aiUse: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {AI_USE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            6. Download / Reuse
                          </label>
                          <select
                            value={selectedRecord.rightsPassport.downloadReuse}
                            onChange={(e) =>
                              void handlePassportPatch({
                                downloadReuse: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {DOWNLOAD_REUSE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            7. Commercial Use
                          </label>
                          <select
                            value={selectedRecord.rightsPassport.commercialUse}
                            onChange={(e) =>
                              void handlePassportPatch({
                                commercialUse: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {COMMERCIAL_USE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            8. Contact Pathway
                          </label>
                          <select
                            value={selectedRecord.rightsPassport.contactMode}
                            onChange={(e) =>
                              void handlePassportPatch({
                                contactMode: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {CONTACT_MODE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="eyebrow block text-white/55">
                            9. Withdrawal Status
                          </label>
                          <select
                            value={
                              selectedRecord.rightsPassport.withdrawalStatus
                            }
                            onChange={(e) =>
                              void handlePassportPatch({
                                withdrawalStatus: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                          >
                            {WITHDRAWAL_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Review, Practitioner Approval & Withdrawal Controls */}
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Language / Folklore Review */}
                    <div className="rounded-3xl border border-white/10 bg-[#151927] p-5">
                      <div className="eyebrow text-[#efb167]">
                        STEP 2 · AUTHORIZED REVIEW
                      </div>
                      <h4 className="mt-2 font-serif text-xl text-white">
                        Language & Folklore Check
                      </h4>
                      <select
                        value={reviewStepType}
                        onChange={(e) =>
                          setReviewStepType(e.target.value as any)
                        }
                        className="mt-3 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                      >
                        <option value="TRANSCRIBED">
                          TRANSCRIBED (Transcript verified)
                        </option>
                        <option value="TRANSLATED">
                          TRANSLATED (Translation & context verified)
                        </option>
                        <option value="NARRATED">
                          NARRATED (Story Companion verified)
                        </option>
                      </select>
                      <input
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Reviewer notes…"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handleSubmitReview}
                        className="mt-3 w-full rounded-full border border-[#57c5a9]/50 bg-[#57c5a9]/15 py-2 text-[11px] font-bold uppercase tracking-[.1em] text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
                      >
                        Log Review Sign-Off
                      </button>
                    </div>

                    {/* Sustained Practitioner Approval */}
                    <div className="rounded-3xl border border-white/10 bg-[#151927] p-5">
                      <div className="eyebrow text-[#efb167]">
                        STEP 3 · PRACTITIONER APPROVAL
                      </div>
                      <h4 className="mt-2 font-serif text-xl text-white">
                        Pre-Release Re-Confirmation
                      </h4>
                      <p className="mt-2 text-xs text-white/55">
                        Re-confirms sustained consent after the practitioner has
                        inspected the final transcript and context.
                      </p>
                      <input
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Practitioner approval notes…"
                        className="mt-3 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handlePractitionerApproval}
                        className="mt-3 w-full rounded-full bg-[#ef9d45] py-2 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#251922]"
                      >
                        Record Practitioner Approval
                      </button>
                    </div>

                    {/* Restrict or Withdraw */}
                    <div className="rounded-3xl border border-red-400/25 bg-[#261820] p-5">
                      <div className="eyebrow text-red-300">
                        RIGHT TO WITHDRAW AT ANY TIME
                      </div>
                      <h4 className="mt-2 font-serif text-xl text-white">
                        Restrict or Remove Record
                      </h4>
                      <input
                        value={restrictReason}
                        onChange={(e) => setRestrictReason(e.target.value)}
                        placeholder="Reason for restriction or withdrawal…"
                        className="mt-3 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            void handleRestrictOrWithdraw("RESTRICTED")
                          }
                          className="flex-1 rounded-full border border-amber-400/50 bg-amber-500/15 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-amber-200 hover:bg-amber-500/30"
                        >
                          Restrict
                        </button>
                        <button
                          onClick={() =>
                            void handleRestrictOrWithdraw("WITHDRAWN")
                          }
                          className="flex-1 rounded-full border border-red-400/50 bg-red-500/20 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-red-200 hover:bg-red-500/40"
                        >
                          <XCircle size={12} className="mr-1 inline" />
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. Provenance Log Table (Instrument 6.5) */}
                  <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                    <div className="eyebrow text-[#efb167]">
                      INSTRUMENT 6.5 · PROVENANCE AUDIT LOG
                    </div>
                    <h3 className="mt-1 font-serif text-2xl text-white">
                      Chronological Chain of Custody & Approvals
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-white/45">
                            <th className="pb-2 pr-4">Step</th>
                            <th className="pb-2 pr-4">Role / Actor</th>
                            <th className="pb-2 pr-4">Practitioner Approved</th>
                            <th className="pb-2 pr-4">Version</th>
                            <th className="pb-2 pr-4">Notes</th>
                            <th className="pb-2">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/8">
                          {selectedRecord.provenanceLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="py-2.5 pr-4 font-bold text-[#efb167]">
                                {log.stepType}
                              </td>
                              <td className="py-2.5 pr-4 text-white/80">
                                {log.performedByDisplay}
                              </td>
                              <td className="py-2.5 pr-4">
                                {log.practitionerApproved ? (
                                  <span className="text-[#8ed5bd]">Yes</span>
                                ) : (
                                  <span className="text-white/40">No</span>
                                )}
                              </td>
                              <td className="py-2.5 pr-4 text-white/65">
                                {log.versionLabel}
                              </td>
                              <td className="py-2.5 pr-4 text-white/75">
                                {log.notes}
                              </td>
                              <td className="py-2.5 text-white/40">
                                {log.createdAt.slice(0, 19).replace("T", " ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: CREATE NEW CULTURAL RECORD
            =================================================================== */}
        {activeTab === "create" && (
          <form
            onSubmit={handleCreateRecord}
            className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-white/10 bg-[#151927] p-6 md:p-8"
          >
            <div>
              <div className="eyebrow text-[#efb167]">
                AUTHORIZED INTAKE · CONSERVATIVE CONSENT DEFAULTS
              </div>
              <h2 className="display mt-2 text-3xl text-white">
                Add Field Cultural Record
              </h2>
              <p className="mt-1 text-xs text-white/55">
                Creates a new record in <code>DRAFT</code> status with
                conservative Rights Passport defaults (private audio, district
                location, original language only, no commercial use). It will
                not appear on the public website until consent, review, and
                practitioner approval are completed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="eyebrow block text-white/60">
                  Practice / Record Title (English) *
                </label>
                <input
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g., Kolhapuri Chappal — Kapashi Workshop"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Practice Title (Marathi Devanagari)
                </label>
                <input
                  value={newTitleMr}
                  onChange={(e) => setNewTitleMr(e.target.value)}
                  placeholder="e.g., कोल्हापुरी चप्पल — कापशी कार्यशाळा"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#10121c] px-3.5 py-2.5 text-sm text-white"
                >
                  {CULTURE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  UNESCO ICH Domain *
                </label>
                <select
                  value={newUnescoDomain}
                  onChange={(e) => setNewUnescoDomain(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#10121c] px-3.5 py-2.5 text-sm text-white"
                >
                  {UNESCO_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="eyebrow block text-white/60">
                  Practitioner Chosen Display Name *
                </label>
                <input
                  required
                  value={newChosenName}
                  onChange={(e) => setNewChosenName(e.target.value)}
                  placeholder="Chosen credit name"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Practitioner Full Legal Name (Private)
                </label>
                <input
                  value={newFullNamePrivate}
                  onChange={(e) => setNewFullNamePrivate(e.target.value)}
                  placeholder="Protected unless FULL_NAME chosen"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Community / Gharana / Parampara Name
                </label>
                <input
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="Community attribution"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="eyebrow block text-white/60">State</label>
                <select
                  value={newStateId}
                  onChange={(e) => setNewStateId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2.5 text-xs text-white"
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block text-white/60">District</label>
                <select
                  value={newDistrictId}
                  onChange={(e) => setNewDistrictId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2.5 text-xs text-white"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  City / Town
                </label>
                <select
                  value={newCityTownId}
                  onChange={(e) => setNewCityTownId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2.5 text-xs text-white"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow block text-white/60">Taluka</label>
                <input
                  value={newTaluka}
                  onChange={(e) => setNewTaluka(e.target.value)}
                  placeholder="e.g., Karveer / Kagal"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="eyebrow block text-white/60">
                  Short Summary (Headline) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newSummaryEn}
                  onChange={(e) => setNewSummaryEn(e.target.value)}
                  placeholder="Concise summary of the cultural practice…"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Cultural & Historical Context
                </label>
                <textarea
                  rows={2}
                  value={newPracticeContextEn}
                  onChange={(e) => setNewPracticeContextEn(e.target.value)}
                  placeholder="Detailed public-safe cultural context…"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="eyebrow block text-white/60">
                  Original Voice Marathi Transcript
                </label>
                <textarea
                  rows={2}
                  value={newOriginalTranscriptMr}
                  onChange={(e) => setNewOriginalTranscriptMr(e.target.value)}
                  placeholder="Original Marathi words spoken or sung by the practitioner…"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Mode 3 · Human Story Companion Text & Narrator
                </label>
                <textarea
                  rows={2}
                  value={newM3StoryCompanion}
                  onChange={(e) => setNewM3StoryCompanion(e.target.value)}
                  placeholder="Contextual mediation text read by the human Story Companion…"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <ImageUploadField
                label="Cover Hero Photo"
                value={newHeroImageUrl}
                onChange={setNewHeroImageUrl}
                placeholder="Upload or pick a cultural image for this record"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="eyebrow block text-white/60">
                  Source Attribution (Field Documentation or Reference Source)
                </label>
                <input
                  value={newSourceAttribution}
                  onChange={(e) => setNewSourceAttribution(e.target.value)}
                  placeholder="e.g., Field documentation in Karveer / GI Registry / State Gazetteer"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Source URL (Optional)
                </label>
                <input
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={newIsWomenLed}
                  onChange={(e) => setNewIsWomenLed(e.target.checked)}
                  className="h-4 w-4 accent-[#ef9d45]"
                />
                Women-led practice / enterprise (HerCraft inclusion)
              </label>
              <label className="flex items-center gap-2 text-xs text-red-200">
                <input
                  type="checkbox"
                  checked={newIsSacredOrRestricted}
                  onChange={(e) => setNewIsSacredOrRestricted(e.target.checked)}
                  className="h-4 w-4 accent-red-500"
                />
                Contains sacred or restricted knowledge (blocks publication)
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("records")}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs text-white/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-lift rounded-full bg-[#ef9d45] px-6 py-2.5 text-xs font-extrabold uppercase tracking-[.14em] text-[#251922]"
              >
                Create Draft Cultural Record
              </button>
            </div>
          </form>
        )}

        {/* ===================================================================
            TAB 2B: CULTURAL CALENDAR & EVENTS WORKSPACE
            =================================================================== */}
        {activeTab === "calendar" && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-3xl border border-white/10 bg-[#151927] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow text-[#efb167]">
                  CALENDAR EVENTS ({eventsList.length})
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewEvent}
                  className="eyebrow text-[#8ed5bd] hover:underline"
                >
                  + New Event Draft
                </button>
              </div>
              <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
                {eventsList.map((ev) => {
                  const isSel = ev.id === selectedEventId;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition ${
                        isSel
                          ? "border-[#ef9d45] bg-[#ef9d45]/15"
                          : "border-white/8 bg-white/[.025] hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="font-bold uppercase tracking-wider text-[#efb167]">
                          {ev.status} · {ev.scheduleStatus}
                        </span>
                        <span className="text-white/45">{ev.startDate}</span>
                      </div>
                      <div className="mt-1 font-serif text-lg text-white">
                        {ev.titleEn}
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/50">
                        {ev.venueLabel} · Access: {ev.visitorAccess}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {selectedEvent ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="eyebrow text-[#efb167]">
                        EVENT WORKFLOW: {selectedEvent.status} · SCHEDULE:{" "}
                        {selectedEvent.scheduleStatus}
                      </div>
                      <h2 className="mt-1 font-serif text-3xl text-white">
                        {selectedEvent.titleEn}
                      </h2>
                      {selectedEvent.submittedByPublicName && (
                        <div className="mt-1 text-xs text-[#8ed5bd]">
                          Public Moderation Queue Submission by{" "}
                          {selectedEvent.submittedByPublicName} (
                          {selectedEvent.submittedByPublicContact})
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handlePublishEvent}
                        className="rounded-full bg-[#57c5a9] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#102124]"
                      >
                        Publish Event
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleEventWorkflowChange(
                            "UNPUBLISHED",
                            selectedEvent.scheduleStatus
                          )
                        }
                        className="rounded-full border border-white/20 px-3.5 py-2 text-xs text-white/80"
                      >
                        Unpublish
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleEventWorkflowChange(
                            selectedEvent.status,
                            "CANCELLED"
                          )
                        }
                        className="rounded-full border border-red-400/40 bg-red-500/15 px-3.5 py-2 text-xs text-red-200"
                      >
                        Mark Cancelled
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleEventWorkflowChange(
                            "ARCHIVED",
                            selectedEvent.scheduleStatus
                          )
                        }
                        className="rounded-full border border-white/15 px-3.5 py-2 text-xs text-white/55"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          triggerDelete("event", selectedEvent.id, selectedEvent.titleEn)
                        }
                        className="rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 size={12} className="mr-1 inline" />
                        Delete Event
                      </button>
                    </div>
                  </div>

                  {!selectedEvent.eventPublicationGate.allowed && (
                    <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-xs text-red-200">
                      <strong>Publication Blocked by Event Safeguard Gate:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {selectedEvent.eventPublicationGate.reasons.map(
                          (reason: string, idx: number) => (
                            <li key={idx}>{reason}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <form
                    onSubmit={handleSaveEventChanges}
                    className="mt-5 space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="eyebrow block text-white/60">
                          English Title *
                        </label>
                        <input
                          required
                          value={evtTitleEn}
                          onChange={(e) => setEvtTitleEn(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Local-Language Title (Marathi)
                        </label>
                        <input
                          value={evtTitleMr}
                          onChange={(e) => setEvtTitleMr(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="eyebrow block text-white/60">
                          Category
                        </label>
                        <select
                          value={evtCategory}
                          onChange={(e) => setEvtCategory(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {CULTURE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Associated Cultural Record
                        </label>
                        <select
                          value={evtCulturalRecordId}
                          onChange={(e) =>
                            setEvtCulturalRecordId(e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          <option value="">None linked</option>
                          {records.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.titleEn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Schedule Status
                        </label>
                        <select
                          value={evtScheduleStatus}
                          onChange={(e) =>
                            setEvtScheduleStatus(
                              e.target.value as EventScheduleStatus
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {EVENT_SCHEDULE_STATUSES.map((s: EventScheduleStatus) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <label className="eyebrow block text-white/60">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={evtStartDate}
                          onChange={(e) => setEvtStartDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={evtEndDate}
                          onChange={(e) => setEvtEndDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Start Time
                        </label>
                        <input
                          value={evtStartTime}
                          onChange={(e) => setEvtStartTime(e.target.value)}
                          placeholder="e.g. 10:00"
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          End Time
                        </label>
                        <input
                          value={evtEndTime}
                          onChange={(e) => setEvtEndTime(e.target.value)}
                          placeholder="e.g. 17:30"
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="eyebrow block text-white/60">
                          Public Venue Label
                        </label>
                        <input
                          value={evtVenueLabel}
                          onChange={(e) => setEvtVenueLabel(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Location Granularity (Privacy)
                        </label>
                        <select
                          value={evtLocationGranularity}
                          onChange={(e) =>
                            setEvtLocationGranularity(
                              e.target.value as LocationGranularityOption
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {LOCATION_GRANULARITY_OPTIONS.map((opt: LocationGranularityOption) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Recurrence Pattern
                        </label>
                        <select
                          value={evtRecurrencePattern}
                          onChange={(e) => {
                            setEvtRecurrencePattern(
                              e.target.value as EventRecurrencePattern
                            );
                            setEvtIsRecurring(
                              e.target.value !== "SINGLE_OCCURRENCE"
                            );
                          }}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {EVENT_RECURRENCE_PATTERNS.map((p: EventRecurrencePattern) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="eyebrow block text-white/60">
                          Visitor Access Condition
                        </label>
                        <select
                          value={evtVisitorAccess}
                          onChange={(e) =>
                            setEvtVisitorAccess(
                              e.target.value as VisitorAccessOption
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {VISITOR_ACCESS_OPTIONS.map((v: VisitorAccessOption) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Registration Requirement
                        </label>
                        <select
                          value={evtRegistrationReq}
                          onChange={(e) =>
                            setEvtRegistrationReq(
                              e.target.value as RegistrationRequirementOption
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {REGISTRATION_REQUIREMENT_OPTIONS.map((r: RegistrationRequirementOption) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Photography Rule
                        </label>
                        <select
                          value={evtPhotographyRule}
                          onChange={(e) =>
                            setEvtPhotographyRule(
                              e.target.value as PhotographyRuleOption
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                        >
                          {PHOTOGRAPHY_RULE_OPTIONS.map((p: PhotographyRuleOption) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="eyebrow block text-white/60">
                          Documented Source Attribution *
                        </label>
                        <input
                          value={evtSourceAttribution}
                          onChange={(e) =>
                            setEvtSourceAttribution(e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Source URL
                        </label>
                        <input
                          value={evtSourceUrl}
                          onChange={(e) => setEvtSourceUrl(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="eyebrow block text-white/60">
                          Organizer Display Name
                        </label>
                        <input
                          value={evtOrganizerDisplay}
                          onChange={(e) =>
                            setEvtOrganizerDisplay(e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Authorized Public Contact
                        </label>
                        <input
                          value={evtOrganizerPublicContact}
                          onChange={(e) =>
                            setEvtOrganizerPublicContact(e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Private Organizer Contact (Never Public)
                        </label>
                        <input
                          value={evtOrganizerPrivateContact}
                          onChange={(e) =>
                            setEvtOrganizerPrivateContact(e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="eyebrow block text-white/60">
                          English Description
                        </label>
                        <textarea
                          rows={2}
                          value={evtDescriptionEn}
                          onChange={(e) => setEvtDescriptionEn(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="eyebrow block text-white/60">
                          Etiquette & Visitor Boundaries
                        </label>
                        <textarea
                          rows={2}
                          value={evtEtiquetteNotes}
                          onChange={(e) => setEvtEtiquetteNotes(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-xs text-white/80">
                        <input
                          type="checkbox"
                          checked={evtOrganizerAuthorized}
                          onChange={(e) =>
                            setEvtOrganizerAuthorized(e.target.checked)
                          }
                          className="h-4 w-4 accent-[#57c5a9]"
                        />
                        Organizer authorized public contact display
                      </label>
                      <label className="flex items-center gap-2 text-xs text-red-200">
                        <input
                          type="checkbox"
                          checked={evtIsPrivateOrRestricted}
                          onChange={(e) =>
                            setEvtIsPrivateOrRestricted(e.target.checked)
                          }
                          className="h-4 w-4 accent-red-500"
                        />
                        Private or restricted ceremony (blocks publication)
                      </label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="rounded-full bg-[#ef9d45] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#241a20]"
                      >
                        Save Event Details
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ===================================================================
            TAB: TRADITIONS, MULTI-REGION PLACES, SOURCES & MEDIA REGISTRY
            =================================================================== */}
        {activeTab === "traditions" && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            {/* Left Sidebar: Tradition List + Create New Tradition */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#151927] p-5">
                <div className="eyebrow text-[#efb167]">
                  PAN-INDIA TRADITION DIRECTORY ({traditionsList.length})
                </div>
                <div className="mt-3 max-h-[380px] space-y-2 overflow-y-auto pr-1">
                  {traditionsList
                    .filter((t) => {
                      if (!adminSearchQuery.trim()) return true;
                      const q = adminSearchQuery.toLowerCase();
                      return (
                        t.nameEn.toLowerCase().includes(q) ||
                        (t.nameNative && t.nameNative.toLowerCase().includes(q)) ||
                        t.traditionCategory.toLowerCase().includes(q) ||
                        (t.summary && t.summary.toLowerCase().includes(q))
                      );
                    })
                    .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTraditionId(t.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        selectedTraditionId === t.id
                          ? "border-[#ef9d45] bg-[#ef9d45]/15"
                          : "border-white/10 bg-white/[.03] hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif text-base text-white">
                          {t.nameEn}
                        </span>
                        <span className="eyebrow text-[9px] text-[#8ed5bd]">
                          {t.places.length} Place{t.places.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/55">
                        {t.traditionCategory} · {t.sourceCount} Sources ·{" "}
                        {t.mediaCount} Public Media
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleCreateTradition}
                className="space-y-3 rounded-3xl border border-white/10 bg-[#151927] p-5"
              >
                <div className="eyebrow text-[#efb167]">
                  ADD NEW LIVING TRADITION
                </div>
                <input
                  required
                  value={newTradNameEn}
                  onChange={(e) => setNewTradNameEn(e.target.value)}
                  placeholder="Canonical Name (e.g., Yakshagana)"
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
                <input
                  value={newTradNameNative}
                  onChange={(e) => setNewTradNameNative(e.target.value)}
                  placeholder="Native Script Name"
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
                <select
                  value={newTradCategory}
                  onChange={(e) =>
                    setNewTradCategory(
                      e.target.value as TraditionDirectoryCategory
                    )
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                >
                  {TRADITION_DIRECTORY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={newTradEvidenceStatus}
                  onChange={(e) =>
                    setNewTradEvidenceStatus(e.target.value as EvidenceStatus)
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                >
                  {EVIDENCE_STATUSES.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
                <textarea
                  required
                  rows={3}
                  value={newTradSummary}
                  onChange={(e) => setNewTradSummary(e.target.value)}
                  placeholder="Source-backed cultural summary…"
                  className="w-full rounded-xl border border-white/15 bg-black/25 p-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#ef9d45] py-2 text-xs font-extrabold uppercase tracking-wider text-[#241a20]"
                >
                  Create Tradition Entry
                </button>
              </form>
            </div>

            {/* Right Workspace: Selected Tradition Multi-Region Places, Sources & Media Gate */}
            {selectedTradition ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="eyebrow text-[#efb167]">
                        {selectedTradition.traditionCategory} ·{" "}
                        {selectedTradition.evidenceStatusLabel}
                      </div>
                      <h2 className="mt-1 font-serif text-3xl text-white">
                        {selectedTradition.nameEn}{" "}
                        {selectedTradition.nameNative && (
                          <span className="text-lg text-[#efb167]">
                            ({selectedTradition.nameNative})
                          </span>
                        )}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTraditionTarget(selectedTradition);
                          setEditTraditionModalOpen(true);
                        }}
                        className="rounded-full border border-[#ef9d45]/50 bg-[#ef9d45]/15 px-4 py-1.5 text-xs font-bold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#251922] transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit2 size={12} />
                        Edit Details & Visuals
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/traditions/${encodeURIComponent(
                              selectedTradition.slug
                            )}`
                          )
                        }
                        className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-4 py-1.5 text-xs font-semibold text-[#8ed5bd]"
                      >
                        Open Public Dossier ↗
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          triggerDelete("tradition", selectedTradition.id, selectedTradition.nameEn)
                        }
                        className="rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 size={12} className="mr-1 inline" />
                        Delete Tradition
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/70">
                    {selectedTradition.summary}
                  </p>
                </div>

                {/* Multi-Region Place Associations */}
                <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                  <div className="eyebrow text-[#8ed5bd]">
                    MULTI-REGION GEOGRAPHIC ASSOCIATIONS (
                    {selectedTradition.places.length})
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedTradition.places.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {p.locationNameEn}, {p.stateName}
                          </div>
                          <div className="text-[11px] text-white/55">
                            {p.regionalVariantName || p.relationshipRole}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiClient.removeTraditionPlaceAssociation(
                              p.id
                            );
                            await refreshAdminTraditions(selectedTradition.id);
                          }}
                          className="text-red-300 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAddTraditionPlace}
                    className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-4"
                  >
                    <select
                      value={assocStateId}
                      onChange={(e) => setAssocStateId(e.target.value)}
                      className="rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                    >
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameEn}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assocLocationId}
                      onChange={(e) => setAssocLocationId(e.target.value)}
                      className="rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                    >
                      {locations.slice(0, 120).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nameEn} ({l.level})
                        </option>
                      ))}
                    </select>
                    <input
                      value={assocVariantName}
                      onChange={(e) => setAssocVariantName(e.target.value)}
                      placeholder="Regional variant / GI cluster label"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[#ef9d45] px-4 py-2 text-xs font-bold uppercase text-[#241a20]"
                    >
                      Link Region
                    </button>
                  </form>
                </div>

                {/* Source Citations & Fact-Verification Management */}
                <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                  <div className="eyebrow text-[#efb167]">
                    SOURCE CITATIONS & FACT-VERIFICATION REGISTRY (
                    {selectedTradition.sources.length})
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedTradition.sources.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-white">
                            {s.sourceTitle} ({s.sourceOrganisation})
                          </strong>
                          <span className="text-[#8ed5bd]">
                            {s.sourceType} · {s.reviewStatus}
                          </span>
                        </div>
                        <div className="mt-1 text-white/70">
                          Facts supported: {s.specificFactsSupported}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAddSourceCitation}
                    className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"
                  >
                    <input
                      required
                      value={srcTitle}
                      onChange={(e) => setSrcTitle(e.target.value)}
                      placeholder="Source Title (e.g., UNESCO Nomination File)"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <input
                      required
                      value={srcOrg}
                      onChange={(e) => setSrcOrg(e.target.value)}
                      placeholder="Organisation (e.g., Sangeet Natak Akademi)"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <input
                      required
                      value={srcUrl}
                      onChange={(e) => setSrcUrl(e.target.value)}
                      placeholder="Official Source URL (https://...)"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={srcType}
                      onChange={(e) => setSrcType(e.target.value as SourceType)}
                      className="rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                    >
                      {SOURCE_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      value={srcFacts}
                      onChange={(e) => setSrcFacts(e.target.value)}
                      placeholder="Specific facts supported by this source…"
                      className=" rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white sm:col-span-2"
                    />
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="rounded-full bg-[#ef9d45] px-5 py-2 text-xs font-bold uppercase text-[#241a20]"
                      >
                        Add Verified Source Citation
                      </button>
                    </div>
                  </form>
                </div>

                {/* Media Registry & Rights Gate */}
                <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
                  <div className="eyebrow text-[#8ed5bd]">
                    VERIFIED MEDIA REGISTRY & RIGHTS PUBLICATION GATE (
                    {selectedTradition.allMediaAssetsAdmin.length})
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedTradition.allMediaAssetsAdmin.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-white">
                            [{m.mediaType}] {m.title}
                          </strong>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                m.mediaPublicationGate?.allowed
                                  ? "bg-[#57c5a9]/20 text-[#8ed5bd]"
                                  : "bg-red-500/20 text-red-200"
                              }`}
                            >
                              {m.rightsStatus} ·{" "}
                              {m.mediaPublicationGate?.allowed
                                ? "CLEARED FOR PUBLIC"
                                : "BLOCKED BY RIGHTS GATE"}
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerDelete("media", m.id, m.title)}
                              className="rounded px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/20 transition"
                            >
                              <Trash2 size={11} className="inline mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 text-white/65">
                          License: {m.licenseIdentifier} · Attribution:{" "}
                          {m.attributionText}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAddMediaAsset}
                    className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"
                  >
                    <input
                      required
                      value={medTitle}
                      onChange={(e) => setMedTitle(e.target.value)}
                      placeholder="Media Title"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={medType}
                      onChange={(e) =>
                        setMedType(e.target.value as MediaAssetType)
                      }
                      className="rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                    >
                      {MEDIA_TYPES.map((mt) => (
                        <option key={mt} value={mt}>
                          {mt}
                        </option>
                      ))}
                    </select>
                    <input
                      value={medCreator}
                      onChange={(e) => setMedCreator(e.target.value)}
                      placeholder="Creator / Photographer / Performer"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={medRightsStatus}
                      onChange={(e) =>
                        setMedRightsStatus(e.target.value as MediaRightsStatus)
                      }
                      className="rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                    >
                      {MEDIA_RIGHTS_STATUSES.map((rs) => (
                        <option key={rs} value={rs}>
                          {rs}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      value={medSourcePageUrl}
                      onChange={(e) => setMedSourcePageUrl(e.target.value)}
                      placeholder="Source Page URL (Wikimedia Commons / UNESCO)"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white sm:col-span-2"
                    />
                    <div className="sm:col-span-2">
                      <ImageUploadField
                        label="Direct Media Asset / Image File"
                        value={medDirectUrl}
                        onChange={setMedDirectUrl}
                        placeholder="Direct URL or upload local media asset"
                      />
                    </div>
                    <input
                      required
                      value={medLicense}
                      onChange={(e) => setMedLicense(e.target.value)}
                      placeholder="License Identifier (e.g., CC BY-SA 4.0)"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <input
                      required
                      value={medAttribution}
                      onChange={(e) => setMedAttribution(e.target.value)}
                      placeholder="Full Attribution Credit Text"
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                    />
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="rounded-full bg-[#ef9d45] px-5 py-2 text-xs font-bold uppercase text-[#241a20]"
                      >
                        Register Media Asset
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        )}

                {/* ===================================================================
            TAB 3: ROLE-BASED USER MANAGEMENT (SUPER_ADMIN ONLY)
            =================================================================== */}
        {activeTab === "users" && user.role === "SUPER_ADMIN" && (
          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            <form
              onSubmit={handleCreateUser}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#151927] p-6"
            >
              <div className="eyebrow text-[#efb167]">RBAC MANAGEMENT</div>
              <h3 className="font-serif text-2xl text-white">
                Add Authorized Role Account
              </h3>
              <div>
                <label className="eyebrow block text-white/60">Full Name</label>
                <input
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Reviewer or Researcher Name"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="reviewer@bharat-culturemap.org"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">
                  Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="eyebrow block text-white/60">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-[#ef9d45] py-2.5 text-xs font-extrabold uppercase tracking-[.12em] text-[#251922]"
              >
                Create Role Account
              </button>
            </form>

            <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
              <div className="eyebrow text-[#efb167]">ACTIVE ACCOUNTS</div>
              <h3 className="mt-1 font-serif text-2xl text-white">
                Authorized Custodians & Reviewers
              </h3>
              <div className="mt-4 space-y-2">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {u.fullName}
                      </div>
                      <div className="text-white/50">{u.email}</div>
                    </div>
                    <span className="eyebrow rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/15 px-3 py-1 text-[#8ed5bd]">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB: PRACTITIONERS & KNOWLEDGE BEARERS
            =================================================================== */}
        {activeTab === "practitioners" && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Create Practitioner Form */}
            <form
              onSubmit={handleCreatePractitioner}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#151927] p-6 h-fit"
            >
              <div className="eyebrow text-[#efb167]">ARTISAN INTAKE</div>
              <h3 className="font-serif text-2xl text-white">Add Practitioner Profile</h3>
              <p className="text-xs text-white/55">
                Register master artisans, craftspeople, and living tradition knowledge bearers with accredited credentials.
              </p>

              <div>
                <label className="eyebrow block text-white/60">Display Name *</label>
                <input
                  required
                  value={newPractName}
                  onChange={(e) => setNewPractName(e.target.value)}
                  placeholder="e.g., Master Weaver Shobha Devi"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="eyebrow block text-white/60">Role / Honorific Title</label>
                <input
                  value={newPractRole}
                  onChange={(e) => setNewPractRole(e.target.value)}
                  placeholder="e.g., National Awardee Master Artisan"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow block text-white/60">State</label>
                  <input
                    value={newPractState}
                    onChange={(e) => setNewPractState(e.target.value)}
                    placeholder="e.g., Maharashtra"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-white/60">City / Cluster</label>
                  <input
                    value={newPractCity}
                    onChange={(e) => setNewPractCity(e.target.value)}
                    placeholder="e.g., Kolhapur"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow block text-white/60">Years of Practice</label>
                  <input
                    type="number"
                    value={newPractYears}
                    onChange={(e) => setNewPractYears(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-white/60">Availability</label>
                  <select
                    value={newPractAvailability}
                    onChange={(e) => setNewPractAvailability(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                  >
                    <option value="OPEN_FOR_WORKSHOPS">Open for Workshops</option>
                    <option value="AVAILABLE_FOR_APPRENTICESHIP">Apprenticeship</option>
                    <option value="BY_ENQUIRY_ONLY">By Enquiry Only</option>
                    <option value="SEASONAL_BREAK">Seasonal Break</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Practitioner Photo"
                  value={newPractImage}
                  onChange={setNewPractImage}
                  placeholder="Upload or choose artisan portrait"
                />
              </div>

              <div>
                <label className="eyebrow block text-white/60">Biographical Narrative</label>
                <textarea
                  rows={3}
                  value={newPractBio}
                  onChange={(e) => setNewPractBio(e.target.value)}
                  placeholder="Artisan lineage, training, ancestral techniques, and community work…"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#ef9d45] py-2.5 text-xs font-extrabold uppercase tracking-[.12em] text-[#251922]"
              >
                Create Practitioner Profile
              </button>
            </form>

            {/* Practitioners Directory Listing */}
            <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="eyebrow text-[#efb167]">LIVING HERITAGE PRACTITIONERS</div>
                  <h3 className="mt-1 font-serif text-2xl text-white">
                    Master Artisans & Knowledge Bearers ({practitionersList.length})
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {practitionersList
                  .filter((p) => {
                    if (!adminSearchQuery.trim()) return true;
                    const q = adminSearchQuery.toLowerCase();
                    return (
                      p.displayName.toLowerCase().includes(q) ||
                      p.roleTitle.toLowerCase().includes(q) ||
                      (p.stateName && p.stateName.toLowerCase().includes(q)) ||
                      (p.cityName && p.cityName.toLowerCase().includes(q))
                    );
                  })
                  .map((p) => (
                  <div
                    key={p.id || p.slug}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.02] p-4 transition hover:border-white/20"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <img
                          src={p.profileImageUrl || "/sample-images/artisan-hands.jpg"}
                          alt={p.displayName}
                          className="h-14 w-14 rounded-full object-cover border border-[#ef9d45]/40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/sample-images/artisan-hands.jpg";
                          }}
                        />
                        <div>
                          <div className="font-serif text-lg font-semibold text-white">
                            {p.displayName}
                          </div>
                          <div className="text-xs text-[#efb167]">{p.roleTitle}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-0.5">
                            <MapPin size={11} className="text-[#57c5a9]" />
                            {p.cityName ? `${p.cityName}, ` : ""}{p.stateName} · {p.yearsOfPractice} yrs exp.
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-white/70 line-clamp-2">
                        {p.shortBio || p.fullNarrative}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="rounded-full bg-[#57c5a9]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#8ed5bd]">
                        {p.availabilityStatus.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditPractitionerTarget(p);
                            setEditPractitionerModalOpen(true);
                          }}
                          className="rounded-lg border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-2.5 py-1 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#251922] transition flex items-center gap-1"
                          title="Edit practitioner profile, details and photo"
                        >
                          <Edit2 size={11} />
                          Edit Profile & Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDelete("practitioner", p.id, p.displayName)}
                          className="rounded px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                        >
                          <Trash2 size={12} className="inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB: ART-MART CRAFT MARKETPLACE
            =================================================================== */}
        {activeTab === "artmart" && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Create Product Form */}
            <form
              onSubmit={handleCreateProduct}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#151927] p-6 h-fit"
            >
              <div className="eyebrow text-[#efb167]">MARKETPLACE INTAKE</div>
              <h3 className="font-serif text-2xl text-white">Add Art-Mart Product</h3>
              <p className="text-xs text-white/55">
                List verified handcrafted cultural artifacts, textiles, metalwork, and pottery with full artisan provenance.
              </p>

              <div>
                <label className="eyebrow block text-white/60">Product Title *</label>
                <input
                  required
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  placeholder="e.g., Handloom Paithani Silk Dupatta"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow block text-white/60">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                  >
                    <option value="Craft">Craft</option>
                    <option value="Textile">Textile</option>
                    <option value="Pottery">Pottery</option>
                    <option value="Jewelry">Jewelry</option>
                    <option value="Metalwork">Metalwork</option>
                    <option value="Woodwork">Woodwork</option>
                    <option value="Painting">Painting</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block text-white/60">State</label>
                  <input
                    value={newProdState}
                    onChange={(e) => setNewProdState(e.target.value)}
                    placeholder="Maharashtra"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow block text-white/60">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-white/60">In-Stock Count</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Product Photo"
                  value={newProdImage}
                  onChange={setNewProdImage}
                  placeholder="Upload product photo or choose sample"
                />
              </div>

              <div>
                <label className="eyebrow block text-white/60">Description & Craft Details</label>
                <textarea
                  rows={3}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="Describe material, weave or casting technique, GI heritage status…"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#ef9d45] py-2.5 text-xs font-extrabold uppercase tracking-[.12em] text-[#251922]"
              >
                Add Marketplace Product
              </button>
            </form>

            {/* Products Directory Listing */}
            <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
              <div className="eyebrow text-[#efb167]">AUTHENTIC CULTURAL ARTIFACTS</div>
              <h3 className="mt-1 font-serif text-2xl text-white">
                Art-Mart Catalog ({artMartProductsList.length})
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {artMartProductsList
                  .filter((prod) => {
                    if (!adminSearchQuery.trim()) return true;
                    const q = adminSearchQuery.toLowerCase();
                    return (
                      prod.title.toLowerCase().includes(q) ||
                      prod.category.toLowerCase().includes(q) ||
                      (prod.description && prod.description.toLowerCase().includes(q)) ||
                      (prod.provenanceNote && prod.provenanceNote.toLowerCase().includes(q))
                    );
                  })
                  .map((prod) => (
                  <div
                    key={prod.id || prod.slug}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.02] overflow-hidden transition hover:border-white/20"
                  >
                    <div className="h-40 w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={prod.imageUrl || "/sample-images/handloom-sari.jpg"}
                        alt={prod.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/sample-images/handloom-sari.jpg";
                        }}
                      />
                      <span className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-[#efb167]">
                        ₹{prod.priceInr.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#57c5a9]">
                          {prod.category} · {prod.stateName}
                        </div>
                        <h4 className="font-serif text-base font-semibold text-white mt-1 line-clamp-1">
                          {prod.title}
                        </h4>
                        <p className="mt-1 text-xs text-white/60 line-clamp-2">
                          {prod.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="text-[11px] text-white/50">
                          Stock: {prod.stockQuantity} units
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditProductTarget(prod);
                              setEditProductModalOpen(true);
                            }}
                            className="rounded-lg border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-2.5 py-1 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#251922] transition flex items-center gap-1"
                            title="Edit product details, pricing, stock and photo"
                          >
                            <Edit2 size={11} />
                            Edit & Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerDelete("product", prod.id, prod.title)}
                            className="rounded px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                          >
                            <Trash2 size={12} className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB: HERCRAFT WOMEN-LED ENTERPRISES & COLLECTIVES
            =================================================================== */}
        {activeTab === "hercraft" && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Create HerCraft Enterprise Form */}
            <form
              onSubmit={handleCreateHerCraft}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#151927] p-6 h-fit"
            >
              <div className="eyebrow text-[#efb167]">WOMEN IN CRAFT INTAKE</div>
              <h3 className="font-serif text-2xl text-white">Add HerCraft Collective</h3>
              <p className="text-xs text-white/55">
                Register women-led Self-Help Groups (SHGs), artisan cooperatives, and craft guilds empowering women artisans.
              </p>

              <div>
                <label className="eyebrow block text-white/60">Enterprise / SHG Name *</label>
                <input
                  required
                  value={newHerCraftName}
                  onChange={(e) => setNewHerCraftName(e.target.value)}
                  placeholder="e.g., Warli Women Artisans SHG"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="eyebrow block text-white/60">Leader / Collective Label</label>
                <input
                  value={newHerCraftLeader}
                  onChange={(e) => setNewHerCraftLeader(e.target.value)}
                  placeholder="e.g., Sunita Bai & 25 Village Weavers"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow block text-white/60">Craft Category</label>
                  <input
                    value={newHerCraftCategory}
                    onChange={(e) => setNewHerCraftCategory(e.target.value)}
                    placeholder="e.g., Textile / Folk Art"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-white/60">Women Artisans Count</label>
                  <input
                    type="number"
                    value={newHerCraftArtisans}
                    onChange={(e) => setNewHerCraftArtisans(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow block text-white/60">State</label>
                  <input
                    value={newHerCraftState}
                    onChange={(e) => setNewHerCraftState(e.target.value)}
                    placeholder="Maharashtra"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-white/60">District / Cluster</label>
                  <input
                    value={newHerCraftDistrict}
                    onChange={(e) => setNewHerCraftDistrict(e.target.value)}
                    placeholder="Palghar District"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="Collective Hero Image"
                  value={newHerCraftImage}
                  onChange={setNewHerCraftImage}
                  placeholder="Upload or choose collective photo"
                />
              </div>

              <div>
                <label className="eyebrow block text-white/60">Summary & Mission</label>
                <textarea
                  rows={3}
                  value={newHerCraftSummary}
                  onChange={(e) => setNewHerCraftSummary(e.target.value)}
                  placeholder="Artisan empowerment model, community impact, traditional craft techniques…"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#ef9d45] py-2.5 text-xs font-extrabold uppercase tracking-[.12em] text-[#251922]"
              >
                Register HerCraft Collective
              </button>
            </form>

            {/* Collectives Listing */}
            <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
              <div className="eyebrow text-[#efb167]">WOMEN-LED ENTERPRISES & SHGS</div>
              <h3 className="mt-1 font-serif text-2xl text-white">
                HerCraft Collectives ({herCraftList.length})
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {herCraftList
                  .filter((ent) => {
                    if (!adminSearchQuery.trim()) return true;
                    const q = adminSearchQuery.toLowerCase();
                    return (
                      ent.enterpriseName.toLowerCase().includes(q) ||
                      (ent.leaderOrCollectiveLabel && ent.leaderOrCollectiveLabel.toLowerCase().includes(q)) ||
                      (ent.craftCategory && ent.craftCategory.toLowerCase().includes(q)) ||
                      (ent.stateName && ent.stateName.toLowerCase().includes(q))
                    );
                  })
                  .map((ent) => (
                  <div
                    key={ent.id || ent.slug}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.02] overflow-hidden transition hover:border-white/20"
                  >
                    <div className="h-40 w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={ent.heroImageUrl || "/sample-images/textile-weaving.jpg"}
                        alt={ent.enterpriseName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/sample-images/textile-weaving.jpg";
                        }}
                      />
                      <span className="absolute top-2 right-2 rounded-full bg-[#57c5a9]/90 px-2.5 py-0.5 text-[10px] font-bold text-[#102124]">
                        {ent.womenArtisansCount || 12} Women Artisans
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#efb167]">
                          {ent.craftCategory} · {ent.stateName}
                        </div>
                        <h4 className="font-serif text-lg font-semibold text-white mt-1">
                          {ent.enterpriseName}
                        </h4>
                        <div className="text-xs text-white/60 mt-0.5">
                          {ent.leaderOrCollectiveLabel}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/70 line-clamp-2">
                          {ent.shortSummary || ent.storyNarrative}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
                          {ent.enterpriseType || "WOMEN_SHG"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditHerCraftTarget(ent);
                              setEditHerCraftModalOpen(true);
                            }}
                            className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center gap-1"
                            title="Edit collective details, artisan count and photo"
                          >
                            <Edit2 size={11} />
                            Edit & Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerDelete("hercraft", ent.id, ent.enterpriseName)}
                            className="rounded px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                          >
                            <Trash2 size={12} className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB: VISUAL MEDIA ASSET GALLERY
            =================================================================== */}
        {activeTab === "media" && (
          <div className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="eyebrow text-[#efb167]">MEDIA AUDIT & GOVERNANCE</div>
                <h3 className="mt-1 font-serif text-2xl text-white">
                  Cultural Media Assets Registry ({mediaAssetsList.length})
                </h3>
                <p className="mt-1 text-xs text-white/55">
                  All licensed photographs, archival audio, and performance recordings registered across traditions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("traditions")}
                className="rounded-full bg-[#ef9d45] px-4 py-2 text-xs font-bold uppercase text-[#251922]"
              >
                + Register New Media Asset
              </button>
            </div>

            {/* Verified National Cultural Asset Repository (9 High-Res Assets) */}
            <div className="mb-8 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#101524] to-[#151927] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#efb167]" />
                  <span className="font-serif text-lg text-white">
                    Verified National Living Heritage Image Repository (9 High-Res Primary Assets)
                  </span>
                </div>
                <span className="eyebrow rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300">
                  Avishkar Convention Research Assets
                </span>
              </div>
              <p className="mt-2 text-xs text-white/70">
                Official high-resolution cultural documentation assets loaded from local storage. Click "Copy Path" on any asset to immediately insert or paste into any Tradition, Artisan profile, Product, or Collective.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {VERIFIED_CULTURAL_IMAGE_LIST.map((img) => (
                  <div
                    key={img.key}
                    className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 overflow-hidden transition hover:border-amber-400/50"
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-black/60">
                      <img
                        src={img.path}
                        alt={img.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold text-[#efb167] border border-[#ef9d45]/40 backdrop-blur">
                        {img.giTag}
                      </span>
                      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[9px] text-white/80 backdrop-blur">
                        {img.region}
                      </span>
                    </div>

                    <div className="p-3">
                      <div className="font-serif text-sm font-semibold text-white line-clamp-1">
                        {img.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#57c5a9]">
                        {img.category}
                      </div>
                      <p className="mt-1 text-[10px] text-white/50 line-clamp-1">
                        {img.craftContext}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                        <span className="text-[10px] text-white/40 font-mono truncate max-w-[150px]">
                          {img.path}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(img.path);
                            setCopiedImageKey(img.key);
                            setTimeout(() => setCopiedImageKey(null), 2000);
                          }}
                          className={`rounded px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                            copiedImageKey === img.key
                              ? "bg-emerald-500 text-slate-950 font-bold"
                              : "border border-amber-400/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-slate-950"
                          }`}
                        >
                          <Copy size={11} />
                          {copiedImageKey === img.key ? "Copied!" : "Copy Path"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {mediaAssetsList.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.02] overflow-hidden"
                >
                  <div className="h-44 w-full overflow-hidden bg-black/40 relative">
                    <img
                      src={m.directMediaUrl || "/sample-images/artisan-hands.jpg"}
                      alt={m.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/sample-images/artisan-hands.jpg";
                      }}
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                      {m.mediaType}
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-white line-clamp-1">
                        {m.title}
                      </h4>
                      <div className="text-[11px] text-white/50 mt-1 line-clamp-1">
                        Creator: {m.creatorOrPerformer || "Archival"}
                      </div>
                      <div className="text-[10px] text-white/40 mt-0.5">
                        {m.licenseIdentifier}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
                      <span className="text-[#57c5a9]">{m.rightsStatus}</span>
                      <button
                        type="button"
                        onClick={() => triggerDelete("media", m.id, m.title)}
                        className="text-red-300 hover:text-red-200"
                      >
                        <Trash2 size={12} className="inline" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: "record", id: "", name: "" })}
        onConfirm={handleConfirmDelete}
        itemType={deleteModal.type}
        itemName={deleteModal.name}
        loading={deleteLoading}
      />

      {/* Dedicated Living Tradition Edit & Visuals Modal */}
      <EditTraditionModal
        open={editTraditionModalOpen}
        onClose={() => {
          setEditTraditionModalOpen(false);
          setEditTraditionTarget(null);
        }}
        tradition={editTraditionTarget}
        onSaved={handleTraditionSaved}
      />

      {/* Dedicated Living Heritage Practitioner Edit Modal */}
      <EditPractitionerModal
        open={editPractitionerModalOpen}
        onClose={() => {
          setEditPractitionerModalOpen(false);
          setEditPractitionerTarget(null);
        }}
        practitioner={editPractitionerTarget}
        onSaved={handlePractitionerSaved}
      />

      {/* Dedicated Art-Mart Product Edit Modal */}
      <EditProductModal
        open={editProductModalOpen}
        onClose={() => {
          setEditProductModalOpen(false);
          setEditProductTarget(null);
        }}
        product={editProductTarget}
        onSaved={handleProductSaved}
      />

      {/* Dedicated HerCraft Collective Edit Modal */}
      <EditHerCraftModal
        open={editHerCraftModalOpen}
        onClose={() => {
          setEditHerCraftModalOpen(false);
          setEditHerCraftTarget(null);
        }}
        enterprise={editHerCraftTarget}
        onSaved={handleHerCraftSaved}
      />

      {/* Aavishkar Research Convention Master Dossier Modal */}
      <AavishkarDossierModal
        open={showDossierModal}
        onClose={() => setShowDossierModal(false)}
      />
    </div>
  );
}
