import type {
  HerCraftEnterprise,
  HerCraftOpportunity,
} from "../../shared/contracts";

export const DEMO_HERCRAFT_ENTERPRISES: HerCraftEnterprise[] = [
  {
    id: "hc-ent-kolhapur-veni-shg-demo",
    slug: "karvir-bhagini-kolhapuri-veni-leather-shg-demo",
    enterpriseName: "Karvir Bhagini Kolhapuri Veni & Leather Craft SHG (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 18-Artisan Women's Self-Help Group — Kolhapur (Demo Sample)",
    enterpriseType: "WOMEN_SHG",
    craftCategory: "Leather & Footwear Craft",
    traditionId: "trad-kolhapuri-chappal",
    traditionSlug: "kolhapuri-chappal",
    traditionTitle: "Kolhapuri Chappal",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    placeId: "loc-city-kolhapur",
    womenArtisansCount: 18,
    foundedYear: 2019,
    shortSummary:
      "Illustrative women-led self-help group in Karveer and Kagal specialising in hand-plaited leather Veni straps, zero-nail cord stitching, and gold-thread Kapashi upper embroidery for GI Kolhapuri Chappals.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — Created to demonstrate how Bharat CultureMap's HerCraft module documents women-led craft collectives without fabricating claims about real individuals. In Kolhapur's traditional footwear ecosystem, women artisans across household workshops in Karveer, Kapashi, and Kagal perform the most intricate upper-strap braiding (Veni), decorative punching, and natural beeswax finishing. This sample profile illustrates how a women's SHG connects traditional skill documentation with Art-Mart craft listings and GI authorised-user training.",
    signatureCrafts: [
      "8-Strand & 12-Strand Hand-Braided Kolhapuri Veni Upper Straps",
      "Kapashi & Kurundwadi Instep Cord-Stitching (Zero-Nail Assembly)",
      "Upcycled Vegetable-Tanned Leather Sketchbook & Pouch Binding",
    ],
    productsAndTechniques: [
      "Natural Hirda & Babul vegetable-tanned buffalo/goat leather strip cutting",
      "Fine awl perforation and hand-twisted leather cord joining",
      "Beeswax and castor-oil footbed burnishing",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-kolhapur-veni-1",
        title: "Women's Craft Cohort: Traditional Kolhapuri Veni Braiding & Upper Patterning (Demo)",
        mode: "IN_PERSON",
        durationLabel: "2 Days (10 Hours)",
        feeInr: 1400,
        scheduleLabel: "Second weekend of every month — Kolhapur SHG Demo Centre",
        skillLevel: "Beginner to Intermediate",
        summary:
          "Hands-on demonstration of traditional Kolhapuri upper-strap braiding, pattern symmetry, and GI authenticity standards.",
      },
    ],
    supportNeeds: [
      "GI Authorised User group registration mentorship",
      "Ergonomic hand-punching toolkits & solar drying racks",
      "Direct institutional exhibition stalls",
    ],
    linkedArtMartProductIds: [
      "prod-kolhapuri-kapashi-chappal-demo",
      "prod-upcycled-chappal-journal-demo",
    ],
    linkedPractitionerId: "pract-kolhapuri-chappal-demo",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/8a/Indian_chappal%2C_Kolhapur%2C_late_20th_century_-_Bata_Shoe_Museum_-_DSC00445.JPG",
    imageCredit:
      "Photograph by Daderot, Bata Shoe Museum exhibit, CC0 1.0 Public Domain via Wikimedia Commons",
    sourceAttribution:
      "Craft context verified against Geographical Indications Registry of India (GI Tag #169 — Kolhapuri Chappal); enterprise identity is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://ipindia.gov.in/gi.htm",
    contactOrEnquiryNote:
      "All workshop and bulk craft enquiries are routed through Bharat CultureMap's moderated community enquiry queue.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional women-led SHG created to demonstrate HerCraft workflows. Never presented as a real organisation or individual.",
    ownerUserId: null,
    createdAt: "2026-10-12T09:00:00.000Z",
    updatedAt: "2026-10-17T10:00:00.000Z",
  },
  {
    id: "hc-ent-hupari-chandi-coop-demo",
    slug: "hupari-mahila-chandi-painjan-cooperative-demo",
    enterpriseName: "Hupari Mahila Chandi Painjan & Gujrav Cooperative (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 24-Artisan Women's Silver Filigree Collective — Hupari (Demo Sample)",
    enterpriseType: "ARTISAN_COOPERATIVE",
    craftCategory: "Traditional Jewellery & Metalwork",
    traditionId: "trad-hupari-silverwork",
    traditionSlug: "hupari-silverwork",
    traditionTitle: "Hupari Silverwork (Chandi Kaam)",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Hupari",
    placeId: "loc-village-hupari",
    womenArtisansCount: 24,
    foundedYear: 2018,
    shortSummary:
      "Illustrative women's silver-ornament cooperative in Hupari (Hatkanangale Taluka, Kolhapur District) demonstrating fine chain-linking, hollow silver bead (Gujrav) assembly, and resonant Ghungroo threading.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — In Hupari's century-old cottage silver cluster (24 km from Kolhapur city), women artisans are the backbone of intricate chain-weaving, ghungroo droplet linking, and Ritha (soapnut) polishing. This demonstration profile shows how HerCraft links Hupari's women metalworkers with Kolhapuri Saaj and Hupari Payal listings on Art-Mart and circular silver recovery from the Industry-to-Art hub.",
    signatureCrafts: [
      "Hupari Articulated Silver Painjan (Payal) Chain-Weaving",
      "Hollow Silver Gujrav Bead & Acoustic Ghungroo Assembly",
      "21-Pani Kolhapuri Saaj Silk Cord (Wagdoro) Stringing",
    ],
    productsAndTechniques: [
      "Fine-gauge drawn silver wire interlocking with micro-pliers",
      "Hollow hemisphere silver bead stamping and soldering preparation",
      "Traditional soapnut (Ritha) water burnishing",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-hupari-1",
        title: "Hupari Silver Chain-Linking & Ornament Heritage Study Session (Demo)",
        mode: "IN_PERSON",
        durationLabel: "1 Day (5 Hours)",
        feeInr: 1500,
        scheduleLabel: "Monthly third Sunday — Hupari Cluster Demo Studio",
        skillLevel: "Beginner",
        summary:
          "Introduction to Hupari's household division of craft labour, wire gauge drawing, and traditional Marathi silver ornament typology.",
      },
    ],
    supportNeeds: [
      "Low-smoke micro-soldering workstation lamps",
      "Hallmarking & assay literacy workshops for women SHGs",
      "Packaging design for heirloom silver ornaments",
    ],
    linkedArtMartProductIds: [
      "prod-hupari-silver-payal-demo",
      "prod-kolhapuri-saaj-necklace-demo",
    ],
    linkedPractitionerId: "pract-kolhapur-saaj-hupari-demo",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Kolhapuri_saaj.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0 (Representative Maharashtra ornament media)",
    sourceAttribution:
      "Cluster history verified against Maharashtra State Gazetteers (Kolhapur District); cooperative identity is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://cultural.maharashtra.gov.in/",
    contactOrEnquiryNote:
      "Household workshop locations in Hupari are privacy-masked to town level; visits require advance moderated approval.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional women's silver cooperative for interface demonstration.",
    ownerUserId: null,
    createdAt: "2026-10-12T10:30:00.000Z",
    updatedAt: "2026-10-17T10:30:00.000Z",
  },
  {
    id: "hc-ent-kolhapur-masala-gurhal-demo",
    slug: "panchganga-kanda-lasun-masala-and-gurhal-collective-demo",
    enterpriseName: "Panchganga Savitribai Kanda-Lasun Masala & Gurhal Collective (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 15-Member Women's Culinary Heritage Enterprise — Karveer (Demo Sample)",
    enterpriseType: "CULINARY_COLLECTIVE",
    craftCategory: "Culinary Heritage & Agrarian Craft",
    traditionId: "trad-kolhapuri-gul-and-spice-cuisine",
    traditionSlug: "kolhapuri-jaggery-and-culinary-heritage",
    traditionTitle: "Kolhapuri Jaggery (Gul) & Stone-Pounded Culinary Heritage",
    stateName: "Maharashtra",
    districtName: "Kolhapur District",
    cityName: "Kolhapur",
    placeId: "loc-taluka-karveer",
    womenArtisansCount: 15,
    foundedYear: 2021,
    shortSummary:
      "Illustrative women-led culinary heritage group in Karveer and Panhala Talukas preserving basalt stone-mortar (Danka) Kanda-Lasun Masala pounding and chemical-free GI Kolhapuri Jaggery value-added confections.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — Showcases how women's culinary and agrarian enterprises in Kolhapur District preserve traditional spice roasting ratios (Lavangi and Byadgi chillies, dagad phool, sesame, poppy seed, and garlic pounded in basalt stone mortars to retain volatile oils) alongside seasonal GI Kolhapuri Jaggery (Gul) and liquid Kakvi.",
    signatureCrafts: [
      "Basalt Stone-Pounded (Danka) Kolhapuri Kanda-Lasun Masala",
      "Chemical-Free GI Kolhapuri Gul & Roasted Sesame Chikki",
      "Sun-Dried Heirloom Spice & Millet Preserves",
    ],
    productsAndTechniques: [
      "Slow wood-fired iron-pan spice roasting by variety",
      "Basalt stone-mortar pounding without high-heat blade grinding",
      "Wild-okra (Ran-Bhendi) clarified golden sugarcane jaggery pairing",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-culinary-1",
        title: "Kolhapuri Spice Botany & Stone-Mortar Pounding Demonstration (Demo)",
        mode: "HYBRID",
        durationLabel: "3 Hours",
        feeInr: 750,
        scheduleLabel: "First Saturday of every month — Karveer Taluka (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Explore the 18 aromatics of traditional Kolhapuri Kanda-Lasun Masala and learn why stone pounding preserves essential oils.",
      },
    ],
    supportNeeds: [
      "FSSAI & GI packaging compliance training",
      "Moisture-barrier glass jar procurement",
    ],
    linkedArtMartProductIds: ["prod-kolhapuri-gi-jaggery-hamper-demo"],
    linkedPractitionerId: null,
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/29/Jaggery_making_in_Maharashtra.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    sourceAttribution:
      "Agrarian & GI context verified against Geographical Indications Registry (Kolhapur Jaggery, 2014); collective identity is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://ipindia.gov.in/gi.htm",
    contactOrEnquiryNote: "Moderated culinary and seasonal Gurhal study enquiries welcome.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional culinary collective for HerCraft demonstration.",
    ownerUserId: null,
    createdAt: "2026-10-13T08:00:00.000Z",
    updatedAt: "2026-10-17T11:00:00.000Z",
  },
  {
    id: "hc-ent-palghar-warli-sangha-demo",
    slug: "jawhar-dahanu-warli-chitrakari-mahila-sangha-demo",
    enterpriseName: "Jawhar-Dahanu Warli Chitrakari Mahila Sangha (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 22-Artist Indigenous Women's Painting Collective — Palghar (Demo Sample)",
    enterpriseType: "ARTISAN_COOPERATIVE",
    craftCategory: "Visual Arts & Folk Painting",
    traditionId: "trad-warli-painting",
    traditionSlug: "warli-painting",
    traditionTitle: "Warli Painting",
    stateName: "Maharashtra",
    districtName: "Palghar",
    cityName: "Dahanu",
    placeId: "loc-state-maharashtra",
    womenArtisansCount: 22,
    foundedYear: 2017,
    shortSummary:
      "Illustrative North Konkan women's Warli painting collective preserving the matriarchal Savasini Lagnachowk ritual mural tradition on natural Geru red-ochre and handloom khadi canvases.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — Historically, Warli ritual wall paintings (Lagnachowk) centered on Palaghat, the goddess of fertility and trees, were painted exclusively by married women (Savasinis) using pounded white rice paste and a chewed bamboo stick over earth walls. This sample HerCraft enterprise illustrates how women artists in Dahanu and Jawhar sustain indigenous visual storytelling on archival handloom cotton canvases.",
    signatureCrafts: [
      "Traditional Palaghat Chaukat & Tarpa Harvest Narrative Canvases",
      "Natural Geru (Red Earth Ochre) & Rice-Paste Bamboo-Twig Painting",
      "Upcycled Mill-Selvedge Handloom Wall Scrolls",
    ],
    productsAndTechniques: [
      "Three-coat sun-cured red ochre (Geru) and acacia-gum priming",
      "Freehand geometric triangle-circle-line brushwork with chewed bamboo twigs",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-warli-1",
        title: "Indigenous Geometry & Natural Ochre Priming Online Workshop (Demo)",
        mode: "ONLINE",
        durationLabel: "2.5 Hours",
        feeInr: 900,
        scheduleLabel: "Every second Saturday, 4:00 PM IST (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Learn the ecological worldview of Warli art, natural surface preparation, and community consent boundaries around sacred motifs.",
      },
    ],
    supportNeeds: [
      "Unbleached cotton duck roll-ends via Industry-to-Art",
      "Archival tube packaging for domestic and museum orders",
    ],
    linkedArtMartProductIds: ["prod-warli-tarpa-canvas-demo"],
    linkedPractitionerId: null,
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Warli_painting.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0",
    sourceAttribution:
      "Historical Savasini mural context verified against GI Registry & Ministry of Culture documentation; collective is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://indianculture.gov.in/",
    contactOrEnquiryNote: "Sacred household Lagnachowk ceremonies are never commercialised; only public-safe narrative canvases are shared.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional women-led Warli collective for interface testing.",
    ownerUserId: null,
    createdAt: "2026-10-13T12:00:00.000Z",
    updatedAt: "2026-10-17T11:30:00.000Z",
  },
  {
    id: "hc-ent-mithila-kohbar-guild-demo",
    slug: "jitwarpur-ranti-mithila-women-artists-guild-demo",
    enterpriseName: "Jitwarpur-Ranti Mithila Kohbar & Kachni Women Artists Guild (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 30-Artist Women's Mithila Painting Studio — Madhubani (Demo Sample)",
    enterpriseType: "MASTER_ARTISAN_STUDIO",
    craftCategory: "Visual Arts & Folk Painting",
    traditionId: "trad-madhubani-mithila-painting",
    traditionSlug: "madhubani-painting",
    traditionTitle: "Madhubani (Mithila) Painting",
    stateName: "Bihar",
    districtName: "Madhubani",
    cityName: "Madhubani",
    placeId: "loc-state-bihar",
    womenArtisansCount: 30,
    foundedYear: 2016,
    shortSummary:
      "Illustrative women-led Mithila painting guild in Madhubani District showcasing Bharni, Kachni, and Aripan floor-to-paper compositions created with bamboo-splinter nibs and plant pigments.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — Madhubani (Mithila) painting is one of India's most celebrated women-custodied art traditions, transmitted across generations of women in Jitwarpur, Ranti, and Rasidpur. This demonstration profile highlights how women artists transition ritual courtyard Aripan and Kohbar motifs onto handmade cotton rag paper.",
    signatureCrafts: [
      "Kachni Micro-Line Hatching & Bharni Mineral-Pigment Paintings",
      "Kamalban (Lotus Pond) & Matsya Mandala Handmade Rag-Paper Scrolls",
    ],
    productsAndTechniques: [
      "Freehand double-line drawing with bamboo twigs wrapped in cotton",
      "Natural lampblack soot, turmeric, indigo, and palash flower pigments",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-mithila-1",
        title: "Kachni Line-Work & Botanical Pigment Preparation Masterclass (Demo)",
        mode: "ONLINE",
        durationLabel: "3 Hours",
        feeInr: 850,
        scheduleLabel: "Every Sunday morning (Illustrative)",
        skillLevel: "Beginner to Intermediate",
        summary:
          "Step-by-step demonstration of freehand double-outline drawing and fine Kachni cross-hatching.",
      },
    ],
    supportNeeds: [
      "Acid-free handmade cotton rag paper supply",
      "Digital provenance watermarking & GI authentication tags",
    ],
    linkedArtMartProductIds: ["prod-madhubani-kachni-lotus-demo"],
    linkedPractitionerId: null,
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Madhubani_art.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    sourceAttribution:
      "Tradition context verified against GI Registry (Madhubani Painting); studio identity is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://ipindia.gov.in/gi.htm",
    contactOrEnquiryNote: "Online workshops and commissioned archival scrolls coordinated via moderated enquiry.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional women-led Mithila art guild for interface testing.",
    ownerUserId: null,
    createdAt: "2026-10-14T09:00:00.000Z",
    updatedAt: "2026-10-17T12:00:00.000Z",
  },
  {
    id: "hc-ent-assam-bihuwan-weavers-demo",
    slug: "sivasagar-bihuwan-muga-phulam-weavers-samiti-demo",
    enterpriseName: "Sivasagar Bihuwan Muga & Phulam Weavers Samiti (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 26-Weaver Women's Handloom Samiti — Assam (Demo Sample)",
    enterpriseType: "TEXTILE_WEAVERS_GUILD",
    craftCategory: "Handloom & Textile Heritage",
    traditionId: "trad-bihu-assam",
    traditionSlug: "bihu",
    traditionTitle: "Bihu & Assamese Handloom Heritage",
    stateName: "Assam",
    districtName: "Sivasagar",
    cityName: "Sivasagar",
    placeId: "loc-state-assam",
    womenArtisansCount: 26,
    foundedYear: 2018,
    shortSummary:
      "Illustrative women's handloom weavers collective in Assam weaving GI-tagged Phulam Bihuwan Gamosas and golden Muga silk borders on traditional Tat-Xaal frame looms.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — Across Assam, handloom weaving on the household Tat-Xaal loom is overwhelmingly led by women weavers (Xipini), who weave the ceremonial Phulam Gamosa gifted during Rongali Bihu as well as lustrous golden Muga silk textiles. This sample profile demonstrates how HerCraft connects Northeast women's handloom collectives to national cultural discovery.",
    signatureCrafts: [
      "GI-Tagged Assamese Phulam Bihuwan Gamosa with Kopou Orchid Motifs",
      "Golden Muga & Eri Peace-Silk Supplementary Weft Borders",
    ],
    productsAndTechniques: [
      "Supplementary-weft floral jacquard picking using bamboo Xali sticks",
      "Natural madder/lac red yarn dyeing and combed cotton warping",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-assam-1",
        title: "Tat-Xaal Supplementary Weft Patterning & Muga Silk Identification (Demo)",
        mode: "ONLINE",
        durationLabel: "2 Hours",
        feeInr: 700,
        scheduleLabel: "Monthly second Saturday (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Live loom walkthrough showing how Kopou Phul and Mirijim motifs are woven into Assamese textiles.",
      },
    ],
    supportNeeds: [
      "Certified Som-fed Muga silk yarn bank access",
      "Handloom Mark & GI label authentication tags",
    ],
    linkedArtMartProductIds: ["prod-assam-bihu-gamosa-demo"],
    linkedPractitionerId: null,
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/59/Bihu_dance_Assam.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    sourceAttribution:
      "Handloom & GI context verified against GI Registry (Assamese Gamosa & Muga Silk); samiti identity is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://handicrafts.nic.in/",
    contactOrEnquiryNote: "Moderated bulk handloom and educational enquiries supported.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional Assamese women's handloom collective.",
    ownerUserId: null,
    createdAt: "2026-10-14T11:00:00.000Z",
    updatedAt: "2026-10-17T12:30:00.000Z",
  },
  {
    id: "hc-ent-raghurajpur-pattachitra-women-demo",
    slug: "raghurajpur-tamarind-patti-and-pattachitra-mahila-studio-demo",
    enterpriseName: "Raghurajpur Tamarind-Patti & Pattachitra Mahila Studio (Demo Enterprise)",
    leaderOrCollectiveLabel: "Illustrative 16-Artisan Women's Chitrakar Studio — Puri District (Demo Sample)",
    enterpriseType: "MASTER_ARTISAN_STUDIO",
    craftCategory: "Visual Arts & Folk Painting",
    traditionId: "trad-pattachitra",
    traditionSlug: "pattachitra",
    traditionTitle: "Odisha Pattachitra",
    stateName: "Odisha",
    districtName: "Puri",
    cityName: "Raghurajpur",
    placeId: "loc-state-odisha",
    womenArtisansCount: 16,
    foundedYear: 2020,
    shortSummary:
      "Illustrative women's Chitrakar collective in Raghurajpur specialising in cotton Patti canvas lamination with roasted tamarind-seed gum, river-stone burnishing, and natural stone-pigment Pattachitra scrolls.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE — In Odisha's Chitrakar families, women artisans have traditionally prepared the multi-layered cotton Patti canvas—cooking tamarind-seed paste (Natha), coating soft white chalk clay, and burnishing the surface smooth with Barada and Golei river stones—and today lead full scroll painting and palm-leaf etching.",
    signatureCrafts: [
      "Tamarind-Seed Gum Laminated Cotton Patti Scrolls",
      "Conch-Shell White & Hingula Mineral Pigment Dasavatara Panels",
    ],
    productsAndTechniques: [
      "Tamarind seed roasting, grinding, and cotton cloth lamination",
      "Natural stone and calcined conch-shell pigment preparation in coconut shells",
    ],
    trainingAndWorkshops: [
      {
        id: "hc-wk-pattachitra-1",
        title: "Preparing the Pattachitra Patti Canvas & Natural Stone Pigments (Demo)",
        mode: "ONLINE",
        durationLabel: "2 Hours",
        feeInr: 950,
        scheduleLabel: "Monthly last Sunday (Illustrative)",
        skillLevel: "All Levels",
        summary:
          "Discover the organic chemistry behind Raghurajpur's tamarind-seed canvas lamination and mineral pigments.",
      },
    ],
    supportNeeds: [
      "Unbleached cotton canvas offcuts from Industry-to-Art",
      "Moisture-safe scroll storage cylinders",
    ],
    linkedArtMartProductIds: ["prod-raghurajpur-pattachitra-scroll-demo"],
    linkedPractitionerId: null,
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b5/Pattachitra_painting_Raghurajpur.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 4.0",
    sourceAttribution:
      "Craft process verified against Odisha Pattachitra GI documentation; studio is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://ipindia.gov.in/gi.htm",
    contactOrEnquiryNote: "Moderated studio visit and online workshop enquiries supported.",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Fictional Odisha women's Chitrakar studio.",
    ownerUserId: null,
    createdAt: "2026-10-15T09:00:00.000Z",
    updatedAt: "2026-10-17T13:00:00.000Z",
  },
  {
    id: "hc-ent-patan-ikat-pending-demo",
    slug: "patan-bandhani-and-ikat-women-resist-dyers-guild-demo",
    enterpriseName: "Patan & Surendranagar Women Ikat Resist-Tying Guild (Demo Pending Review)",
    leaderOrCollectiveLabel: "Illustrative 14-Artisan Women's Silk Resist-Binding Group — Gujarat (Demo Sample)",
    enterpriseType: "TEXTILE_WEAVERS_GUILD",
    craftCategory: "Handloom & Textile Heritage",
    traditionId: "trad-patan-patola-gujarat",
    traditionSlug: "patan-patola",
    traditionTitle: "Patan Patola Double-Ikat",
    stateName: "Gujarat",
    districtName: "Patan",
    cityName: "Patan",
    placeId: "loc-state-gujarat",
    womenArtisansCount: 14,
    foundedYear: 2022,
    shortSummary:
      "Illustrative women-led silk resist-tying and natural madder/indigo dyeing group in North Gujarat, seeded in PENDING_REVIEW status so administrators can test the HerCraft review and publication workflow.",
    storyNarrative:
      "CLEARLY LABELLED DEMO_SAMPLE ENTERPRISE (PENDING ADMIN REVIEW) — Seeded in PENDING_REVIEW / DRAFT state to demonstrate how newly submitted HerCraft enterprise profiles are held in the moderation queue until an authorized staff reviewer approves and publishes them.",
    signatureCrafts: [
      "Mathematical Cotton-Cord Resist Binding on Mulberry Silk Warp & Weft",
      "Natural Madder, Turmeric & Pomegranate Rind Vat Dyeing",
    ],
    productsAndTechniques: [
      "Grid-measured cotton thread resist tying prior to multi-stage dyeing",
      "Degummed mulberry silk skein preparation",
    ],
    trainingAndWorkshops: [],
    supportNeeds: [
      "Degummed mulberry silk cone-ends from Industry-to-Art",
      "Solar hot-water dye vat equipment",
    ],
    linkedArtMartProductIds: ["prod-patan-patola-dupatta-demo"],
    linkedPractitionerId: "pract-patan-patola-demo",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Patan_Patola.jpg",
    imageCredit: "Wikimedia Commons — CC BY-SA 3.0",
    sourceAttribution:
      "Craft context verified against GI Registry (Patan Patola); enterprise is a fictional DEMO_SAMPLE.",
    sourceUrl: "https://ipindia.gov.in/gi.htm",
    contactOrEnquiryNote: "Pending administrator review and publication approval.",
    approvalStatus: "PENDING_REVIEW",
    publicationStatus: "DRAFT",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "DEMONSTRATION ENTERPRISE PROFILE — Seeded in PENDING_REVIEW state to test the Admin review workflow.",
    ownerUserId: null,
    createdAt: "2026-10-17T14:00:00.000Z",
    updatedAt: "2026-10-17T14:00:00.000Z",
  },
];

export const DEMO_HERCRAFT_OPPORTUNITIES: HerCraftOpportunity[] = [
  {
    id: "hc-opp-001",
    title: "Development Commissioner (Handicrafts) — Ambedkar Hastshilp Vikas Yojana (AHVY) for Women Craft SHGs",
    opportunityType: "GOVERNMENT_SCHEME",
    organiserName: "Office of the Development Commissioner (Handicrafts), Ministry of Textiles, Govt. of India",
    organiserType: "GOVERNMENT_MINISTRY",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India (Includes Kolhapur & Maharashtra Clusters)",
    eligibilitySummary:
      "Registered women's artisan Self-Help Groups (SHGs), cooperative societies, and Pehchan-card holding handicraft artisans.",
    benefitSummary:
      "Baseline cluster mobilisation, design & technical upgradation workshops, improved toolkit distribution, and common facility centre support.",
    applicationOrOfficialUrl: "https://handicrafts.nic.in/",
    deadlineOrCycleLabel: "Rolling / Annual Ministry Cluster Cycle",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC SCHEME REFERENCE — Summarised from public Ministry of Textiles information; Bharat CultureMap does not claim official government endorsement.",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "hc-opp-002",
    title: "National Backward Classes / Women Artisan Mahila Samriddhi & Mudra Craft Micro-Credit Reference",
    opportunityType: "MICRO_GRANT_OR_CREDIT",
    organiserName: "Ministry of Social Justice & Public Sector Craft Credit Portals",
    organiserType: "STATUTORY_BOARD",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India",
    eligibilitySummary:
      "Women artisans and micro-enterprises in traditional leatherwork, metalwork, handloom, and food processing clusters.",
    benefitSummary:
      "Working capital micro-finance, raw-material bank credit linkage, and subsidised exhibition participation support.",
    applicationOrOfficialUrl: "https://msme.gov.in/",
    deadlineOrCycleLabel: "Year-round via District Industries Centres (DIC)",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC SCHEME REFERENCE — Informational directory entry only.",
    createdAt: "2026-10-11T09:00:00.000Z",
  },
  {
    id: "hc-opp-003",
    title: "DPIIT Geographical Indications (GI) Authorised User Registration Drive for Women's Craft Collectives",
    opportunityType: "GOVERNMENT_SCHEME",
    organiserName: "Geographical Indications Registry, DPIIT, Ministry of Commerce & Industry",
    organiserType: "STATUTORY_BOARD",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India (Kolhapuri Chappal, Kolhapur Jaggery, Warli, Madhubani, Patan Patola, Pattachitra)",
    eligibilitySummary:
      "Women artisans producing authentic GI-registered crafts within the designated geographical boundary.",
    benefitSummary:
      "Official GI Authorised User certificate (nominal statutory fee of ₹10) enabling legal use of the official Indian GI logo and protection against counterfeit products.",
    applicationOrOfficialUrl: "https://ipindia.gov.in/gi.htm",
    deadlineOrCycleLabel: "Continuous Online Filing",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC SCHEME REFERENCE — Statutory GI Registry reference.",
    createdAt: "2026-10-12T09:00:00.000Z",
  },
  {
    id: "hc-opp-004",
    title: "Maharashtra State Khadi & Village Industries Board (MSKVIB) — Rural Women Artisan Exhibition & Tool Grant",
    opportunityType: "EXHIBITION_AND_MARKET",
    organiserName: "MSKVIB & Directorate of Cultural Affairs, Government of Maharashtra",
    organiserType: "GOVERNMENT_MINISTRY",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "Maharashtra (Includes Kolhapur, Sangli, Satara & Palghar)",
    eligibilitySummary:
      "Women-led village industry units, leather/silver craft SHGs, and traditional food heritage cooperatives domiciled in Maharashtra.",
    benefitSummary:
      "Subsidised stalls at state-level Mahalaxmi Saras / district craft melas, solar dehydrator/tool assistance, and packaging guidance.",
    applicationOrOfficialUrl: "https://mahasanskruti.org/",
    deadlineOrCycleLabel: "Seasonal Festive & District Mela Cycles",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC SCHEME REFERENCE — Informational reference to public state schemes.",
    createdAt: "2026-10-13T09:00:00.000Z",
  },
  {
    id: "hc-opp-005",
    title: "Sahyadri HerCraft Digital Storytelling, Packaging & Circular Material Fellowship (Illustrative Demo Opportunity)",
    opportunityType: "INCUBATION_PROGRAM",
    organiserName: "Panchganga Circular Craft & Design Incubator (Illustrative Prospective NGO Partner)",
    organiserType: "NGO_FOUNDATION",
    relationshipStatus: "ILLUSTRATIVE_DEMO_PROGRAM",
    stateScope: "Western Maharashtra & Konkan",
    eligibilitySummary:
      "Women-led SHGs and family craft studios participating in Industry-to-Art upcycling or Cultural Rights Passport documentation.",
    benefitSummary:
      "6-week mentorship in open-licence craft photography, bilingual Marathi-English provenance storytelling, and zero-plastic shipping materials.",
    applicationOrOfficialUrl: "https://example.org/demo-hercraft-fellowship",
    deadlineOrCycleLabel: "Quarterly Demo Cohort (Illustrative)",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "ILLUSTRATIVE DEMO OPPORTUNITY — Fictional fellowship entry created to demonstrate partner vs. official scheme badges.",
    createdAt: "2026-10-14T09:00:00.000Z",
  },
  {
    id: "hc-opp-006",
    title: "National Handloom Development Programme (NHDP) — Hathkargha Samvardhan Sahayata for Women Weavers",
    opportunityType: "TRAINING_FELLOWSHIP",
    organiserName: "Office of the Development Commissioner for Handlooms, Ministry of Textiles",
    organiserType: "GOVERNMENT_MINISTRY",
    relationshipStatus: "OFFICIAL_PUBLIC_SOURCE",
    stateScope: "All India",
    eligibilitySummary:
      "Women handloom weavers and primary handloom cooperative societies holding Weavers Service Centre (WSC) registration.",
    benefitSummary:
      "90% government subsidy on upgraded jacquard/dobby frame looms, warp-beam accessories, and natural dyeing skill upgradation.",
    applicationOrOfficialUrl: "https://handlooms.nic.in/",
    deadlineOrCycleLabel: "Rolling via Weavers Service Centres",
    approvalStatus: "APPROVED",
    publicationStatus: "PUBLISHED",
    recordOrigin: "DEMO_SAMPLE",
    demoDisclaimer:
      "OFFICIAL PUBLIC SCHEME REFERENCE — Public handloom directorate reference.",
    createdAt: "2026-10-15T09:00:00.000Z",
  },
];
