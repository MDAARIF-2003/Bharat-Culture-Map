import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const dbPath = path.resolve("data", "bharat_culturemap.sqlite");
const db = new DatabaseSync(dbPath);

console.log("Updating Art-Mart and HerCraft with verified local images...");

// 1. Update existing Art-Mart products
db.prepare("UPDATE art_mart_products SET image_url = ? WHERE slug = ?").run(
  "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg",
  "hand-stitched-kapashi-kolhapuri-chappal-demo"
);
db.prepare("UPDATE art_mart_products SET image_url = ? WHERE slug = ?").run(
  "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg",
  "industry-to-art-kurundwadi-leather-sketchbook-demo"
);
db.prepare("UPDATE art_mart_products SET image_url = ? WHERE slug = ?").run(
  "/cultural-images/Warli_Art_House_Wall.jpg",
  "warli-tarpa-harvest-circle-geru-canvas-demo"
);
db.prepare("UPDATE art_mart_products SET image_url = ? WHERE slug = ?").run(
  "/cultural-images/Odisha_Pattachitra_Raghurajpur.jpg",
  "raghurajpur-dasavatara-pattachitra-scroll-demo"
);

// Add new Art-Mart products with verified images using valid seller IDs
const newArtProducts = [
  {
    id: "prod-verified-jaipur-blue-pottery-platter",
    slug: "jaipur-blue-pottery-handpainted-turquoise-platter",
    title: "Jaipur Blue Pottery Hand-Painted Arabesque Platter (GI Certified)",
    category: "Craft",
    traditionId: "trad-blue-pottery-jaipur",
    traditionSlug: "blue-pottery-jaipur",
    traditionTitle: "Jaipur Blue Pottery",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Jaipur Walled City, Rajasthan",
    stateName: "Rajasthan",
    districtName: "Jaipur",
    priceInr: 1850,
    stockQuantity: 14,
    materialsUsed: "Ground quartz stone, Fuller's earth, glass cullet, copper oxide turquoise glaze",
    makingProcess: "Dough pressed into open moulds, hand-painted with fine squirrel-hair brushes, fired once in low-temperature gas kiln.",
    provenanceNote: "GI Application No. 37 certified artisan collective.",
    description: "Handcrafted 10-inch decorative ceramic platter featuring classical turquoise-blue arabesque floral patterns and bird motifs.",
    imageUrl: "/cultural-images/Blue_Pottery_Jaipur.jpg",
  },
  {
    id: "prod-verified-channapatna-wooden-toy-set",
    slug: "channapatna-non-toxic-lacquered-wooden-stacker-set",
    title: "Channapatna Wooden Stacking Rings & Toy Set (GI Certified)",
    category: "Craft",
    traditionId: "trad-channapatna-toys",
    traditionSlug: "channapatna-toys",
    traditionTitle: "Channapatna Wooden Toys",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Ramanagara District, Karnataka",
    stateName: "Karnataka",
    districtName: "Ramanagara",
    priceInr: 950,
    stockQuantity: 25,
    materialsUsed: "Wrightia tinctoria (ivory wood), natural shellac, organic turmeric, indigo and kumkum dyes",
    makingProcess: "Turned on high-speed wood lathes, lac sticks applied during rotation, polished to high sheen with screw-pine leaves.",
    provenanceNote: "GI Application No. 24 registered artisan workshop.",
    description: "Child-safe non-toxic hand-turned wooden educational stacker finished in radiant organic lac colors.",
    imageUrl: "/cultural-images/Channapatna_Wooden_Toys.jpg",
  },
  {
    id: "prod-verified-bengal-dokra-tribal-peacock",
    slug: "bengal-dokra-lost-wax-brass-peacock-sculpture",
    title: "Bikna Lost-Wax Dokra Brass Peacock Figurine (GI Certified)",
    category: "Craft",
    traditionId: "trad-bengal-dokra",
    traditionSlug: "bengal-dokra",
    traditionTitle: "Bengal Dokra Metal Casting",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Bikna, Bankura District, West Bengal",
    stateName: "West Bengal",
    districtName: "Bankura",
    priceInr: 3200,
    stockQuantity: 8,
    materialsUsed: "Recycled scrap brass and bronze, natural beeswax, damar resin, alluvial clay",
    makingProcess: "Hand-coiled wax wire technique over clay core, enveloped in clay mould, lost-wax furnace casting.",
    provenanceNote: "GI Application No. 583 certified non-ferrous craft.",
    description: "Rare 8-inch heirloom brass peacock sculpture handcrafted using ancient 4,000-year lost-wax casting.",
    imageUrl: "/cultural-images/Dokra_Lost_Wax_Casting.jpg",
  },
  {
    id: "prod-verified-thanjavur-gold-leaf-framed",
    slug: "thanjavur-22k-gold-leaf-balakrishna-framed-artwork",
    title: "Thanjavur Gilded 22-Carat Gold Leaf Balakrishna Icon",
    category: "Fine Art",
    traditionId: "trad-thanjavur-painting",
    traditionSlug: "thanjavur-painting",
    traditionTitle: "Thanjavur Gold Leaf Painting",
    sellerId: "seller-raghurajpur-chitrakar-guild-demo",
    sellerSlug: "raghurajpur-chitrakar-guild-demo",
    sellerName: "Raghurajpur Chitrakar Parampara Guild (Demo Storefront)",
    regionLabel: "Thanjavur Heritage Atelier, Tamil Nadu",
    stateName: "Tamil Nadu",
    districtName: "Thanjavur",
    priceInr: 12500,
    stockQuantity: 4,
    materialsUsed: "Teakwood plank, limestone Gesso relief paste, 22-carat gold foil, Jaipur stones, natural tamarind gum",
    makingProcess: "Three-dimensional relief sculpting with Sukku paste, gilded with authentic gold leaf, hand-painted eyes.",
    provenanceNote: "GI Application No. 22 registered classical painting atelier.",
    description: "Museum-quality 12x15 inch framed sacred artwork depicting Balakrishna with embossed gold foil ornamentations.",
    imageUrl: "/cultural-images/Thanjavur_Gold_Leaf_Painting.jpg",
  },
  {
    id: "prod-verified-yeola-paithani-silk-saree",
    slug: "pure-silk-yeola-paithani-gold-zari-saree",
    title: "Authentic Yeola Paithani Pure Silk Saree with Bangadi Mor Pallu",
    category: "Textile",
    traditionId: "trad-paithani-sarees",
    traditionSlug: "paithani-sarees",
    traditionTitle: "Paithani Sarees",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Yeola, Nashik District, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Nashik",
    priceInr: 28500,
    stockQuantity: 3,
    materialsUsed: "100% fine mulberry silk yarn, tested gold and silver Zari threads",
    makingProcess: "Over 8 months of meticulous hand pit-loom tapestry weaving with interlocking split-weft technique.",
    provenanceNote: "GI Application No. 36 certified handloom silk weave.",
    description: "Royal peacock-in-ring (Bangadi Mor) gold Zari pallu saree woven in rich peacock-blue pure mulberry silk.",
    imageUrl: "/cultural-images/Paithani_Saree_Border.jpg",
  }
];

const checkProd = db.prepare("SELECT id FROM art_mart_products WHERE slug = ?");
const insertProd = db.prepare(`
  INSERT INTO art_mart_products (
    id, slug, title, category, tradition_id, tradition_slug, tradition_title,
    seller_id, seller_slug, seller_name, region_label, state_name, district_name,
    price_inr, stock_quantity, materials_used, making_process, provenance_note,
    description, image_url, approval_status, publication_status, record_origin,
    created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, 'APPROVED', 'PUBLISHED', 'FIELD_VERIFIED',
    datetime('now'), datetime('now')
  )
`);

for (const p of newArtProducts) {
  const existing = checkProd.get(p.slug);
  if (!existing) {
    insertProd.run(
      p.id, p.slug, p.title, p.category, p.traditionId, p.traditionSlug, p.traditionTitle,
      p.sellerId, p.sellerSlug, p.sellerName, p.regionLabel, p.stateName, p.districtName,
      p.priceInr, p.stockQuantity, p.materialsUsed, p.makingProcess, p.provenanceNote,
      p.description, p.imageUrl
    );
    console.log("Added Art-Mart product:", p.title);
  } else {
    db.prepare("UPDATE art_mart_products SET image_url = ?, price_inr = ? WHERE slug = ?").run(p.imageUrl, p.priceInr, p.slug);
  }
}

// 2. Update HerCraft enterprises with verified images
db.prepare("UPDATE hercraft_enterprises SET hero_image_url = ? WHERE slug LIKE '%weaving%' OR slug LIKE '%sari%' OR slug LIKE '%textile%'").run(
  "/cultural-images/Paithani_Saree_Border.jpg"
);
db.prepare("UPDATE hercraft_enterprises SET hero_image_url = ? WHERE slug LIKE '%leather%' OR slug LIKE '%chappal%'").run(
  "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg"
);
db.prepare("UPDATE hercraft_enterprises SET hero_image_url = ? WHERE slug LIKE '%painting%' OR slug LIKE '%art%' OR slug LIKE '%warli%'").run(
  "/cultural-images/Warli_Art_House_Wall.jpg"
);

console.log("Art-Mart and HerCraft image updates complete!");
console.log("Total Art-Mart products now:", db.prepare("SELECT count(*) as count FROM art_mart_products").get().count);
