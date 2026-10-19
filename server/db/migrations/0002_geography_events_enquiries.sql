-- =============================================================================
-- BHARAT CULTUREMAP — MIGRATION 0002: GEOGRAPHY METADATA, EVENTS & ENQUIRIES
-- Supports comprehensive administrative hierarchy, cultural events, and enquiries
-- =============================================================================

CREATE TABLE IF NOT EXISTS cultural_events (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_mr TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'CULTURAL_GATHERING',
  description_en TEXT NOT NULL,
  description_mr TEXT DEFAULT '',
  cultural_record_id TEXT,
  state_id TEXT NOT NULL REFERENCES locations(id),
  district_id TEXT REFERENCES locations(id),
  taluka_id TEXT REFERENCES locations(id),
  city_town_id TEXT REFERENCES locations(id),
  venue_label TEXT NOT NULL DEFAULT '',
  location_granularity TEXT DEFAULT 'CITY_TOWN',
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  exact_lat_private REAL,
  exact_lng_private REAL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  start_time TEXT,
  end_time TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  schedule_status TEXT DEFAULT 'CONFIRMED',
  cancellation_reason TEXT,
  is_recurring_tradition INTEGER DEFAULT 0,
  recurrence_pattern TEXT DEFAULT 'SINGLE_OCCURRENCE',
  recurrence_note TEXT DEFAULT '',
  occurrences_json TEXT DEFAULT '[]',
  organizer_display TEXT NOT NULL DEFAULT '',
  organizer_contact_authorized INTEGER DEFAULT 0,
  organizer_public_contact TEXT,
  organizer_website_url TEXT,
  organizer_private_contact TEXT DEFAULT '',
  source_attribution TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  last_verified_at TEXT,
  verified_by_display TEXT,
  visitor_access TEXT DEFAULT 'OPEN_PUBLIC',
  visitor_access_note TEXT DEFAULT '',
  registration_requirement TEXT DEFAULT 'NONE',
  etiquette_notes TEXT DEFAULT '',
  photography_rule TEXT DEFAULT 'PERMISSION_REQUIRED_ON_SITE',
  entry_fee_info TEXT,
  accessibility_info TEXT,
  cover_image_url TEXT,
  approved_media_urls_json TEXT DEFAULT '[]',
  related_practitioners_json TEXT DEFAULT '[]',
  visitor_interests_json TEXT DEFAULT '[]',
  is_private_or_restricted_ceremony INTEGER DEFAULT 0,
  review_notes TEXT DEFAULT '',
  submitted_by_public_name TEXT,
  submitted_by_public_contact TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN (
    'DRAFT',
    'UNDER_REVIEW',
    'PUBLISHED',
    'UNPUBLISHED',
    'ARCHIVED'
  )),
  workflow_status TEXT DEFAULT 'PUBLISHED',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status ON cultural_events(status);
CREATE INDEX IF NOT EXISTS idx_events_state ON cultural_events(state_id);
CREATE INDEX IF NOT EXISTS idx_events_district ON cultural_events(district_id);

CREATE TABLE IF NOT EXISTS community_enquiries (
  id TEXT PRIMARY KEY,
  enquiry_type TEXT NOT NULL CHECK (enquiry_type IN (
    'WORKSHOP_ENQUIRY',
    'PRACTITIONER_NOMINATION',
    'MAKERS_ENQUIRY',
    'PLACE_CONTRIBUTION',
    'GENERAL_CONTACT'
  )),
  cultural_record_id TEXT,
  location_id TEXT,
  event_id TEXT,
  sender_name TEXT NOT NULL,
  sender_contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN (
    'PENDING_REVIEW',
    'REVIEWED',
    'ARCHIVED'
  )),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON community_enquiries(status);
