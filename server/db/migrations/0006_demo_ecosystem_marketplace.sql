-- =============================================================================
-- BHARAT CULTUREMAP — MIGRATION 0006: PRACTITIONERS, ART-MART MARKETPLACE,
-- INDUSTRY-TO-ART WORKFLOW & GOVERNMENT / ECOSYSTEM RESOURCES
-- Forward-only idempotent schema extension with foreign-key enforcement intact
-- =============================================================================

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
  availability_status TEXT NOT NULL DEFAULT 'OPEN_FOR_WORKSHOPS' CHECK (availability_status IN (
    'OPEN_FOR_WORKSHOPS',
    'AVAILABLE_FOR_APPRENTICESHIP',
    'BY_ENQUIRY_ONLY',
    'SEASONAL_BREAK'
  )),
  profile_image_url TEXT NOT NULL DEFAULT '',
  profile_image_credit TEXT NOT NULL DEFAULT '',
  workshops_json TEXT NOT NULL DEFAULT '[]',
  verification_badge TEXT NOT NULL DEFAULT '',
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN (
    'PUBLISHED',
    'UNDER_REVIEW',
    'DRAFT'
  )),
  record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
  demo_disclaimer TEXT NOT NULL DEFAULT '',
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_practitioners_slug ON practitioner_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_practitioners_state ON practitioner_profiles(state_name);

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
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN (
    'PUBLISHED',
    'UNDER_REVIEW',
    'DRAFT'
  )),
  record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sellers_slug ON art_mart_sellers(slug);
CREATE INDEX IF NOT EXISTS idx_sellers_state ON art_mart_sellers(state_name);

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
  approval_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN (
    'APPROVED',
    'PENDING_REVIEW',
    'CHANGES_REQUESTED'
  )),
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN (
    'PUBLISHED',
    'DRAFT',
    'ARCHIVED'
  )),
  record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
  demo_disclaimer TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON art_mart_products(slug);
CREATE INDEX IF NOT EXISTS idx_products_seller ON art_mart_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON art_mart_products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON art_mart_products(publication_status);

CREATE TABLE IF NOT EXISTS art_mart_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_address_label TEXT NOT NULL,
  payment_method_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN (
    'CONFIRMED',
    'PACKING_DEMO',
    'DISPATCHED_DEMO',
    'COMPLETED_DEMO',
    'CANCELLED_DEMO'
  )),
  total_inr INTEGER NOT NULL DEFAULT 0,
  items_json TEXT NOT NULL DEFAULT '[]',
  simulation_disclaimer TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON art_mart_orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON art_mart_orders(status);

CREATE TABLE IF NOT EXISTS industry_materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  industry_org_label TEXT NOT NULL,
  material_category TEXT NOT NULL,
  quantity_available_label TEXT NOT NULL,
  condition_label TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_state TEXT NOT NULL,
  pricing_terms TEXT NOT NULL DEFAULT 'DONATION_FREE' CHECK (pricing_terms IN (
    'DONATION_FREE',
    'NOMINAL_RECOVERY_COST',
    'SPONSORED_CSR_GRANT'
  )),
  price_note TEXT NOT NULL DEFAULT '',
  safety_restrictions TEXT NOT NULL DEFAULT '',
  suggested_traditions_json TEXT NOT NULL DEFAULT '[]',
  admin_review_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (admin_review_status IN (
    'PENDING_ADMIN_REVIEW',
    'APPROVED',
    'REJECTED'
  )),
  availability_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN (
    'AVAILABLE',
    'PARTIALLY_ALLOCATED',
    'FULLY_ALLOCATED'
  )),
  record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
  demo_disclaimer TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_industry_materials_status ON industry_materials(admin_review_status);

CREATE TABLE IF NOT EXISTS industry_requests (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES industry_materials(id) ON DELETE CASCADE,
  material_title TEXT NOT NULL,
  artisan_name TEXT NOT NULL,
  artisan_email TEXT NOT NULL,
  tradition_title TEXT NOT NULL,
  requested_quantity_label TEXT NOT NULL,
  intended_craft_use TEXT NOT NULL,
  collaboration_status TEXT NOT NULL DEFAULT 'SUBMITTED_BY_ARTISAN' CHECK (collaboration_status IN (
    'SUBMITTED_BY_ARTISAN',
    'REVIEWED_BY_ADMIN_OR_INDUSTRY',
    'ALLOCATED_TO_ARTISAN',
    'IN_CRAFT_PRODUCTION',
    'CRAFT_PRODUCT_LISTED_ON_ART_MART',
    'DECLINED'
  )),
  admin_reviewer_note TEXT NOT NULL DEFAULT '',
  linked_art_mart_product_id TEXT,
  linked_art_mart_product_slug TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_industry_requests_material ON industry_requests(material_id);

CREATE TABLE IF NOT EXISTS ecosystem_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  resource_category TEXT NOT NULL,
  organisation_type TEXT NOT NULL CHECK (organisation_type IN (
    'GOVERNMENT_MINISTRY',
    'STATUTORY_BOARD',
    'CULTURAL_ACADEMY',
    'NGO_FOUNDATION',
    'ACADEMIC_INSTITUTION',
    'CSR_INDUSTRY_PARTNER'
  )),
  relationship_status TEXT NOT NULL CHECK (relationship_status IN (
    'OFFICIAL_PUBLIC_SOURCE',
    'ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR',
    'DEMO_SIMULATED_PARTNER'
  )),
  state_scope TEXT NOT NULL,
  summary TEXT NOT NULL,
  eligibility_details TEXT NOT NULL,
  official_url TEXT NOT NULL,
  last_reviewed_date TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN (
    'PUBLISHED',
    'DRAFT'
  )),
  record_origin TEXT NOT NULL DEFAULT 'DEMO_SAMPLE',
  demo_disclaimer TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_ecosystem_resources_type ON ecosystem_resources(organisation_type);


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

CREATE INDEX IF NOT EXISTS idx_hercraft_enterprises_state ON hercraft_enterprises(state_name);
CREATE INDEX IF NOT EXISTS idx_hercraft_enterprises_status ON hercraft_enterprises(publication_status);

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

CREATE INDEX IF NOT EXISTS idx_hercraft_opportunities_status ON hercraft_opportunities(publication_status);
