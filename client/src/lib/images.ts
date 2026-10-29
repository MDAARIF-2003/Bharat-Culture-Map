/**
 * Curated local high-definition cultural image library for Bharat CultureMap.
 * Includes both verified field images and national institutional archetypes
 * from Indian Culture Portal, IP India, IGNCA, and UNESCO documentation.
 */

export const VERIFIED_CULTURAL_IMAGES = {
  // 9 Primary High-Resolution Verified Regional Assets
  kolhapuriChappal: "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg",
  paithaniSaree: "/cultural-images/Paithani_Saree_Border.jpg",
  warliPainting: "/cultural-images/Warli_Art_House_Wall.jpg",
  bluePottery: "/cultural-images/Blue_Pottery_Jaipur.jpg",
  kalbeliaDance: "/cultural-images/Kalbelia_Folk_Dancers.jpg",
  channapatnaToys: "/cultural-images/Channapatna_Wooden_Toys.jpg",
  thanjavurPainting: "/cultural-images/Thanjavur_Gold_Leaf_Painting.jpg",
  dokraCasting: "/cultural-images/Dokra_Lost_Wax_Casting.jpg",
  odishaPattachitra: "/cultural-images/Odisha_Pattachitra_Raghurajpur.jpg",
} as const;

export interface VerifiedCulturalImageItem {
  key: string;
  title: string;
  path: string;
  giTag: string;
  region: string;
  category: string;
  craftContext: string;
}

export const VERIFIED_CULTURAL_IMAGE_LIST: VerifiedCulturalImageItem[] = [
  {
    key: "kolhapuriChappal",
    title: "Kolhapuri Chappal",
    path: "/cultural-images/Kolhapuri_Chappal_Kolhapur.jpg",
    giTag: "GI Application No. 169",
    region: "Western India (Maharashtra)",
    category: "Handcrafted Leather Footwear",
    craftContext: "Hard-pressed bagda leather, cord-braided seams, natural vegetable dyes.",
  },
  {
    key: "paithaniSaree",
    title: "Paithani Silk Saree Border",
    path: "/cultural-images/Paithani_Saree_Border.jpg",
    giTag: "GI Application No. 36",
    region: "Western India (Maharashtra)",
    category: "Handloom Brocade Textile",
    craftContext: "Pure mulberry silk with real silver-gold zari weave and peacock pallu motif.",
  },
  {
    key: "warliPainting",
    title: "Warli Tribal Folk Painting",
    path: "/cultural-images/Warli_Art_House_Wall.jpg",
    giTag: "GI Application No. 171",
    region: "Western India (Maharashtra)",
    category: "Indigenous Ochre & Rice Murals",
    craftContext: "Earth ochre background with natural rice paste paint and bamboo twig brushes.",
  },
  {
    key: "bluePottery",
    title: "Jaipur Blue Pottery",
    path: "/cultural-images/Blue_Pottery_Jaipur.jpg",
    giTag: "GI Application No. 37",
    region: "Northern India (Rajasthan)",
    category: "Low-Fire Quartz Ceramic",
    craftContext: "Clay-free quartz dough, fuller's earth, copper oxide glaze, wood kiln firing.",
  },
  {
    key: "kalbeliaDance",
    title: "Kalbelia Folk Dancers & Musicians",
    path: "/cultural-images/Kalbelia_Folk_Dancers.jpg",
    giTag: "UNESCO Representative List (00340)",
    region: "Northern India (Rajasthan)",
    category: "Folk Performing Arts & Song",
    craftContext: "Poongi music, swirling mirrored black skirts, nomadic oral transmission.",
  },
  {
    key: "channapatnaToys",
    title: "Channapatna Wooden Toys",
    path: "/cultural-images/Channapatna_Wooden_Toys.jpg",
    giTag: "GI Application No. 24",
    region: "Southern India (Karnataka)",
    category: "Lathe-Turned Lacquer Woodcraft",
    craftContext: "Wrightia tinctoria (Aale mara) wood, natural non-toxic vegetable lacquer.",
  },
  {
    key: "thanjavurPainting",
    title: "Thanjavur Gold Leaf Painting",
    path: "/cultural-images/Thanjavur_Gold_Leaf_Painting.jpg",
    giTag: "GI Application No. 22",
    region: "Southern India (Tamil Nadu)",
    category: "Classical Panel Art with 22k Gold Foil",
    craftContext: "Chalk and gum gesso relief (sukka), cut glass stones, 22-carat gold foil overlay.",
  },
  {
    key: "dokraCasting",
    title: "Dokra Lost-Wax Metal Casting",
    path: "/cultural-images/Dokra_Lost_Wax_Casting.jpg",
    giTag: "GI Application No. 583",
    region: "Eastern India (West Bengal)",
    category: "Non-Ferrous Cire Perdue Bell Metal",
    craftContext: "Clay core, hand-coiled pure beeswax threads, pit-furnace bronze casting.",
  },
  {
    key: "odishaPattachitra",
    title: "Odisha Pattachitra Scroll Painting",
    path: "/cultural-images/Odisha_Pattachitra_Raghurajpur.jpg",
    giTag: "GI Application No. 105",
    region: "Eastern India (Odisha)",
    category: "Cloth-Based Mineral Pigment Art",
    craftContext: "Tamarind-gum treated cotton cloth, conch shell white, hingula red, lampblack.",
  },
];

export const SAMPLE_CULTURAL_IMAGES = {
  // Verified Primary Regional Collection
  ...VERIFIED_CULTURAL_IMAGES,

  // Crafts & Visual Arts
  pottery: "/sample-images/indian-pottery.jpg",
  terracotta: "/sample-images/terracotta-craft.jpg",
  brass: "/sample-images/brass-craft.jpg",
  woodCarving: "/sample-images/wood-carving.jpg",
  artisanHands: "/sample-images/artisan-hands.jpg",
  folkArt: "/sample-images/folk-art.jpg",
  puppetry: "/sample-images/folk-puppet.jpg",
  jewelry: "/sample-images/silver-jewelry.jpg",
  rangoli: "/sample-images/rangoli-art.jpg",

  // Textiles & Weaving
  textiles: "/sample-images/indian-textiles.jpg",
  handloom: "/sample-images/handloom-sari.jpg",
  weaving: "/sample-images/traditional-weaving.jpg",

  // Performing Arts & Dance
  dance: "/sample-images/classical-dance.jpg",
  kathakali: "/sample-images/kathakali-dance.jpg",

  // Music & Instruments
  music: "/sample-images/classical-music.jpg",

  // Festivals & Living Traditions
  festivals: "/sample-images/indian-festivals.jpg",
  diwali: "/sample-images/diwali-lights.jpg",

  // Heritage & Landscapes
  heritage: "/sample-images/heritage-architecture.jpg",
  spices: "/sample-images/indian-spices.jpg",

  // Artisans & People
  masterArtisan: "/sample-images/master-artisan.jpg",
  artisanWoman: "/sample-images/artisan-woman.jpg",

  // Existing assets
  heroDefault: "/manus-storage/bharat-culturemap-hero_1c81260f.jpg",
  craftDefault: "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg",
  textileDefault: "/manus-storage/bharat-culturemap-textile_e59e6de2.jpg",
} as const;

/**
 * Returns a high-quality guaranteed image URL based on category or tradition keyword.
 */
export function getCultureImageFallback(
  categoryOrTitle?: string | null,
  providedUrl?: string | null
): string {
  if (providedUrl && providedUrl.trim().length > 0 && !providedUrl.includes("placeholder")) {
    return providedUrl;
  }

  const normalized = (categoryOrTitle || "").toLowerCase();

  // 1. Direct matches to verified national cultural images
  if (normalized.includes("kolhapuri") || normalized.includes("chappal") || normalized.includes("leather footwear")) {
    return VERIFIED_CULTURAL_IMAGES.kolhapuriChappal;
  }
  if (normalized.includes("paithani") || normalized.includes("yeola")) {
    return VERIFIED_CULTURAL_IMAGES.paithaniSaree;
  }
  if (normalized.includes("warli") || normalized.includes("tarpa")) {
    return VERIFIED_CULTURAL_IMAGES.warliPainting;
  }
  if (normalized.includes("blue pottery") || normalized.includes("jaipur pottery")) {
    return VERIFIED_CULTURAL_IMAGES.bluePottery;
  }
  if (normalized.includes("kalbelia") || normalized.includes("serpentine") || normalized.includes("thar")) {
    return VERIFIED_CULTURAL_IMAGES.kalbeliaDance;
  }
  if (normalized.includes("channapatna") || normalized.includes("wooden toy") || normalized.includes("lacquer toy")) {
    return VERIFIED_CULTURAL_IMAGES.channapatnaToys;
  }
  if (normalized.includes("thanjavur") || normalized.includes("tanjore") || normalized.includes("gold leaf")) {
    return VERIFIED_CULTURAL_IMAGES.thanjavurPainting;
  }
  if (normalized.includes("dokra") || normalized.includes("dhokra") || normalized.includes("lost-wax") || normalized.includes("cire perdue")) {
    return VERIFIED_CULTURAL_IMAGES.dokraCasting;
  }
  if (normalized.includes("pattachitra") || normalized.includes("raghurajpur") || normalized.includes("patachitra")) {
    return VERIFIED_CULTURAL_IMAGES.odishaPattachitra;
  }

  // 2. Generic categories
  if (
    normalized.includes("textile") ||
    normalized.includes("sari") ||
    normalized.includes("silk") ||
    normalized.includes("kanchi") ||
    normalized.includes("chanderi") ||
    normalized.includes("jamdani") ||
    normalized.includes("patola") ||
    normalized.includes("pashmina") ||
    normalized.includes("shawl")
  ) {
    return SAMPLE_CULTURAL_IMAGES.handloom;
  }
  if (normalized.includes("pottery") || normalized.includes("ceramic") || normalized.includes("clay")) {
    return VERIFIED_CULTURAL_IMAGES.bluePottery;
  }
  if (normalized.includes("terracotta") || normalized.includes("bankura")) {
    return SAMPLE_CULTURAL_IMAGES.terracotta;
  }
  if (normalized.includes("brass") || normalized.includes("metal") || normalized.includes("bidri") || normalized.includes("bell metal")) {
    return VERIFIED_CULTURAL_IMAGES.dokraCasting;
  }
  if (normalized.includes("wood") || normalized.includes("carv")) {
    return VERIFIED_CULTURAL_IMAGES.channapatnaToys;
  }
  if (
    normalized.includes("dance") ||
    normalized.includes("kathak") ||
    normalized.includes("bharatnatyam") ||
    normalized.includes("odissi") ||
    normalized.includes("chhau") ||
    normalized.includes("lavani")
  ) {
    return SAMPLE_CULTURAL_IMAGES.dance;
  }
  if (normalized.includes("kathakali")) {
    return SAMPLE_CULTURAL_IMAGES.kathakali;
  }
  if (
    normalized.includes("music") ||
    normalized.includes("sitar") ||
    normalized.includes("veena") ||
    normalized.includes("tabla") ||
    normalized.includes("sing") ||
    normalized.includes("dhrupad") ||
    normalized.includes("powada") ||
    normalized.includes("sankirtana")
  ) {
    return SAMPLE_CULTURAL_IMAGES.music;
  }
  if (
    normalized.includes("festival") ||
    normalized.includes("puja") ||
    normalized.includes("utsav") ||
    normalized.includes("fair") ||
    normalized.includes("mela") ||
    normalized.includes("diwali") ||
    normalized.includes("durga")
  ) {
    return SAMPLE_CULTURAL_IMAGES.festivals;
  }
  if (normalized.includes("puppet") || normalized.includes("theatre") || normalized.includes("yakshagana") || normalized.includes("koodiyattam") || normalized.includes("kutiyattam")) {
    return SAMPLE_CULTURAL_IMAGES.puppetry;
  }
  if (normalized.includes("food") || normalized.includes("spice") || normalized.includes("culinary") || normalized.includes("jaggery") || normalized.includes("gul")) {
    return SAMPLE_CULTURAL_IMAGES.spices;
  }
  if (normalized.includes("woman") || normalized.includes("hercraft") || normalized.includes("shg")) {
    return SAMPLE_CULTURAL_IMAGES.artisanWoman;
  }

  return SAMPLE_CULTURAL_IMAGES.craftDefault;
}
