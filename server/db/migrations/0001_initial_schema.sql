-- =============================================================================
-- BHARAT CULTUREMAP — MIGRATION 0001: INITIAL SCHEMA
-- Supports SQLite 3 (WAL mode) and standard SQL types for PostgreSQL portability
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'PUBLIC_USER',
    'SUPER_ADMIN',
    'FIELD_RESEARCHER',
    'LANGUAGE_REVIEWER',
    'FOLKLORE_REVIEWER',
    'PRACTITIONER_APPROVER'
  )),
  account_type TEXT DEFAULT 'VISITOR',
  bio TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location_label TEXT DEFAULT '',
  organisation_or_guild TEXT DEFAULT '',
  preferred_language TEXT DEFAULT 'English',
  linked_practitioner_id TEXT,
  linked_seller_id TEXT,
  linked_hercraft_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN (
    'COUNTRY',
    'STATE',
    'DISTRICT',
    'TALUKA',
    'CITY_TOWN',
    'VILLAGE'
  )),
  name_en TEXT NOT NULL,
  name_mr TEXT,
  abbr TEXT,
  parent_id TEXT REFERENCES locations(id),
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  default_zoom INTEGER NOT NULL DEFAULT 7
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_level ON locations(level);

CREATE TABLE IF NOT EXISTS cultural_records (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  tradition_id TEXT,
  tradition_slug TEXT,
  record_origin TEXT NOT NULL DEFAULT 'FIELD_VERIFIED' CHECK (record_origin IN (
    'FIELD_VERIFIED',
    'DEMO_REFERENCE'
  )),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT',
    'CONSENT_RECORDED',
    'UNDER_REVIEW',
    'PRACTITIONER_APPROVED',
    'PUBLISHED',
    'RESTRICTED',
    'WITHDRAWN',
    'ARCHIVED'
  )),
  unesco_domain TEXT NOT NULL,
  category TEXT NOT NULL,
  is_women_led INTEGER NOT NULL DEFAULT 0,
  is_sacred_or_restricted INTEGER NOT NULL DEFAULT 0,
  -- Practitioner details (private fields never exposed in public serializer)
  practitioner_full_name_private TEXT NOT NULL DEFAULT '',
  practitioner_chosen_name TEXT NOT NULL DEFAULT '',
  practitioner_community_name TEXT NOT NULL DEFAULT '',
  practitioner_village_private TEXT DEFAULT '',
  practitioner_taluka TEXT DEFAULT '',
  practitioner_phone_private TEXT DEFAULT '',
  practitioner_address_private TEXT DEFAULT '',
  -- Geographic hierarchy
  state_id TEXT NOT NULL REFERENCES locations(id),
  district_id TEXT REFERENCES locations(id),
  taluka_id TEXT REFERENCES locations(id),
  city_town_id TEXT REFERENCES locations(id),
  exact_lat_private REAL,
  exact_lng_private REAL,
  -- Cultural content
  title_en TEXT NOT NULL,
  title_mr TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL,
  summary_mr TEXT NOT NULL DEFAULT '',
  practice_context_en TEXT NOT NULL DEFAULT '',
  practice_context_mr TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  hero_image_url TEXT NOT NULL DEFAULT '',
  source_attribution TEXT,
  source_url TEXT,
  -- Original Voice & 3-Mode Mediation (HLFA Section 4.6)
  original_voice_language TEXT NOT NULL DEFAULT 'Marathi',
  original_voice_audio_url TEXT,
  original_voice_transcript_mr TEXT,
  mediation_m1_subtitles_en TEXT,
  mediation_m2_synthetic_context_text TEXT,
  mediation_m3_human_story_companion_text TEXT,
  mediation_m3_narrator_credit TEXT,
  story_companion_prompts_json TEXT NOT NULL DEFAULT '[]',
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_records_status ON cultural_records(status);
CREATE INDEX IF NOT EXISTS idx_records_origin ON cultural_records(record_origin);
CREATE INDEX IF NOT EXISTS idx_records_state ON cultural_records(state_id);
CREATE INDEX IF NOT EXISTS idx_records_district ON cultural_records(district_id);
CREATE INDEX IF NOT EXISTS idx_records_taluka ON cultural_records(taluka_id);

CREATE TABLE IF NOT EXISTS rights_passports (
  id TEXT PRIMARY KEY,
  cultural_record_id TEXT NOT NULL UNIQUE REFERENCES cultural_records(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  -- Three-part consent (HLFA Section 5)
  consent_taking_part INTEGER NOT NULL DEFAULT 0,
  consent_being_recorded INTEGER NOT NULL DEFAULT 0,
  consent_public_use INTEGER NOT NULL DEFAULT 0,
  consent_mode TEXT NOT NULL DEFAULT 'WRITTEN_SIGNED' CHECK (consent_mode IN (
    'WRITTEN_SIGNED',
    'WITNESSED_VERBAL',
    'DEMO_PLACEHOLDER'
  )),
  witness_name_private TEXT,
  consent_signed_at TEXT,
  -- Part B 7 statements JSON (HLFA Section 6.1)
  statements_json TEXT NOT NULL DEFAULT '{}',
  -- Part C 9 Passport fields with conservative defaults (HLFA Section 5 & 6.1)
  identity_display TEXT NOT NULL DEFAULT 'CHOSEN_NAME' CHECK (identity_display IN (
    'FULL_NAME', 'CHOSEN_NAME', 'COMMUNITY_NAME', 'ANONYMOUS'
  )),
  location_granularity TEXT NOT NULL DEFAULT 'DISTRICT' CHECK (location_granularity IN (
    'EXACT_WORKSHOP', 'VILLAGE', 'CITY_TOWN', 'TALUKA', 'DISTRICT', 'HIDDEN'
  )),
  audio_video_access TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (audio_video_access IN (
    'PUBLIC', 'LIMITED', 'PRIVATE', 'NOT_PERMITTED'
  )),
  translation_scope TEXT NOT NULL DEFAULT 'ORIGINAL_ONLY' CHECK (translation_scope IN (
    'ORIGINAL_ONLY', 'SELECTED_LANGUAGES', 'NONE'
  )),
  allowed_translation_languages_json TEXT NOT NULL DEFAULT '[]',
  ai_use TEXT NOT NULL DEFAULT 'NONE' CHECK (ai_use IN (
    'NONE', 'TRANSCRIPT_DRAFT_ONLY', 'TRANSLATION_DRAFT_ONLY', 'APPROVED_RETRIEVAL'
  )),
  download_reuse TEXT NOT NULL DEFAULT 'PERMISSION_REQUIRED' CHECK (download_reuse IN (
    'ALLOWED', 'EDUCATIONAL_ONLY', 'PERMISSION_REQUIRED', 'PROHIBITED'
  )),
  commercial_use TEXT NOT NULL DEFAULT 'PROHIBITED' CHECK (commercial_use IN (
    'PROHIBITED', 'PERMISSION_REQUIRED', 'BENEFIT_SHARING_AGREEMENT'
  )),
  contact_mode TEXT NOT NULL DEFAULT 'MODERATED_ENQUIRY' CHECK (contact_mode IN (
    'DIRECT', 'MODERATED_ENQUIRY', 'UNAVAILABLE'
  )),
  withdrawal_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (withdrawal_status IN (
    'ACTIVE', 'CORRECT_REQUESTED', 'RESTRICTED', 'REMOVED'
  )),
  practitioner_confirmed_at TEXT,
  pre_release_reconfirmed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS heritage_vocabulary (
  id TEXT PRIMARY KEY,
  cultural_record_id TEXT NOT NULL REFERENCES cultural_records(id) ON DELETE CASCADE,
  term_roman TEXT NOT NULL,
  term_devanagari TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'mr',
  meaning_en TEXT NOT NULL,
  meaning_mr TEXT DEFAULT '',
  misunderstood_note TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_vocab_record ON heritage_vocabulary(cultural_record_id);

CREATE TABLE IF NOT EXISTS provenance_logs (
  id TEXT PRIMARY KEY,
  cultural_record_id TEXT NOT NULL REFERENCES cultural_records(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN (
    'COLLECTED',
    'CONSENTED',
    'TRANSCRIBED',
    'TRANSLATED',
    'NARRATED',
    'APPROVED',
    'PUBLISHED',
    'RESTRICTED',
    'REMOVED'
  )),
  performed_by_user_id TEXT REFERENCES users(id),
  performed_by_role TEXT NOT NULL,
  performed_by_display TEXT NOT NULL,
  practitioner_approved INTEGER NOT NULL DEFAULT 0,
  practitioner_approved_at TEXT,
  version_label TEXT NOT NULL DEFAULT 'v1',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provenance_record ON provenance_logs(cultural_record_id);
