import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SqliteDriverName =
  | "better-sqlite3"
  | "node:sqlite"
  | "portable-file-store";

export interface SqlitePreparedStatement {
  run(...args: any[]): unknown;
  get(...args: any[]): any;
  all(...args: any[]): any[];
}

export interface SqliteDatabaseAdapter {
  readonly driverName: "better-sqlite3" | "node:sqlite";
  readonly dbPath: string;
  exec(sql: string): void;
  prepare(sql: string): SqlitePreparedStatement;
  transaction<T>(fn: () => T): () => T;
  close(): void;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the SQL migration file path reliably regardless of current working directory
 * (supports project root, `client/` root under Vite/Vitest, and `dist/` production bundle).
 */
export function resolveMigrationSqlPath(
  filename = "0001_initial_schema.sql"
): string {
  const candidates = [
    path.resolve(process.cwd(), "server", "db", "migrations", filename),
    path.resolve(process.cwd(), "..", "server", "db", "migrations", filename),
    path.resolve(__dirname, "migrations", filename),
    path.resolve(__dirname, "..", "server", "db", "migrations", filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

function coerceSqlValue(val: unknown): unknown {
  if (val === undefined) return null;
  if (typeof val === "boolean") return val ? 1 : 0;
  return val;
}

/**
 * Wraps a raw SQLite prepared statement (`better-sqlite3` or `node:sqlite` `DatabaseSync`)
 * so that `@paramName` named parameters are normalized into standard positional `?`
 * bindings with `undefined` safely coerced to `null` and booleans coerced to `1 | 0`.
 */
function createNormalizedStatement(
  rawDb: any,
  sql: string
): SqlitePreparedStatement {
  const paramNames: string[] = [];
  const positionalSql = sql.replace(
    /@([a-zA-Z0-9_]+)/g,
    (_match, name: string) => {
      paramNames.push(name);
      return "?";
    }
  );

  const stmt = rawDb.prepare(positionalSql);

  function normalizeArgs(args: any[]): any[] {
    if (
      paramNames.length > 0 &&
      args.length === 1 &&
      args[0] !== null &&
      typeof args[0] === "object" &&
      !Array.isArray(args[0]) &&
      !(args[0] instanceof Uint8Array)
    ) {
      const record = args[0] as Record<string, unknown>;
      return paramNames.map((key) => coerceSqlValue(record[key]));
    }
    return args.map((v) => coerceSqlValue(v));
  }

  return {
    run(...args: any[]) {
      return stmt.run(...normalizeArgs(args));
    },
    get(...args: any[]) {
      return stmt.get(...normalizeArgs(args));
    },
    all(...args: any[]) {
      return stmt.all(...normalizeArgs(args));
    },
  };
}

/**
 * Canonical column definitions required across all tables used by `loadFromSqlite()`
 * and `persistSnapshot()`. Used to forward-migrate any existing SQLite database
 * created by an earlier schema version without dropping tables or losing records.
 */
const CANONICAL_COLUMN_MIGRATIONS: Record<string, Array<[string, string]>> = {
  users: [
    ["email", "TEXT NOT NULL DEFAULT ''"],
    ["password_hash", "TEXT NOT NULL DEFAULT ''"],
    ["full_name", "TEXT NOT NULL DEFAULT ''"],
    ["role", "TEXT NOT NULL DEFAULT 'PUBLIC_USER'"],
    ["account_type", "TEXT DEFAULT 'VISITOR'"],
    ["bio", "TEXT DEFAULT ''"],
    ["phone", "TEXT DEFAULT ''"],
    ["location_label", "TEXT DEFAULT ''"],
    ["organisation_or_guild", "TEXT DEFAULT ''"],
    ["preferred_language", "TEXT DEFAULT 'English'"],
    ["linked_practitioner_id", "TEXT"],
    ["linked_seller_id", "TEXT"],
    ["linked_hercraft_id", "TEXT"],
    ["is_active", "INTEGER NOT NULL DEFAULT 1"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
    ["updated_at", "TEXT DEFAULT ''"],
  ],
  locations: [
    ["level", "TEXT NOT NULL DEFAULT 'CITY_TOWN'"],
    ["name_en", "TEXT NOT NULL DEFAULT ''"],
    ["name_mr", "TEXT"],
    ["abbr", "TEXT"],
    ["parent_id", "TEXT"],
    ["center_lat", "REAL NOT NULL DEFAULT 0"],
    ["center_lng", "REAL NOT NULL DEFAULT 0"],
    ["default_zoom", "INTEGER NOT NULL DEFAULT 7"],
  ],
  cultural_records: [
    ["slug", "TEXT NOT NULL DEFAULT ''"],
    ["tradition_id", "TEXT"],
    ["tradition_slug", "TEXT"],
    ["record_origin", "TEXT NOT NULL DEFAULT 'FIELD_VERIFIED'"],
    ["status", "TEXT NOT NULL DEFAULT 'DRAFT'"],
    ["unesco_domain", "TEXT NOT NULL DEFAULT ''"],
    ["category", "TEXT NOT NULL DEFAULT 'Craft'"],
    ["is_women_led", "INTEGER NOT NULL DEFAULT 0"],
    ["is_sacred_or_restricted", "INTEGER NOT NULL DEFAULT 0"],
    ["practitioner_full_name_private", "TEXT NOT NULL DEFAULT ''"],
    ["practitioner_chosen_name", "TEXT NOT NULL DEFAULT ''"],
    ["practitioner_community_name", "TEXT NOT NULL DEFAULT ''"],
    ["practitioner_village_private", "TEXT DEFAULT ''"],
    ["practitioner_taluka", "TEXT DEFAULT ''"],
    ["practitioner_phone_private", "TEXT DEFAULT ''"],
    ["practitioner_address_private", "TEXT DEFAULT ''"],
    ["state_id", "TEXT NOT NULL DEFAULT 'loc-state-maharashtra'"],
    ["district_id", "TEXT"],
    ["taluka_id", "TEXT"],
    ["city_town_id", "TEXT"],
    ["exact_lat_private", "REAL"],
    ["exact_lng_private", "REAL"],
    ["title_en", "TEXT NOT NULL DEFAULT ''"],
    ["title_mr", "TEXT NOT NULL DEFAULT ''"],
    ["subtitle_en", "TEXT NOT NULL DEFAULT ''"],
    ["summary_en", "TEXT NOT NULL DEFAULT ''"],
    ["summary_mr", "TEXT NOT NULL DEFAULT ''"],
    ["practice_context_en", "TEXT NOT NULL DEFAULT ''"],
    ["practice_context_mr", "TEXT NOT NULL DEFAULT ''"],
    ["tags_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["hero_image_url", "TEXT NOT NULL DEFAULT ''"],
    ["source_attribution", "TEXT"],
    ["source_url", "TEXT"],
    ["original_voice_language", "TEXT NOT NULL DEFAULT 'Marathi'"],
    ["original_voice_audio_url", "TEXT"],
    ["original_voice_transcript_mr", "TEXT"],
    ["mediation_m1_subtitles_en", "TEXT"],
    ["mediation_m2_synthetic_context_text", "TEXT"],
    ["mediation_m3_human_story_companion_text", "TEXT"],
    ["mediation_m3_narrator_credit", "TEXT"],
    ["story_companion_prompts_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["published_at", "TEXT"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
    ["updated_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  rights_passports: [
    ["cultural_record_id", "TEXT NOT NULL DEFAULT ''"],
    ["version", "INTEGER NOT NULL DEFAULT 1"],
    ["consent_taking_part", "INTEGER NOT NULL DEFAULT 0"],
    ["consent_being_recorded", "INTEGER NOT NULL DEFAULT 0"],
    ["consent_public_use", "INTEGER NOT NULL DEFAULT 0"],
    ["consent_mode", "TEXT NOT NULL DEFAULT 'WRITTEN_SIGNED'"],
    ["witness_name_private", "TEXT"],
    ["consent_signed_at", "TEXT"],
    ["statements_json", "TEXT NOT NULL DEFAULT '{}'"],
    ["identity_display", "TEXT NOT NULL DEFAULT 'CHOSEN_NAME'"],
    ["location_granularity", "TEXT NOT NULL DEFAULT 'DISTRICT'"],
    ["audio_video_access", "TEXT NOT NULL DEFAULT 'PRIVATE'"],
    ["translation_scope", "TEXT NOT NULL DEFAULT 'ORIGINAL_ONLY'"],
    ["allowed_translation_languages_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["ai_use", "TEXT NOT NULL DEFAULT 'NONE'"],
    ["download_reuse", "TEXT NOT NULL DEFAULT 'PERMISSION_REQUIRED'"],
    ["commercial_use", "TEXT NOT NULL DEFAULT 'PROHIBITED'"],
    ["contact_mode", "TEXT NOT NULL DEFAULT 'MODERATED_ENQUIRY'"],
    ["withdrawal_status", "TEXT NOT NULL DEFAULT 'ACTIVE'"],
    ["practitioner_confirmed_at", "TEXT"],
    ["pre_release_reconfirmed_at", "TEXT"],
    ["updated_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  heritage_vocabulary: [
    ["cultural_record_id", "TEXT NOT NULL DEFAULT ''"],
    ["term_roman", "TEXT NOT NULL DEFAULT ''"],
    ["term_devanagari", "TEXT NOT NULL DEFAULT ''"],
    ["language_code", "TEXT NOT NULL DEFAULT 'mr'"],
    ["meaning_en", "TEXT NOT NULL DEFAULT ''"],
    ["meaning_mr", "TEXT DEFAULT ''"],
    ["misunderstood_note", "TEXT DEFAULT ''"],
  ],
  provenance_logs: [
    ["cultural_record_id", "TEXT NOT NULL DEFAULT ''"],
    ["step_type", "TEXT NOT NULL DEFAULT 'COLLECTED'"],
    ["performed_by_user_id", "TEXT"],
    ["performed_by_role", "TEXT NOT NULL DEFAULT ''"],
    ["performed_by_display", "TEXT NOT NULL DEFAULT ''"],
    ["practitioner_approved", "INTEGER NOT NULL DEFAULT 0"],
    ["practitioner_approved_at", "TEXT"],
    ["version_label", "TEXT NOT NULL DEFAULT 'v1'"],
    ["notes", "TEXT NOT NULL DEFAULT ''"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  cultural_events: [
    ["title_en", "TEXT NOT NULL DEFAULT ''"],
    ["title_mr", "TEXT NOT NULL DEFAULT ''"],
    ["category", "TEXT NOT NULL DEFAULT 'Festival'"],
    ["event_type", "TEXT NOT NULL DEFAULT 'CULTURAL_GATHERING'"],
    ["description_en", "TEXT NOT NULL DEFAULT ''"],
    ["description_mr", "TEXT DEFAULT ''"],
    ["cultural_record_id", "TEXT"],
    ["state_id", "TEXT NOT NULL DEFAULT 'loc-state-maharashtra'"],
    ["district_id", "TEXT"],
    ["taluka_id", "TEXT"],
    ["city_town_id", "TEXT"],
    ["venue_label", "TEXT NOT NULL DEFAULT ''"],
    ["location_granularity", "TEXT DEFAULT 'CITY_TOWN'"],
    ["center_lat", "REAL NOT NULL DEFAULT 0"],
    ["center_lng", "REAL NOT NULL DEFAULT 0"],
    ["exact_lat_private", "REAL"],
    ["exact_lng_private", "REAL"],
    ["start_date", "TEXT NOT NULL DEFAULT ''"],
    ["end_date", "TEXT"],
    ["start_time", "TEXT"],
    ["end_time", "TEXT"],
    ["timezone", "TEXT DEFAULT 'Asia/Kolkata'"],
    ["schedule_status", "TEXT DEFAULT 'CONFIRMED'"],
    ["cancellation_reason", "TEXT"],
    ["is_recurring_tradition", "INTEGER DEFAULT 0"],
    ["recurrence_pattern", "TEXT DEFAULT 'SINGLE_OCCURRENCE'"],
    ["recurrence_note", "TEXT DEFAULT ''"],
    ["occurrences_json", "TEXT DEFAULT '[]'"],
    ["organizer_display", "TEXT NOT NULL DEFAULT ''"],
    ["organizer_contact_authorized", "INTEGER DEFAULT 0"],
    ["organizer_public_contact", "TEXT"],
    ["organizer_website_url", "TEXT"],
    ["organizer_private_contact", "TEXT DEFAULT ''"],
    ["source_attribution", "TEXT NOT NULL DEFAULT ''"],
    ["source_url", "TEXT"],
    ["last_verified_at", "TEXT"],
    ["verified_by_display", "TEXT"],
    ["visitor_access", "TEXT DEFAULT 'OPEN_PUBLIC'"],
    ["visitor_access_note", "TEXT DEFAULT ''"],
    ["registration_requirement", "TEXT DEFAULT 'NONE'"],
    ["etiquette_notes", "TEXT DEFAULT ''"],
    ["photography_rule", "TEXT DEFAULT 'PERMISSION_REQUIRED_ON_SITE'"],
    ["entry_fee_info", "TEXT"],
    ["accessibility_info", "TEXT"],
    ["cover_image_url", "TEXT"],
    ["approved_media_urls_json", "TEXT DEFAULT '[]'"],
    ["related_practitioners_json", "TEXT DEFAULT '[]'"],
    ["visitor_interests_json", "TEXT DEFAULT '[]'"],
    ["is_private_or_restricted_ceremony", "INTEGER DEFAULT 0"],
    ["review_notes", "TEXT DEFAULT ''"],
    ["submitted_by_public_name", "TEXT"],
    ["submitted_by_public_contact", "TEXT"],
    ["status", "TEXT NOT NULL DEFAULT 'PUBLISHED'"],
    ["workflow_status", "TEXT DEFAULT 'PUBLISHED'"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
    ["updated_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  cultural_event_occurrences: [
    ["event_id", "TEXT NOT NULL DEFAULT ''"],
    ["label", "TEXT NOT NULL DEFAULT ''"],
    ["start_date", "TEXT NOT NULL DEFAULT ''"],
    ["end_date", "TEXT"],
    ["start_time", "TEXT"],
    ["end_time", "TEXT"],
    ["schedule_status", "TEXT NOT NULL DEFAULT 'PROVISIONAL'"],
    ["verification_note", "TEXT NOT NULL DEFAULT ''"],
  ],
  community_enquiries: [
    ["enquiry_type", "TEXT NOT NULL DEFAULT 'GENERAL_CONTACT'"],
    ["cultural_record_id", "TEXT"],
    ["location_id", "TEXT"],
    ["event_id", "TEXT"],
    ["sender_name", "TEXT NOT NULL DEFAULT ''"],
    ["sender_contact", "TEXT NOT NULL DEFAULT ''"],
    ["message", "TEXT NOT NULL DEFAULT ''"],
    ["status", "TEXT NOT NULL DEFAULT 'PENDING_REVIEW'"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  trip_plans: [
    ["title", "TEXT NOT NULL DEFAULT ''"],
    ["start_date", "TEXT NOT NULL DEFAULT ''"],
    ["end_date", "TEXT NOT NULL DEFAULT ''"],
    ["duration_days", "INTEGER NOT NULL DEFAULT 2"],
    ["state_id", "TEXT NOT NULL DEFAULT 'loc-state-maharashtra'"],
    ["district_id", "TEXT"],
    ["place_id", "TEXT"],
    ["region_label", "TEXT NOT NULL DEFAULT ''"],
    ["selected_categories_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["selected_interests_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["confirmed_only", "INTEGER NOT NULL DEFAULT 0"],
    ["days_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["available_candidates_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["excluded_safeguard_summary_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["disclaimer", "TEXT NOT NULL DEFAULT ''"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
    ["updated_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  traditions: [
    ["slug", "TEXT NOT NULL DEFAULT ''"],
    ["name_en", "TEXT NOT NULL DEFAULT ''"],
    ["name_native", "TEXT NOT NULL DEFAULT ''"],
    ["native_script_lang", "TEXT NOT NULL DEFAULT ''"],
    ["alternative_names_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["tradition_category", "TEXT NOT NULL DEFAULT ''"],
    ["legacy_category", "TEXT NOT NULL DEFAULT 'Craft'"],
    ["subcategory", "TEXT NOT NULL DEFAULT ''"],
    ["unesco_domain", "TEXT NOT NULL DEFAULT ''"],
    ["unesco_status", "TEXT"],
    ["gi_tag_status", "TEXT"],
    ["languages_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["summary", "TEXT NOT NULL DEFAULT ''"],
    ["cultural_description", "TEXT NOT NULL DEFAULT ''"],
    ["historical_background", "TEXT NOT NULL DEFAULT ''"],
    ["community_context", "TEXT NOT NULL DEFAULT ''"],
    ["techniques_and_materials_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["instruments_or_forms_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["regional_variations_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["learning_opportunities_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["related_tradition_slugs_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["evidence_status", "TEXT NOT NULL DEFAULT 'OFFICIAL_INSTITUTIONAL'"],
    ["verification_notes", "TEXT NOT NULL DEFAULT ''"],
    ["last_reviewed_at", "TEXT NOT NULL DEFAULT ''"],
    ["reviewed_by_display", "TEXT NOT NULL DEFAULT ''"],
    ["consent_and_access_note", "TEXT NOT NULL DEFAULT ''"],
    ["is_sacred_or_restricted", "INTEGER NOT NULL DEFAULT 0"],
    ["status", "TEXT NOT NULL DEFAULT 'PUBLISHED'"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
    ["updated_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  tradition_places: [
    ["tradition_id", "TEXT NOT NULL DEFAULT ''"],
    ["location_id", "TEXT NOT NULL DEFAULT ''"],
    ["state_id", "TEXT NOT NULL DEFAULT ''"],
    ["district_id", "TEXT"],
    ["relationship_role", "TEXT NOT NULL DEFAULT 'PRIMARY_PRACTICE_REGION'"],
    ["regional_variant_name", "TEXT DEFAULT ''"],
    ["notes", "TEXT NOT NULL DEFAULT ''"],
    ["is_primary", "INTEGER NOT NULL DEFAULT 0"],
  ],
  source_citations: [
    ["tradition_id", "TEXT"],
    ["cultural_record_id", "TEXT"],
    ["location_id", "TEXT"],
    ["source_title", "TEXT NOT NULL DEFAULT ''"],
    ["source_organisation", "TEXT NOT NULL DEFAULT ''"],
    ["source_url", "TEXT NOT NULL DEFAULT ''"],
    ["source_type", "TEXT NOT NULL DEFAULT 'OFFICIAL_INSTITUTIONAL'"],
    ["publication_or_inscribed_date", "TEXT"],
    ["specific_facts_supported", "TEXT NOT NULL DEFAULT ''"],
    ["retrieval_date", "TEXT NOT NULL DEFAULT ''"],
    ["attribution_or_reuse_terms", "TEXT NOT NULL DEFAULT ''"],
    ["evidence_status", "TEXT NOT NULL DEFAULT 'OFFICIAL_INSTITUTIONAL'"],
    ["review_status", "TEXT NOT NULL DEFAULT 'VERIFIED'"],
    ["reviewed_by", "TEXT NOT NULL DEFAULT ''"],
    ["last_reviewed_at", "TEXT NOT NULL DEFAULT ''"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
  ],
  media_assets: [
    ["tradition_id", "TEXT"],
    ["cultural_record_id", "TEXT"],
    ["location_id", "TEXT"],
    ["media_type", "TEXT NOT NULL DEFAULT 'IMAGE'"],
    ["title", "TEXT NOT NULL DEFAULT ''"],
    ["caption", "TEXT NOT NULL DEFAULT ''"],
    ["alt_text", "TEXT NOT NULL DEFAULT ''"],
    ["creator_or_performer", "TEXT NOT NULL DEFAULT ''"],
    ["source_organisation", "TEXT NOT NULL DEFAULT ''"],
    ["source_page_url", "TEXT NOT NULL DEFAULT ''"],
    ["direct_media_url", "TEXT"],
    ["embed_url", "TEXT"],
    ["license_identifier", "TEXT NOT NULL DEFAULT ''"],
    ["license_url", "TEXT"],
    ["attribution_text", "TEXT NOT NULL DEFAULT ''"],
    ["rights_status", "TEXT NOT NULL DEFAULT 'UNVERIFIED'"],
    ["permission_evidence", "TEXT NOT NULL DEFAULT ''"],
    ["language", "TEXT DEFAULT ''"],
    ["transcript_or_summary", "TEXT DEFAULT ''"],
    ["retrieval_date", "TEXT NOT NULL DEFAULT ''"],
    ["reviewed_at", "TEXT"],
    ["reviewed_by", "TEXT DEFAULT ''"],
    ["publication_status", "TEXT NOT NULL DEFAULT 'DRAFT'"],
    ["is_primary_hero", "INTEGER NOT NULL DEFAULT 0"],
    ["created_at", "TEXT NOT NULL DEFAULT ''"],
  ],
};

function ensureTableColumns(adapter: SqliteDatabaseAdapter): void {
  for (const [tableName, columns] of Object.entries(
    CANONICAL_COLUMN_MIGRATIONS
  )) {
    const existingRows = adapter
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();
    if (!existingRows || existingRows.length === 0) {
      continue;
    }
    const existingNames = new Set(
      existingRows.map((row: any) => String(row.name))
    );
    for (const [colName, colDef] of columns) {
      if (!existingNames.has(colName)) {
        adapter.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colDef}`);
      }
    }
  }
}

/**
 * Upgrades an older `rights_passports` table if its `CHECK (location_granularity IN (...))`
 * constraint was created before `'CITY_TOWN'` was added, preserving 100% of existing rows.
 */
function ensureRightsPassportsConstraintUpgraded(
  adapter: SqliteDatabaseAdapter
): void {
  const masterRow = adapter
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'rights_passports'"
    )
    .get();
  if (!masterRow || typeof masterRow.sql !== "string") return;
  if (masterRow.sql.includes("'CITY_TOWN'")) return;

  adapter.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN IMMEDIATE;
    CREATE TABLE rights_passports_v2 (
      id TEXT PRIMARY KEY,
      cultural_record_id TEXT NOT NULL UNIQUE REFERENCES cultural_records(id) ON DELETE CASCADE,
      version INTEGER NOT NULL DEFAULT 1,
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
      statements_json TEXT NOT NULL DEFAULT '{}',
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
    INSERT INTO rights_passports_v2 (
      id, cultural_record_id, version, consent_taking_part, consent_being_recorded, consent_public_use,
      consent_mode, witness_name_private, consent_signed_at, statements_json,
      identity_display, location_granularity, audio_video_access, translation_scope,
      allowed_translation_languages_json, ai_use, download_reuse, commercial_use, contact_mode,
      withdrawal_status, practitioner_confirmed_at, pre_release_reconfirmed_at, updated_at
    )
    SELECT
      id, cultural_record_id, version, consent_taking_part, consent_being_recorded, consent_public_use,
      consent_mode, witness_name_private, consent_signed_at, statements_json,
      identity_display, location_granularity, audio_video_access, translation_scope,
      allowed_translation_languages_json, ai_use, download_reuse, commercial_use, contact_mode,
      withdrawal_status, practitioner_confirmed_at, pre_release_reconfirmed_at, updated_at
    FROM rights_passports;
    DROP TABLE rights_passports;
    ALTER TABLE rights_passports_v2 RENAME TO rights_passports;
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

/**
 * Applies idempotent SQL schema migrations (`0001` through `0006`), ensures all
 * canonical tables and columns exist even on legacy databases, and records
 * applied versions in `schema_migrations`. If the SQLite file already exists and is
 * non-empty prior to migration, creates a `.bak` copy first so existing data is safe.
 */

function ensureUsersRoleConstraintUpgraded(
  adapter: SqliteDatabaseAdapter
): void {
  const masterRow = adapter
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'"
    )
    .get();
  if (!masterRow || typeof masterRow.sql !== "string") return;
  if (masterRow.sql.includes("'PUBLIC_USER'")) return;

  adapter.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN IMMEDIATE;
    CREATE TABLE users_v2 (
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
    INSERT INTO users_v2 (
      id, email, password_hash, full_name, role, account_type,
      bio, phone, location_label, organisation_or_guild, preferred_language,
      linked_practitioner_id, linked_seller_id, linked_hercraft_id,
      is_active, created_at, updated_at
    )
    SELECT
      id, email, password_hash, full_name, role,
      COALESCE(account_type, 'VISITOR'),
      COALESCE(bio, ''),
      COALESCE(phone, ''),
      COALESCE(location_label, ''),
      COALESCE(organisation_or_guild, ''),
      COALESCE(preferred_language, 'English'),
      linked_practitioner_id, linked_seller_id, linked_hercraft_id,
      is_active, created_at, COALESCE(updated_at, created_at)
    FROM users;
    DROP TABLE users;
    ALTER TABLE users_v2 RENAME TO users;
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

export function applySchemaMigrations(adapter: SqliteDatabaseAdapter): string[] {
  const applied: string[] = [];

  if (fs.existsSync(adapter.dbPath)) {
    try {
      const stat = fs.statSync(adapter.dbPath);
      const backupPath = `${adapter.dbPath}.bak`;
      if (stat.size > 0 && !fs.existsSync(backupPath)) {
        fs.copyFileSync(adapter.dbPath, backupPath);
      }
    } catch {
      // Ignore backup copy errors on locked/ephemeral files
    }
  }

  adapter.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Pre-upgrade any existing tables from earlier schema versions before index creation in SQL files
  ensureTableColumns(adapter);

  const migrationFiles: Array<[string, string]> = [
    ["0001_initial_schema", "0001_initial_schema.sql"],
    ["0002_geography_events_enquiries", "0002_geography_events_enquiries.sql"],
    ["0003_cultural_calendar", "0003_cultural_calendar.sql"],
    ["0004_trip_planner", "0004_trip_planner.sql"],
    ["0005_traditions_sources_media", "0005_traditions_sources_media.sql"],
    ["0006_demo_ecosystem_marketplace", "0006_demo_ecosystem_marketplace.sql"],
  ];

  for (const [version, filename] of migrationFiles) {
    const filePath = resolveMigrationSqlPath(filename);
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, "utf8");
      adapter.exec(sql);
      adapter
        .prepare(
          "INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)"
        )
        .run(version, new Date().toISOString());
      applied.push(version);
    }
  }

  // Ensure all required tables exist even if a migration file was not located relative to cwd
  adapter.exec(`
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
      status TEXT NOT NULL DEFAULT 'PUBLISHED',
      workflow_status TEXT DEFAULT 'PUBLISHED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cultural_event_occurrences (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES cultural_events(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      start_time TEXT,
      end_time TEXT,
      schedule_status TEXT NOT NULL DEFAULT 'PROVISIONAL',
      verification_note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS community_enquiries (
      id TEXT PRIMARY KEY,
      enquiry_type TEXT NOT NULL,
      cultural_record_id TEXT,
      location_id TEXT,
      event_id TEXT,
      sender_name TEXT NOT NULL,
      sender_contact TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
      created_at TEXT NOT NULL
    );

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
      status TEXT NOT NULL DEFAULT 'PUBLISHED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      tradition_id TEXT REFERENCES traditions(id) ON DELETE SET NULL,
      cultural_record_id TEXT REFERENCES cultural_records(id) ON DELETE SET NULL,
      location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
      media_type TEXT NOT NULL,
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
      rights_status TEXT NOT NULL,
      permission_evidence TEXT NOT NULL DEFAULT '',
      language TEXT DEFAULT '',
      transcript_or_summary TEXT DEFAULT '',
      retrieval_date TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT DEFAULT '',
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      is_primary_hero INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS practitioner_profiles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      short_bio TEXT NOT NULL,
      full_narrative TEXT NOT NULL,
      state_name TEXT NOT NULL,
      district_name TEXT,
      city_name TEXT,
      place_id TEXT,
      languages_json TEXT NOT NULL DEFAULT '[]',
      specialisations_json TEXT NOT NULL DEFAULT '[]',
      tradition_ids_json TEXT NOT NULL DEFAULT '[]',
      tradition_slugs_json TEXT NOT NULL DEFAULT '[]',
      tradition_titles_json TEXT NOT NULL DEFAULT '[]',
      years_of_practice INTEGER NOT NULL DEFAULT 5,
      lineage_note TEXT NOT NULL DEFAULT '',
      availability_status TEXT NOT NULL DEFAULT 'OPEN_FOR_WORKSHOPS',
      profile_image_url TEXT NOT NULL DEFAULT '',
      profile_image_credit TEXT NOT NULL DEFAULT '',
      workshops_json TEXT NOT NULL DEFAULT '[]',
      verification_badge TEXT NOT NULL DEFAULT '',
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      demo_disclaimer TEXT NOT NULL DEFAULT '',
      owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS art_mart_sellers (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      storefront_name TEXT NOT NULL,
      craft_cluster_label TEXT NOT NULL,
      state_name TEXT NOT NULL,
      district_name TEXT,
      city_name TEXT,
      linked_practitioner_id TEXT REFERENCES practitioner_profiles(id) ON DELETE SET NULL,
      story_summary TEXT NOT NULL,
      verification_note TEXT NOT NULL DEFAULT '',
      rating_average REAL NOT NULL DEFAULT 4.8,
      completed_demo_orders INTEGER NOT NULL DEFAULT 0,
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS art_mart_products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      tradition_id TEXT REFERENCES traditions(id) ON DELETE SET NULL,
      tradition_slug TEXT,
      tradition_title TEXT,
      seller_id TEXT NOT NULL REFERENCES art_mart_sellers(id) ON DELETE CASCADE,
      seller_slug TEXT NOT NULL,
      seller_name TEXT NOT NULL,
      region_label TEXT NOT NULL,
      state_name TEXT NOT NULL,
      district_name TEXT,
      price_inr INTEGER NOT NULL DEFAULT 0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      materials_used TEXT NOT NULL DEFAULT '',
      making_process TEXT NOT NULL DEFAULT '',
      provenance_note TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      gallery_urls_json TEXT NOT NULL DEFAULT '[]',
      image_credit TEXT NOT NULL DEFAULT '',
      industry_collaboration_id TEXT,
      approval_status TEXT NOT NULL DEFAULT 'APPROVED',
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      demo_disclaimer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS art_mart_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_state TEXT NOT NULL,
      shipping_address_label TEXT NOT NULL,
      payment_method_label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      total_inr INTEGER NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL DEFAULT '[]',
      simulation_disclaimer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS industry_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      industry_org_label TEXT NOT NULL,
      material_category TEXT NOT NULL,
      quantity_available_label TEXT NOT NULL,
      condition_label TEXT NOT NULL,
      location_city TEXT NOT NULL,
      location_state TEXT NOT NULL,
      pricing_terms TEXT NOT NULL DEFAULT 'DONATION_FREE',
      price_note TEXT NOT NULL DEFAULT '',
      safety_restrictions TEXT NOT NULL DEFAULT '',
      suggested_traditions_json TEXT NOT NULL DEFAULT '[]',
      admin_review_status TEXT NOT NULL DEFAULT 'APPROVED',
      availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      demo_disclaimer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS industry_requests (
      id TEXT PRIMARY KEY,
      material_id TEXT NOT NULL REFERENCES industry_materials(id) ON DELETE CASCADE,
      material_title TEXT NOT NULL,
      artisan_name TEXT NOT NULL,
      artisan_email TEXT NOT NULL,
      tradition_title TEXT NOT NULL,
      requested_quantity_label TEXT NOT NULL,
      intended_craft_use TEXT NOT NULL,
      collaboration_status TEXT NOT NULL DEFAULT 'SUBMITTED_BY_ARTISAN',
      admin_reviewer_note TEXT NOT NULL DEFAULT '',
      linked_art_mart_product_id TEXT,
      linked_art_mart_product_slug TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ecosystem_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      resource_category TEXT NOT NULL,
      organisation_type TEXT NOT NULL,
      relationship_status TEXT NOT NULL,
      state_scope TEXT NOT NULL,
      summary TEXT NOT NULL,
      eligibility_details TEXT NOT NULL,
      official_url TEXT NOT NULL,
      last_reviewed_date TEXT NOT NULL,
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      demo_disclaimer TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS hercraft_enterprises (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      enterprise_name TEXT NOT NULL,
      leader_or_collective_label TEXT NOT NULL,
      enterprise_type TEXT NOT NULL DEFAULT 'WOMEN_SHG',
      craft_category TEXT NOT NULL,
      tradition_id TEXT REFERENCES traditions(id) ON DELETE SET NULL,
      tradition_slug TEXT,
      tradition_title TEXT,
      state_name TEXT NOT NULL,
      district_name TEXT,
      city_name TEXT,
      place_id TEXT,
      women_artisans_count INTEGER NOT NULL DEFAULT 1,
      founded_year INTEGER NOT NULL DEFAULT 2020,
      short_summary TEXT NOT NULL,
      story_narrative TEXT NOT NULL DEFAULT '',
      signature_crafts_json TEXT NOT NULL DEFAULT '[]',
      products_and_techniques_json TEXT NOT NULL DEFAULT '[]',
      training_and_workshops_json TEXT NOT NULL DEFAULT '[]',
      support_needs_json TEXT NOT NULL DEFAULT '[]',
      linked_art_mart_product_ids_json TEXT NOT NULL DEFAULT '[]',
      linked_practitioner_id TEXT REFERENCES practitioner_profiles(id) ON DELETE SET NULL,
      hero_image_url TEXT NOT NULL DEFAULT '',
      image_credit TEXT NOT NULL DEFAULT '',
      source_attribution TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      contact_or_enquiry_note TEXT NOT NULL DEFAULT '',
      approval_status TEXT NOT NULL DEFAULT 'APPROVED',
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      demo_disclaimer TEXT NOT NULL DEFAULT '',
      owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hercraft_opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      opportunity_type TEXT NOT NULL DEFAULT 'GOVERNMENT_SCHEME',
      organiser_name TEXT NOT NULL,
      organiser_type TEXT NOT NULL DEFAULT 'GOVERNMENT_MINISTRY',
      relationship_status TEXT NOT NULL DEFAULT 'OFFICIAL_PUBLIC_SOURCE',
      state_scope TEXT NOT NULL DEFAULT 'All India',
      eligibility_summary TEXT NOT NULL,
      benefit_summary TEXT NOT NULL,
      application_or_official_url TEXT NOT NULL,
      deadline_or_cycle_label TEXT NOT NULL DEFAULT 'Rolling / Annual Cycle',
      approval_status TEXT NOT NULL DEFAULT 'APPROVED',
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
      record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
      demo_disclaimer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  // Forward-only idempotent column check across all tables for existing databases
  ensureTableColumns(adapter);
  ensureRightsPassportsConstraintUpgraded(adapter);
  ensureUsersRoleConstraintUpgraded(adapter);

  return applied;
}

/**
 * Opens a persistent SQLite database at `dbPath`.
 */
export function openSqliteDatabase(dbPath: string): {
  adapter: SqliteDatabaseAdapter | null;
  driverName: SqliteDriverName;
  diagnostics: string[];
} {
  const diagnostics: string[] = [];
  const req = createRequire(import.meta.url);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  // 1. Try better-sqlite3 native addon first
  try {
    const BetterSqlite3 = req("better-sqlite3");
    const rawDb = new BetterSqlite3(dbPath);
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");

    const adapter: SqliteDatabaseAdapter = {
      driverName: "better-sqlite3",
      dbPath,
      exec(sql: string) {
        rawDb.exec(sql);
      },
      prepare(sql: string) {
        return createNormalizedStatement(rawDb, sql);
      },
      transaction<T>(fn: () => T): () => T {
        return rawDb.transaction(fn);
      },
      close() {
        rawDb.close();
      },
    };

    applySchemaMigrations(adapter);
    return {
      adapter,
      driverName: "better-sqlite3",
      diagnostics,
    };
  } catch (err: any) {
    diagnostics.push(
      `better-sqlite3 unavailable (${err?.message || "unknown error"})`
    );
  }

  // 2. Try Node.js built-in SQLite module (node:sqlite DatabaseSync in Node v22.5+ / v24+)
  try {
    const nodeSqlite = req("node:sqlite");
    if (nodeSqlite && typeof nodeSqlite.DatabaseSync === "function") {
      const rawDb = new nodeSqlite.DatabaseSync(dbPath);
      rawDb.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

      const adapter: SqliteDatabaseAdapter = {
        driverName: "node:sqlite",
        dbPath,
        exec(sql: string) {
          rawDb.exec(sql);
        },
        prepare(sql: string) {
          return createNormalizedStatement(rawDb, sql);
        },
        transaction<T>(fn: () => T): () => T {
          return () => {
            rawDb.exec("BEGIN IMMEDIATE");
            try {
              const result = fn();
              rawDb.exec("COMMIT");
              return result;
            } catch (txErr) {
              try {
                rawDb.exec("ROLLBACK");
              } catch {
                // Ignore rollback secondary error
              }
              throw txErr;
            }
          };
        },
        close() {
          if (typeof rawDb.close === "function") {
            rawDb.close();
          }
        },
      };

      applySchemaMigrations(adapter);
      return {
        adapter,
        driverName: "node:sqlite",
        diagnostics,
      };
    }
  } catch (err: any) {
    diagnostics.push(
      `node:sqlite unavailable (${err?.message || "unknown error"})`
    );
  }

  return {
    adapter: null,
    driverName: "portable-file-store",
    diagnostics,
  };
}
