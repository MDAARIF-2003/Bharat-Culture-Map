/**
 * Curated local high-definition sample image library for Bharat CultureMap.
 * All images are served directly from /sample-images/ to guarantee instant,
 * 100% reliable offline & online loading without rate-limiting or broken links.
 */

export const SAMPLE_CULTURAL_IMAGES = {
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

  if (normalized.includes("textile") || normalized.includes("sari") || normalized.includes("silk") || normalized.includes("paithani") || normalized.includes("kanchi") || normalized.includes("chanderi") || normalized.includes("jamdani")) {
    return SAMPLE_CULTURAL_IMAGES.handloom;
  }
  if (normalized.includes("pottery") || normalized.includes("ceramic") || normalized.includes("clay")) {
    return SAMPLE_CULTURAL_IMAGES.pottery;
  }
  if (normalized.includes("terracotta") || normalized.includes("bankura")) {
    return SAMPLE_CULTURAL_IMAGES.terracotta;
  }
  if (normalized.includes("brass") || normalized.includes("dhokra") || normalized.includes("metal") || normalized.includes("bidri")) {
    return SAMPLE_CULTURAL_IMAGES.brass;
  }
  if (normalized.includes("wood") || normalized.includes("carv")) {
    return SAMPLE_CULTURAL_IMAGES.woodCarving;
  }
  if (normalized.includes("dance") || normalized.includes("kathak") || normalized.includes("bharatnatyam") || normalized.includes("odissi") || normalized.includes("chhau") || normalized.includes("lavani")) {
    return SAMPLE_CULTURAL_IMAGES.dance;
  }
  if (normalized.includes("kathakali")) {
    return SAMPLE_CULTURAL_IMAGES.kathakali;
  }
  if (normalized.includes("music") || normalized.includes("sitar") || normalized.includes("veena") || normalized.includes("tabla") || normalized.includes("sing") || normalized.includes("dhrupad") || normalized.includes("powada")) {
    return SAMPLE_CULTURAL_IMAGES.music;
  }
  if (normalized.includes("festival") || normalized.includes("puja") || normalized.includes("utsav") || normalized.includes("fair") || normalized.includes("mela") || normalized.includes("diwali")) {
    return SAMPLE_CULTURAL_IMAGES.festivals;
  }
  if (normalized.includes("puppet") || normalized.includes("theatre") || normalized.includes("yakshagana")) {
    return SAMPLE_CULTURAL_IMAGES.puppetry;
  }
  if (normalized.includes("food") || normalized.includes("spice") || normalized.includes("culinary")) {
    return SAMPLE_CULTURAL_IMAGES.spices;
  }
  if (normalized.includes("chappal") || normalized.includes("leather") || normalized.includes("craft")) {
    return SAMPLE_CULTURAL_IMAGES.craftDefault;
  }
  if (normalized.includes("woman") || normalized.includes("hercraft") || normalized.includes("shg")) {
    return SAMPLE_CULTURAL_IMAGES.artisanWoman;
  }

  return SAMPLE_CULTURAL_IMAGES.heroDefault;
}
