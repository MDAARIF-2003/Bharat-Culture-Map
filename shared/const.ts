export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const USER_ROLES = [
  "PUBLIC_USER",
  "SUPER_ADMIN",
  "FIELD_RESEARCHER",
  "LANGUAGE_REVIEWER",
  "FOLKLORE_REVIEWER",
  "PRACTITIONER_APPROVER",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "FIELD_RESEARCHER",
  "LANGUAGE_REVIEWER",
  "FOLKLORE_REVIEWER",
  "PRACTITIONER_APPROVER",
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ACCOUNT_PERSONA_TYPES = [
  "VISITOR",
  "BUYER",
  "PRACTITIONER",
  "ARTISAN_SELLER",
  "HERCRAFT_ENTREPRENEUR",
  "FIELD_RESEARCHER",
  "SUPER_ADMIN",
] as const;
export type AccountPersonaType = (typeof ACCOUNT_PERSONA_TYPES)[number];

export const PUBLIC_REGISTRATION_PERSONAS = [
  "BUYER",
  "PRACTITIONER",
  "ARTISAN_SELLER",
  "HERCRAFT_ENTREPRENEUR",
  "VISITOR",
] as const;
export type PublicRegistrationPersona =
  (typeof PUBLIC_REGISTRATION_PERSONAS)[number];

export const RECORD_ORIGINS = ["FIELD_VERIFIED", "DEMO_REFERENCE"] as const;
export type RecordOrigin = (typeof RECORD_ORIGINS)[number];

export const RECORD_STATUSES = [
  "DRAFT",
  "CONSENT_RECORDED",
  "UNDER_REVIEW",
  "PRACTITIONER_APPROVED",
  "PUBLISHED",
  "RESTRICTED",
  "WITHDRAWN",
  "ARCHIVED",
] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const CULTURE_CATEGORIES = [
  "Craft",
  "Music",
  "Dance",
  "Performance",
  "Festival",
  "Traditional Knowledge",
  "Textile",
  "Food Heritage",
  "Games",
] as const;
export type CultureCategory = (typeof CULTURE_CATEGORIES)[number];

export const TRADITION_DIRECTORY_CATEGORIES = [
  "Classical and folk dance",
  "Classical, folk and regional music",
  "Folk theatre, puppetry and storytelling",
  "Crafts, handloom and textiles",
  "Painting, sculpture and other traditional visual arts",
  "Cuisine and food traditions",
  "Festivals, seasonal practices and cultural events",
  "Oral histories, languages and folklore",
  "Other well-documented living heritage categories",
] as const;
export type TraditionDirectoryCategory =
  (typeof TRADITION_DIRECTORY_CATEGORIES)[number];

export const EVIDENCE_STATUSES = [
  "OFFICIAL_INSTITUTIONAL",
  "ACADEMIC_SPECIALIST",
  "PRACTITIONER_CONFIRMED",
  "COMMUNITY_CONTRIBUTED",
  "UNVERIFIED_INCOMPLETE",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const SOURCE_TYPES = [
  "OFFICIAL_INSTITUTIONAL",
  "UNESCO_ICH_DOSSIER",
  "MINISTRY_OF_CULTURE_PORTAL",
  "SANGEET_NATAK_AKADEMI",
  "GI_REGISTRY_DOCUMENTATION",
  "STATE_CULTURE_GAZETTEER",
  "ACADEMIC_OR_SAHAPEDIA",
  "FIELD_INTERVIEW_RECORD",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const MEDIA_TYPES = ["IMAGE", "AUDIO", "VIDEO"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
export type MediaAssetType = MediaType;

export const MEDIA_RIGHTS_STATUSES = [
  "OPEN_LICENSE_VERIFIED",
  "EMBED_ONLY",
  "PERMISSION_REQUIRED",
  "CONSENT_REQUIRED",
  "RESTRICTED",
  "UNVERIFIED",
] as const;
export type MediaRightsStatus = (typeof MEDIA_RIGHTS_STATUSES)[number];

export const MEDIA_PUBLICATION_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "UNPUBLISHED",
  "RESTRICTED",
  "ARCHIVED",
] as const;
export type MediaPublicationStatus =
  (typeof MEDIA_PUBLICATION_STATUSES)[number];

export const TRADITION_WORKFLOW_STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "PUBLISHED",
  "RESTRICTED",
  "ARCHIVED",
] as const;
export type TraditionWorkflowStatus =
  (typeof TRADITION_WORKFLOW_STATUSES)[number];

export const UNESCO_DOMAINS = [
  "Oral traditions and expressions",
  "Performing arts",
  "Social practices, rituals and festive events",
  "Knowledge and practices concerning nature and the universe",
  "Traditional craftsmanship",
] as const;
export type UnescoDomain = (typeof UNESCO_DOMAINS)[number];

// Section 5 & 6.1 — Cultural Rights Passport Options & Conservative Defaults
export const IDENTITY_DISPLAY_OPTIONS = [
  "FULL_NAME",
  "CHOSEN_NAME",
  "COMMUNITY_NAME",
  "ANONYMOUS",
] as const;
export type IdentityDisplayOption = (typeof IDENTITY_DISPLAY_OPTIONS)[number];

export const LOCATION_GRANULARITY_OPTIONS = [
  "EXACT_WORKSHOP",
  "VILLAGE",
  "CITY_TOWN",
  "TALUKA",
  "DISTRICT",
  "HIDDEN",
] as const;
export type LocationGranularityOption =
  (typeof LOCATION_GRANULARITY_OPTIONS)[number];

export const AUDIO_VIDEO_ACCESS_OPTIONS = [
  "PUBLIC",
  "LIMITED",
  "PRIVATE",
  "NOT_PERMITTED",
] as const;
export type AudioVideoAccessOption =
  (typeof AUDIO_VIDEO_ACCESS_OPTIONS)[number];

export const TRANSLATION_SCOPE_OPTIONS = [
  "ORIGINAL_ONLY",
  "SELECTED_LANGUAGES",
  "NONE",
] as const;
export type TranslationScopeOption =
  (typeof TRANSLATION_SCOPE_OPTIONS)[number];

export const AI_USE_OPTIONS = [
  "NONE",
  "TRANSCRIPT_DRAFT_ONLY",
  "TRANSLATION_DRAFT_ONLY",
  "APPROVED_RETRIEVAL",
] as const;
export type AiUseOption = (typeof AI_USE_OPTIONS)[number];

export const DOWNLOAD_REUSE_OPTIONS = [
  "ALLOWED",
  "EDUCATIONAL_ONLY",
  "PERMISSION_REQUIRED",
  "PROHIBITED",
] as const;
export type DownloadReuseOption = (typeof DOWNLOAD_REUSE_OPTIONS)[number];

export const COMMERCIAL_USE_OPTIONS = [
  "PROHIBITED",
  "PERMISSION_REQUIRED",
  "BENEFIT_SHARING_AGREEMENT",
] as const;
export type CommercialUseOption = (typeof COMMERCIAL_USE_OPTIONS)[number];

export const CONTACT_MODE_OPTIONS = [
  "DIRECT",
  "MODERATED_ENQUIRY",
  "UNAVAILABLE",
] as const;
export type ContactModeOption = (typeof CONTACT_MODE_OPTIONS)[number];

export const WITHDRAWAL_STATUS_OPTIONS = [
  "ACTIVE",
  "CORRECT_REQUESTED",
  "RESTRICTED",
  "REMOVED",
] as const;
export type WithdrawalStatusOption =
  (typeof WITHDRAWAL_STATUS_OPTIONS)[number];

export const CONSENT_MODES = [
  "WRITTEN_SIGNED",
  "WITNESSED_VERBAL",
  "DEMO_PLACEHOLDER",
] as const;
export type ConsentMode = (typeof CONSENT_MODES)[number];

export const PROVENANCE_STEPS = [
  "COLLECTED",
  "CONSENTED",
  "TRANSCRIBED",
  "TRANSLATED",
  "NARRATED",
  "APPROVED",
  "PUBLISHED",
  "RESTRICTED",
  "REMOVED",
] as const;
export type ProvenanceStep = (typeof PROVENANCE_STEPS)[number];

export const CONSERVATIVE_PASSPORT_DEFAULTS = {
  identityDisplay: "CHOSEN_NAME" as IdentityDisplayOption,
  locationGranularity: "DISTRICT" as LocationGranularityOption,
  audioVideoAccess: "PRIVATE" as AudioVideoAccessOption,
  translationScope: "ORIGINAL_ONLY" as TranslationScopeOption,
  aiUse: "NONE" as AiUseOption,
  downloadReuse: "PERMISSION_REQUIRED" as DownloadReuseOption,
  commercialUse: "PROHIBITED" as CommercialUseOption,
  contactMode: "MODERATED_ENQUIRY" as ContactModeOption,
  withdrawalStatus: "ACTIVE" as WithdrawalStatusOption,
} as const;

export const EVENT_SCHEDULE_STATUSES = [
  "CONFIRMED",
  "PROVISIONAL",
  "SEASONAL_ESTIMATE",
  "CANCELLED",
  "PAST",
] as const;
export type EventScheduleStatus = (typeof EVENT_SCHEDULE_STATUSES)[number];

export const EVENT_WORKFLOW_STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "PUBLISHED",
  "UNPUBLISHED",
  "ARCHIVED",
] as const;
export type EventWorkflowStatus = (typeof EVENT_WORKFLOW_STATUSES)[number];

export const EVENT_RECURRENCE_PATTERNS = [
  "SINGLE_OCCURRENCE",
  "ANNUAL_LUNAR_SOLAR_TRADITION",
  "ANNUAL_FIXED_WINDOW",
  "SEASONAL_CYCLE",
  "RECURRING_SERIES",
] as const;
export type EventRecurrencePattern =
  (typeof EVENT_RECURRENCE_PATTERNS)[number];

export const VISITOR_ACCESS_OPTIONS = [
  "OPEN_PUBLIC",
  "DOMESTIC_AND_FOREIGN_PERMITTED",
  "LOCAL_COMMUNITY_ONLY",
  "INVITATION_OR_PERMIT_REQUIRED",
  "RESTRICTED_OR_PRIVATE",
  "ACCESS_NOT_ESTABLISHED",
] as const;
export type VisitorAccessOption = (typeof VISITOR_ACCESS_OPTIONS)[number];

export const REGISTRATION_REQUIREMENT_OPTIONS = [
  "NONE",
  "ADVANCE_REGISTRATION_REQUIRED",
  "MODERATED_ENQUIRY_REQUIRED",
  "TICKETED_ENTRY",
  "NOT_ESTABLISHED",
] as const;
export type RegistrationRequirementOption =
  (typeof REGISTRATION_REQUIREMENT_OPTIONS)[number];

export const PHOTOGRAPHY_RULE_OPTIONS = [
  "ALLOWED_NON_COMMERCIAL",
  "PERMISSION_REQUIRED_ON_SITE",
  "NO_FLASH_OR_DRONES",
  "PROHIBITED",
] as const;
export type PhotographyRuleOption = (typeof PHOTOGRAPHY_RULE_OPTIONS)[number];

export const VISITOR_INTEREST_TAGS = [
  "Craft & Making",
  "Music & Ballads",
  "Ritual & Performance",
  "Workshops & Learning",
  "Regional Festivals",
  "Oral History & Folklore",
] as const;
export type VisitorInterestTag = (typeof VISITOR_INTEREST_TAGS)[number];
