import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const dbPath = path.resolve("data", "bharat_culturemap.sqlite");
const db = new DatabaseSync(dbPath);

console.log("Linking verified images to cultural records and adding dedicated archetypes...");

const mappings = [
  { slug: "kolhapuri-chappal-demo", image: "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg" },
  { slug: "mumbai-warli-visual-language-demo", image: "/cultural-images/Warli_Art_House_Wall.jpg" },
  { slug: "bhubaneswar-pattachitra-demo", image: "/cultural-images/Odisha_Pattachitra_Raghurajpur.jpg" },
  { slug: "kolkata-patachitra-related-regional-culture-demo", image: "/cultural-images/Odisha_Pattachitra_Raghurajpur.jpg" },
  { slug: "raipur-dhokra-craft-demo", image: "/cultural-images/Dokra_Lost_Wax_Casting.jpg" },
];

for (const m of mappings) {
  db.prepare("UPDATE cultural_records SET hero_image_url = ? WHERE slug = ?").run(m.image, m.slug);
}

// Ensure dedicated cultural records exist for the remaining 5 verified images with full rights passport!
const newVerifiedRecords = [
  {
    id: "rec-verified-jaipur-blue-pottery",
    slug: "jaipur-blue-pottery-verified",
    traditionId: "trad-blue-pottery-jaipur",
    traditionSlug: "blue-pottery-jaipur",
    titleEn: "Jaipur Blue Pottery",
    titleMr: "जयपूर ब्लू पॉटरी",
    subtitleEn: "Non-Clay Glazed Ceramic Art of Rajasthan (GI App. No. 37)",
    summaryEn: "Formulated without clay from quartz stone powder, Fuller's earth, and glass cullet, finished with vibrant turquoise-blue copper oxide glaze.",
    summaryMr: "मातीचा वापर न करता क्वार्ट्झ पावडर आणि मुलतानी मातीपासून बनवलेली पारंपारिक राजस्थानी निळी भांडी कला.",
    category: "Craft",
    stateId: "loc-state-rajasthan",
    heroImageUrl: "/cultural-images/Blue_Pottery_Jaipur.jpg",
    tags: JSON.stringify(["Blue Pottery", "Glazed Ceramic", "Jaipur", "GI Tag 37", "Rajasthan"])
  },
  {
    id: "rec-verified-kalbelia-dance",
    slug: "kalbelia-dance-rajasthan-verified",
    traditionId: "trad-kalbelia-folk-songs-and-dances-of-rajasthan",
    traditionSlug: "kalbelia-folk-songs-and-dances-of-rajasthan",
    titleEn: "Kalbelia Folk Dance & Songs",
    titleMr: "कालबेलिया लोकनृत्य आणि गाणी",
    subtitleEn: "Nomadic Serpentine Dance of the Thar Desert (UNESCO ICH 2010)",
    summaryEn: "Swirling black-skirted folk dance mimicking the graceful movements of a black cobra, accompanied by Pungi and Khanjari percussion.",
    summaryMr: "थारच्या वाळवंटातील वैशिष्ट्यपूर्ण कालबेलिया सर्पाकार नृत्य आणि पुंगी वाद्य परंपरा.",
    category: "Dance",
    stateId: "loc-state-rajasthan",
    heroImageUrl: "/cultural-images/Kalbelia_Folk_Dancers.jpg",
    tags: JSON.stringify(["Kalbelia", "Folk Dance", "UNESCO ICH", "Thar Desert", "Rajasthan"])
  },
  {
    id: "rec-verified-channapatna-toys",
    slug: "channapatna-wooden-toys-verified",
    traditionId: "trad-channapatna-toys",
    traditionSlug: "channapatna-toys",
    titleEn: "Channapatna Wooden Toys",
    titleMr: "चन्नपट्टणा लाकडी खेळणी",
    subtitleEn: "Non-Toxic Lacquered Ivory Wood Turnery (GI App. No. 24)",
    summaryEn: "Hand-turned on wood lathes from ivory wood (Wrightia tinctoria) and colored with non-toxic natural lac and vegetable dyes.",
    summaryMr: "हस्तिदंती लाकूड आणि नैसर्गिक वनस्पती रंगांचा वापर करून बनवलेली पारंपरिक लाकडी खेळणी.",
    category: "Craft",
    stateId: "loc-state-karnataka",
    heroImageUrl: "/cultural-images/Channapatna_Wooden_Toys.jpg",
    tags: JSON.stringify(["Channapatna", "Wooden Toys", "Lacquerware", "GI Tag 24", "Karnataka"])
  },
  {
    id: "rec-verified-thanjavur-painting",
    slug: "thanjavur-painting-tamilnadu-verified",
    traditionId: "trad-thanjavur-painting",
    traditionSlug: "thanjavur-painting",
    titleEn: "Thanjavur Gold Leaf Painting",
    titleMr: "तंजावूर सुवर्णपत्र चित्रकला",
    subtitleEn: "Gilded Gesso Sacred Relief Iconography (GI App. No. 22)",
    summaryEn: "Classical South Indian relief painting on teakwood, sculpted with limestone Gesso and embossed with pure 22-carat gold foil and semi-precious stones.",
    summaryMr: "लाकडी फळीवर चुना आणि २२ कॅरेट सोन्याच्या पानांचा वापर करून कोरलेली पवित्र दक्षिण भारतीय चित्रकला.",
    category: "Traditional Knowledge",
    stateId: "loc-state-tamil-nadu",
    heroImageUrl: "/cultural-images/Thanjavur_Gold_Leaf_Painting.jpg",
    tags: JSON.stringify(["Thanjavur Painting", "Gold Leaf", "Gesso", "GI Tag 22", "Tamil Nadu"])
  },
  {
    id: "rec-verified-paithani-saree",
    slug: "paithani-saree-maharashtra-verified",
    traditionId: "trad-paithani-sarees",
    traditionSlug: "paithani-sarees",
    titleEn: "Paithani Sarees",
    titleMr: "पैठणी साडी",
    subtitleEn: "Pure Silk & Gold Zari Tapestry Weave (GI App. No. 36)",
    summaryEn: "Ancient interlocking tapestry weave (Dhaap) on fine mulberry silk featuring Bangadi Mor and Asawali pallu motifs.",
    summaryMr: "शुद्ध रेशीम आणि सोन्याच्या जरीने विणलेली ऐतिहासिक महाराष्ट्रीयन पैठणी साडी.",
    category: "Textile",
    stateId: "loc-state-maharashtra",
    heroImageUrl: "/cultural-images/Paithani_Saree_Border.jpg",
    tags: JSON.stringify(["Paithani", "Silk Saree", "Yeola", "GI Tag 36", "Maharashtra"])
  },
  {
    id: "rec-verified-dokra-casting",
    slug: "bengal-dokra-lost-wax-verified",
    traditionId: "trad-bengal-dokra",
    traditionSlug: "bengal-dokra",
    titleEn: "Bengal Dokra Metal Casting",
    titleMr: "बंगाल डोकरा धातू कला",
    subtitleEn: "Ancient 4,000-Year Lost-Wax Metallurgy (GI App. No. 583)",
    summaryEn: "Non-ferrous lost-wax metal casting (Cire Perdue) coiled with beeswax and resin cords, cast in recycled brass and bronze.",
    summaryMr: "मेण आणि मातीच्या साच्यात ओतकाम करून तयार केलेली ४००० वर्षांची प्राचीन धातू शिल्पकला.",
    category: "Craft",
    stateId: "loc-state-west-bengal",
    heroImageUrl: "/cultural-images/Dokra_Lost_Wax_Casting.jpg",
    tags: JSON.stringify(["Dokra", "Lost-Wax", "Metal Casting", "Bankura", "GI Tag 583", "West Bengal"])
  }
];

const checkRecStmt = db.prepare("SELECT id FROM cultural_records WHERE slug = ?");
const insertRecStmt = db.prepare(`
  INSERT INTO cultural_records (
    id, slug, tradition_id, tradition_slug, record_origin,
    status, unesco_domain, category, is_women_led, is_sacred_or_restricted,
    practitioner_full_name_private, practitioner_chosen_name, practitioner_community_name,
    state_id, title_en, title_mr, subtitle_en, summary_en, summary_mr,
    tags_json, hero_image_url, source_attribution, source_url,
    original_voice_language, published_at, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, 'DEMO_REFERENCE',
    'PUBLISHED', 'Traditional craftsmanship', ?, 0, 0,
    'Institutional Knowledge Base Master Record', 'Master Artisan Guild', 'Traditional Artisan Community',
    ?, ?, ?, ?, ?, ?,
    ?, ?, 'Indian Culture Portal / IP India Registry', 'https://indianculture.gov.in',
    'English', datetime('now'), datetime('now'), datetime('now')
  )
`);

const insertPassportStmt = db.prepare(`
  INSERT OR REPLACE INTO rights_passports (
    id, cultural_record_id, version, consent_taking_part, consent_being_recorded, consent_public_use,
    consent_mode, consent_signed_at, statements_json,
    identity_display, location_granularity, audio_video_access, translation_scope,
    allowed_translation_languages_json, ai_use, download_reuse, commercial_use, contact_mode,
    withdrawal_status, practitioner_confirmed_at, pre_release_reconfirmed_at, updated_at
  ) VALUES (
    ?, ?, 1, 1, 1, 1,
    'DEMO_PLACEHOLDER', datetime('now'),
    '{"voluntaryParticipation":true,"rightToWithdraw":true,"interviewAndRecording":true,"nothingPublicWithoutApproval":true,"sacredPrivateExcluded":true,"noExternalAiOrVoiceCloning":true,"fairCompensationIndependentOfConsent":true}',
    'COMMUNITY_NAME', 'DISTRICT', 'PUBLIC', 'SELECTED_LANGUAGES',
    '["en","mr","hi"]', 'APPROVED_RETRIEVAL', 'EDUCATIONAL_ONLY', 'PERMISSION_REQUIRED', 'MODERATED_ENQUIRY',
    'ACTIVE', datetime('now'), datetime('now'), datetime('now')
  )
`);

for (const nr of newVerifiedRecords) {
  const existing = checkRecStmt.get(nr.slug);
  if (!existing) {
    insertRecStmt.run(
      nr.id, nr.slug, nr.traditionId, nr.traditionSlug, nr.category,
      nr.stateId, nr.titleEn, nr.titleMr, nr.subtitleEn, nr.summaryEn, nr.summaryMr,
      nr.tags, nr.heroImageUrl
    );
    insertPassportStmt.run(`pass-${nr.id}`, nr.id);
    console.log("Inserted verified record & passport:", nr.titleEn);
  } else {
    db.prepare("UPDATE cultural_records SET hero_image_url = ? WHERE slug = ?").run(nr.heroImageUrl, nr.slug);
    console.log("Updated hero_image_url for:", nr.titleEn);
  }
}

console.log("Linking complete! Total cultural_records:", db.prepare("SELECT count(*) as count FROM cultural_records").get().count);
