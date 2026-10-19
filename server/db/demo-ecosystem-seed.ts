import {
  AccountPersonaType,
  ArtMartOrder,
  ArtMartProduct,
  ArtMartSeller,
  EcosystemResourceItem,
  IndustryMaterialListing,
  IndustryMaterialRequest,
  PractitionerProfile,
  UserRole,
} from "../../shared/contracts";

export interface DemoAccountSpec {
  email: string;
  fullName: string;
  role: UserRole;
  accountType: AccountPersonaType;
  linkedPractitionerId?: string | null;
  linkedSellerId?: string | null;
  linkedHerCraftId?: string | null;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccountSpec[] = [
  {
    email: "admin.demo@bharat-culturemap.local",
    fullName: "Arundhati Deshmukh (Demo Super Admin)",
    role: "SUPER_ADMIN",
    accountType: "SUPER_ADMIN",
    linkedPractitionerId: null,
    linkedSellerId: null,
    description:
      "Full administrative access: review governance workflows, approve practitioners/products, manage industry-to-art requests, and publish records.",
  },
  {
    email: "researcher.demo@bharat-culturemap.local",
    fullName: "Dr. Vikramaditya Kulkarni (Demo Field Researcher)",
    role: "FIELD_RESEARCHER",
    accountType: "FIELD_RESEARCHER",
    linkedPractitionerId: null,
    linkedSellerId: null,
    description:
      "Field researcher persona: document traditions, attach source citations, log consent records, and submit entries for review.",
  },
  {
    email: "practitioner.demo@bharat-culturemap.local",
    fullName: "ShahuRao Sawant — Demo Gondhal & Powada Balladeer",
    role: "PUBLIC_USER",
    accountType: "PRACTITIONER",
    linkedPractitionerId: "pract-kolhapur-powada-demo",
    linkedSellerId: null,
    linkedHerCraftId: null,
    description:
      "Practitioner & teacher persona (least-privileged PUBLIC_USER role): edit own practitioner profile, update workshop schedules, and manage availability.",
  },
  {
    email: "seller.demo@bharat-culturemap.local",
    fullName: "Subhash Satpute — Karvir Leather Guild (Demo Seller)",
    role: "PUBLIC_USER",
    accountType: "ARTISAN_SELLER",
    linkedPractitionerId: "pract-kolhapuri-chappal-demo",
    linkedSellerId: "seller-karvir-leather-demo",
    linkedHerCraftId: null,
    description:
      "Artisan & seller persona (least-privileged PUBLIC_USER role): manage Art-Mart storefront, create/edit craft listings, adjust inventory, and request surplus materials.",
  },
  {
    email: "hercraft.demo@bharat-culturemap.local",
    fullName: "Smt. Muktabai Shinde — Karvir Bhagini SHG (Demo HerCraft Lead)",
    role: "PUBLIC_USER",
    accountType: "HERCRAFT_ENTREPRENEUR",
    linkedPractitionerId: null,
    linkedSellerId: "seller-karvir-leather-demo",
    linkedHerCraftId: "hc-ent-kolhapur-veni-shg-demo",
    description:
      "HerCraft women-led enterprise persona (least-privileged PUBLIC_USER role): manage HerCraft enterprise profile, submit training workshops, and explore women artisan grants.",
  },
  {
    email: "buyer.demo@bharat-culturemap.local",
    fullName: "Meera Nambiar (Demo Cultural Patron & Buyer)",
    role: "PUBLIC_USER",
    accountType: "BUYER",
    linkedPractitionerId: null,
    linkedSellerId: null,
    linkedHerCraftId: null,
    description:
      "Buyer & visitor persona (least-privileged PUBLIC_USER role): browse Art-Mart, manage cart & wishlist, test simulated checkout, view order history, and cancel/modify demo orders.",
  },
];

export const DEMO_PRACTITIONERS: PractitionerProfile[] = [
  {
    id: "pract-kolhapuri-chappal-demo",
    slug: "subhash-satpute-kolhapuri-chappal-demo",
    displayName: "Master Subhash Satpute (Demo Artisan Profile)",
    roleTitle: "Master Leather Craftsman & Veni Braiding Instructor",
    shortBio:
      "Illustrative third-generation leather artisan demonstrating traditional vegetable-tanned Kolhapuri Chappal cord-stitching and Kapashi pattern cutting in Kolhapur.",
    fullNarrative:
      "This is a clearly labelled DEMO_SAMPLE practitioner profile created to demonstrate how Bharat CultureMap links master craftspeople to GI-tagged regional crafts and workshops. In this illustrative profile, Master Subhash Satpute demonstrates the 32-step hand-crafted process of vegetable tanning with Hirda and Babul bark, hand-cutting buffalo hide soles, and braiding intricate leather veni straps without metallic nails.",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    placeId: "loc-city-kolhapur",
    languages: ["Marathi", "Hindi", "Kannada"],
    specialisations: [
      "Kapashi & Kurundwadi Kolhapuri Chappal",
      "Bag-tanning with Hirda & Babul bark",
      "Hand-twisted leather cord stitching (Zero-nail construction)",
    ],
    traditionIds: ["trad-kolhapuri-chappal"],
    traditionSlugs: ["kolhapuri-chappal"],
    traditionTitles: ["Kolhapuri Chappal"],
    yearsOfPractice: 28,
    lineageNote: "Illustrative 3rd-generation family guild in Bindu Chowk, Kolhapur (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Illustrative craft photograph)",
    workshops: [
      {
        id: "wk-chappal-1",
        title: "2-Day Vegetable-Tanned Leather & Veni Braiding Intensive (Demo)",
        mode: "IN_PERSON",
        durationLabel: "2 Days (12 hours total)",
        feeInr: 1800,
        nextSessionLabel: "First weekend of every month — Kolhapur Guild Studio (Illustrative)",
        skillLevel: "Beginner to Intermediate",
        summary:
          "Hands-on introduction to natural tanning chemistry, template tracing, and hand-braiding authentic Kolhapuri upper straps.",
      },
      {
        id: "wk-chappal-2",
        title: "Online Lecture: Identifying GI-Authentic Kolhapuri Footwear (Demo)",
        mode: "ONLINE",
        durationLabel: "90 Minutes",
        feeInr: 350,
        nextSessionLabel: "Every alternate Saturday, 5:00 PM IST (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Learn how vegetable-tanned soles age, how GI certification protects rural leather artisans across Kolhapur, Sangli, Satara, and Solapur.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional practitioner identity for interface demonstration; not a real individual.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative artisan persona. Not a factual claim about a real teacher or workshop schedule.",
    ownerUserId: null,
  },
  {
    id: "pract-kolhapur-powada-demo",
    slug: "shahurao-sawant-powada-gondhal-demo",
    displayName: "Shahir ShahuRao Sawant (Demo Balladeer Profile)",
    roleTitle: "Powada Shahir & Ritual Gondhal Performer",
    shortBio:
      "Illustrative Shahir and Sambal percussionist demonstrating heroic Marathi Powada balladry and narrative Gondhal performance from Kolhapur.",
    fullNarrative:
      "Clearly marked DEMO_SAMPLE profile illustrating how oral historians and performing artists appear on Bharat CultureMap. Shahir ShahuRao Sawant's sample profile showcases the vocal projection of the high-pitched Raag-infused Veer-Rasa Powada alongside the interlocking rhythms of the Daf, Tuntune, and twin Sambal drums.",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    placeId: "loc-city-kolhapur",
    languages: ["Marathi", "Hindi"],
    specialisations: [
      "Veer-Rasa Powada Composition & Recitation",
      "Sambal, Daf & Tuntune Accompaniment",
      "Jagran-Gondhal Narrative Storytelling",
    ],
    traditionIds: ["trad-gondhal-powada-maharashtra"],
    traditionSlugs: ["powada-and-gondhal"],
    traditionTitles: ["Powada and Gondhal"],
    yearsOfPractice: 24,
    lineageNote: "Illustrative Kolhapur Shahiri Kala Mandal cohort (Demo Sample).",
    availabilityStatus: "AVAILABLE_FOR_APPRENTICESHIP",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/6e/Gondhal_Performance.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Gondhal performance reference)",
    workshops: [
      {
        id: "wk-powada-1",
        title: "Oral Meter & Daf Rhythm Workshop in Marathi Powada (Demo)",
        mode: "HYBRID",
        durationLabel: "3 Sessions x 2 Hours",
        feeInr: 1200,
        nextSessionLabel: "Rolling monthly cohorts (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Explore historical Marathi ballad meters, chorus call-and-response (Jee-Jee-Re-Jee), and rhythmic phrasing on the frame drum.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional balladeer identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative performing artist profile. Not a real person or booking listing.",
    ownerUserId: null,
  },
  {
    id: "pract-kolhapur-saaj-hupari-demo",
    slug: "anandibai-potdar-kolhapuri-saaj-hupari-demo",
    displayName: "Smt. Anandibai Potdar (Demo Jewellery Master)",
    roleTitle: "Kolhapuri Saaj Repoussé & Hupari Silver Filigree Artisan",
    shortBio:
      "Illustrative gold-foil repoussé and Hupari silver ornament artisan demonstrating traditional 21-pendant Kolhapuri Saaj and Payal chain-linking.",
    fullNarrative:
      "DEMO_SAMPLE practitioner profile demonstrating traditional Maharashtrian ornament craft documentation. This sample profile highlights how thin 24-karat gold sheet is embossed over lac-filled dies to create the auspicious Ashtamangal pendants (Taviz, Panadi, Belpan, Kairi, Matsya) of the Kolhapuri Saaj, alongside Hupari's renowned silver wire drawing.",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Hupari",
    placeId: "loc-village-hupari",
    languages: ["Marathi", "Hindi"],
    specialisations: [
      "21-Leaf Traditional Kolhapuri Saaj (Lac-core Gold Repoussé)",
      "Hupari Silver Payal & Hollow Bead Granulation",
      "Traditional Die-Stamping & Jav-Mani Stringing",
    ],
    traditionIds: ["trad-kolhapuri-saaj", "trad-hupari-silverwork"],
    traditionSlugs: ["kolhapuri-saaj", "hupari-silverwork"],
    traditionTitles: ["Kolhapuri Saaj", "Hupari Silverwork"],
    yearsOfPractice: 31,
    lineageNote: "Illustrative Hupari-Kolhapur Chandi & Suvarna Artisans Collective (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Kolhapuri_saaj.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 3.0 (Kolhapuri Saaj reference)",
    workshops: [
      {
        id: "wk-saaj-1",
        title: "Silver Wire Drawing & Traditional Die-Embossing Studio Visit (Demo)",
        mode: "IN_PERSON",
        durationLabel: "1 Day (5 Hours)",
        feeInr: 1500,
        nextSessionLabel: "Every second Sunday — Hupari Silver Cluster (Illustrative)",
        skillLevel: "Beginner",
        summary:
          "Observe and practice brass/silver sheet embossing on traditional bronze dies and learn the iconography of the 21 Kolhapuri Saaj motifs.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional artisan identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative jewellery craftsperson. Not a real person.",
    ownerUserId: null,
  },
  {
    id: "pract-kolhapur-kushti-mallakhamb-demo",
    slug: "vastad-dattajirao-jadhav-kushti-mallakhamb-demo",
    displayName: "Vastad Dattajirao Jadhav (Demo Talim Mentor)",
    roleTitle: "Kushti Akhada Vastad, Mallakhamb & Mardani Khel Coach",
    shortBio:
      "Illustrative akhada mentor demonstrating Kolhapur red-earth Kushti conditioning, oiled teakwood Mallakhamb pole acrobatics, and Mardani Khel Dand-Patta.",
    fullNarrative:
      "DEMO_SAMPLE mentor profile demonstrating physical culture and martial heritage in Kolhapur. Illustrates how traditional Talims combine red-earth (Tamda Mati) wrestling, castor-oiled teakwood pole Mallakhamb, and historical Maratha weapon drills (Vita, Lathi-Kathi, Dand-Patta).",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    placeId: "loc-city-kolhapur",
    languages: ["Marathi", "Hindi", "English"],
    specialisations: [
      "Fixed & Hanging Pole Mallakhamb",
      "Traditional Red-Earth Kushti & Jor-Baithak Conditioning",
      "Mardani Khel Lathi-Kathi & Dand-Patta Forms",
    ],
    traditionIds: ["trad-mallakhamb-maharashtra", "trad-kushti-talim-kolhapur"],
    traditionSlugs: ["mallakhamb", "kushti-and-mardani-khel"],
    traditionTitles: ["Mallakhamb", "Kushti and Associated Akhada Traditions"],
    yearsOfPractice: 35,
    lineageNote: "Illustrative Khasbag Heritage Talim Study Group, Kolhapur (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mallakhamb_performance.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Mallakhamb performance)",
    workshops: [
      {
        id: "wk-mallakhamb-1",
        title: "Morning Talim Experience: Mallakhamb & Akhada Conditioning (Demo)",
        mode: "IN_PERSON",
        durationLabel: "3 Hours (6:30 AM – 9:30 AM)",
        feeInr: 900,
        nextSessionLabel: "Weekly Tuesday & Saturday mornings (Illustrative)",
        skillLevel: "All Fitness Levels",
        summary:
          "Guided introduction to traditional Surya Namaskar, Gada/Jor swinging, pole grip fundamentals, and Mardani Khel footwork.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional akhada mentor identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative coach profile. Not a real person or akhada booking.",
    ownerUserId: null,
  },
  {
    id: "pract-kolhapur-jaggery-culinary-demo",
    slug: "radhabai-patil-kolhapuri-gul-culinary-demo",
    displayName: "Smt. Radhabai Patil (Demo Gul-Gurhal & Culinary Custodian)",
    roleTitle: "Traditional Sugarcane Gurhal Specialist & Kolhapuri Masala Archivist",
    shortBio:
      "Illustrative culinary heritage custodian demonstrating chemical-free Panchganga sugarcane jaggery clarification and stone-pounded Kolhapuri Kanda-Lasun Masala.",
    fullNarrative:
      "DEMO_SAMPLE profile showcasing how agrarian and culinary traditions are documented on Bharat CultureMap. Highlights traditional iron-pan sugarcane juice boiling clarified with wild okra (Ran-Bhendi) mucilage, alongside heirloom spice roasting and stone-mortar (Danki) pounding.",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    placeId: "loc-city-kolhapur",
    languages: ["Marathi", "Hindi"],
    specialisations: [
      "GI Kolhapuri Jaggery (Chemical-free Ran-Bhendi Clarification)",
      "Stone-Pounded Kolhapuri Kanda-Lasun Masala",
      "Seasonal Festival Sweets (Gul-Poli & Khapri Kurdai)",
    ],
    traditionIds: ["trad-kolhapuri-gul-and-spice-cuisine"],
    traditionSlugs: ["kolhapuri-jaggery-and-culinary-heritage"],
    traditionTitles: ["Kolhapuri Jaggery and Culinary Heritage"],
    yearsOfPractice: 26,
    lineageNote: "Illustrative Karvir Rural Culinary & Gurhal Heritage Circle (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/29/Jaggery_making_in_Maharashtra.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Jaggery making in Maharashtra)",
    workshops: [
      {
        id: "wk-culinary-1",
        title: "Harvest Gurhal Tour & Traditional Kanda-Lasun Masala Workshop (Demo)",
        mode: "IN_PERSON",
        durationLabel: "Half Day (4 Hours)",
        feeInr: 1400,
        nextSessionLabel: "November to March harvest season weekends (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Visit a demonstration sugarcane boiling house, taste warm Kakvi (liquid jaggery), and learn proportioning of 18 whole spices in Kolhapuri masala.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional culinary custodian for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative culinary practitioner. Not a real person.",
    ownerUserId: null,
  },
  {
    id: "pract-palghar-warli-demo",
    slug: "jiva-vahadu-warli-palghar-demo",
    displayName: "Shri Jiva Vahadu (Demo Warli Chitrakar)",
    roleTitle: "Traditional Warli Ritual Wall & Bamboo-Brush Painter",
    shortBio:
      "Illustrative Dahanu-Jawhar Warli artist demonstrating rice-paste painting on geru-prepared surfaces, Lagna Chowk iconography, and Tarpa dance circles.",
    fullNarrative:
      "DEMO_SAMPLE profile demonstrating indigenous visual art documentation in North Konkan (Palghar). Explains the geometric visual language of circle, triangle, and square painted with chewed bamboo twigs and pounded white rice paste over red ochre mud-and-cow-dung grounds.",
    stateName: "Maharashtra",
    districtName: "Palghar",
    cityName: "Dahanu",
    placeId: "loc-state-maharashtra",
    languages: ["Varli", "Marathi", "Hindi"],
    specialisations: [
      "Ritual Lagna Chowk & Palghat Devi Iconography",
      "Natural Geru (Red Ochre) & Rice-Paste Preparation",
      "Tarpa Harvest Dance Narrative Composition",
    ],
    traditionIds: ["trad-warli-painting"],
    traditionSlugs: ["warli-painting"],
    traditionTitles: ["Warli Painting"],
    yearsOfPractice: 22,
    lineageNote: "Illustrative Jawhar-Dahanu Warli Kala Collective (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Warli_painting.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 3.0 (Warli painting)",
    workshops: [
      {
        id: "wk-warli-1",
        title: "Earth Pigment & Bamboo-Stick Warli Storytelling Workshop (Demo)",
        mode: "HYBRID",
        durationLabel: "2 Sessions x 2.5 Hours",
        feeInr: 1100,
        nextSessionLabel: "Every Sunday morning (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Prepare natural red earth backgrounds and paint seasonal agrarian and Tarpa dance narratives using traditional bamboo-twig brushes.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional Warli painter identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative artist profile. Not a real person.",
    ownerUserId: null,
  },
  {
    id: "pract-purulia-chhau-demo",
    slug: "nepal-mahato-chhau-mask-dance-demo",
    displayName: "Acharya Nepal Mahato (Demo Chhau Guru & Mask Maker)",
    roleTitle: "Purulia Chhau Dance Master & Charida Paper-Clay Mask Artisan",
    shortBio:
      "Illustrative Chhau exponent demonstrating martial leaps (Ulfa), Mayurbhanj/Seraikela/Purulia comparative movement, and Charida mask sculpting.",
    fullNarrative:
      "DEMO_SAMPLE profile connected to the Eastern Indian Chhau cluster (West Bengal, Jharkhand, Odisha). Demonstrates how martial parikhanda footwork, avian/animal gaits (chali), and multi-layered clay-and-paper mask making come together in nocturnal Chaitra Parva performances.",
    stateName: "West Bengal",
    districtName: "Purulia",
    cityName: "Purulia",
    placeId: "loc-state-west-bengal",
    languages: ["Bengali", "Hindi", "Kurmali"],
    specialisations: [
      "Purulia & Seraikela Chhau Martial Chali & Topka",
      "Charida Clay, Muslin & Shola-Pith Mask Crafting",
      "Dhol, Dhamsa & Shehnai Rhythmic Cueing",
    ],
    traditionIds: ["trad-chhau-dance"],
    traditionSlugs: ["chhau-dance"],
    traditionTitles: ["Chhau"],
    yearsOfPractice: 29,
    lineageNote: "Illustrative Baghmundi-Charida Chhau Akhada (Demo Sample).",
    availabilityStatus: "AVAILABLE_FOR_APPRENTICESHIP",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Chhau_Dance_Purulia.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Chhau Dance Purulia)",
    workshops: [
      {
        id: "wk-chhau-1",
        title: "Chhau Mask Sculpting & Martial Footwork Fundamentals (Demo)",
        mode: "ONLINE",
        durationLabel: "4 Weeks (Weekend live sessions)",
        feeInr: 2200,
        nextSessionLabel: "Starts 1st of next month (Illustrative)",
        skillLevel: "Intermediate",
        summary:
          "Study the three regional Chhau styles and craft a miniature clay-and-paper mask using the Charida layering method.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional Chhau guru identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative performing artist & artisan. Not a real person.",
    ownerUserId: null,
  },
  {
    id: "pract-raghurajpur-pattachitra-demo",
    slug: "bibhu-maharana-pattachitra-odissi-demo",
    displayName: "Shilpi Bibhu Maharana (Demo Chitrakar)",
    roleTitle: "Raghurajpur Pattachitra & Talapatra Chitra Master",
    shortBio:
      "Illustrative Chitrakar from Puri demonstrating tamarind-seed gum canvas preparation (Patti), conch-shell white pigment grinding, and etched palm-leaf manuscripts.",
    fullNarrative:
      "DEMO_SAMPLE profile representing Odisha's Raghurajpur heritage craft tradition. Demonstrates how layered cotton cloth is coated with tamarind seed paste and chalk stone, burnished with river pebbles, and painted using natural hingula, haritala, lampblack, and conch-shell pigments.",
    stateName: "Odisha",
    districtName: "Puri",
    cityName: "Raghurajpur",
    placeId: "loc-state-odisha",
    languages: ["Odia", "Hindi", "English"],
    specialisations: [
      "Tamarind-Seed Treated Cotton Pattachitra",
      "Talapatra Chitra (Iron-Stylus Etched Palm Leaf)",
      "Mineral & Conch-Shell Pigment Preparation",
    ],
    traditionIds: ["trad-pattachitra", "trad-odissi"],
    traditionSlugs: ["pattachitra", "odissi"],
    traditionTitles: ["Pattachitra", "Odissi"],
    yearsOfPractice: 25,
    lineageNote: "Illustrative Raghurajpur Chitrakar Parampara (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b5/Pattachitra_painting_Raghurajpur.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Pattachitra painting)",
    workshops: [
      {
        id: "wk-patta-1",
        title: "Natural Stone Pigment & Fine Border Linework in Pattachitra (Demo)",
        mode: "ONLINE",
        durationLabel: "2 Days (3 Hours/day)",
        feeInr: 1600,
        nextSessionLabel: "Bi-weekly Saturday-Sunday batch (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Master the disciplined Sankha-Sindura floral borders and narrative framing of classical Odia scroll painting.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional Chitrakar identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative painter profile. Not a real person.",
    ownerUserId: null,
  },
  {
    id: "pract-mithila-madhubani-demo",
    slug: "dulari-devi-jha-madhubani-demo",
    displayName: "Smt. Kalpana Devi Mithila (Demo Madhubani Artist)",
    roleTitle: "Kachni & Bharni Mithila Painting Exponent",
    shortBio:
      "Illustrative Madhubani artist demonstrating double-line bamboo nib drawing, Kohbar ceremonial cosmology, and natural indigo/turmeric pigments.",
    fullNarrative:
      "DEMO_SAMPLE profile showcasing Bihar's Mithila painting heritage. Illustrates the distinction between Bharni (vibrant colour-filled forms), Kachni (delicate cross-hatched line work), and Godna (concentric narrative registers) painted on handmade paper and handloom tussar silk.",
    stateName: "Bihar",
    districtName: "Madhubani",
    cityName: "Madhubani",
    placeId: "loc-state-bihar",
    languages: ["Maithili", "Hindi"],
    specialisations: [
      "Kachni Fine Linework & Bharni Pigmentation",
      "Kohbar & Aripan Ritual Floor/Wall Motifs",
      "Natural Plant-Dye Preparation on Handmade Paper",
    ],
    traditionIds: ["trad-madhubani-mithila-painting"],
    traditionSlugs: ["madhubani-painting"],
    traditionTitles: ["Madhubani Painting"],
    yearsOfPractice: 19,
    lineageNote: "Illustrative Jitwarpur-Ranti Mithila Kala Sangha (Demo Sample).",
    availabilityStatus: "OPEN_FOR_WORKSHOPS",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Madhubani_art.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Madhubani art)",
    workshops: [
      {
        id: "wk-madhubani-1",
        title: "Kachni Hatching & Double-Line Border Technique (Demo)",
        mode: "ONLINE",
        durationLabel: "3 Hours",
        feeInr: 850,
        nextSessionLabel: "Every Wednesday & Sunday (Illustrative)",
        skillLevel: "Beginner",
        summary:
          "Learn freehand double-outline drawing without pencil sketches and traditional lotus, fish, and peacock motifs.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional Mithila artist identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative artist profile. Not a real person.",
    ownerUserId: null,
  },
  {
    id: "pract-patan-patola-demo",
    slug: "kanubhai-salvi-patan-patola-demo",
    displayName: "Shri Kanubhai Vankar (Demo Double-Ikat Weaver)",
    roleTitle: "Patan Patola Double-Ikat Silk Master Weaver",
    shortBio:
      "Illustrative Patan weaver demonstrating mathematical resist-tying of both warp and weft silk threads before weaving on the inclined single-heddle loom.",
    fullNarrative:
      "DEMO_SAMPLE profile illustrating Gujarat's Patan Patola double-ikat weaving tradition. Explains how warp (Tana) and weft (Bana) mulberry silk yarns are individually tied with cotton cord according to grid calculations, dyed in madder, turmeric, indigo, and pomegranate rind, and aligned thread-by-thread on the rosewood loom.",
    stateName: "Gujarat",
    districtName: "Patan",
    cityName: "Patan",
    placeId: "loc-state-gujarat",
    languages: ["Gujarati", "Hindi", "English"],
    specialisations: [
      "Double-Ikat Warp & Weft Mathematical Resist-Tying",
      "Chhabdi Bhat, Nari Kunjar & Paan Bhat Geometries",
      "Natural Vegetable Dyeing on Mulberry Silk",
    ],
    traditionIds: ["trad-patan-patola-gujarat", "trad-garba-of-gujarat"],
    traditionSlugs: ["patan-patola", "garba"],
    traditionTitles: ["Patan Patola", "Garba"],
    yearsOfPractice: 33,
    lineageNote: "Illustrative Patan Double-Ikat Weavers Study Circle (Demo Sample).",
    availabilityStatus: "BY_ENQUIRY_ONLY",
    profileImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Patan_Patola.jpg",
    profileImageCredit: "Wikimedia Commons — CC BY-SA 3.0 (Patan Patola)",
    workshops: [
      {
        id: "wk-patola-1",
        title: "Virtual Loom Walkthrough: The Mathematics of Double-Ikat (Demo)",
        mode: "ONLINE",
        durationLabel: "2 Hours",
        feeInr: 950,
        nextSessionLabel: "Monthly last Saturday (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Live demonstration of graph-marking, resist-binding, and using the steel-tipped Sali needle to align warp and weft intersections.",
      },
    ],
    verificationBadge:
      "DEMO_SAMPLE — Fictional master weaver identity for interface demonstration.",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION PROFILE — Illustrative weaver profile. Not a real person.",
    ownerUserId: null,
  },
];

export const DEMO_ART_MART_SELLERS: ArtMartSeller[] = [
  {
    id: "seller-karvir-leather-demo",
    slug: "karvir-heritage-leather-guild-demo",
    storefrontName: "Karvir Heritage Leather Guild (Demo Storefront)",
    craftClusterLabel: "Kolhapur GI Leather Footwear Cluster, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    linkedPractitionerId: "pract-kolhapuri-chappal-demo",
    storySummary:
      "Illustrative artisan cooperative storefront showcasing hand-stitched, vegetable-tanned Kolhapuri Chappals and upcycled leather craft accessories.",
    verificationNote:
      "DEMO_SAMPLE STOREFRONT — Illustrative seller profile linked to the Kolhapuri Chappal tradition. No real commercial transactions occur.",
    ratingAverage: 4.9,
    completedDemoOrders: 42,
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    ownerUserId: null,
  },
  {
    id: "seller-hupari-karvir-ornaments-demo",
    slug: "panchganga-suvarna-chandi-studio-demo",
    storefrontName: "Panchganga Suvarna & Hupari Chandi Studio (Demo Storefront)",
    craftClusterLabel: "Kolhapur & Hupari Ornament Craft Cluster, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Hupari",
    linkedPractitionerId: "pract-kolhapur-saaj-hupari-demo",
    storySummary:
      "Illustrative jewellery storefront demonstrating traditional 21-motif Kolhapuri Saaj necklaces and Hupari sterling silver filigree ornaments.",
    verificationNote:
      "DEMO_SAMPLE STOREFRONT — Illustrative jewellery collective for Art-Mart demonstration.",
    ratingAverage: 4.8,
    completedDemoOrders: 29,
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    ownerUserId: null,
  },
  {
    id: "seller-sahyadri-gurhal-culinary-demo",
    slug: "sahyadri-gurhal-spices-demo",
    storefrontName: "Sahyadri Gurhal & Heritage Spices (Demo Storefront)",
    craftClusterLabel: "Panchganga Basin Agrarian & Culinary Cluster, Kolhapur",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    linkedPractitionerId: "pract-kolhapur-jaggery-culinary-demo",
    storySummary:
      "Illustrative farm-to-kitchen storefront presenting chemical-free GI Kolhapuri Jaggery cubes, liquid Kakvi, and stone-pounded Kanda-Lasun Masala.",
    verificationNote:
      "DEMO_SAMPLE STOREFRONT — Illustrative culinary craft storefront for interface testing.",
    ratingAverage: 4.9,
    completedDemoOrders: 64,
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    ownerUserId: null,
  },
  {
    id: "seller-sahyadri-warli-collective-demo",
    slug: "dahanu-warli-art-collective-demo",
    storefrontName: "Dahanu-Jawhar Warli Kala Collective (Demo Storefront)",
    craftClusterLabel: "North Konkan Indigenous Painting Cluster, Palghar",
    stateName: "Maharashtra",
    districtName: "Palghar",
    cityName: "Dahanu",
    linkedPractitionerId: "pract-palghar-warli-demo",
    storySummary:
      "Illustrative indigenous art storefront featuring natural earth-ochre and rice-paste Warli canvases and upcycled wood/textile home objects.",
    verificationNote:
      "DEMO_SAMPLE STOREFRONT — Illustrative Warli art storefront.",
    ratingAverage: 4.8,
    completedDemoOrders: 37,
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    ownerUserId: null,
  },
  {
    id: "seller-raghurajpur-chitrakar-guild-demo",
    slug: "raghurajpur-chitrakar-guild-demo",
    storefrontName: "Raghurajpur Chitrakar Parampara Guild (Demo Storefront)",
    craftClusterLabel: "Raghurajpur Heritage Crafts Village, Puri, Odisha",
    stateName: "Odisha",
    districtName: "Puri",
    cityName: "Raghurajpur",
    linkedPractitionerId: "pract-raghurajpur-pattachitra-demo",
    storySummary:
      "Illustrative Odisha scroll and palm-leaf studio presenting natural mineral pigment Pattachitra scrolls and etched Talapatra manuscripts.",
    verificationNote:
      "DEMO_SAMPLE STOREFRONT — Illustrative Pattachitra storefront.",
    ratingAverage: 5.0,
    completedDemoOrders: 51,
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    ownerUserId: null,
  },
  {
    id: "seller-charida-mithila-patan-demo",
    slug: "bharat-loom-and-mask-coop-demo",
    storefrontName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    craftClusterLabel: "Multi-Region Heritage Craft Cooperative (WB, Bihar, Gujarat)",
    stateName: "West Bengal",
    districtName: "Purulia",
    cityName: "Purulia",
    linkedPractitionerId: "pract-purulia-chhau-demo",
    storySummary:
      "Illustrative multi-craft showcase offering Charida Chhau masks, Mithila handmade-paper paintings, and Patan Patola silk stoles.",
    verificationNote:
      "DEMO_SAMPLE STOREFRONT — Illustrative multi-region craft cooperative.",
    ratingAverage: 4.7,
    completedDemoOrders: 33,
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    ownerUserId: null,
  },
];

export const DEMO_ART_MART_PRODUCTS: ArtMartProduct[] = [
  {
    id: "prod-kolhapuri-kapashi-chappal-demo",
    slug: "hand-stitched-kapashi-kolhapuri-chappal-demo",
    title: "Hand-Stitched Kapashi Kolhapuri Chappal — Natural Bag-Tanned Leather (Demo)",
    category: "Leather & Footwear Craft",
    traditionId: "trad-kolhapuri-chappal",
    traditionSlug: "kolhapuri-chappal",
    traditionTitle: "Kolhapuri Chappal",
    sellerId: "seller-karvir-leather-demo",
    sellerSlug: "karvir-heritage-leather-guild-demo",
    sellerName: "Karvir Heritage Leather Guild (Demo Storefront)",
    regionLabel: "Kolhapur, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    priceInr: 2450,
    stockQuantity: 14,
    materialsUsed:
      "Vegetable-tanned buffalo hide sole, Hirda & Babul bark natural tan liquor, hand-braided goat/buffalo leather Veni cord, natural beeswax polish.",
    makingProcess:
      "Hides are soaked for 30–35 days in natural vegetable tannins, sun-cured, hand-cut using brass templates, and joined exclusively with leather cords without a single iron nail.",
    provenanceNote:
      "Linked to GI Tag Application #169 (Kolhapuri Chappal — Maharashtra & Karnataka cluster). Illustrative demonstration listing.",
    description:
      "Classic Kapashi-pattern Kolhapuri footwear featuring a hand-plaited central Veni strap, dual-layer leather heel, and breathable natural vegetable-tanned footbed that moulds to the wearer's foot over time.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative craft product and price. Checkout uses simulated transactions only.",
  },
  {
    id: "prod-upcycled-chappal-journal-demo",
    slug: "industry-to-art-kurundwadi-leather-sketchbook-demo",
    title: "Industry-to-Art Edition: Braided Veni Leather Field Sketchbook & Satchel (Demo)",
    category: "Upcycled Industry-to-Art Craft",
    traditionId: "trad-kolhapuri-chappal",
    traditionSlug: "kolhapuri-chappal",
    traditionTitle: "Kolhapuri Chappal",
    sellerId: "seller-karvir-leather-demo",
    sellerSlug: "karvir-heritage-leather-guild-demo",
    sellerName: "Karvir Heritage Leather Guild (Demo Storefront)",
    regionLabel: "Kolhapur, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    priceInr: 1650,
    stockQuantity: 9,
    materialsUsed:
      "Surplus vegetable-tanned leather offcuts + unbleached handloom cotton rag paper from Industry-to-Art Batch #ITA-REQ-001.",
    makingProcess:
      "Crafted from clean vegetable-tanned leather trimmings diverted from industrial footwear cutting tables, bound with traditional Kolhapuri Veni cord braiding.",
    provenanceNote:
      "Produced through Industry-to-Art Collaboration #ITA-REQ-001 (Completed Demo Collaboration).",
    description:
      "A field researcher's sketchbook and utility pouch bound in vegetable-tanned leather offcuts and secured with a hand-braided Kolhapuri Veni wrap.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Kolhapuri_chappals.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0 (Illustrative craft asset)",
    industryCollaborationId: "ita-req-001",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Showcases how an Industry-to-Art collaboration links directly to an Art-Mart craft product.",
  },
  {
    id: "prod-kolhapuri-saaj-necklace-demo",
    slug: "traditional-21-pendant-kolhapuri-saaj-demo",
    title: "Traditional 21-Motif Kolhapuri Saaj Necklace — Gold-Plated Silver over Lac Core (Demo)",
    category: "Traditional Jewellery & Metalwork",
    traditionId: "trad-kolhapuri-saaj",
    traditionSlug: "kolhapuri-saaj",
    traditionTitle: "Kolhapuri Saaj",
    sellerId: "seller-hupari-karvir-ornaments-demo",
    sellerSlug: "panchganga-suvarna-chandi-studio-demo",
    sellerName: "Panchganga Suvarna & Hupari Chandi Studio (Demo Storefront)",
    regionLabel: "Kolhapur, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    priceInr: 6800,
    stockQuantity: 7,
    materialsUsed:
      "92.5 sterling silver with 24K gold foil vermeil, natural shellac (lac) core filling, synthetic ruby/emerald kempu stones, silk sarafa cord.",
    makingProcess:
      "Metal foil is hand-embossed on traditional bronze dies representing 10 Dashavatara and 8 Ashtamangal auspicious motifs, filled with warm lac for structural strength, and strung with alternating Jav-Mani (barley beads).",
    provenanceNote:
      "Documented under Kolhapuri Saaj heritage jewellery craft (Kolhapur District Gazetteer reference). Illustrative demo product.",
    description:
      "Heirloom-style Kolhapuri Saaj featuring 21 hand-embossed auspicious leaves (Panadi, Belpan, Kairi, Kamala, Matsya, Chandra, and central Lolak) strung on braided red-and-gold silk.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Kolhapuri_saaj.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Kolhapuri_saaj.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative craft product and price.",
  },
  {
    id: "prod-hupari-silver-payal-demo",
    slug: "hupari-hand-linked-silver-anklet-payal-demo",
    title: "Hupari Hand-Linked Silver Filigree Payal (Anklet Pair) with Hollow Ghungroo (Demo)",
    category: "Traditional Jewellery & Metalwork",
    traditionId: "trad-hupari-silverwork",
    traditionSlug: "hupari-silverwork",
    traditionTitle: "Hupari Silverwork",
    sellerId: "seller-hupari-karvir-ornaments-demo",
    sellerSlug: "panchganga-suvarna-chandi-studio-demo",
    sellerName: "Panchganga Suvarna & Hupari Chandi Studio (Demo Storefront)",
    regionLabel: "Hupari, Kolhapur District, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    priceInr: 4200,
    stockQuantity: 11,
    materialsUsed:
      "Hand-drawn silver alloy wire, hollow silver acoustic ghungroo bells, borax flux solder.",
    makingProcess:
      "Drawn through graduated steel draw-plates in Hupari's home workshops, interlocked link-by-link with fine pliers, and fitted with resonant hollow silver droplets.",
    provenanceNote:
      "Linked to the Hupari Silver Craft Cluster in Hatkanangale Taluka, Kolhapur.",
    description:
      "Lightweight, flexible Hupari silver anklets showcasing intricate chain-weaving and gentle ghungroo resonance cherished across Western Maharashtra.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Kolhapuri_saaj.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Kolhapuri_saaj.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0 (Representative Maharashtra ornament media)",
    industryCollaborationId: "ita-req-002",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative silver craft product.",
  },
  {
    id: "prod-kolhapuri-gi-jaggery-hamper-demo",
    slug: "kolhapuri-gi-golden-jaggery-and-masala-box-demo",
    title: "GI Kolhapuri Golden Jaggery (Gul) & Stone-Pounded Kanda-Lasun Masala Tasting Box (Demo)",
    category: "Culinary Heritage & Agrarian Craft",
    traditionId: "trad-kolhapuri-gul-and-spice-cuisine",
    traditionSlug: "kolhapuri-jaggery-and-culinary-heritage",
    traditionTitle: "Kolhapuri Jaggery and Culinary Heritage",
    sellerId: "seller-sahyadri-gurhal-culinary-demo",
    sellerSlug: "sahyadri-gurhal-spices-demo",
    sellerName: "Sahyadri Gurhal & Heritage Spices (Demo Storefront)",
    regionLabel: "Karvir & Panhala, Kolhapur, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    priceInr: 890,
    stockQuantity: 25,
    materialsUsed:
      "Panchganga river-basin sugarcane juice clarified with wild okra (Ran-Bhendi) mucilage; Lavangi & Byadgi chillies, coriander seed, sesame, poppy seed, dagad phool (stone flower), and garlic.",
    makingProcess:
      "Sugarcane juice is slow-boiled in wide shallow iron pans fired with dried bagasse, skimmed using herbal clarifiers with zero chemical hydros, and poured into wooden cooling pits.",
    provenanceNote:
      "Linked to GI-tagged Kolhapuri Jaggery and traditional Karvir culinary practices.",
    description:
      "A curated culinary heritage hamper pairing 1 kg of golden crystalline Kolhapuri Gul blocks, a 250 ml glass bottle of warm-poured Kakvi (liquid jaggery), and 250 g of hand-pounded Kolhapuri Kanda-Lasun Masala.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/29/Jaggery_making_in_Maharashtra.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/29/Jaggery_making_in_Maharashtra.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative culinary heritage product.",
  },
  {
    id: "prod-warli-tarpa-canvas-demo",
    slug: "warli-tarpa-harvest-circle-geru-canvas-demo",
    title: "Warli Tarpa Harvest Circle — Natural Geru Ochre & Rice-Paste Handloom Canvas (Demo)",
    category: "Visual Arts & Folk Painting",
    traditionId: "trad-warli-painting",
    traditionSlug: "warli-painting",
    traditionTitle: "Warli Painting",
    sellerId: "seller-sahyadri-warli-collective-demo",
    sellerSlug: "dahanu-warli-art-collective-demo",
    sellerName: "Dahanu-Jawhar Warli Kala Collective (Demo Storefront)",
    regionLabel: "Dahanu & Jawhar, Palghar District, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Palghar",
    priceInr: 3400,
    stockQuantity: 8,
    materialsUsed:
      "Unbleached handloom khadi canvas primed with red earth ochre (Geru) and acacia gum, painted with pounded white rice paste using a chewed bamboo stick.",
    makingProcess:
      "The canvas is primed in three coats of sun-dried red ochre slurry and burnished smooth before the artist paints the spiral Tarpa dance circle freehand with a bamboo twig.",
    provenanceNote:
      "Linked to North Konkan Warli Painting tradition (GI-registered Maharashtra indigenous art).",
    description:
      "An authentic 18 x 24 inch Warli narrative painting depicting the spiral Tarpa harvest dance around the central Tarpa wind-player, surrounded by forest flora, threshing scenes, and village granaries.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Warli_painting.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Warli_painting.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0",
    industryCollaborationId: "ita-req-003",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative indigenous painting product.",
  },
  {
    id: "prod-raghurajpur-pattachitra-scroll-demo",
    slug: "raghurajpur-dasavatara-pattachitra-scroll-demo",
    title: "Raghurajpur Dasavatara Pattachitra Scroll on Tamarind-Treated Cotton Patti (Demo)",
    category: "Visual Arts & Folk Painting",
    traditionId: "trad-pattachitra",
    traditionSlug: "pattachitra",
    traditionTitle: "Pattachitra",
    sellerId: "seller-raghurajpur-chitrakar-guild-demo",
    sellerSlug: "raghurajpur-chitrakar-guild-demo",
    sellerName: "Raghurajpur Chitrakar Parampara Guild (Demo Storefront)",
    regionLabel: "Raghurajpur, Puri District, Odisha",
    stateName: "Odisha",
    districtName: "Puri",
    priceInr: 5200,
    stockQuantity: 6,
    materialsUsed:
      "Layered cotton cloth, roasted tamarind-seed gum, soft chalk stone powder, Hingula (red mineral), Haritala (yellow stone), burned coconut lampblack, and calcined conch shell white.",
    makingProcess:
      "Two layers of cotton cloth are laminated with tamarind-seed paste, coated with chalk clay, polished with two river stones (Barada and Golei), painted with natural mineral colours, and sealed with wood-apple resin lacquer.",
    provenanceNote:
      "Linked to Odisha Pattachitra GI tradition, Raghurajpur Heritage Crafts Village.",
    description:
      "Finely detailed 15 x 30 inch Pattachitra scroll framing the ten incarnations (Dasavatara) in floral Sankha-Padma borders with natural stone pigments.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b5/Pattachitra_painting_Raghurajpur.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b5/Pattachitra_painting_Raghurajpur.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative Pattachitra scroll product.",
  },
  {
    id: "prod-charida-chhau-mask-demo",
    slug: "charida-purulia-chhau-festival-mask-demo",
    title: "Charida Hand-Moulded Purulia Chhau Mask — Clay, Muslin & Shola-Pith Crown (Demo)",
    category: "Sculptural & Performance Craft",
    traditionId: "trad-chhau-dance",
    traditionSlug: "chhau-dance",
    traditionTitle: "Chhau",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Charida, Purulia District, West Bengal",
    stateName: "West Bengal",
    districtName: "Purulia",
    priceInr: 2950,
    stockQuantity: 10,
    materialsUsed:
      "Subarnarekha river clay, recycled newsprint & cotton muslin layers (Chitani), Khari white chalk coat, natural earth pigments, Shola-pith reed ornaments.",
    makingProcess:
      "Sculpted over a river-clay core, layered with ash-dusted paper and mud-soaked muslin, sun-dried, hollow-separated, burnished with a wooden Thapi, and crowned with lightweight Shola-pith filigree.",
    provenanceNote:
      "Linked to Purulia Chhau Dance (UNESCO ICH 2010) and GI-tagged Charida Mask Craft.",
    description:
      "Authentic wall-display and performance-grade Purulia Chhau mask crafted in Charida village, featuring expressive arched brows and a traditional Shola-pith halo.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Chhau_Dance_Purulia.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Chhau_Dance_Purulia.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative Chhau mask product.",
  },
  {
    id: "prod-madhubani-kachni-lotus-demo",
    slug: "mithila-kachni-kohbar-lotus-painting-demo",
    title: "Mithila Kachni Lotus & Matsya Mandala on Handmade Cotton Rag Paper (Demo)",
    category: "Visual Arts & Folk Painting",
    traditionId: "trad-madhubani-mithila-painting",
    traditionSlug: "madhubani-painting",
    traditionTitle: "Madhubani Painting",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Jitwarpur, Madhubani District, Bihar",
    stateName: "Bihar",
    districtName: "Madhubani",
    priceInr: 2700,
    stockQuantity: 12,
    materialsUsed:
      "Handmade cotton rag paper primed with cow-dung wash, bamboo-splinter nib, lampblack soot with Babul resin, madder red, and turmeric yellow.",
    makingProcess:
      "Drawn freehand without preliminary pencil outlines using a bamboo twig nib, filled with dense parallel and cross-hatched Kachni micro-lines.",
    provenanceNote:
      "Linked to GI-registered Madhubani / Mithila Painting tradition of Bihar.",
    description:
      "A 16 x 22 inch Kachni-style Mithila composition celebrating aquatic fertility and auspicious union through concentric lotus stems, turtles, and twin fish.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Madhubani_art.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Madhubani_art.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative Madhubani painting product.",
  },
  {
    id: "prod-patan-patola-dupatta-demo",
    slug: "patan-patola-chhabdi-bhat-silk-stole-demo",
    title: "Patan Patola Double-Ikat Mulberry Silk Stole — Chhabdi Bhat Motif (Demo)",
    category: "Handloom & Textile Heritage",
    traditionId: "trad-patan-patola-gujarat",
    traditionSlug: "patan-patola",
    traditionTitle: "Patan Patola",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Patan, Gujarat",
    stateName: "Gujarat",
    districtName: "Patan",
    priceInr: 18500,
    stockQuantity: 3,
    materialsUsed:
      "8-ply degummed Katan mulberry silk warp and weft, cotton resist thread, natural madder root, indigo, pomegranate peel, and turmeric dyes.",
    makingProcess:
      "Both warp and weft threads are mathematically measured, resist-tied, and dyed in multiple stages before being woven on a rosewood handloom where every colour intersection aligns identically on both faces.",
    provenanceNote:
      "Linked to GI-registered Patan Patola Double-Ikat weaving tradition of North Gujarat.",
    description:
      "A museum-grade double-ikat silk stole with reversible geometric floral basket (Chhabdi Bhat) motifs and jewel-toned crimson, turmeric gold, and emerald borders.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Patan_Patola.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Patan_Patola.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative high-craft textile listing for Art-Mart demonstration.",
  },
  {
    id: "prod-mallakhamb-practice-rope-demo",
    slug: "cotton-braided-mallakhamb-practice-rope-demo",
    title: "Braided Unbleached Cotton Mallakhamb Practice Rope & Grip Rosin Kit (Demo)",
    category: "Traditional Sports & Akhada Gear",
    traditionId: "trad-mallakhamb-maharashtra",
    traditionSlug: "mallakhamb",
    traditionTitle: "Mallakhamb",
    sellerId: "seller-karvir-leather-demo",
    sellerSlug: "karvir-heritage-leather-guild-demo",
    sellerName: "Karvir Heritage Leather Guild (Demo Storefront)",
    regionLabel: "Kolhapur, Maharashtra",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    priceInr: 3100,
    stockQuantity: 6,
    materialsUsed:
      "Long-staple unbleached twisted cotton cord (5.5 m length, 22 mm tapered diameter), reinforced leather crown loop, castor-oil conditioning balm.",
    makingProcess:
      "Multi-strand cotton yarn is tension-braided to eliminate splinters while maintaining skin-safe friction for toe-locks and aerial yoga postures.",
    provenanceNote:
      "Linked to Maharashtra's traditional Rope Mallakhamb & Talim training craft.",
    description:
      "Competition-spec braided cotton hanging Mallakhamb rope with a hand-stitched Kolhapuri leather suspension collar.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mallakhamb_performance.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mallakhamb_performance.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative traditional sports apparatus listing.",
  },
  {
    id: "prod-assam-bihu-gamosa-demo",
    slug: "handwoven-phulam-bihu-gamosa-muga-border-demo",
    title: "Handwoven Assamese Phulam Gamosa with Golden Muga Silk & Red Mirijim Motifs (Demo)",
    category: "Handloom & Textile Heritage",
    traditionId: "trad-bihu-assam",
    traditionSlug: "bihu",
    traditionTitle: "Bihu",
    sellerId: "seller-charida-mithila-patan-demo",
    sellerSlug: "bharat-loom-and-mask-coop-demo",
    sellerName: "Triveni Loom, Mithila & Charida Craft Coop (Demo Storefront)",
    regionLabel: "Sivasagar, Assam",
    stateName: "Assam",
    districtName: "Sivasagar",
    priceInr: 1350,
    stockQuantity: 18,
    materialsUsed:
      "2/80s combed cotton warp and weft, natural madder/lac crimson extra-weft floral jacquard (Phulam) border, golden Muga silk accent stripe.",
    makingProcess:
      "Woven on a traditional Assamese throw-shuttle frame loom (Tat-Xaal) using supplementary weft patterning for the Kopou Phul (foxtail orchid) border.",
    provenanceNote:
      "Linked to GI-tagged Assamese Gamosa and Rongali Bihu cultural heritage.",
    description:
      "Ceremonial Bihuwan Phulam Gamosa featuring intricate red orchid and geometric borders woven by handloom weavers.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/59/Bihu_dance_Assam.jpg",
    galleryUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/59/Bihu_dance_Assam.jpg",
    ],
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    industryCollaborationId: null,
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION LISTING — Illustrative handloom product.",
  },
];

export const DEMO_ART_MART_ORDERS: ArtMartOrder[] = [
  {
    id: "ord-demo-1001",
    orderNumber: "BCM-DEMO-2026-1001",
    buyerName: "Meera Nambiar (Demo Buyer)",
    buyerEmail: "buyer.demo@bharat-culturemap.local",
    shippingCity: "Pune",
    shippingState: "Maharashtra",
    shippingAddressLabel: "Flat 402, Sahyadri Residency, Deccan Gymkhana, Pune 411004 (Demo Address)",
    paymentMethodLabel: "SIMULATED_UPI_SANDBOX (No real money transferred)",
    status: "CONFIRMED",
    totalInr: 3340,
    items: [
      {
        productId: "prod-kolhapuri-kapashi-chappal-demo",
        productTitle: "Hand-Stitched Kapashi Kolhapuri Chappal — Natural Bag-Tanned Leather (Demo)",
        sellerId: "seller-karvir-leather-demo",
        sellerName: "Karvir Heritage Leather Guild (Demo Storefront)",
        quantity: 1,
        unitPriceInr: 2450,
        lineTotalInr: 2450,
      },
      {
        productId: "prod-kolhapuri-gi-jaggery-hamper-demo",
        productTitle: "GI Kolhapuri Golden Jaggery (Gul) & Stone-Pounded Kanda-Lasun Masala Tasting Box (Demo)",
        sellerId: "seller-sahyadri-gurhal-culinary-demo",
        sellerName: "Sahyadri Gurhal & Heritage Spices (Demo Storefront)",
        quantity: 1,
        unitPriceInr: 890,
        lineTotalInr: 890,
      },
    ],
    simulationDisclaimer:
      "SIMULATED DEMONSTRATION ORDER — No real payment was processed and no physical shipment is dispatched.",
    createdAt: "2026-10-14T10:30:00.000Z",
    updatedAt: "2026-10-14T10:35:00.000Z",
  },
  {
    id: "ord-demo-1002",
    orderNumber: "BCM-DEMO-2026-1002",
    buyerName: "Rohan Deshpande (Demo Buyer)",
    buyerEmail: "buyer.demo@bharat-culturemap.local",
    shippingCity: "Kolhapur",
    shippingState: "Maharashtra",
    shippingAddressLabel: "18 Tarabai Park, Kolhapur 416003 (Demo Address)",
    paymentMethodLabel: "SIMULATED_ESCROW_PREVIEW (No real money transferred)",
    status: "DISPATCHED_DEMO",
    totalInr: 5050,
    items: [
      {
        productId: "prod-warli-tarpa-canvas-demo",
        productTitle: "Warli Tarpa Harvest Circle — Natural Geru Ochre & Rice-Paste Handloom Canvas (Demo)",
        sellerId: "seller-sahyadri-warli-collective-demo",
        sellerName: "Dahanu-Jawhar Warli Kala Collective (Demo Storefront)",
        quantity: 1,
        unitPriceInr: 3400,
        lineTotalInr: 3400,
      },
      {
        productId: "prod-upcycled-chappal-journal-demo",
        productTitle: "Industry-to-Art Edition: Braided Veni Leather Field Sketchbook & Satchel (Demo)",
        sellerId: "seller-karvir-leather-demo",
        sellerName: "Karvir Heritage Leather Guild (Demo Storefront)",
        quantity: 1,
        unitPriceInr: 1650,
        lineTotalInr: 1650,
      },
    ],
    simulationDisclaimer:
      "SIMULATED DEMONSTRATION ORDER — Created to demonstrate order status tracking and inventory deduction.",
    createdAt: "2026-10-16T14:20:00.000Z",
    updatedAt: "2026-10-17T09:10:00.000Z",
  },
];

export const DEMO_INDUSTRY_MATERIALS: IndustryMaterialListing[] = [
  {
    id: "ita-mat-001",
    title: "Vegetable-Tanned Full-Grain Leather Trim Offcuts (Chromium-Free)",
    industryOrgLabel: "Sahyadri Footwear & Saddlery Fabrication Unit (Illustrative Demo Mill)",
    materialCategory: "Vegetable-Tanned Leather & Hide Offcuts",
    quantityAvailableLabel: "180 kg (Assorted 20x35 cm clean pattern trimmings)",
    conditionLabel: "New, clean factory-die offcuts (2.2 mm – 3.0 mm thickness)",
    locationCity: "Kolhapur",
    locationState: "Maharashtra",
    pricingTerms: "DONATION_FREE",
    priceNote: "Free donation for registered craft guilds; pickup from Shiroli MIDC demo depot.",
    safetyRestrictions:
      "Verified 100% vegetable-tanned (Hirda/Babul); zero chromium-VI residue. Suitable for hand-stitching, braiding, and bookbinding.",
    suggestedTraditions: ["Kolhapuri Chappal", "Mardani Khel Scabbard & Shield Craft"],
    adminReviewStatus: "APPROVED",
    availabilityStatus: "PARTIALLY_ALLOCATED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION SURPLUS LISTING — Illustrative industrial circular-economy record. Not an actual industrial tender.",
    createdAt: "2026-10-05T09:00:00.000Z",
  },
  {
    id: "ita-mat-002",
    title: "High-Purity 99.9% Fine Silver Blanking Punch Scrap & Wire Ends",
    industryOrgLabel: "Deccan Precision Electrical Contacts Pvt Ltd (Illustrative Demo Unit)",
    materialCategory: "Non-Ferrous Metal & Silver Offcuts",
    quantityAvailableLabel: "4.5 kg (Assorted clean silver strip skeletons & wire spools)",
    conditionLabel: "Uncoated, unplated clean silver punch skeletons (cadmium-free)",
    locationCity: "Hupari",
    locationState: "Maharashtra",
    pricingTerms: "NOMINAL_RECOVERY_COST",
    priceNote: "Subsidised artisan circularity rate with certified assay sheet (Illustrative).",
    safetyRestrictions:
      "Cadmium-free and lead-free clean electrical silver. Requires standard crucible melting ventilation.",
    suggestedTraditions: ["Hupari Silverwork", "Kolhapuri Saaj"],
    adminReviewStatus: "APPROVED",
    availabilityStatus: "PARTIALLY_ALLOCATED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION SURPLUS LISTING — Illustrative material circularity listing.",
    createdAt: "2026-10-07T11:30:00.000Z",
  },
  {
    id: "ita-mat-003",
    title: "Unbleached Cotton Canvas & Handloom Selvedge Roll-Ends",
    industryOrgLabel: "Ichalkaranji Heritage Powerloom & Sizing Cluster (Illustrative Demo Mill)",
    materialCategory: "Cotton Canvas & Loom Selvedge",
    quantityAvailableLabel: "320 metres (Roll-ends 45 cm to 110 cm width, 340 GSM)",
    conditionLabel: "Unbleached, desized 100% cotton duck canvas without synthetic sizing",
    locationCity: "Ichalkaranji",
    locationState: "Maharashtra",
    pricingTerms: "DONATION_FREE",
    priceNote: "Complimentary allocation for folk painting and scroll preparation.",
    safetyRestrictions:
      "Free of optical brighteners, PVC coatings, or formaldehydes. Ready for natural Geru ochre or tamarind-seed gum priming.",
    suggestedTraditions: ["Warli Painting", "Pattachitra", "Madhubani Painting"],
    adminReviewStatus: "APPROVED",
    availabilityStatus: "AVAILABLE",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION SURPLUS LISTING — Illustrative textile mill circularity listing.",
    createdAt: "2026-10-09T08:15:00.000Z",
  },
  {
    id: "ita-mat-004",
    title: "Seasoned Burma/Konkan Teakwood Lathe Offcuts & Turning Cylinders",
    industryOrgLabel: "Karvir Architectural Joinery & Sawmill Works (Illustrative Demo Unit)",
    materialCategory: "Seasoned Hardwood & Teak Offcuts",
    quantityAvailableLabel: "65 cubic feet (Kiln-seasoned billets & cylindrical offcuts)",
    conditionLabel: "Untreated seasoned teakwood; zero chemical pressure-preservatives",
    locationCity: "Kolhapur",
    locationState: "Maharashtra",
    pricingTerms: "SPONSORED_CSR_GRANT",
    priceNote: "CSR-sponsored zero-cost transfer including local transport within Kolhapur.",
    safetyRestrictions:
      "Confirmed free of copper-chrome-arsenate (CCA) or creosote treatment. Safe for skin-contact athletic/musical carving.",
    suggestedTraditions: ["Mallakhamb", "Powada and Gondhal", "Kushti and Associated Akhada Traditions"],
    adminReviewStatus: "APPROVED",
    availabilityStatus: "AVAILABLE",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION SURPLUS LISTING — Illustrative timber circularity listing.",
    createdAt: "2026-10-11T15:00:00.000Z",
  },
  {
    id: "ita-mat-005",
    title: "Degummed Mulberry Silk Cone-Ends & Natural Indigo Vat Sediment",
    industryOrgLabel: "Western India Heritage Silk & Dye House (Illustrative Demo Unit)",
    materialCategory: "Natural Silk Yarn & Plant Pigments",
    quantityAvailableLabel: "28 kg silk cone-ends + 15 kg natural indigo cake",
    conditionLabel: "Clean mulberry silk bobbins (40–120 g per cone) & pure plant indigo",
    locationCity: "Patan",
    locationState: "Gujarat",
    pricingTerms: "NOMINAL_RECOVERY_COST",
    priceNote: "80% below wholesale cost for handloom & folk painting practitioners.",
    safetyRestrictions:
      "AZO-free natural indigo and untreated silk protein fibres.",
    suggestedTraditions: ["Patan Patola", "Bihu", "Madhubani Painting"],
    adminReviewStatus: "APPROVED",
    availabilityStatus: "AVAILABLE",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION SURPLUS LISTING — Illustrative yarn & pigment circularity listing.",
    createdAt: "2026-10-12T10:45:00.000Z",
  },
  {
    id: "ita-mat-006",
    title: "Pressed Sugarcane Bagasse Fibre Board & Food-Grade Beeswax Blocks",
    industryOrgLabel: "Panchganga Cooperative Agro-Processing Unit (Illustrative Demo Listing)",
    materialCategory: "Natural Fibre, Pulp & Wax",
    quantityAvailableLabel: "500 sheets cotton-bagasse pulp board + 20 kg beeswax",
    conditionLabel: "Acid-free unbleached agro-pulp sheets & filtered natural beeswax",
    locationCity: "Kolhapur",
    locationState: "Maharashtra",
    pricingTerms: "DONATION_FREE",
    priceNote: "Submitted for administrator safety and quality review.",
    safetyRestrictions:
      "Pending admin verification of acid-free pH certification for archival craft use.",
    suggestedTraditions: ["Chhau", "Madhubani Painting", "Kolhapuri Chappal"],
    adminReviewStatus: "PENDING_ADMIN_REVIEW",
    availabilityStatus: "AVAILABLE",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION SURPLUS LISTING — Shows step 1 & 2 of the workflow where an admin reviews a newly submitted material listing.",
    createdAt: "2026-10-17T12:00:00.000Z",
  },
];

export const DEMO_INDUSTRY_REQUESTS: IndustryMaterialRequest[] = [
  {
    id: "ita-req-001",
    materialId: "ita-mat-001",
    materialTitle: "Vegetable-Tanned Full-Grain Leather Trim Offcuts (Chromium-Free)",
    artisanName: "Master Subhash Satpute (Demo Artisan)",
    artisanEmail: "seller.demo@bharat-culturemap.local",
    traditionTitle: "Kolhapuri Chappal",
    requestedQuantityLabel: "45 kg clean 2.5 mm vegetable-tanned strips",
    intendedCraftUse:
      "Hand-braided Kolhapuri Veni straps and protective leather covers for field researcher sketchbooks & satchels.",
    collaborationStatus: "CRAFT_PRODUCT_LISTED_ON_ART_MART",
    adminReviewerNote:
      "Completed all 6 workflow stages. Resulting product 'Industry-to-Art Edition: Braided Veni Leather Field Sketchbook & Satchel (Demo)' is live on Art-Mart.",
    linkedArtMartProductId: "prod-upcycled-chappal-journal-demo",
    linkedArtMartProductSlug: "industry-to-art-kurundwadi-leather-sketchbook-demo",
    createdAt: "2026-10-06T10:00:00.000Z",
    updatedAt: "2026-10-15T16:00:00.000Z",
  },
  {
    id: "ita-req-002",
    materialId: "ita-mat-002",
    materialTitle: "High-Purity 99.9% Fine Silver Blanking Punch Scrap & Wire Ends",
    artisanName: "Smt. Anandibai Potdar (Demo Jewellery Master)",
    artisanEmail: "practitioner.demo@bharat-culturemap.local",
    traditionTitle: "Hupari Silverwork",
    requestedQuantityLabel: "1.2 kg clean silver punch skeletons",
    intendedCraftUse:
      "Remelting and wire-drawing into Hupari filigree Payal links and hollow acoustic ghungroo droplets.",
    collaborationStatus: "CRAFT_PRODUCT_LISTED_ON_ART_MART",
    adminReviewerNote:
      "Assay verified cadmium-free. Resulting Hupari hand-linked Payal pair is published on Art-Mart.",
    linkedArtMartProductId: "prod-hupari-silver-payal-demo",
    linkedArtMartProductSlug: "hupari-hand-linked-silver-anklet-payal-demo",
    createdAt: "2026-10-08T11:20:00.000Z",
    updatedAt: "2026-10-16T14:00:00.000Z",
  },
  {
    id: "ita-req-003",
    materialId: "ita-mat-003",
    materialTitle: "Unbleached Cotton Canvas & Handloom Selvedge Roll-Ends",
    artisanName: "Shri Jiva Vahadu (Demo Warli Chitrakar)",
    artisanEmail: "practitioner.demo@bharat-culturemap.local",
    traditionTitle: "Warli Painting",
    requestedQuantityLabel: "60 metres unbleached cotton duck roll-ends",
    intendedCraftUse:
      "Priming with natural red ochre (Geru) and acacia gum for Warli Tarpa harvest narrative canvases.",
    collaborationStatus: "IN_CRAFT_PRODUCTION",
    adminReviewerNote:
      "Material allocated and dispatched to Dahanu studio; first batch of canvases already linked to Art-Mart.",
    linkedArtMartProductId: "prod-warli-tarpa-canvas-demo",
    linkedArtMartProductSlug: "warli-tarpa-harvest-circle-geru-canvas-demo",
    createdAt: "2026-10-10T09:45:00.000Z",
    updatedAt: "2026-10-17T11:00:00.000Z",
  },
  {
    id: "ita-req-004",
    materialId: "ita-mat-004",
    materialTitle: "Seasoned Burma/Konkan Teakwood Lathe Offcuts & Turning Cylinders",
    artisanName: "Shahir ShahuRao Sawant (Demo Balladeer)",
    artisanEmail: "practitioner.demo@bharat-culturemap.local",
    traditionTitle: "Powada and Gondhal",
    requestedQuantityLabel: "12 cylindrical teakwood billets",
    intendedCraftUse:
      "Turning resonant wooden bodies for traditional Tuntune single-string instruments and Sambal drum shells.",
    collaborationStatus: "SUBMITTED_BY_ARTISAN",
    adminReviewerNote:
      "Awaiting administrator or industry review to advance to REVIEWED_BY_ADMIN_OR_INDUSTRY.",
    linkedArtMartProductId: null,
    linkedArtMartProductSlug: null,
    createdAt: "2026-10-17T15:30:00.000Z",
    updatedAt: "2026-10-17T15:30:00.000Z",
  },
];

export const DEMO_ECOSYSTEM_RESOURCES: EcosystemResourceItem[] = [
  {
    id: "eco-gov-001",
    title: "Development Commissioner (Handicrafts) — Pehchan Artisan ID & Ambedkar Hastshilp Vikas Yojana",
    resourceCategory: "Central Government Scheme",
    organisationType: "GOVERNMENT_MINISTRY",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India (Includes Kolhapur & Maharashtra Clusters)",
    summary:
      "Public reference information on the Ministry of Textiles' national artisan registration (Pehchan Card), tool-kit distribution, craft cluster infrastructure, and GI registration support.",
    eligibilityDetails:
      "Practising handloom and handicraft artisans across recognised Indian craft clusters; group applications via registered SHGs, cooperatives, or producer companies.",
    officialUrl: "https://handicrafts.nic.in/",
    lastReviewedDate: "2026-10-01",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC REFERENCE SUMMARY — Provided for informational discovery; Bharat CultureMap is not claiming an official ministerial endorsement.",
  },
  {
    id: "eco-gov-002",
    title: "Geographical Indications Registry (DPIIT) — Registered Craft & Agrarian GI Directory",
    resourceCategory: "Intellectual Property & GI Protection",
    organisationType: "STATUTORY_BOARD",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India",
    summary:
      "Authoritative statutory registry covering Geographical Indications including Kolhapuri Chappal, Kolhapuri Jaggery, Warli Painting, Patan Patola, Madhubani Painting, Odisha Pattachitra, and Purulia Chhau Masks.",
    eligibilityDetails:
      "Artisan associations, producer societies, and individual Authorised Users seeking GI logo certification under the GI Act, 1999.",
    officialUrl: "https://ipindia.gov.in/gi.htm",
    lastReviewedDate: "2026-10-05",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC REFERENCE SUMMARY — Statutory information reference only.",
  },
  {
    id: "eco-gov-003",
    title: "Sangeet Natak Akademi — Safeguarding the Intangible Cultural Heritage & Diverse Musical Traditions of India",
    resourceCategory: "Performing Arts Fellowship & Documentation Grant",
    organisationType: "CULTURAL_ACADEMY",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India",
    summary:
      "National academy programmes supporting Guru-Shishya Parampara training, field documentation, and archival preservation of folk, tribal, and classical performing arts (Chhau, Powada, Gondhal, Kathakali, Odissi, Bharatanatyam, Bihu, Garba).",
    eligibilityDetails:
      "Master practitioners, cultural documentation scholars, and registered folk/classical training institutions.",
    officialUrl: "https://www.sangeetnatak.gov.in/",
    lastReviewedDate: "2026-10-04",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC REFERENCE SUMMARY — Informational reference to public cultural schemes.",
  },
  {
    id: "eco-gov-004",
    title: "Directorate of Cultural Affairs & Maharashtra State Khadi and Village Industries Board (MSKVIB)",
    resourceCategory: "State Artisan Welfare & Honey/Rural Craft Mission",
    organisationType: "GOVERNMENT_MINISTRY",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "Maharashtra",
    summary:
      "State-level support schemes for senior folk artists (Shahir, Gondhali, Lavani, Tamasha veterans), rural leather/silver artisans, and district craft exhibitions across Maharashtra.",
    eligibilityDetails:
      "Domูก-domiciled Maharashtra folk artists and traditional rural craftspeople meeting age and practice documentation criteria.",
    officialUrl: "https://mahasanskruti.org/",
    lastReviewedDate: "2026-10-08",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC REFERENCE SUMMARY — Informational link to Maharashtra Cultural Affairs portal.",
  },
  {
    id: "eco-gov-005",
    title: "LIDCOM & LIDKAR — Sant Rohidas Leather Industries & Charmakar Development Corporations",
    resourceCategory: "Cluster Technical Upgradation & GI Footwear Support",
    organisationType: "STATUTORY_BOARD",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "Maharashtra & Karnataka (Kolhapuri Chappal GI Belt)",
    summary:
      "Joint institutional ecosystem supporting GI Kolhapuri Chappal artisans across Kolhapur, Sangli, Satara, and Solapur (Maharashtra) and Belagavi, Bagalkot, Dharwad, and Vijayapura (Karnataka).",
    eligibilityDetails:
      "Traditional leather artisans and footwear self-help groups within the 8 GI-designated districts.",
    officialUrl: "https://lidcom.maharashtra.gov.in/",
    lastReviewedDate: "2026-10-06",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC REFERENCE SUMMARY — Public corporation reference; not a claim of formal partnership.",
  },
  {
    id: "eco-partner-006",
    title: "Sahyadri Living Heritage & Oral History Documentation Lab (Illustrative Prospective Academic Partner)",
    resourceCategory: "Archival Research & Linguistic Transcription",
    organisationType: "ACADEMIC_INSTITUTION",
    relationshipStatus: "ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR",
    stateScope: "Western Maharashtra & Konkan",
    summary:
      "Illustrative university-affiliated ethnomusicology and oral history group demonstrating how academic labs can collaborate on Marathi/Varli/Ahirani transcription and provenance review.",
    eligibilityDetails:
      "Open to joint field documentation fellowships and student archival internships (Demonstration example).",
    officialUrl: "https://example.org/demo-sahyadri-heritage-lab",
    lastReviewedDate: "2026-10-12",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "ILLUSTRATIVE PROSPECTIVE COLLABORATOR — Fictional academic partner entry created to demonstrate partner status filtering.",
  },
  {
    id: "eco-partner-007",
    title: "Panchganga Circular Craft & Design Incubator Foundation (Illustrative NGO Collaborator)",
    resourceCategory: "Design Mentorship, Packaging & Circular Material Logistics",
    organisationType: "NGO_FOUNDATION",
    relationshipStatus: "ILLUSTRATIVE_PROSPECTIVE_COLLABORATOR",
    stateScope: "Kolhapur, Sangli & Palghar",
    summary:
      "Illustrative non-profit craft incubator entry showing how NGOs can assist artisans with eco-friendly packaging, GI tag literacy, and Industry-to-Art material collection.",
    eligibilityDetails:
      "Registered artisan collectives and women's self-help groups (Demonstration example).",
    officialUrl: "https://example.org/demo-panchganga-craft-incubator",
    lastReviewedDate: "2026-10-14",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "ILLUSTRATIVE PROSPECTIVE COLLABORATOR — Fictional NGO entry for interface demonstration; not a real organisation.",
  },
  {
    id: "eco-partner-008",
    title: "Deccan Green Manufacturing CSR Material Exchange Consortium (Illustrative Industry Partner)",
    resourceCategory: "Surplus Raw Material & CSR Logistics Partner",
    organisationType: "CSR_INDUSTRY_PARTNER",
    relationshipStatus: "DEMO_SIMULATED_PARTNER",
    stateScope: "Maharashtra & Gujarat",
    summary:
      "Simulated CSR consortium entry demonstrating how industrial estates can pledge clean vegetable-tanned leather, unbleached cotton roll-ends, and seasoned timber offcuts to the Industry-to-Art hub.",
    eligibilityDetails:
      "Verified industrial units with non-hazardous, craft-safe surplus materials (Demonstration simulation).",
    officialUrl: "https://example.org/demo-deccan-csr-exchange",
    lastReviewedDate: "2026-10-15",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMO SIMULATED PARTNER — Fictional CSR partner created solely to demonstrate the confirmed/simulated partner badge in the interface.",
  },
];
