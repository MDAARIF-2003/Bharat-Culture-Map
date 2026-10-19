-- =============================================================================
-- BHARAT CULTUREMAP — MIGRATION 0005: TRADITIONS, MULTI-PLACE LINKS,
-- SOURCE CITATIONS & VERIFIED MEDIA REGISTRY
-- Forward-only idempotent schema extension preserving all existing data
-- =============================================================================

CREATE TABLE IF NOT EXISTS traditions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_native TEXT NOT NULL DEFAULT '',
  native_script_lang TEXT NOT NULL DEFAULT '',
  alternative_names_json TEXT NOT NULL DEFAULT '[]',
  tradition_category TEXT NOT NULL,
  legacy_category TEXT NOT NULL DEFAULT 'Craft',
  subcategory TEXT NOT NULL DEFAULT '',
  unesco_domain TEXT NOT NULL DEFAULT '',
  unesco_status TEXT,
  gi_tag_status TEXT,
  languages_json TEXT NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL,
  cultural_description TEXT NOT NULL DEFAULT '',
  historical_background TEXT NOT NULL DEFAULT '',
  community_context TEXT NOT NULL DEFAULT '',
  techniques_and_materials_json TEXT NOT NULL DEFAULT '[]',
  instruments_or_forms_json TEXT NOT NULL DEFAULT '[]',
  regional_variations_json TEXT NOT NULL DEFAULT '[]',
  learning_opportunities_json TEXT NOT NULL DEFAULT '[]',
  related_tradition_slugs_json TEXT NOT NULL DEFAULT '[]',
  evidence_status TEXT NOT NULL DEFAULT 'OFFICIAL_INSTITUTIONAL',
  verification_notes TEXT NOT NULL DEFAULT '',
  last_reviewed_at TEXT NOT NULL,
  reviewed_by_display TEXT NOT NULL DEFAULT 'Cultural Research Desk',
  consent_and_access_note TEXT NOT NULL DEFAULT '',
  is_sacred_or_restricted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN (
    'DRAFT',
    'UNDER_REVIEW',
    'PUBLISHED',
    'RESTRICTED',
    'ARCHIVED'
  )),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_traditions_slug ON traditions(slug);
CREATE INDEX IF NOT EXISTS idx_traditions_category ON traditions(tradition_category);
CREATE INDEX IF NOT EXISTS idx_traditions_status ON traditions(status);

CREATE TABLE IF NOT EXISTS tradition_places (
  id TEXT PRIMARY KEY,
  tradition_id TEXT NOT NULL REFERENCES traditions(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  state_id TEXT NOT NULL REFERENCES locations(id),
  district_id TEXT REFERENCES locations(id),
  relationship_role TEXT NOT NULL DEFAULT 'PRIMARY_PRACTICE_REGION',
  regional_variant_name TEXT DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_primary INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tradition_places_tradition ON tradition_places(tradition_id);
CREATE INDEX IF NOT EXISTS idx_tradition_places_location ON tradition_places(location_id);
CREATE INDEX IF NOT EXISTS idx_tradition_places_state ON tradition_places(state_id);

CREATE TABLE IF NOT EXISTS source_citations (
  id TEXT PRIMARY KEY,
  tradition_id TEXT REFERENCES traditions(id) ON DELETE CASCADE,
  cultural_record_id TEXT REFERENCES cultural_records(id) ON DELETE SET NULL,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  source_title TEXT NOT NULL,
  source_organisation TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'OFFICIAL_INSTITUTIONAL',
  publication_or_inscribed_date TEXT,
  specific_facts_supported TEXT NOT NULL,
  retrieval_date TEXT NOT NULL,
  attribution_or_reuse_terms TEXT NOT NULL DEFAULT '',
  evidence_status TEXT NOT NULL DEFAULT 'OFFICIAL_INSTITUTIONAL',
  review_status TEXT NOT NULL DEFAULT 'VERIFIED',
  reviewed_by TEXT NOT NULL DEFAULT 'Cultural Research Desk',
  last_reviewed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sources_tradition ON source_citations(tradition_id);
CREATE INDEX IF NOT EXISTS idx_sources_record ON source_citations(cultural_record_id);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  tradition_id TEXT REFERENCES traditions(id) ON DELETE SET NULL,
  cultural_record_id TEXT REFERENCES cultural_records(id) ON DELETE SET NULL,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('IMAGE', 'AUDIO', 'VIDEO')),
  title TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  creator_or_performer TEXT NOT NULL DEFAULT '',
  source_organisation TEXT NOT NULL,
  source_page_url TEXT NOT NULL,
  direct_media_url TEXT,
  embed_url TEXT,
  license_identifier TEXT NOT NULL,
  license_url TEXT,
  attribution_text TEXT NOT NULL,
  rights_status TEXT NOT NULL CHECK (rights_status IN (
    'OPEN_LICENSE_VERIFIED',
    'EMBED_ONLY',
    'PERMISSION_REQUIRED',
    'CONSENT_REQUIRED',
    'RESTRICTED',
    'UNVERIFIED'
  )),
  permission_evidence TEXT NOT NULL DEFAULT '',
  language TEXT DEFAULT '',
  transcript_or_summary TEXT DEFAULT '',
  retrieval_date TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT DEFAULT '',
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN (
    'DRAFT',
    'PUBLISHED',
    'UNPUBLISHED',
    'RESTRICTED',
    'ARCHIVED'
  )),
  is_primary_hero INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_tradition ON media_assets(tradition_id);
CREATE INDEX IF NOT EXISTS idx_media_record ON media_assets(cultural_record_id);
CREATE INDEX IF NOT EXISTS idx_media_rights ON media_assets(rights_status);
