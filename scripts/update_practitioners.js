import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const dbPath = path.resolve("data", "bharat_culturemap.sqlite");
const db = new DatabaseSync(dbPath);

console.log("Updating practitioners with verified images & adding new master artisans...");

db.prepare("UPDATE practitioner_profiles SET profile_image_url = ? WHERE slug = ?").run(
  "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg",
  "subhash-satpute-kolhapuri-chappal-demo"
);
db.prepare("UPDATE practitioner_profiles SET profile_image_url = ? WHERE slug = ?").run(
  "/cultural-images/Warli_Art_House_Wall.jpg",
  "jiva-vahadu-warli-palghar-demo"
);
db.prepare("UPDATE practitioner_profiles SET profile_image_url = ? WHERE slug = ?").run(
  "/cultural-images/Odisha_Pattachitra_Raghurajpur.jpg",
  "bibhu-maharana-pattachitra-odissi-demo"
);

const newPractitioners = [
  {
    id: "pract-verified-kripal-kumbhar-blue-pottery",
    slug: "kripal-singh-kumbhar-blue-pottery-jaipur",
    displayName: "Master Kripal Kumbhar",
    roleTitle: "National Awardee Blue Pottery Master Craftsman",
    shortBio: "Heritage craftsman carrying 40 years of expertise in non-clay quartz glazed ceramic crafting in Kot Jewar.",
    fullNarrative: "Pioneering the revival of classical Jaipur Blue Pottery with low-temperature cobalt and copper oxide firings, mentoring over 150 village artisans in raw quartz grinding and arabesque floral brushwork.",
    stateName: "Rajasthan",
    districtName: "Jaipur",
    cityName: "Jaipur",
    yearsOfPractice: 42,
    lineageNote: "Traditional Jaipur royal atelier lineage",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl: "/cultural-images/Blue_Pottery_Jaipur.jpg",
    verificationBadge: "VERIFIED_MASTER_ARTISAN",
    publicationStatus: "PUBLISHED"
  },
  {
    id: "pract-verified-syed-channapatna-toys",
    slug: "syed-munawar-channapatna-woodcraft",
    displayName: "Ustad Syed Munawar",
    roleTitle: "Master Wood Lathe Turnery Artisan",
    shortBio: "Fourth-generation ivory woodturner and natural shellac colorist in Channapatna Toy Town.",
    fullNarrative: "Practicing the centuries-old Wrightia tinctoria wood lathe turnery, using screw-pine leaf burnishing and 100% natural organic turmeric, indigo, and shellac lacquering for certified child-safe toys.",
    stateName: "Karnataka",
    districtName: "Ramanagara",
    cityName: "Channapatna",
    yearsOfPractice: 36,
    lineageNote: "Tipu Sultan royal guild fourth-generation lineage",
    availabilityStatus: "AVAILABLE_FOR_APPRENTICESHIP",
    profileImageUrl: "/cultural-images/Channapatna_Wooden_Toys.jpg",
    verificationBadge: "VERIFIED_MASTER_ARTISAN",
    publicationStatus: "PUBLISHED"
  },
  {
    id: "pract-verified-subhash-karmakar-dokra",
    slug: "subhash-karmakar-bankura-dokra-casting",
    displayName: "Shilpi Subhash Karmakar",
    roleTitle: "Dhokra Damar Master Sculptor",
    shortBio: "Master of ancient lost-wax brass and bronze hollow casting in Bikna heritage village.",
    fullNarrative: "Dedicated to preserving the 4,000-year Cire Perdue metallurgy using hand-coiled beeswax wires over riverbed silt cores, creating iconic Bengal owls, elephants, and deities without moulds.",
    stateName: "West Bengal",
    districtName: "Bankura",
    cityName: "Bankura (Bikna)",
    yearsOfPractice: 30,
    lineageNote: "Dhokra Damar hereditary metalworking community",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl: "/cultural-images/Dokra_Lost_Wax_Casting.jpg",
    verificationBadge: "VERIFIED_MASTER_ARTISAN",
    publicationStatus: "PUBLISHED"
  },
  {
    id: "pract-verified-saraswathi-ammal-thanjavur",
    slug: "saraswathi-ammal-thanjavur-painting",
    displayName: "Guru Saraswathi Ammal",
    roleTitle: "Master Gilded Gesso Iconographer",
    shortBio: "Hereditary Thanjavur sacred relief painter specializing in 22-carat gold foil relief.",
    fullNarrative: "Trained under court painters in Thanjavur, creating classical Nayaka sacred paintings using teakwood boards, unboiled limestone Sukku paste relief, and hand-burnished pure gold foil.",
    stateName: "Tamil Nadu",
    districtName: "Thanjavur",
    cityName: "Thanjavur",
    yearsOfPractice: 38,
    lineageNote: "Thanjavur Nayaka court artist parampara",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl: "/cultural-images/Thanjavur_Gold_Leaf_Painting.jpg",
    verificationBadge: "VERIFIED_MASTER_ARTISAN",
    publicationStatus: "PUBLISHED"
  },
  {
    id: "pract-verified-parvati-koli-kalbelia",
    slug: "parvati-koli-kalbelia-folk-exponent",
    displayName: "Smt. Parvati Sapera",
    roleTitle: "International Kalbelia Dance & Oral Folklore Exponent",
    shortBio: "Renowned nomadic Kalbelia serpentine dance custodian and oral song tradition bearer.",
    fullNarrative: "Leading international workshops in the hypnotic black-ghagra serpentine dance, rhythmic Been and Khanjari accompaniment, and preserving unwritten oral Thar desert poems for younger generations.",
    stateName: "Rajasthan",
    districtName: "Jodhpur",
    cityName: "Jodhpur",
    yearsOfPractice: 28,
    lineageNote: "Nomadic Sapera community living tradition",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl: "/cultural-images/Kalbelia_Folk_Dancers.jpg",
    verificationBadge: "UNESCO_ICH_EXPONENT",
    publicationStatus: "PUBLISHED"
  }
];

const checkPract = db.prepare("SELECT id FROM practitioner_profiles WHERE slug = ?");
const insertPract = db.prepare(`
  INSERT INTO practitioner_profiles (
    id, slug, display_name, role_title, short_bio, full_narrative,
    state_name, district_name, city_name, years_of_practice, lineage_note,
    availability_status, profile_image_url, verification_badge, publication_status,
    record_origin, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    'FIELD_VERIFIED', datetime('now'), datetime('now')
  )
`);

for (const p of newPractitioners) {
  const existing = checkPract.get(p.slug);
  if (!existing) {
    insertPract.run(
      p.id, p.slug, p.displayName, p.roleTitle, p.shortBio, p.fullNarrative,
      p.stateName, p.districtName, p.cityName, p.yearsOfPractice, p.lineageNote,
      p.availabilityStatus, p.profileImageUrl, p.verificationBadge, p.publicationStatus
    );
    console.log("Added practitioner:", p.displayName);
  } else {
    db.prepare("UPDATE practitioner_profiles SET profile_image_url = ? WHERE slug = ?").run(p.profileImageUrl, p.slug);
  }
}

console.log("Practitioner updates complete! Total count:", db.prepare("SELECT count(*) as count FROM practitioner_profiles").get().count);
