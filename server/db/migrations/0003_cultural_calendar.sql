-- =============================================================================
-- BHARAT CULTUREMAP — MIGRATION 0003: FULL CULTURAL CALENDAR & OCCURRENCES
-- Supports confirmed/provisional/seasonal/cancelled/past schedules, recurring
-- traditions vs. verified occurrences, tourist safeguards, and moderation queue
-- =============================================================================

CREATE TABLE IF NOT EXISTS cultural_event_occurrences (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES cultural_events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  start_time TEXT,
  end_time TEXT,
  schedule_status TEXT NOT NULL DEFAULT 'PROVISIONAL' CHECK (schedule_status IN (
    'CONFIRMED',
    'PROVISIONAL',
    'SEASONAL_ESTIMATE',
    'CANCELLED',
    'PAST'
  )),
  verification_note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_event_occurrences_event ON cultural_event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_start ON cultural_event_occurrences(start_date);
