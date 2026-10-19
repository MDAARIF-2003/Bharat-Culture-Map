import {
  CultureCategory,
  UnescoDomain,
} from "../../shared/const";
import {
  CulturalEventAdmin,
  CulturalRecordAdmin,
  GeoLocation,
} from "../../shared/contracts";
import { loadAdministrativeGeographyDataset } from "./import-geography";
import { createDefaultRightsPassport } from "../modules/consent-gate";

export interface SeedBundle {
  locations: GeoLocation[];
  demoRecords: CulturalRecordAdmin[];
  initialEvents: CulturalEventAdmin[];
}

const RAW_STATES: Array<[string, string, string, number, number]> = [
  ["Gujarat", "गुजरात", "GJ", 22.3, 71.8],
  ["Rajasthan", "राजस्थान", "RJ", 26.7, 73.8],
  ["Maharashtra", "महाराष्ट्र", "MH", 19.2, 75.3],
  ["Kerala", "केरळ", "KL", 10.3, 76.3],
  ["Tamil Nadu", "तामिळनाडू", "TN", 11.1, 78.3],
  ["Odisha", "ओडिशा", "OD", 20.3, 84.5],
  ["Assam", "आसाम", "AS", 26.2, 92.9],
  ["Manipur", "मणिपूर", "MN", 24.8, 93.9],
  ["Punjab", "पंजाब", "PB", 31.0, 75.3],
  ["Uttar Pradesh", "उत्तर प्रदेश", "UP", 26.8, 81.1],
  ["Karnataka", "कर्नाटक", "KA", 14.7, 75.7],
  ["Bihar", "बिहार", "BR", 25.7, 85.4],
  ["Madhya Pradesh", "मध्य प्रदेश", "MP", 23.5, 78.5],
  ["Jharkhand", "झारखंड", "JH", 23.6, 85.5],
  ["Goa", "गोवा", "GA", 15.4, 74.1],
  ["Jammu & Kashmir", "जम्मू आणि काश्मीर", "JK", 33.7, 75.3],
  ["Ladakh", "लडाख", "LA", 34.2, 77.6],
  ["Sikkim", "सिक्कीम", "SK", 27.5, 88.5],
  ["Meghalaya", "मेघालय", "ML", 25.5, 91.3],
  ["Mizoram", "मिझोरम", "MZ", 23.4, 92.8],
  ["Nagaland", "नागालँड", "NL", 25.7, 94.1],
  ["Tripura", "त्रिपुरा", "TR", 23.8, 91.3],
  ["Uttarakhand", "उत्तराखंड", "UK", 30.1, 79.1],
  ["Himachal Pradesh", "हिमाचल प्रदेश", "HP", 31.4, 77.5],
  ["Chhattisgarh", "छत्तीसगड", "CG", 21.3, 81.7],
  ["Telangana", "तेलंगणा", "TS", 17.9, 79.4],
  ["Andhra Pradesh", "आंध्र प्रदेश", "AP", 16.3, 80.4],
  ["West Bengal", "पश्चिम बंगाल", "WB", 23.2, 87.8],
];

const RAW_CITIES: Record<
  string,
  {
    state: string;
    district: string;
    nameMr?: string;
    center: { lat: number; lng: number };
    records: Array<{
      name: string;
      category: CultureCategory;
      description: string;
    }>;
  }
> = {
  Kolhapur: {
    state: "Maharashtra",
    district: "Kolhapur District",
    nameMr: "कोल्हापूर (करवीर)",
    center: { lat: 16.705, lng: 74.2433 },
    records: [], // Populated with the 5 featured Kolhapur DEMO_REFERENCE records below
  },
  Kagal: {
    state: "Maharashtra",
    district: "Kolhapur District",
    nameMr: "कागल / कापशी",
    center: { lat: 16.5772, lng: 74.3158 },
    records: [],
  },
  Ichalkaranji: {
    state: "Maharashtra",
    district: "Kolhapur District",
    nameMr: "इचलकरंजी (हातकणंगले)",
    center: { lat: 16.6912, lng: 74.4605 },
    records: [],
  },
  Panhala: {
    state: "Maharashtra",
    district: "Kolhapur District",
    nameMr: "पन्हाळा",
    center: { lat: 16.8115, lng: 74.1078 },
    records: [],
  },
  Pune: {
    state: "Maharashtra",
    district: "Pune District",
    nameMr: "पुणे",
    center: { lat: 18.5204, lng: 73.8567 },
    records: [
      {
        name: "Lavani",
        category: "Dance",
        description:
          "A performance ecology of rhythm, poetry, costume, and stage.",
      },
      {
        name: "Mardani Khel (Pune Akhada Reference)",
        category: "Traditional Knowledge",
        description:
          "Martial knowledge carried through movement and discipline.",
      },
    ],
  },
  Mumbai: {
    state: "Maharashtra",
    district: "Mumbai District",
    nameMr: "मुंबई",
    center: { lat: 19.076, lng: 72.8777 },
    records: [
      {
        name: "Koli song traditions",
        category: "Music",
        description:
          "Coastal songs and collective memory at the water’s edge.",
      },
      {
        name: "Warli visual language",
        category: "Textile",
        description:
          "A related regional visual vocabulary of line, rhythm, and story.",
      },
    ],
  },
  Ahmedabad: {
    state: "Gujarat",
    district: "Ahmedabad District",
    center: { lat: 23.0225, lng: 72.5714 },
    records: [
      {
        name: "Patola weaving",
        category: "Textile",
        description:
          "A heritage trail through double-ikat weaving knowledge and material memory.",
      },
      {
        name: "Garba traditions",
        category: "Dance",
        description:
          "A regional dance tradition held in circles of community and season.",
      },
    ],
  },
  Jaipur: {
    state: "Rajasthan",
    district: "Jaipur District",
    center: { lat: 26.9124, lng: 75.7873 },
    records: [
      {
        name: "Block printing",
        category: "Textile",
        description:
          "Colour, carved wood, and the slow rhythm of repeated gesture.",
      },
      {
        name: "Kathputli performance",
        category: "Performance",
        description:
          "Puppet theatre, oral memory, and itinerant storytelling.",
      },
    ],
  },
  Kochi: {
    state: "Kerala",
    district: "Ernakulam District",
    center: { lat: 9.9312, lng: 76.2673 },
    records: [
      {
        name: "Kathakali",
        category: "Performance",
        description:
          "Paint, gesture, percussion, and a highly coded visual language.",
      },
      {
        name: "Coir making",
        category: "Craft",
        description: "Fibre, water, and a coastal material practice.",
      },
    ],
  },
  Chennai: {
    state: "Tamil Nadu",
    district: "Chennai District",
    center: { lat: 13.0827, lng: 80.2707 },
    records: [
      {
        name: "Bharatanatyam",
        category: "Dance",
        description: "An embodied vocabulary of rhythm, gaze, and narrative.",
      },
      {
        name: "Kolam",
        category: "Traditional Knowledge",
        description:
          "Threshold drawings made with repetition, symmetry, and care.",
      },
    ],
  },
  Bhubaneswar: {
    state: "Odisha",
    district: "Khordha District",
    center: { lat: 20.2961, lng: 85.8245 },
    records: [
      {
        name: "Odissi",
        category: "Dance",
        description:
          "A classical form shaped by sculpture, rhythm, and devotion.",
      },
      {
        name: "Pattachitra",
        category: "Craft",
        description:
          "Natural pigments and narrative painting on prepared surfaces.",
      },
    ],
  },
  Guwahati: {
    state: "Assam",
    district: "Kamrup Metropolitan District",
    center: { lat: 26.1445, lng: 91.7362 },
    records: [
      {
        name: "Bihu",
        category: "Festival",
        description:
          "Seasonal gathering, music, dance, and collective welcome.",
      },
      {
        name: "Muga silk",
        category: "Textile",
        description:
          "A golden fibre tradition connected to landscape and labour.",
      },
    ],
  },
  Imphal: {
    state: "Manipur",
    district: "Imphal West District",
    center: { lat: 24.817, lng: 93.9368 },
    records: [
      {
        name: "Manipuri dance",
        category: "Dance",
        description:
          "A graceful performance tradition shaped by devotion and story.",
      },
      {
        name: "Pena music",
        category: "Music",
        description:
          "A bowed instrument carrying a distinctive regional sound.",
      },
    ],
  },
  Amritsar: {
    state: "Punjab",
    district: "Amritsar District",
    center: { lat: 31.634, lng: 74.8723 },
    records: [
      {
        name: "Phulkari",
        category: "Textile",
        description:
          "Embroidery as memory, adornment, and a language of care.",
      },
      {
        name: "Giddha",
        category: "Dance",
        description: "Women-led performance, verse, gesture, and wit.",
      },
    ],
  },
  Lucknow: {
    state: "Uttar Pradesh",
    district: "Lucknow District",
    center: { lat: 26.8467, lng: 80.9462 },
    records: [
      {
        name: "Chikankari",
        category: "Textile",
        description:
          "Fine hand embroidery with a vocabulary of delicate stitches.",
      },
      {
        name: "Kathak",
        category: "Dance",
        description: "Footwork, storytelling, and rhythmic conversation.",
      },
    ],
  },
  Varanasi: {
    state: "Uttar Pradesh",
    district: "Varanasi District",
    center: { lat: 25.3176, lng: 82.9739 },
    records: [
      {
        name: "Banarasi weaving",
        category: "Textile",
        description: "Silk, zari, and a living grammar of pattern.",
      },
      {
        name: "Shehnai traditions",
        category: "Music",
        description:
          "A ceremonial soundscape carried through breath and gathering.",
      },
    ],
  },
  Mysuru: {
    state: "Karnataka",
    district: "Mysuru District",
    center: { lat: 12.2958, lng: 76.6394 },
    records: [
      {
        name: "Mysore painting",
        category: "Craft",
        description: "Gold leaf, line, and devotional image-making.",
      },
      {
        name: "Dasara procession",
        category: "Festival",
        description:
          "A public celebration where craft, movement, and history meet.",
      },
    ],
  },
  Bengaluru: {
    state: "Karnataka",
    district: "Bengaluru Urban District",
    center: { lat: 12.9716, lng: 77.5946 },
    records: [
      {
        name: "Yakshagana regional culture",
        category: "Performance",
        description:
          "Music, costume, and dramatic storytelling from the coast.",
      },
      {
        name: "Handloom revival",
        category: "Textile",
        description:
          "Contemporary making grounded in older material knowledge.",
      },
    ],
  },
  Patna: {
    state: "Bihar",
    district: "Patna District",
    center: { lat: 25.5941, lng: 85.1376 },
    records: [
      {
        name: "Madhubani regional culture",
        category: "Craft",
        description:
          "A related visual tradition of line, myth, and domestic making.",
      },
      {
        name: "Chhath",
        category: "Festival",
        description:
          "Ritual, river, song, and collective seasonal practice.",
      },
    ],
  },
  Bhopal: {
    state: "Madhya Pradesh",
    district: "Bhopal District",
    center: { lat: 23.2599, lng: 77.4126 },
    records: [
      {
        name: "Gond painting",
        category: "Craft",
        description:
          "A visual language that maps relationships between living beings.",
      },
      {
        name: "Tribal metalwork",
        category: "Craft",
        description:
          "Material knowledge shaped by local ecology and handwork.",
      },
    ],
  },
  Ranchi: {
    state: "Jharkhand",
    district: "Ranchi District",
    center: { lat: 23.3441, lng: 85.3096 },
    records: [
      {
        name: "Sohrai painting",
        category: "Craft",
        description:
          "Seasonal wall painting and a visual language of animals and place.",
      },
      {
        name: "Adivasi song traditions",
        category: "Music",
        description:
          "Community voice, movement, and story held in gathering.",
      },
    ],
  },
  Panaji: {
    state: "Goa",
    district: "North Goa District",
    center: { lat: 15.4909, lng: 73.8278 },
    records: [
      {
        name: "Mando",
        category: "Music",
        description:
          "A Goan song form where voice, movement, and memory meet.",
      },
      {
        name: "Cuncolim pottery",
        category: "Craft",
        description: "Clay, firing, and a coastal making tradition.",
      },
    ],
  },
  Srinagar: {
    state: "Jammu & Kashmir",
    district: "Srinagar District",
    center: { lat: 34.0837, lng: 74.7973 },
    records: [
      {
        name: "Kashmiri papier-mâché",
        category: "Craft",
        description: "Layered surfaces, colour, and patient handwork.",
      },
      {
        name: "Sozni embroidery",
        category: "Textile",
        description: "Fine needlework with a vocabulary of floral detail.",
      },
    ],
  },
  Leh: {
    state: "Ladakh",
    district: "Leh District",
    center: { lat: 34.1526, lng: 77.5771 },
    records: [
      {
        name: "Ladakhi weaving",
        category: "Textile",
        description: "Fibre and pattern shaped by high-altitude life.",
      },
      {
        name: "Cham dance",
        category: "Dance",
        description: "Masked ritual movement held within monastery contexts.",
      },
    ],
  },
  Gangtok: {
    state: "Sikkim",
    district: "Gangtok District",
    center: { lat: 27.3314, lng: 88.6138 },
    records: [
      {
        name: "Thangka painting",
        category: "Craft",
        description:
          "A contemplative image practice built through layered detail.",
      },
      {
        name: "Losar",
        category: "Festival",
        description:
          "A seasonal cultural gathering with food, ritual, and song.",
      },
    ],
  },
  Shillong: {
    state: "Meghalaya",
    district: "East Khasi Hills District",
    center: { lat: 25.5788, lng: 91.8933 },
    records: [
      {
        name: "Khasi music",
        category: "Music",
        description:
          "A living soundscape of voice, instrument, and community.",
      },
      {
        name: "Bamboo craft",
        category: "Craft",
        description:
          "Material practice shaped by local ecology and everyday use.",
      },
    ],
  },
  Aizawl: {
    state: "Mizoram",
    district: "Aizawl District",
    center: { lat: 23.7271, lng: 92.7176 },
    records: [
      {
        name: "Puan weaving",
        category: "Textile",
        description:
          "Woven identity, colour, and knowledge carried through cloth.",
      },
      {
        name: "Cheraw",
        category: "Dance",
        description: "Bamboo rhythm, movement, and collective precision.",
      },
    ],
  },
  Kohima: {
    state: "Nagaland",
    district: "Kohima District",
    center: { lat: 25.6751, lng: 94.1086 },
    records: [
      {
        name: "Naga shawl traditions",
        category: "Textile",
        description:
          "Pattern, identity, and social meaning carried in woven form.",
      },
      {
        name: "Hornbill Festival",
        category: "Festival",
        description: "A gathering of performance, food, craft, and exchange.",
      },
    ],
  },
  Agartala: {
    state: "Tripura",
    district: "West Tripura District",
    center: { lat: 23.8315, lng: 91.2868 },
    records: [
      {
        name: "Bamboo craft (Tripura)",
        category: "Craft",
        description: "Bamboo, utility, and a regional culture of making.",
      },
      {
        name: "Hojagiri",
        category: "Dance",
        description: "Balance, rhythm, and community performance.",
      },
    ],
  },
  Dehradun: {
    state: "Uttarakhand",
    district: "Dehradun District",
    center: { lat: 30.3165, lng: 78.0322 },
    records: [
      {
        name: "Aipan",
        category: "Craft",
        description:
          "Ritual floor drawings made from line, repetition, and intention.",
      },
      {
        name: "Jagar",
        category: "Music",
        description: "An oral ritual music tradition rooted in place.",
      },
    ],
  },
  Shimla: {
    state: "Himachal Pradesh",
    district: "Shimla District",
    center: { lat: 31.1048, lng: 77.1734 },
    records: [
      {
        name: "Kullu shawl",
        category: "Textile",
        description: "Wool, geometry, and mountain material knowledge.",
      },
      {
        name: "Nati",
        category: "Dance",
        description: "A community dance held in circular movement.",
      },
    ],
  },
  Raipur: {
    state: "Chhattisgarh",
    district: "Raipur District",
    center: { lat: 21.2514, lng: 81.6296 },
    records: [
      {
        name: "Dhokra craft",
        category: "Craft",
        description: "Lost-wax metalwork with a tactile language of form.",
      },
      {
        name: "Panthi",
        category: "Dance",
        description: "Devotional movement, rhythm, and collective performance.",
      },
    ],
  },
  Hyderabad: {
    state: "Telangana",
    district: "Hyderabad District",
    center: { lat: 17.385, lng: 78.4867 },
    records: [
      {
        name: "Bidri-related metalwork",
        category: "Craft",
        description:
          "A regional material story of dark metal and silver inlay.",
      },
      {
        name: "Bonalu",
        category: "Festival",
        description:
          "A city festival with food, procession, and embodied devotion.",
      },
    ],
  },
  Vijayawada: {
    state: "Andhra Pradesh",
    district: "NTR District",
    center: { lat: 16.5062, lng: 80.648 },
    records: [
      {
        name: "Kalamkari",
        category: "Textile",
        description: "Natural dye, drawn line, and narrative cloth.",
      },
      {
        name: "Kuchipudi",
        category: "Dance",
        description:
          "A classical dance tradition shaped by theatre and rhythm.",
      },
    ],
  },
  Kolkata: {
    state: "West Bengal",
    district: "Kolkata District",
    center: { lat: 22.5726, lng: 88.3639 },
    records: [
      {
        name: "Durga Puja",
        category: "Festival",
        description:
          "A city-wide cultural ecology of making, gathering, and public art.",
      },
      {
        name: "Baul traditions",
        category: "Music",
        description:
          "A travelling philosophy of voice, song, and inner searching.",
      },
      {
        name: "Patachitra-related regional culture",
        category: "Craft",
        description:
          "Narrative painting and the social life of image-making.",
      },
    ],
  },
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapCategoryToUnesco(cat: CultureCategory): UnescoDomain {
  switch (cat) {
    case "Craft":
    case "Textile":
      return "Traditional craftsmanship";
    case "Music":
      return "Oral traditions and expressions";
    case "Dance":
    case "Performance":
      return "Performing arts";
    case "Festival":
    case "Food Heritage":
    case "Games":
      return "Social practices, rituals and festive events";
    case "Traditional Knowledge":
      return "Knowledge and practices concerning nature and the universe";
  }
}

export function buildInitialSeedBundle(): SeedBundle {
  const now = "2026-10-15T00:00:00.000Z";
  const locations: GeoLocation[] = [
    {
      id: "loc-country-in",
      level: "COUNTRY",
      nameEn: "India",
      nameMr: "भारत",
      abbr: "IN",
      parentId: null,
      centerLat: 21.15,
      centerLng: 79.0,
      defaultZoom: 5,
    },
  ];

  const stateIdByName = new Map<string, string>();
  for (const [nameEn, nameMr, abbr, centerLat, centerLng] of RAW_STATES) {
    const id = `loc-state-${slugify(nameEn)}`;
    stateIdByName.set(nameEn, id);
    locations.push({
      id,
      level: "STATE",
      nameEn,
      nameMr,
      abbr,
      parentId: "loc-country-in",
      centerLat,
      centerLng,
      defaultZoom: 7,
    });
  }

  const districtIdByName = new Map<string, string>();
  const cityIdByName = new Map<string, string>();

  for (const [cityName, cityDef] of Object.entries(RAW_CITIES)) {
    const stateId = stateIdByName.get(cityDef.state)!;
    let districtId = districtIdByName.get(cityDef.district);
    if (!districtId) {
      districtId = `loc-district-${slugify(cityDef.district)}`;
      districtIdByName.set(cityDef.district, districtId);
      locations.push({
        id: districtId,
        level: "DISTRICT",
        nameEn: cityDef.district,
        nameMr:
          cityDef.district === "Kolhapur District"
            ? "कोल्हापूर जिल्हा"
            : undefined,
        parentId: stateId,
        centerLat: cityDef.center.lat,
        centerLng: cityDef.center.lng,
        defaultZoom: 10,
      });
    }

    const cityId = `loc-city-${slugify(cityName)}`;
    cityIdByName.set(cityName, cityId);
    locations.push({
      id: cityId,
      level: "CITY_TOWN",
      nameEn: cityName,
      nameMr: cityDef.nameMr,
      parentId: districtId,
      centerLat: cityDef.center.lat,
      centerLng: cityDef.center.lng,
      defaultZoom: 12,
    });
  }

  const mhStateId = stateIdByName.get("Maharashtra")!;
  const kolhapurDistrictId = districtIdByName.get("Kolhapur District")!;
  const kolhapurCityId = cityIdByName.get("Kolhapur")!;

  const kolhapurFeaturedDemos: Array<{
    slug: string;
    titleEn: string;
    titleMr: string;
    subtitleEn: string;
    category: CultureCategory;
    unescoDomain: UnescoDomain;
    isWomenLed: boolean;
    talukaId: string;
    talukaName: string;
    summaryEn: string;
    practiceContextEn: string;
    sourceAttribution: string;
    sourceUrl: string;
    tags: string[];
  }> = [
    {
      slug: "kolhapuri-chappal-demo",
      titleEn: "Kolhapuri Chappal",
      titleMr: "कोल्हापुरी चप्पल",
      subtitleEn: "Traditional craft · material knowledge · hand-shaped leather",
      category: "Craft",
      unescoDomain: "Traditional craftsmanship",
      isWomenLed: false,
      talukaId: "loc-taluka-karveer",
      talukaName: "Karveer",
      summaryEn:
        "Hand-shaped vegetable-tanned leather footwear, regional vocabulary, and a craft lineage carried across Kolhapur District.",
      practiceContextEn:
        "Documented as a public cultural reference entry with Geographical Indications (GI) source attribution while practitioner-governed field interviews, workshop vocabulary, and oral histories are being collected in Karveer and Kagal.",
      sourceAttribution:
        "Geographical Indications Registry of India (GI Tag No. 169) & Maharashtra State Gazetteers — Kolhapur District",
      sourceUrl: "https://ipindia.gov.in/",
      tags: ["Leatherwork", "Handmade", "Regional knowledge"],
    },
    {
      slug: "kolhapuri-saaj-demo",
      titleEn: "Kolhapuri Saaj",
      titleMr: "कोल्हापुरी साज",
      subtitleEn: "Adornment & metalwork · ceremonial gold craft",
      category: "Craft",
      unescoDomain: "Traditional craftsmanship",
      isWomenLed: true,
      talukaId: "loc-taluka-karveer",
      talukaName: "Karveer",
      summaryEn:
        "A visual language of gold repoussé, twenty-one traditional motifs, and ceremonial belonging in Kolhapur.",
      practiceContextEn:
        "Included as a cultural reference entry in Kolhapur District with Maharashtra State Gazetteer attribution while practitioner-governed field interviews, consent collection, and folklore review are in progress.",
      sourceAttribution:
        "Maharashtra State Gazetteers — Kolhapur District Volume & Crafts Council of India Reference",
      sourceUrl: "https://cultural.maharashtra.gov.in/",
      tags: ["Metalwork", "Adornment", "Ceremonial craft"],
    },
    {
      slug: "mardani-khel-kolhapur-demo",
      titleEn: "Mardani Khel",
      titleMr: "मर्दानी खेळ",
      subtitleEn: "Martial knowledge · public-safe context only",
      category: "Traditional Knowledge",
      unescoDomain:
        "Knowledge and practices concerning nature and the universe",
      isWomenLed: false,
      talukaId: "loc-taluka-panhala",
      talukaName: "Panhala",
      summaryEn:
        "Movement, discipline, and embodied akhada martial knowledge in Kolhapur and Panhala.",
      practiceContextEn:
        "Specific training sequences in Mardani Khel are governed by talim elders; only public-safe historical and cultural context is shared in accordance with community boundaries.",
      sourceAttribution:
        "Maharashtra State Gazetteers — Kolhapur District Volume & Regional Talim Heritage Reference",
      sourceUrl: "https://cultural.maharashtra.gov.in/",
      tags: ["Martial art", "Embodied knowledge", "Public-safe context"],
    },
    {
      slug: "powada-kolhapur-demo",
      titleEn: "Powada",
      titleMr: "पोवाडा",
      subtitleEn: "Oral performance · ballad tradition sung by shahirs",
      category: "Music",
      unescoDomain: "Oral traditions and expressions",
      isWomenLed: false,
      talukaId: "loc-taluka-karveer",
      talukaName: "Karveer",
      summaryEn:
        "Epic sung histories by Marathi shahirs that keep a region’s memory in motion.",
      practiceContextEn:
        "An oral, performance-based ballad tradition sung by shahirs where sound, daf rhythm, and occasion carry meaning that line-by-line translation can flatten.",
      sourceAttribution:
        "Sangeet Natak Akademi & Maharashtra State Literature and Culture Board Reference",
      sourceUrl: "https://sangeetnatak.gov.in/",
      tags: ["Shahir tradition", "Oral history", "Ballad performance"],
    },
    {
      slug: "gondhal-kolhapur-demo",
      titleEn: "Gondhal",
      titleMr: "गोंधळ",
      subtitleEn: "Ritual performance · devotional narrative and percussion",
      category: "Performance",
      unescoDomain: "Performing arts",
      isWomenLed: false,
      talukaId: "loc-taluka-karveer",
      talukaName: "Karveer",
      summaryEn:
        "A ceremonial dramatic and musical form where voice, sambal rhythm, and community meet.",
      practiceContextEn:
        "A ritual performance linked to devotional practice where the recorded performance remains primary and contextual mediation stays secondary.",
      sourceAttribution:
        "Sahapedia Open Cultural Reference & Maharashtra Folklore Documentation Archive",
      sourceUrl: "https://www.sahapedia.org/",
      tags: ["Ritual performance", "Oral tradition", "Community gathering"],
    },
  ];

  // Merge extra administrative geography (all 36 States/UTs, 36 Maharashtra districts, 12 Kolhapur talukas, towns & villages)
  const existingLocationIds = new Set(locations.map((l) => l.id));
  const { extraLocations } = loadAdministrativeGeographyDataset();
  for (const extraLoc of extraLocations) {
    if (!existingLocationIds.has(extraLoc.id)) {
      locations.push(extraLoc);
      existingLocationIds.add(extraLoc.id);
    }
  }

  const demoRecords: CulturalRecordAdmin[] = [];

  const kolhapurVocabBySlug: Record<string, Array<{ termRoman: string; termDevanagari: string; meaningEn: string }>> = {
    "kolhapuri-chappal-demo": [
      { termRoman: "Rapi", termDevanagari: "रापी", meaningEn: "curved half-moon leather-cutting blade" },
      { termRoman: "Veni", termDevanagari: "वेणी", meaningEn: "hand-braided leather upper cord" },
      { termRoman: "Hirda", termDevanagari: "हिरडा", meaningEn: "myrobalan fruit used in vegetable tanning" },
    ],
    "kolhapuri-saaj-demo": [
      { termRoman: "Javmani", termDevanagari: "जवमणी", meaningEn: "barley-shaped gold bead in Kolhapuri Saaj" },
      { termRoman: "Panadi", termDevanagari: "पानडी", meaningEn: "repoussé gold leaf motif" },
      { termRoman: "Ghat", termDevanagari: "घाट", meaningEn: "hand-shaped sheet-gold form" },
    ],
    "mardani-khel-kolhapur-demo": [
      { termRoman: "Dandpatta", termDevanagari: "दांडपट्टा", meaningEn: "flexible gauntlet-sword of the Maratha akhada" },
      { termRoman: "Talim", termDevanagari: "तालीम", meaningEn: "traditional martial and wrestling gymnasium" },
      { termRoman: "Pavitrak", termDevanagari: "पवित्रक", meaningEn: "disciplined defensive and offensive footwork stance" },
    ],
    "powada-kolhapur-demo": [
      { termRoman: "Shahir", termDevanagari: "शाहीर", meaningEn: "composer-bard of heroic historical ballads" },
      { termRoman: "Daf", termDevanagari: "डफ", meaningEn: "frame drum driving the Powada tempo" },
      { termRoman: "Kavan", termDevanagari: "कवण", meaningEn: "sung poetic stanza in oral history" },
    ],
    "gondhal-kolhapur-demo": [
      { termRoman: "Sambal", termDevanagari: "संबळ", meaningEn: "paired twin-drum played during Gondhal" },
      { termRoman: "Divti", termDevanagari: "दिवटी", meaningEn: "consecrated oil torch held during invocation" },
      { termRoman: "Tuntune", termDevanagari: "तुणतुणे", meaningEn: "single-stringed plucked drone instrument" },
    ],
  };

  const kolhapurTraditionBySlug: Record<string, { traditionId: string | null; traditionSlug: string | null; heroImageUrl: string }> = {
    "kolhapuri-chappal-demo": {
      traditionId: "trad-kolhapuri-chappal",
      traditionSlug: "kolhapuri-chappal",
      heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Indian_chappal%2C_Kolhapur%2C_late_20th_century_-_Bata_Shoe_Museum_-_DSC00445.JPG",
    },
    "kolhapuri-saaj-demo": {
      traditionId: "trad-kolhapuri-saaj",
      traditionSlug: "kolhapuri-saaj",
      heroImageUrl: "",
    },
    "mardani-khel-kolhapur-demo": {
      traditionId: "trad-kushti-talim-kolhapur",
      traditionSlug: "kushti-and-mardani-khel",
      heroImageUrl: "",
    },
    "powada-kolhapur-demo": {
      traditionId: "trad-gondhal-powada-maharashtra",
      traditionSlug: "powada-and-gondhal",
      heroImageUrl: "",
    },
    "gondhal-kolhapur-demo": {
      traditionId: "trad-gondhal-powada-maharashtra",
      traditionSlug: "powada-and-gondhal",
      heroImageUrl: "",
    },
  };

  for (const item of kolhapurFeaturedDemos) {
    const id = `rec-demo-${item.slug}`;
    const passport = createDefaultRightsPassport(
      `pass-${id}`,
      id,
      "DEMO_REFERENCE"
    );
    const tMeta = kolhapurTraditionBySlug[item.slug] || { traditionId: null, traditionSlug: null, heroImageUrl: "" };
    const customVocab = (kolhapurVocabBySlug[item.slug] || []).map((v, idx) => ({
      id: `voc-${id}-${idx + 1}`,
      culturalRecordId: id,
      termRoman: v.termRoman,
      termDevanagari: v.termDevanagari,
      languageCode: "mr",
      meaningEn: v.meaningEn,
    }));
    demoRecords.push({
      traditionId: tMeta.traditionId,
      traditionSlug: tMeta.traditionSlug,
      id,
      slug: item.slug,
      recordOrigin: "DEMO_REFERENCE",
      status: "PUBLISHED",
      unescoDomain: item.unescoDomain,
      category: item.category,
      isWomenLed: item.isWomenLed,
      isSacredOrRestricted: false,
      practitionerFullNamePrivate: "",
      practitionerChosenName: "Community verification pending",
      practitionerCommunityName:
        "Regional tradition bearers (verification in progress)",
      practitionerVillagePrivate: "",
      practitionerTaluka: item.talukaName,
      practitionerPhonePrivate: "",
      practitionerAddressPrivate: "",
      stateId: mhStateId,
      districtId: kolhapurDistrictId,
      talukaId: item.talukaId,
      cityTownId: kolhapurCityId,
      exactLatPrivate: null,
      exactLngPrivate: null,
      titleEn: item.titleEn,
      titleMr: item.titleMr,
      subtitleEn: item.subtitleEn,
      summaryEn: item.summaryEn,
      summaryMr: "",
      practiceContextEn: item.practiceContextEn,
      practiceContextMr: "",
      tags: item.tags,
      heroImageUrl: tMeta.heroImageUrl,
      sourceAttribution: item.sourceAttribution,
      sourceUrl: item.sourceUrl,
      originalVoiceLanguage: "Marathi",
      originalVoiceAudioUrl: null,
      originalVoiceTranscriptMr:
        "पुढील ध्वनिमुद्रण कलाकारांच्या संमतीनेच केले जाईल. (Collection in progress — original practitioner voice recordings are published only after informed consent and practitioner approval.)",
      mediationM1SubtitlesEn:
        "Line-by-line subtitle layer — published after practitioner and language reviewer sign-off.",
      mediationM2SyntheticContextText:
        "Contextual narration layer — provides approved background context and never imitates a practitioner's voice.",
      mediationM3HumanStoryCompanionText:
        "Human Story Companion context beside the original performance so the listener is brought towards the source.",
      mediationM3NarratorCredit:
        "Reference Context Summary (Community Verification Pending)",
      storyCompanionPrompts: [
        {
          question: `What defines ${item.titleEn}?`,
          answer: item.summaryEn,
        },
        {
          question: "What is its documentation status?",
          answer: item.practiceContextEn,
        },
        {
          question: "What should visitors respect?",
          answer: "Consent, source attribution, and community boundaries.",
        },
      ],
      vocabulary: customVocab,
      rightsPassport: passport,
      provenanceLogs: [
        {
          id: `prov-${id}-1`,
          culturalRecordId: id,
          stepType: "COLLECTED",
          performedByUserId: null,
          performedByRole: "SYSTEM_DEMO_SEED",
          performedByDisplay: "Cultural Reference Directory (Source Attributed)",
          practitionerApproved: false,
          practitionerApprovedAt: null,
          versionLabel: "v1-ref",
          notes: `Reference information compiled from ${item.sourceAttribution}. Community verification and field consent collection in progress.`,
          createdAt: now,
        },
      ],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const [cityName, cityDef] of Object.entries(RAW_CITIES)) {
    const stateId = stateIdByName.get(cityDef.state)!;
    const districtId = districtIdByName.get(cityDef.district)!;
    const cityId = cityIdByName.get(cityName)!;

    for (const rec of cityDef.records) {
      const slug = `${slugify(cityName)}-${slugify(rec.name)}-demo`;
      const id = `rec-demo-${slug}`;
      const passport = createDefaultRightsPassport(
        `pass-${id}`,
        id,
        "DEMO_REFERENCE"
      );
      const sourceAttr = `Ministry of Culture Cultural Atlas of India, Sangeet Natak Akademi & Sahapedia Open Cultural Reference (${cityName}, ${cityDef.state})`;
      demoRecords.push({
        id,
        slug,
        recordOrigin: "DEMO_REFERENCE",
        status: "PUBLISHED",
        unescoDomain: mapCategoryToUnesco(rec.category),
        category: rec.category,
        isWomenLed: rec.name === "Giddha",
        isSacredOrRestricted: false,
        practitionerFullNamePrivate: "",
        practitionerChosenName: "Community verification pending",
        practitionerCommunityName:
          "Regional tradition bearers (verification in progress)",
        practitionerVillagePrivate: "",
        practitionerTaluka: "",
        practitionerPhonePrivate: "",
        practitionerAddressPrivate: "",
        stateId,
        districtId,
        talukaId: null,
        cityTownId: cityId,
        exactLatPrivate: null,
        exactLngPrivate: null,
        titleEn: rec.name,
        titleMr: "",
        subtitleEn: `${rec.category} · ${cityName}, ${cityDef.state}`,
        summaryEn: rec.description,
        summaryMr: "",
        practiceContextEn: `${rec.description} Documented as reference information with source attribution; community verification and practitioner consent collection pending.`,
        practiceContextMr: "",
        traditionId:
          rec.name === "Kathakali" ? "trad-kathakali"
          : rec.name === "Odissi" ? "trad-odissi"
          : rec.name === "Pattachitra" ? "trad-pattachitra"
          : rec.name === "Warli visual language" ? "trad-warli-painting"
          : rec.name === "Garba traditions" ? "trad-garba-of-gujarat"
          : rec.name === "Patola weaving" ? "trad-patan-patola-gujarat"
          : rec.name === "Bharatanatyam" ? "trad-bharatanatyam"
          : rec.name === "Bihu" ? "trad-bihu-assam"
          : rec.name === "Muga silk" ? "trad-muga-silk-assam"
          : rec.name === "Manipuri dance" ? "trad-sankirtana-manipur"
          : null,
        traditionSlug:
          rec.name === "Kathakali" ? "kathakali"
          : rec.name === "Odissi" ? "odissi"
          : rec.name === "Pattachitra" ? "pattachitra"
          : rec.name === "Warli visual language" ? "warli-painting"
          : rec.name === "Garba traditions" ? "garba"
          : rec.name === "Patola weaving" ? "patan-patola"
          : rec.name === "Bharatanatyam" ? "bharatanatyam"
          : rec.name === "Bihu" ? "bihu"
          : rec.name === "Muga silk" ? "muga-silk-weaving-assam"
          : rec.name === "Manipuri dance" ? "sankirtana-manipur"
          : null,
        tags: [rec.category, cityName, "Reference Information"],
        heroImageUrl:
          rec.name === "Kathakali" ? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Kathakali_-Play_with_Kaurava.jpg"
          : rec.name === "Odissi" ? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Odissi_dance_at_Nishagandi_Dance_Festival_2024_%28207%29.jpg"
          : rec.name === "Pattachitra" ? "https://upload.wikimedia.org/wikipedia/commons/7/7d/Odisha_Pattachitara_Depicting_Unconditional_Love_between_Radha_Krushna.jpg"
          : rec.name === "Warli visual language" ? "https://upload.wikimedia.org/wikipedia/commons/9/94/Painted_prayers%2C_Warli_paintings%2C_at_Sanskriti_Kendra%2C_Anandagram%2C_New_Delhi.jpg"
          : rec.name === "Garba traditions" ? "https://upload.wikimedia.org/wikipedia/commons/3/39/Garba_%28dance%29.jpg"
          : rec.name === "Bihu" ? "https://upload.wikimedia.org/wikipedia/commons/4/48/Bihu-Dance-assam.jpg"
          : rec.name === "Muga silk" ? "https://upload.wikimedia.org/wikipedia/commons/6/6f/Muga_Silkworm.JPG"
          : rec.name === "Manipuri dance" ? "https://upload.wikimedia.org/wikipedia/commons/f/f4/Pung_Cholom_Manipur.jpg"
          : "",
        sourceAttribution: sourceAttr,
        sourceUrl: "https://indianculture.gov.in/",
        originalVoiceLanguage: "Regional Language",
        originalVoiceAudioUrl: null,
        originalVoiceTranscriptMr: null,
        mediationM1SubtitlesEn: null,
        mediationM2SyntheticContextText: null,
        mediationM3HumanStoryCompanionText: null,
        mediationM3NarratorCredit: null,
        storyCompanionPrompts: [
          {
            question: "What is this practice?",
            answer: rec.description,
          },
          {
            question: "What is its verification status?",
            answer:
              "Reference information with institutional source attribution; community verification and practitioner Rights Passport pending.",
          },
        ],
        vocabulary: [],
        rightsPassport: passport,
        provenanceLogs: [
          {
            id: `prov-${id}-1`,
            culturalRecordId: id,
            stepType: "COLLECTED",
            performedByUserId: null,
            performedByRole: "SYSTEM_DEMO_SEED",
            performedByDisplay: "Cultural Reference Directory",
            practitionerApproved: false,
            practitionerApprovedAt: null,
            versionLabel: "v1-ref",
            notes: `Reference information compiled from ${sourceAttr}.`,
            createdAt: now,
          },
        ],
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const initialEvents: CulturalEventAdmin[] = [
    {
      id: "evt-kolhapur-chappal-workshop-2026",
      titleEn: "Kolhapuri Leather Craft & GI Heritage Circle",
      titleMr: "कोल्हापुरी चर्मकला आणि जीआय वारसा संवाद",
      category: "Craft",
      eventType: "CRAFT_DEMONSTRATION",
      descriptionEn:
        "Public-safe craft dialogue and vegetable-tanning heritage exhibition in Karveer & Kagal, Kolhapur District.",
      descriptionMr:
        "करवीर आणि कागल परिसरातील पारंपरिक कोल्हापुरी चप्पल कारागिरांचा वारसा आणि नैसर्गिक चर्म कमावण्याच्या पद्धतींचे सादरीकरण.",
      culturalRecordId: "rec-demo-kolhapuri-chappal-demo",
      culturalRecordSlug: "kolhapuri-chappal-demo",
      culturalRecordTitle: "Kolhapuri Chappal",
      stateId: mhStateId,
      districtId: kolhapurDistrictId,
      talukaId: "loc-taluka-karveer",
      cityTownId: kolhapurCityId,
      stateName: "Maharashtra",
      districtName: "Kolhapur District",
      talukaName: "Karveer Taluka",
      cityTownName: "Kolhapur",
      venueLabel: "Bhavani Mandap Heritage Precinct, Kolhapur",
      locationGranularity: "CITY_TOWN",
      center: { lat: 16.6952, lng: 74.2229 },
      publicCenter: { lat: 16.6952, lng: 74.2229 },
      exactLatPrivate: null,
      exactLngPrivate: null,
      startDate: "2026-11-14",
      endDate: "2026-11-16",
      startTime: "10:00",
      endTime: "17:30",
      timezone: "Asia/Kolkata",
      scheduleStatus: "CONFIRMED",
      cancellationReason: null,
      isRecurringTradition: false,
      recurrencePattern: "SINGLE_OCCURRENCE",
      recurrenceNote:
        "Confirmed three-day public craft demonstration window for November 2026.",
      occurrences: [
        {
          id: "occ-chappal-1",
          eventId: "evt-kolhapur-chappal-workshop-2026",
          label: "Day 1 — Material Vocabulary & Vegetable Tanning Overview",
          startDate: "2026-11-14",
          endDate: "2026-11-14",
          startTime: "10:00",
          endTime: "17:30",
          scheduleStatus: "CONFIRMED",
          verificationNote: "Verified against district craft exhibition notice.",
        },
        {
          id: "occ-chappal-2",
          eventId: "evt-kolhapur-chappal-workshop-2026",
          label: "Days 2–3 — Veni Braiding & GI Heritage Dialogue",
          startDate: "2026-11-15",
          endDate: "2026-11-16",
          startTime: "10:30",
          endTime: "17:30",
          scheduleStatus: "CONFIRMED",
          verificationNote: "Verified against district craft exhibition notice.",
        },
      ],
      organizerDisplay: "Kolhapur District Craft Documentation Initiative",
      organizerContactAuthorized: true,
      organizerPublicContact: "craft-desk@kolhapur-heritage.org",
      organizerWebsiteUrl: "https://ipindia.gov.in/",
      organizerPrivateContact: "Private Coordinator Phone: +91-9000011111",
      sourceAttribution:
        "Geographical Indications Registry of India (GI No. 169) & Maharashtra State Gazetteers — Kolhapur District",
      sourceUrl: "https://ipindia.gov.in/",
      lastVerifiedAt: "2026-10-15T10:30:00.000Z",
      verifiedByDisplay: "Cultural Calendar Editorial Review",
      visitorAccess: "DOMESTIC_AND_FOREIGN_PERMITTED",
      visitorAccessNote:
        "Open to domestic and international visitors during exhibition hours; workshop seating requires advance moderated enquiry.",
      registrationRequirement: "MODERATED_ENQUIRY_REQUIRED",
      etiquetteNotes:
        "Please remove footwear before stepping onto the artisan mat. Ask permission before photographing close-up handwork or tools.",
      photographyRule: "PERMISSION_REQUIRED_ON_SITE",
      entryFeeInfo:
        "Entry fee not established — confirm directly with the official organizer.",
      accessibilityInfo:
        "Ground-level courtyard access available at Bhavani Mandap precinct.",
      coverImageUrl: "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg",
      approvedMediaUrls: ["/manus-storage/bharat-culturemap-craft_14d51f4e.jpg"],
      relatedPractitioners: ["Community verification pending (Karveer & Kagal Artisans)"],
      visitorInterests: ["Craft & Making", "Workshops & Learning"],
      isPrivateOrRestrictedCeremony: false,
      reviewNotes: "Verified public craft demonstration record.",
      submittedByPublicName: null,
      submittedByPublicContact: null,
      status: "PUBLISHED",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-kolhapur-powada-mardani-recital-2026",
      titleEn: "Shahu Heritage Powada & Mardani Khel Public Recital",
      titleMr: "शाहू वारसा पोवाडा आणि मर्दानी खेळ सादरीकरण",
      category: "Performance",
      eventType: "COMMUNITY_RECITAL",
      descriptionEn:
        "Evening shahir ballad recital and public-safe Mardani Khel demonstration honouring regional oral history.",
      descriptionMr:
        "कोल्हापूरच्या शाहिरी परंपरा आणि मर्दानी खेळाच्या सार्वजनिक स्वरूपाचे ऐतिहासिक खासबाग मैदानावर सादरीकरण.",
      culturalRecordId: "rec-demo-powada-kolhapur-demo",
      culturalRecordSlug: "powada-kolhapur-demo",
      culturalRecordTitle: "Powada",
      stateId: mhStateId,
      districtId: kolhapurDistrictId,
      talukaId: "loc-taluka-karveer",
      cityTownId: kolhapurCityId,
      stateName: "Maharashtra",
      districtName: "Kolhapur District",
      talukaName: "Karveer Taluka",
      cityTownName: "Kolhapur",
      venueLabel: "Khasbag Maidan Cultural Stage, Kolhapur",
      locationGranularity: "CITY_TOWN",
      center: { lat: 16.6921, lng: 74.2264 },
      publicCenter: { lat: 16.6921, lng: 74.2264 },
      exactLatPrivate: null,
      exactLngPrivate: null,
      startDate: "2026-11-28",
      endDate: "2026-11-28",
      startTime: "18:00",
      endTime: "21:00",
      timezone: "Asia/Kolkata",
      scheduleStatus: "PROVISIONAL",
      cancellationReason: null,
      isRecurringTradition: true,
      recurrencePattern: "ANNUAL_FIXED_WINDOW",
      recurrenceNote:
        "Recurring regional recital tradition held in late November; exact stage timings remain provisional until municipal confirmation.",
      occurrences: [
        {
          id: "occ-powada-1",
          eventId: "evt-kolhapur-powada-mardani-recital-2026",
          label: "Evening Shahir Ballad & Public Akhada Demonstration",
          startDate: "2026-11-28",
          endDate: "2026-11-28",
          startTime: "18:00",
          endTime: "21:00",
          scheduleStatus: "PROVISIONAL",
          verificationNote:
            "Provisional date window; confirm final evening schedule with Karveer cultural directorate.",
        },
      ],
      organizerDisplay: "Karveer Shahir & Talim Heritage Forum",
      organizerContactAuthorized: true,
      organizerPublicContact: null,
      organizerWebsiteUrl: "https://cultural.maharashtra.gov.in/",
      organizerPrivateContact: "Private Forum Secretary: +91-9000022222",
      sourceAttribution:
        "Sangeet Natak Akademi & Maharashtra State Gazetteers — Kolhapur District",
      sourceUrl: "https://cultural.maharashtra.gov.in/",
      lastVerifiedAt: "2026-10-14T15:00:00.000Z",
      verifiedByDisplay: "Folklore Review Desk",
      visitorAccess: "OPEN_PUBLIC",
      visitorAccessNote:
        "Public amphitheatre seating; restricted internal talim sequences are not performed publicly.",
      registrationRequirement: "NONE",
      etiquetteNotes:
        "Maintain respectful distance from the akhada ring. Do not interrupt ballad narration or use flash photography.",
      photographyRule: "NO_FLASH_OR_DRONES",
      entryFeeInfo: null,
      accessibilityInfo:
        "Stepped amphitheatre seating at Khasbag Maidan; companion assistance recommended.",
      coverImageUrl: "/manus-storage/bharat-culturemap-hero_1c81260f.jpg",
      approvedMediaUrls: [],
      relatedPractitioners: ["Community verification pending (Karveer Shahir Mandal)"],
      visitorInterests: ["Music & Ballads", "Ritual & Performance", "Oral History & Folklore"],
      isPrivateOrRestrictedCeremony: false,
      reviewNotes: "Provisional public recital verified.",
      submittedByPublicName: null,
      submittedByPublicContact: null,
      status: "PUBLISHED",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-panhala-oral-history-walk-2026",
      titleEn: "Panhala Fort Folklore & Oral Traditions Gathering",
      titleMr: "पन्हाळा गड लोकसंस्कृती आणि मौखिक परंपरा संवाद",
      category: "Traditional Knowledge",
      eventType: "HERITAGE_CIRCLE",
      descriptionEn:
        "Seasonal storytelling, regional ecological vocabulary, and ballad documentation circle at Panhala.",
      descriptionMr:
        "पन्हाळा परिसरातील मौखिक इतिहास, सह्याद्रीतील पारंपरिक ज्ञान आणि लोककथांचे संकलन सत्र.",
      culturalRecordId: "rec-demo-mardani-khel-kolhapur-demo",
      culturalRecordSlug: "mardani-khel-kolhapur-demo",
      culturalRecordTitle: "Mardani Khel",
      stateId: mhStateId,
      districtId: kolhapurDistrictId,
      talukaId: "loc-taluka-panhala",
      cityTownId: "loc-city-panhala",
      stateName: "Maharashtra",
      districtName: "Kolhapur District",
      talukaName: "Panhala Taluka",
      cityTownName: "Panhala",
      venueLabel: "Panhala Cultural Community Hall",
      locationGranularity: "CITY_TOWN",
      center: { lat: 16.8115, lng: 74.1078 },
      publicCenter: { lat: 16.8115, lng: 74.1078 },
      exactLatPrivate: null,
      exactLngPrivate: null,
      startDate: "2026-12-05",
      endDate: "2026-12-06",
      startTime: "09:30",
      endTime: "16:00",
      timezone: "Asia/Kolkata",
      scheduleStatus: "SEASONAL_ESTIMATE",
      cancellationReason: null,
      isRecurringTradition: true,
      recurrencePattern: "SEASONAL_CYCLE",
      recurrenceNote:
        "Held seasonally in early winter (December); exact dates are announced locally and must not be inferred from prior years.",
      occurrences: [
        {
          id: "occ-panhala-1",
          eventId: "evt-panhala-oral-history-walk-2026",
          label: "Winter 2026 Seasonal Documentation Window (Estimated)",
          startDate: "2026-12-05",
          endDate: "2026-12-06",
          startTime: "09:30",
          endTime: "16:00",
          scheduleStatus: "SEASONAL_ESTIMATE",
          verificationNote:
            "Seasonal estimate only — verify confirmed dates with Panhala municipal heritage office before travel.",
        },
      ],
      organizerDisplay: "Panhala Heritage & Folklore Collective",
      organizerContactAuthorized: false,
      organizerPublicContact: null,
      organizerWebsiteUrl: null,
      organizerPrivateContact: "Private Collective Lead: +91-9000033333",
      sourceAttribution:
        "Maharashtra State Gazetteer Cultural Calendar — Kolhapur District",
      sourceUrl: "https://cultural.maharashtra.gov.in/",
      lastVerifiedAt: "2026-10-12T09:00:00.000Z",
      verifiedByDisplay: "Field Research Coordinator",
      visitorAccess: "ACCESS_NOT_ESTABLISHED",
      visitorAccessNote:
        "Visitor access conditions for outside guests are not yet established for the December 2026 session. Do not travel without confirming via official district channels.",
      registrationRequirement: "NOT_ESTABLISHED",
      etiquetteNotes:
        "Sacred groves and private household shrines near Panhala are off-limits to visitors.",
      photographyRule: "PROHIBITED",
      entryFeeInfo: null,
      accessibilityInfo: null,
      coverImageUrl: "/manus-storage/bharat-culturemap-craft_14d51f4e.jpg",
      approvedMediaUrls: [],
      relatedPractitioners: [],
      visitorInterests: ["Oral History & Folklore", "Regional Festivals"],
      isPrivateOrRestrictedCeremony: false,
      reviewNotes: "Seasonal estimate flagged with tourist safeguard.",
      submittedByPublicName: null,
      submittedByPublicContact: null,
      status: "PUBLISHED",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-ichalkaranji-weaving-open-loom-2026",
      titleEn: "Ichalkaranji Handloom & Textile Vocabulary Workshop",
      titleMr: "इचलकरंजी हातमाग आणि वस्त्रोद्योग शब्दावली कार्यशाळा",
      category: "Textile",
      eventType: "WORKSHOP",
      descriptionEn:
        "Educational session on warp-weft terminology, regional weaving history, and ethical craft documentation.",
      descriptionMr:
        "इचलकरंजीतील पारंपरिक हातमाग विणकाम संज्ञा आणि वस्त्र वारशाची ओळख करून देणारी कार्यशाळा.",
      culturalRecordId: "rec-demo-kolhapuri-saaj-demo",
      culturalRecordSlug: "kolhapuri-saaj-demo",
      culturalRecordTitle: "Kolhapuri Saaj",
      stateId: mhStateId,
      districtId: kolhapurDistrictId,
      talukaId: "loc-taluka-hatkanangale",
      cityTownId: "loc-city-ichalkaranji",
      stateName: "Maharashtra",
      districtName: "Kolhapur District",
      talukaName: "Hatkanangale Taluka",
      cityTownName: "Ichalkaranji",
      venueLabel: "Textile Heritage Centre, Hatkanangale / Ichalkaranji",
      locationGranularity: "DISTRICT",
      center: { lat: 16.705, lng: 74.2433 },
      publicCenter: { lat: 16.705, lng: 74.2433 },
      exactLatPrivate: 16.6912,
      exactLngPrivate: 74.4605,
      startDate: "2026-12-12",
      endDate: "2026-12-13",
      startTime: "11:00",
      endTime: "16:30",
      timezone: "Asia/Kolkata",
      scheduleStatus: "CONFIRMED",
      cancellationReason: null,
      isRecurringTradition: false,
      recurrencePattern: "SINGLE_OCCURRENCE",
      recurrenceNote: "Two-day educational workshop scheduled for December 2026.",
      occurrences: [
        {
          id: "occ-loom-1",
          eventId: "evt-ichalkaranji-weaving-open-loom-2026",
          label: "Loom Terminology & Material Study Session",
          startDate: "2026-12-12",
          endDate: "2026-12-13",
          startTime: "11:00",
          endTime: "16:30",
          scheduleStatus: "CONFIRMED",
          verificationNote: "Confirmed by Hatkanangale textile study circle; exact workshop address masked to district level.",
        },
      ],
      organizerDisplay: "Hatkanangale Weavers Documentation Network",
      organizerContactAuthorized: true,
      organizerPublicContact: "weavers-study@hatkanangale-textile.org",
      organizerWebsiteUrl: "https://indianculture.gov.in/",
      organizerPrivateContact: "Private Master Weaver Phone: +91-9000044444",
      sourceAttribution:
        "Ministry of Culture Cultural Atlas & Regional Handloom Reference Directory",
      sourceUrl: "https://indianculture.gov.in/",
      lastVerifiedAt: "2026-10-16T08:00:00.000Z",
      verifiedByDisplay: "Language & Craft Reviewer",
      visitorAccess: "INVITATION_OR_PERMIT_REQUIRED",
      visitorAccessNote:
        "Attendance is limited to registered students and researchers approved via moderated enquiry; walk-in visits to private looms are not permitted.",
      registrationRequirement: "ADVANCE_REGISTRATION_REQUIRED",
      etiquetteNotes:
        "Do not touch active warp threads on looms. Recording of proprietary jacquard patterns is prohibited.",
      photographyRule: "PERMISSION_REQUIRED_ON_SITE",
      entryFeeInfo: "Educational session — no fee charged for approved participants.",
      accessibilityInfo: "First-floor study room (staircase access).",
      coverImageUrl: "/manus-storage/bharat-culturemap-textile_e59e6de2.jpg",
      approvedMediaUrls: ["/manus-storage/bharat-culturemap-textile_e59e6de2.jpg"],
      relatedPractitioners: ["Community verification pending (Hatkanangale Loom Collective)"],
      visitorInterests: ["Craft & Making", "Workshops & Learning"],
      isPrivateOrRestrictedCeremony: false,
      reviewNotes: "District-level location masking active.",
      submittedByPublicName: null,
      submittedByPublicContact: null,
      status: "PUBLISHED",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-kolhapur-gondhal-annual-tradition",
      titleEn: "Regional Gondhal Devotional Narrative Tradition (Lunar Calendar Cycle)",
      titleMr: "पारंपरिक गोंधळ भक्ती-आख्यान परंपरा (चान्द्र पंचांग चक्र)",
      category: "Performance",
      eventType: "RITUAL_TRADITION",
      descriptionEn:
        "Recurring devotional dramatic and musical tradition performed by Gondhali custodians across Kolhapur District.",
      descriptionMr:
        "कोल्हापूर जिल्ह्यातील कुलधर्म-कुलाचार आणि मंदिर उत्सवांमध्ये सादर होणारी पारंपरिक गोंधळ परंपरा.",
      culturalRecordId: "rec-demo-gondhal-kolhapur-demo",
      culturalRecordSlug: "gondhal-kolhapur-demo",
      culturalRecordTitle: "Gondhal",
      stateId: mhStateId,
      districtId: kolhapurDistrictId,
      talukaId: "loc-taluka-karveer",
      cityTownId: kolhapurCityId,
      stateName: "Maharashtra",
      districtName: "Kolhapur District",
      talukaName: "Karveer Taluka",
      cityTownName: "Kolhapur",
      venueLabel: "Karveer Regional Temple Courtyards (District Reference)",
      locationGranularity: "DISTRICT",
      center: { lat: 16.705, lng: 74.2433 },
      publicCenter: { lat: 16.705, lng: 74.2433 },
      exactLatPrivate: null,
      exactLngPrivate: null,
      startDate: "2026-10-20",
      endDate: "2026-10-22",
      startTime: "19:30",
      endTime: "23:00",
      timezone: "Asia/Kolkata",
      scheduleStatus: "SEASONAL_ESTIMATE",
      cancellationReason: null,
      isRecurringTradition: true,
      recurrencePattern: "ANNUAL_LUNAR_SOLAR_TRADITION",
      recurrenceNote:
        "Observed according to the Hindu lunisolar calendar (Ashwin/Kartik tithis); exact Gregorian dates shift every year and are never inferred automatically from previous years.",
      occurrences: [
        {
          id: "occ-gondhal-1",
          eventId: "evt-kolhapur-gondhal-annual-tradition",
          label: "Ashwin/Kartik Seasonal Temple Recital Window",
          startDate: "2026-10-20",
          endDate: "2026-10-22",
          startTime: "19:30",
          endTime: "23:00",
          scheduleStatus: "SEASONAL_ESTIMATE",
          verificationNote:
            "Lunar tithi window only; household vows remain strictly private.",
        },
      ],
      organizerDisplay: "Regional Gondhali Tradition Custodians",
      organizerContactAuthorized: false,
      organizerPublicContact: null,
      organizerWebsiteUrl: "https://www.sahapedia.org/",
      organizerPrivateContact: "",
      sourceAttribution:
        "Sahapedia Open Cultural Reference & Maharashtra Folklore Documentation Archive",
      sourceUrl: "https://www.sahapedia.org/",
      lastVerifiedAt: "2026-10-10T12:00:00.000Z",
      verifiedByDisplay: "Folklore Reviewer",
      visitorAccess: "LOCAL_COMMUNITY_ONLY",
      visitorAccessNote:
        "Household and community Gondhal rituals are devotional observances for local community members and are not tourist spectacles.",
      registrationRequirement: "NOT_ESTABLISHED",
      etiquetteNotes:
        "Respect devotional boundaries; do not enter private household courtyards or record ritual sequences.",
      photographyRule: "PROHIBITED",
      entryFeeInfo: null,
      accessibilityInfo: null,
      coverImageUrl: "/manus-storage/bharat-culturemap-hero_1c81260f.jpg",
      approvedMediaUrls: [],
      relatedPractitioners: ["Community verification pending"],
      visitorInterests: ["Ritual & Performance", "Oral History & Folklore", "Regional Festivals"],
      isPrivateOrRestrictedCeremony: false,
      reviewNotes: "Recurring tradition documented with local-community access notice.",
      submittedByPublicName: null,
      submittedByPublicContact: null,
      status: "PUBLISHED",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-pune-lavani-archival-seminar-2026",
      titleEn: "Pune Sangeet & Lavani Archival Listening Session",
      titleMr: "पुणे संगीत आणि लावणी अभिलेखागार श्रवण सत्र",
      category: "Dance",
      eventType: "LECTURE_DEMONSTRATION",
      descriptionEn:
        "Curated archival lecture-demonstration on rhythmic structures, dholki accompaniment, and poetic history of Lavani in Pune.",
      descriptionMr:
        "लावणीच्या ढोलकीच्या थापा, काव्यरचना आणि रंगभूमीचा इतिहास उलगडणारे व्याख्यान-सादरीकरण.",
      culturalRecordId: "rec-demo-pune-lavani-demo",
      culturalRecordSlug: "pune-lavani-demo",
      culturalRecordTitle: "Lavani",
      stateId: mhStateId,
      districtId: "loc-district-pune-district",
      talukaId: "loc-taluka-haveli",
      cityTownId: "loc-city-pune",
      stateName: "Maharashtra",
      districtName: "Pune District",
      talukaName: "Haveli Taluka",
      cityTownName: "Pune",
      venueLabel: "Pune Regional Performing Arts Auditorium",
      locationGranularity: "CITY_TOWN",
      center: { lat: 18.5204, lng: 73.8567 },
      publicCenter: { lat: 18.5204, lng: 73.8567 },
      exactLatPrivate: null,
      exactLngPrivate: null,
      startDate: "2026-10-24",
      endDate: "2026-10-25",
      startTime: "17:00",
      endTime: "20:00",
      timezone: "Asia/Kolkata",
      scheduleStatus: "CONFIRMED",
      cancellationReason: null,
      isRecurringTradition: false,
      recurrencePattern: "SINGLE_OCCURRENCE",
      recurrenceNote: "Confirmed two-evening archival listening and dialogue session.",
      occurrences: [
        {
          id: "occ-pune-lavani-1",
          eventId: "evt-pune-lavani-archival-seminar-2026",
          label: "Archival Rhythm & Poetics Session",
          startDate: "2026-10-24",
          endDate: "2026-10-25",
          startTime: "17:00",
          endTime: "20:00",
          scheduleStatus: "CONFIRMED",
          verificationNote: "Verified against Sangeet Natak Akademi regional reference schedule.",
        },
      ],
      organizerDisplay: "Maharashtra Performing Arts Archival Forum",
      organizerContactAuthorized: true,
      organizerPublicContact: "archive-desk@maharashtra-arts-ref.org",
      organizerWebsiteUrl: "https://sangeetnatak.gov.in/",
      organizerPrivateContact: "",
      sourceAttribution:
        "Sangeet Natak Akademi & Ministry of Culture Performing Arts Reference",
      sourceUrl: "https://sangeetnatak.gov.in/",
      lastVerifiedAt: "2026-10-16T11:00:00.000Z",
      verifiedByDisplay: "Cultural Calendar Editorial Review",
      visitorAccess: "DOMESTIC_AND_FOREIGN_PERMITTED",
      visitorAccessNote:
        "Open to students, researchers, and general public with auditorium seating.",
      registrationRequirement: "NONE",
      etiquetteNotes:
        "Audio/video recording of archival playback is prohibited.",
      photographyRule: "PROHIBITED",
      entryFeeInfo: "Free public academic entry.",
      accessibilityInfo: "Wheelchair-accessible auditorium ramp and seating.",
      coverImageUrl: "/manus-storage/bharat-culturemap-hero_1c81260f.jpg",
      approvedMediaUrls: [],
      relatedPractitioners: ["Community verification pending"],
      visitorInterests: ["Music & Ballads", "Ritual & Performance"],
      isPrivateOrRestrictedCeremony: false,
      reviewNotes: "Verified archival session.",
      submittedByPublicName: null,
      submittedByPublicContact: null,
      status: "PUBLISHED",
      eventPublicationGate: { allowed: true, reasons: [] },
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { locations, demoRecords, initialEvents };
}
