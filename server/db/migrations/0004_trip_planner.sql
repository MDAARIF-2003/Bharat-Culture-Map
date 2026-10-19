-- =============================================================================
-- BHARAT CULTUREMAP — MIGRATION 0004: CULTURE-BASED TRIP PLANNER
-- Persists user-created and customizable cultural trip itineraries
-- =============================================================================

CREATE TABLE IF NOT EXISTS trip_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 2,
  state_id TEXT NOT NULL,
  district_id TEXT,
  place_id TEXT,
  region_label TEXT NOT NULL,
  selected_categories_json TEXT NOT NULL DEFAULT '[]',
  selected_interests_json TEXT NOT NULL DEFAULT '[]',
  confirmed_only INTEGER NOT NULL DEFAULT 0,
  days_json TEXT NOT NULL DEFAULT '[]',
  available_candidates_json TEXT NOT NULL DEFAULT '[]',
  excluded_safeguard_summary_json TEXT NOT NULL DEFAULT '[]',
  disclaimer TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_plans_state ON trip_plans(state_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_district ON trip_plans(district_id);
