import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import HeroIndiaArtwork from "@/components/HeroIndiaArtwork";
import NationalCultureMap from "@/components/NationalCultureMap";
import { apiClient } from "@/lib/api";
import { getCultureImageFallback } from "@/lib/images";
import { TRADITION_DIRECTORY_CATEGORIES } from "@shared/const";
import type {
  CommunityEnquiryType,
  CulturalEventItem,
  MapDiscoveryPayload,
  PublicCulturalRecord,
  TraditionSummary,
} from "@shared/contracts";
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Eye,
  HeartHandshake,
  Library,
  Lock,
  Menu,
  Mic2,
  MoveUpRight,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Users,
  X,
} from "lucide-react";

const HERO_IMAGE = "/manus-storage/bharat-culturemap-hero_1c81260f.jpg";
const TEXTILE_IMAGE = "/manus-storage/bharat-culturemap-textile_e59e6de2.jpg";

const journey = [
  {
    no: "01",
    title: "Discover",
    body: "Start from a place, not a category.",
    icon: Compass,
  },
  {
    no: "02",
    title: "Listen",
    body: "Make original voices central to the record.",
    icon: Mic2,
  },
  {
    no: "03",
    title: "Understand",
    body: "Context before consumption.",
    icon: BookOpen,
  },
  {
    no: "04",
    title: "Respect",
    body: "Consent, attribution, and boundaries.",
    icon: ShieldCheck,
  },
  {
    no: "05",
    title: "Learn",
    body: "Meet knowledge through practice.",
    icon: Sprout,
  },
  {
    no: "06",
    title: "Meet",
    body: "Find the people behind the work.",
    icon: Users,
  },
  {
    no: "07",
    title: "Support",
    body: "Turn discovery into opportunity.",
    icon: HeartHandshake,
  },
];

function DemoBadge({
  light = false,
  isVerified = false,
  children = "REFERENCE INFORMATION · COMMUNITY VERIFICATION PENDING",
}: {
  light?: boolean;
  isVerified?: boolean;
  children?: string;
}) {
  if (isVerified) {
    return (
      <span
        className={`eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
          light
            ? "border-[#0f807c]/35 bg-[#e6f7f4] text-[#0f5e5b]"
            : "border-[#57c5a9]/45 bg-[#57c5a9]/15 text-[#8ed5bd]"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#57c5a9]" />
        {children}
      </span>
    );
  }
  return (
    <span
      className={`eyebrow inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
        light
          ? "border-[#6d463b]/20 bg-[#fffaf1]/70 text-[#7c5748]"
          : "border-[#ef9d45]/30 bg-[#ef9d45]/10 text-[#efb167]"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#ef9d45]" />
      {children}
    </span>
  );
}

function SectionKicker({
  children,
  light = false,
}: {
  children: string;
  light?: boolean;
}) {
  return (
    <div
      className={`eyebrow mb-4 flex items-center gap-3 ${
        light ? "text-[#7b5c4f]" : "text-[#e7a25b]"
      }`}
    >
      <span className="h-px w-8 bg-current" />
      {children}
    </div>
  );
}

function IconCircle({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
        active
          ? "border-[#ef9d45]/50 bg-[#ef9d45] text-[#251922]"
          : "border-white/10 bg-white/[.05] text-[#efb167]"
      }`}
    >
      {children}
    </span>
  );
}

function renderSplitEditorialTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length === 2) {
    return (
      <>
        {words[0]}
        <br />
        <em className="text-[#efb167]">{words[1]}</em>
      </>
    );
  }
  if (words.length > 2) {
    const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");
    return (
      <>
        {firstLine}
        <br />
        <em className="text-[#efb167]">{secondLine}</em>
      </>
    );
  }
  return <em className="text-[#efb167]">{title}</em>;
}

function Home() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [records, setRecords] = useState<PublicCulturalRecord[]>([]);
  const [traditions, setTraditions] = useState<TraditionSummary[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<PublicCulturalRecord | null>(null);
  const [missingRecordSlug, setMissingRecordSlug] = useState<string | null>(
    null
  );
  const [profileStateFilter, setProfileStateFilter] = useState<string>("All");
  const [profileCategoryFilter, setProfileCategoryFilter] =
    useState<string>("All");
  const [events, setEvents] = useState<CulturalEventItem[]>([]);
  const [mapStats, setMapStats] = useState<MapDiscoveryPayload["stats"] | null>(
    null
  );
  const [enquiryModal, setEnquiryModal] = useState<{
    open: boolean;
    enquiryType: CommunityEnquiryType;
    title: string;
    subtitle: string;
  }>({
    open: false,
    enquiryType: "WORKSHOP_ENQUIRY",
    title: "",
    subtitle: "",
  });
  const [enqName, setEnqName] = useState("");
  const [enqContact, setEnqContact] = useState("");
  const [enqMessage, setEnqMessage] = useState("");
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);
  const [mediationTab, setMediationTab] = useState<
    "QA" | "M3" | "M1" | "M2"
  >("QA");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectRecordAndSyncUrl = (rec: PublicCulturalRecord | null) => {
    setSelectedRecord(rec);
    setMissingRecordSlug(null);
    const url = new URL(window.location.href);
    if (rec) {
      url.searchParams.set("record", rec.slug);
    } else {
      url.searchParams.delete("record");
    }
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get("record");

    apiClient.listPublicRecords()
      .then(({ records: list }) => {
        setRecords(list);
        if (requestedSlug) {
          const fromQuery = list.find((r) => r.slug === requestedSlug) || null;
          if (fromQuery) {
            setSelectedRecord(fromQuery);
            setMissingRecordSlug(null);
          } else {
            setSelectedRecord(null);
            setMissingRecordSlug(requestedSlug);
          }
        } else {
          // Never default to a hard-coded Kolhapuri Chappal lookup;
          // let the visitor choose a region, category, or cultural record.
          setSelectedRecord(null);
          setMissingRecordSlug(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load public cultural records:", err);
      });

    apiClient
      .queryPublicTraditions({ pageSize: 18 })
      .then((res) => setTraditions(res.traditions))
      .catch(() => {});

    apiClient
      .listPublicEvents()
      .then(({ events: evts }) => setEvents(evts))
      .catch(() => {});

    apiClient
      .getMapDiscovery(true)
      .then((payload) => setMapStats(payload.stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCoverImgError(false);
    setPlaying(false);
  }, [selectedRecord?.id]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNav(false);
  };

  const availableStates = Array.from(
    new Set(records.map((r) => r.stateName).filter(Boolean))
  ).sort();
  const availableCategories = Array.from(
    new Set(records.map((r) => r.category).filter(Boolean))
  ).sort();

  // Filter across all pan-India records by state and category
  const profileSwitcherRecords = records
    .filter((r) => {
      if (profileStateFilter !== "All" && r.stateName !== profileStateFilter)
        return false;
      if (
        profileCategoryFilter !== "All" &&
        r.category !== profileCategoryFilter
      )
        return false;
      return true;
    })
    .slice(0, 14);

  const fieldVerifiedRecordsCount = records.filter(
    (r) => r.recordOrigin === "FIELD_VERIFIED"
  ).length;

  const searchMatches = records
    .filter(
      (r) =>
        r.titleEn.toLowerCase().includes(searchValue.toLowerCase()) ||
        (r.titleMr || "").toLowerCase().includes(searchValue.toLowerCase()) ||
        r.displayLocationLabel
          .toLowerCase()
          .includes(searchValue.toLowerCase()) ||
        r.creditedPractitionerLabel
          .toLowerCase()
          .includes(searchValue.toLowerCase())
    )
    .slice(0, 6);

  const active = selectedRecord;
  const isVerified = active?.recordOrigin === "FIELD_VERIFIED";
  const activeCoverUrl =
    active?.heroImageUrl && active.heroImageUrl.trim().length > 0
      ? active.heroImageUrl
      : active
        ? getCultureImageFallback(active.category || active.titleEn)
        : null;

  const openEnquiryModal = (
    enquiryType: CommunityEnquiryType,
    title: string,
    subtitle: string
  ) => {
    setEnquiryModal({ open: true, enquiryType, title, subtitle });
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnqSubmitting(true);
    try {
      await apiClient.submitCommunityEnquiry({
        enquiryType: enquiryModal.enquiryType,
        culturalRecordId: active?.id || null,
        senderName: enqName,
        senderContact: enqContact,
        message: enqMessage,
      });
      setEnqName("");
      setEnqContact("");
      setEnqMessage("");
      setEnquiryModal((prev) => ({ ...prev, open: false }));
      setToast(
        "Your moderated enquiry has been recorded in the database for community & coordinator review."
      );
    } catch (err: any) {
      setToast(err?.message || "Failed to submit enquiry.");
    } finally {
      setEnqSubmitting(false);
    }
  };

  const togglePlayAudio = () => {
    if (!active) {
      setPlaying((v) => !v);
      return;
    }
    if (isVerified && !active.canPlayAudioVideo) {
      setToast(
        `Audio playback is restricted by the practitioner's Rights Passport (${active.publicRightsCard.audioVideoAccess}).`
      );
      return;
    }
    if (active.originalVoiceAudioUrl && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying((v) => !v));
      }
    } else {
      setPlaying((v) => !v);
    }
  };

  // Map provenance steps onto the 6-step Chain of Care visual cards
  const chainSteps = active?.provenanceChain || [];
  const hasCollected = chainSteps.some((s) => s.stepType === "COLLECTED");
  const hasConsented = chainSteps.some(
    (s) => s.stepType === "CONSENTED" && s.practitionerApproved
  );
  const hasVerified = chainSteps.some(
    (s) => s.stepType === "TRANSCRIBED" || s.stepType === "TRANSLATED"
  );
  const hasHumanReview = chainSteps.some(
    (s) => s.stepType === "TRANSLATED" || s.stepType === "NARRATED"
  );
  const hasPractitionerApproval = chainSteps.some(
    (s) => s.stepType === "APPROVED" && s.practitionerApproved
  );
  const hasPublished =
    chainSteps.some((s) => s.stepType === "PUBLISHED") ||
    Boolean(active?.publishedAt && isVerified);

  const provenanceVisualSteps = [
    { label: "Field documentation", done: isVerified ? hasCollected : true },
    { label: "Consent", done: isVerified ? hasConsented : true },
    { label: "Verification", done: isVerified ? hasVerified : false },
    { label: "Human review", done: isVerified ? hasHumanReview : false },
    {
      label: "Practitioner approval",
      done: isVerified ? hasPractitionerApproval : false,
    },
    { label: "Publication", done: isVerified ? hasPublished : false },
  ];

  return (
    <main className="overflow-x-hidden bg-[#10121c]">
      {/* Persistent Navigation Header (z-[1200] prevents map panes or cards from overlapping) */}
      <header
        className="relative z-30 border-b border-white/10 bg-[#111522]/90 px-4 py-2.5"
      >
        <div
          className={`mx-auto flex max-w-[1360px] items-center justify-between rounded-full px-4 py-3 md:px-5 ${
            scrolled ? "glass" : "bg-[#111522]/55 backdrop-blur-md"
          }`}
        >
          <button
            className="focus-ring flex items-center gap-3 text-left"
            onClick={() => scrollTo("top")}
            aria-label="Bharat CultureMap home"
          >
            <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[#ef9d45]/60 text-[#efb167]">
              <span className="absolute h-2.5 w-2.5 rounded-full bg-[#ef9d45] shadow-[0_0_18px_#ef9d45]" />
              <span className="absolute h-6 w-6 rounded-full border border-[#ef9d45]/30" />
            </span>
            <span className="leading-none">
              <span className="block text-[11px] font-semibold tracking-[.22em] text-[#f3eee5]">
                BHARAT
              </span>
              <span className="block font-serif text-[16px] tracking-[.03em] text-[#efb167]">
                CultureMap
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-5 lg:flex">
            {[
              { label: "Explore", id: "journey" },
              { label: "CultureMap", id: "culturemap" },
              { label: "Stories", id: "practice-profile" },
              { label: "Learn", id: "learn" },
              { label: "Makers", id: "ecosystem" },
              { label: "About", id: "governance" },
            ].map((item) => (
              <button
                key={item.label}
                className="focus-ring text-[11px] font-semibold uppercase tracking-[.13em] text-white/65 transition-colors hover:text-[#efb167]"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/75 transition hover:border-[#ef9d45]/50 hover:text-[#efb167]"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="Search"
            >
              <Search size={15} />
            </button>
            <span className="hidden sm:inline-flex">
              <DemoBadge isVerified={fieldVerifiedRecordsCount > 0}>
                {fieldVerifiedRecordsCount > 0
                  ? `${fieldVerifiedRecordsCount} PRACTITIONER-APPROVED · ${records.length} RECORDS`
                  : `LIVING ARCHIVE · ${traditions.length} TRADITIONS · ${records.length} RECORDS`}
              </DemoBadge>
            </span>
            <button
              type="button"
              onClick={() => setLocation("/traditions")}
              className="rounded-full border border-[#ef9d45]/50 bg-[#ef9d45]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#efb167] transition hover:bg-[#ef9d45] hover:text-[#251922]"
            >
              Tradition Explorer
            </button>
            <button
              type="button"
              onClick={() => setLocation("/calendar")}
              className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#8ed5bd] transition hover:bg-[#57c5a9] hover:text-[#102124]"
            >
              Cultural Calendar
            </button>
            <button
              type="button"
              onClick={() => setLocation("/trip-planner")}
              className="hidden rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#efb167] transition hover:bg-[#ef9d45] hover:text-[#251922] md:inline-flex"
            >
              Trip Planner
            </button>
            <button
              type="button"
              onClick={() => setLocation("/places/loc-country-in")}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/80 transition hover:border-[#ef9d45]/50 hover:text-[#efb167]"
            >
              Places Directory
            </button>
            <button
              onClick={() => setLocation("/admin")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#efb167] transition hover:bg-[#ef9d45] hover:text-[#251922]"
            >
              <Lock size={11} />
              Admin
            </button>
            <button
              className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/75 lg:hidden"
              onClick={() => setMobileNav((open) => !open)}
              aria-label="Toggle navigation"
            >
              {mobileNav ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="glass mx-auto mt-2 max-w-xl rounded-2xl p-3">
            <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-2">
              <Search size={15} className="text-[#efb167]" />
              <input
                autoFocus
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search places, people or culture…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <div className="mt-2 grid gap-1">
              {searchMatches.map((rec) => (
                <button
                  key={rec.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-white/75 transition hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    selectRecordAndSyncUrl(rec);
                    setSearchOpen(false);
                    scrollTo("practice-profile");
                  }}
                >
                  <span>
                    {rec.titleEn}{" "}
                    <span className="text-white/40">
                      · {rec.displayLocationLabel}
                    </span>
                  </span>
                  <span
                    className={`eyebrow ${
                      rec.recordOrigin === "FIELD_VERIFIED"
                        ? "text-[#8ed5bd]"
                        : "text-[#efb167]"
                    }`}
                  >
                    {rec.recordOrigin === "FIELD_VERIFIED"
                      ? "FIELD-VERIFIED"
                      : "REFERENCE"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mobileNav && (
          <div className="glass mt-2 rounded-2xl p-4 lg:hidden">
            <div className="grid gap-1">
              {[
                { label: "Explore", id: "journey" },
                { label: "CultureMap", id: "culturemap" },
                { label: "Stories", id: "practice-profile" },
                { label: "Learn", id: "learn" },
                { label: "Makers", id: "ecosystem" },
                { label: "About", id: "governance" },
              ].map((item) => (
                <button
                  key={item.label}
                  className="rounded-xl px-3 py-3 text-left text-sm text-white/75 hover:bg-white/10 hover:text-[#efb167]"
                  onClick={() => scrollTo(item.id)}
                >
                  {item.label}
                </button>
              ))}
              <button
                className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#efb167] hover:bg-white/10"
                onClick={() => setLocation("/admin")}
              >
                Admin Panel
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          HERO SECTION (#top) — RESTORED GOLDEN INDIA HERITAGE ILLUSTRATION
          ===================================================================== */}
      <section
        id="top"
        className="grain relative min-h-[760px] overflow-hidden bg-[#10121c] pb-16 pt-28 md:min-h-[860px] md:pt-36"
      >
        <div
          className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-[.82]"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#10121c_0%,rgba(16,18,28,.94)_32%,rgba(16,18,28,.22)_68%,rgba(16,18,28,.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_44%,transparent_0,rgba(16,18,28,.10)_30%,#10121c_82%)]" />

        <div className="container relative z-10 grid min-h-[620px] items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
          <div className="max-w-[720px]">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="eyebrow text-[#efb167]">
                A LIVING CULTURAL ATLAS OF INDIA
              </span>
              <span className="h-px w-16 bg-[#ef9d45]/40" />
              <span className="eyebrow text-white/45">INDIA / 2026</span>
            </div>
            <h1 className="display max-w-[780px] text-[clamp(3.5rem,7.8vw,7.4rem)] leading-[.91] text-[#fbf5eb]">
              India has
              <br />
              <em className="text-[#efb167]">millions</em> of stories.
              <br />
              <span className="text-white/75">
                Let’s make them
                <br />
                discoverable.
              </span>
            </h1>
            <p className="mt-8 max-w-[510px] text-base leading-7 text-white/60 md:text-lg">
              A community-governed digital ecosystem connecting people, places,
              living traditions, and opportunity.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                className="button-lift focus-ring inline-flex items-center gap-3 rounded-full bg-[#ef9d45] px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#251922]"
                onClick={() => scrollTo("culturemap")}
              >
                Explore CultureMap <ArrowRight size={15} />
              </button>
              <button
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-white/80 transition hover:border-[#efb167]/50 hover:text-[#efb167]"
                onClick={() => scrollTo("journey")}
              >
                How it works <ChevronDown size={14} />
              </button>
            </div>
            <div className="mt-16 flex items-center gap-4 text-white/42 md:mt-20">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15">
                <ArrowDown size={14} />
              </span>
              <span className="eyebrow">Scroll to enter the living archive</span>
            </div>
          </div>

          <HeroIndiaArtwork
            fieldVerifiedCount={fieldVerifiedRecordsCount}
            activePlaceLabel={
              active?.cityTownName ||
              active?.districtName?.replace(/ District$/i, "") ||
              active?.stateName ||
              "All India"
            }
            activePracticeLabel={
              active?.titleEn || `${traditions.length || 16} Living Traditions`
            }
            isVerified={Boolean(isVerified)}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#10121c] to-transparent" />
      </section>

      {/* =====================================================================
          PLATFORM PURPOSE & 7 PRIMARY ACTIONS
          ===================================================================== */}
      <section
        aria-label="Primary Platform Pathways"
        className="relative z-20 border-y border-white/10 bg-[#141827] py-12"
      >
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow text-[#efb167]">
                START YOUR JOURNEY · 7 CORE PLATFORM PATHWAYS
              </div>
              <h2 className="mt-2 font-serif text-3xl text-white md:text-4xl">
                Connect with India’s Living Cultural Heritage
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-white/65">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <strong className="text-[#efb167]">
                  {mapStats?.totalLocations ?? "…"}
                </strong>{" "}
                Places Indexed
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <strong className="text-[#8ed5bd]">
                  {mapStats?.traditionsPublished ?? traditions.length}
                </strong>{" "}
                Source-Backed Traditions
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <strong className="text-white">{records.length}</strong>{" "}
                Published Cultural Records
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {[
              {
                step: "01",
                title: "Interactive Map",
                desc: "Explore India from State & District down to Taluka, City, and Village.",
                actionLabel: "Open Map",
                onClick: () => scrollTo("culturemap"),
              },
              {
                step: "02",
                title: "Traditions by Category",
                desc: "Browse 9 living heritage categories with verified sources & media.",
                actionLabel: "Tradition Explorer",
                onClick: () => setLocation("/traditions"),
              },
              {
                step: "03",
                title: "Practitioners & Teachers",
                desc: "Connect with master artisans, performers, and workshops ethically.",
                actionLabel: "Find Practitioners",
                onClick: () => scrollTo("learn"),
              },
              {
                step: "04",
                title: "Explore Art-Mart",
                desc: "Enquire directly about GI-tagged and traditional handloom & craft works.",
                actionLabel: "Open Art-Mart",
                onClick: () => scrollTo("ecosystem"),
              },
              {
                step: "05",
                title: "Events & Trip Planner",
                desc: "Browse confirmed festivals and build day-by-day cultural itineraries.",
                actionLabel: "Plan a Trip",
                onClick: () => setLocation("/trip-planner"),
              },
              {
                step: "06",
                title: "Industry Collaborations",
                desc: "Connect sustainable materials, artisan clusters, and design partners.",
                actionLabel: "Industry-to-Art",
                onClick: () => scrollTo("industry-to-art"),
              },
              {
                step: "07",
                title: "Government & Ecosystem",
                desc: "Access Ministry of Culture, Akademi, GI Registry & UNESCO archives.",
                actionLabel: "Explore Resources",
                onClick: () => scrollTo("gov-resources"),
              },
            ].map((card) => (
              <button
                key={card.step}
                type="button"
                onClick={card.onClick}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#101320] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#ef9d45]/60 hover:bg-[#191f33]"
              >
                <div>
                  <div className="eyebrow text-[10px] text-[#efb167]">
                    {card.step}
                  </div>
                  <h3 className="mt-2 font-serif text-lg text-white group-hover:text-[#efb167]">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-white/60">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8ed5bd]">
                  {card.actionLabel} <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          THE INVITATION (#journey)
          ===================================================================== */}
      <section
        id="journey"
        className="relative scroll-mt-28 bg-[#10121c] py-28 md:py-36"
      >
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <SectionKicker>THE INVITATION</SectionKicker>
              <h2 className="display max-w-[530px] text-5xl leading-[.98] text-[#f7f0e5] md:text-7xl">
                Living culture is not a pin on a map.
              </h2>
              <p className="mt-7 max-w-[430px] text-sm leading-7 text-white/52">
                It is a relationship between people, place, memory, skill, and
                the futures that become possible when knowledge is seen on its
                own terms.
              </p>
              <button
                className="button-lift mt-9 inline-flex items-center gap-3 rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[.14em] text-white/80 hover:border-[#efb167]/50 hover:text-[#efb167]"
                onClick={() => scrollTo("culturemap")}
              >
                Enter the map <MoveUpRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-4">
              <div className="col-span-2 bg-[#181c2b] p-7 md:col-span-2 md:p-9">
                <div className="eyebrow text-[#efb167]">PEOPLE + PLACE</div>
                <div className="mt-14 font-serif text-5xl text-white">
                  A place is
                  <br />
                  <em className="text-[#efb167]">never just</em> a place.
                </div>
              </div>
              <div className="bg-[#202e39] p-6 md:p-8">
                <span className="eyebrow text-[#8ed5bd]">CULTURE</span>
                <p className="mt-12 text-sm leading-6 text-white/75">
                  Knowledge lives in bodies, materials, gestures, songs, and
                  care.
                </p>
              </div>
              <div className="bg-[#3b2530] p-6 md:p-8">
                <span className="eyebrow text-[#f2b56b]">OPPORTUNITY</span>
                <p className="mt-12 text-sm leading-6 text-white/75">
                  Discovery should lead to learning, meeting, and ethical
                  support.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mt-20">
          <div className="hairline mb-8" />
          <div className="grid gap-6 md:grid-cols-7">
            {journey.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.no}
                  className="group relative rounded-2xl border border-white/5 bg-white/[.02] p-4 transition-all duration-300 hover:border-[#ef9d45]/40 hover:bg-white/[.06] hover:-translate-y-1.5 bcm-card-interactive"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="eyebrow text-white/40 font-mono text-[11px]">{item.no}</span>
                    <Icon
                      size={18}
                      className="text-[#efb167] transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-white group-hover:text-[#efb167] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          01 / CULTUREMAP (#culturemap)
          ===================================================================== */}
      <NationalCultureMap
        onExploreStory={(recordItem, city) => {
          const matched = records.find(
            (r) =>
              (recordItem.slug && r.slug === recordItem.slug) ||
              r.titleEn === recordItem.name
          );
          if (matched) {
            selectRecordAndSyncUrl(matched);
            setToast(
              `Loaded '${matched.titleEn}' (${matched.originBadgeLabel}) from ${city.name}.`
            );
          } else if (recordItem.slug) {
            apiClient
              .getPublicRecordBySlug(recordItem.slug)
              .then(({ record }) => {
                selectRecordAndSyncUrl(record);
              })
              .catch(() => {});
          }
          window.setTimeout(() => scrollTo("practice-profile"), 80);
        }}
      />

      {/* =====================================================================
          02 / ENTER A CULTURAL PROFILE (#practice-profile)
          ===================================================================== */}
      <section
        id="practice-profile"
        className="scroll-mt-28 bg-[#f3eee4] py-24 text-[#332530] md:py-32"
      >
        <div className="container">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <SectionKicker light>02 / ENTER A CULTURAL PROFILE</SectionKicker>
              <h2 className="display max-w-[700px] text-5xl leading-[.95] md:text-7xl">
                A practice is a
                <br />
                <em className="text-[#b96844]">doorway</em>, not a record.
              </h2>
            </div>
            <DemoBadge light isVerified={isVerified}>
              {active?.originBadgeLabel || "REFERENCE INFORMATION · COMMUNITY VERIFICATION PENDING"}
            </DemoBadge>
          </div>

          {/* Pan-India Cultural Profile Filter & Selector Bar */}
          <div className="mt-10 space-y-3 rounded-2xl border border-[#6d463b]/15 bg-[#e6ddd0]/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow text-[#7b5c4f]">
                FILTER & SELECT A CULTURAL PROFILE ({records.length} PUBLISHED ACROSS INDIA):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter cultural profiles by State or UT"
                  value={profileStateFilter}
                  onChange={(e) => setProfileStateFilter(e.target.value)}
                  className="rounded-full border border-[#6d463b]/20 bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#332530] outline-none"
                >
                  <option value="All">All States & UTs ({availableStates.length})</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter cultural profiles by Category"
                  value={profileCategoryFilter}
                  onChange={(e) => setProfileCategoryFilter(e.target.value)}
                  className="rounded-full border border-[#6d463b]/20 bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#332530] outline-none"
                >
                  <option value="All">All Categories ({availableCategories.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {active && (
                  <button
                    type="button"
                    onClick={() => selectRecordAndSyncUrl(null)}
                    className="rounded-full border border-[#6d463b]/25 px-3 py-1.5 text-xs font-semibold text-[#7b5c4f] hover:bg-[#332530] hover:text-white"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {profileSwitcherRecords.map((rec) => {
                const isSelected = active?.id === rec.id;
                const recVerified = rec.recordOrigin === "FIELD_VERIFIED";
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => selectRecordAndSyncUrl(rec)}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#332530] text-[#fbf5eb] shadow-md"
                        : "bg-[#fffaf1] text-[#5b4a4b] hover:bg-[#332530]/10"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        recVerified ? "bg-[#0f807c]" : "bg-[#ef9d45]"
                      }`}
                    />
                    <span>{rec.titleEn}</span>
                    <span className="text-[10px] opacity-65">
                      ({rec.stateName})
                    </span>
                    <span
                      className={`eyebrow text-[9px] ${
                        recVerified
                          ? "text-[#57c5a9]"
                          : isSelected
                            ? "text-[#efb167]"
                            : "text-[#9c5540]"
                      }`}
                    >
                      {recVerified ? "PRACTITIONER-APPROVED" : "REFERENCE"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {missingRecordSlug && (
            <div className="mt-6 rounded-2xl border border-[#b96844]/40 bg-[#fffaf1] p-6 text-center">
              <div className="eyebrow text-[#b96844]">
                RECORD NOT FOUND · NO SILENT FALLBACK
              </div>
              <h3 className="mt-2 font-serif text-2xl text-[#332530]">
                The requested cultural profile “{missingRecordSlug}” is not available
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[#5b4a4b]">
                Bharat CultureMap never substitutes an unrelated cultural record
                when a link or slug is missing or restricted. Choose any
                verified or reference record above, or browse the Tradition
                Explorer.
              </p>
            </div>
          )}

          {!active ? (
            <div className="mt-10 rounded-[2rem] border border-[#6d463b]/20 bg-[#fffaf1] p-8 md:p-12">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                <div>
                  <div className="eyebrow text-[#b96844]">
                    NO DEFAULT RECORD FORCED · CHOOSE BY PLACE, CATEGORY OR TRADITION
                  </div>
                  <h3 className="display mt-3 text-4xl text-[#332530] md:text-5xl">
                    Select a cultural profile above or explore the pan-India Tradition Directory
                  </h3>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b4a4b]">
                    To ensure regional and cultural accuracy, Bharat CultureMap
                    does not hard-code a single default tradition on launch.
                    Select any documented practice from the filter bar above,
                    click a marker on the interactive map, or open a multi-region
                    dossier in the Tradition Explorer.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setLocation("/traditions")}
                      className="inline-flex items-center gap-2 rounded-full bg-[#332530] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#fbf5eb]"
                    >
                      Open Tradition Explorer ({traditions.length} Traditions){" "}
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTo("culturemap")}
                      className="inline-flex items-center gap-2 rounded-full border border-[#332530]/25 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#332530]"
                    >
                      Select on Interactive Map
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {traditions.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setLocation(`/traditions/${encodeURIComponent(t.slug)}`)
                      }
                      className="group flex flex-col justify-between rounded-2xl border border-[#6d463b]/15 bg-[#fffaf1] p-4 text-left transition-all duration-300 hover:border-[#b96844] hover:shadow-lg hover:-translate-y-1 bcm-card-interactive"
                    >
                      <div className="flex gap-3 items-start">
                        <img
                          src={t.primaryHeroMedia?.directMediaUrl || getCultureImageFallback(t.traditionCategory || t.nameEn)}
                          alt={t.nameEn}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover border border-[#6d463b]/15 transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCultureImageFallback(t.traditionCategory || t.nameEn);
                          }}
                        />
                        <div>
                          <div className="eyebrow text-[9px] text-[#b96844]">
                            {t.traditionCategory}
                          </div>
                          <div className="mt-1 font-serif text-lg font-semibold text-[#332530] group-hover:text-[#b96844] transition-colors line-clamp-1">
                            {t.nameEn}
                          </div>
                          <div className="mt-0.5 text-xs text-[#6e5a55] line-clamp-1">
                            {t.statesRepresented.join(" · ")}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-[11px] font-bold text-[#9c5540] flex items-center justify-between border-t border-[#6d463b]/10 pt-2">
                        <span>Open Multi-Region Dossier</span>
                        <span>→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
          <>
          /* Row 1: Cover Image Card + The Practice + Original Voice */
          <div className="mt-10 grid gap-6 lg:grid-cols-[.88fr_1.12fr]">
            <div className="relative min-h-[540px] overflow-hidden rounded-[2rem] bg-[#2b2533] lg:min-h-[600px] shadow-2xl bcm-card-interactive">
              {activeCoverUrl ? (
                <img
                  src={activeCoverUrl}
                  alt={`Photograph representing ${active.titleEn} in ${active.displayLocationLabel}`}
                  onError={(e) => {
                    const fallback = getCultureImageFallback(active.category || active.titleEn);
                    if ((e.target as HTMLImageElement).src !== fallback) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2b2533] p-8 text-center">
                  <Eye size={28} className="text-[#efb167]" />
                  <div className="eyebrow mt-3 text-[#efb167]">
                    VERIFIED PHOTOGRAPH PENDING RIGHTS CLEARANCE
                  </div>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-white/65">
                    No open-license or practitioner-consented photograph is
                    attached to {active.titleEn} yet.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      openEnquiryModal(
                        "PLACE_CONTRIBUTION",
                        `Contribute Verified Media for ${active.titleEn}`,
                        "Share an openly licensed or practitioner-authorized photograph or recording with source attribution."
                      )
                    }
                    className="relative z-20 mt-4 rounded-full border border-[#ef9d45]/50 bg-[#ef9d45]/15 px-4 py-2 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#241a20]"
                  >
                    Contribute Verified Media
                  </button>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#211b28] via-[#211b28]/20 to-[#211b28]/25" />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-[#211b28]/80 px-3 py-2 backdrop-blur-xl">
                <Eye size={14} className="text-[#efb167]" />
                <span className="eyebrow text-[#f6e4d1]">
                  {isVerified
                    ? "PRACTITIONER-APPROVED · CONSENT VERIFIED"
                    : "REFERENCE INFORMATION · SOURCE ATTRIBUTED"}
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="eyebrow text-[#efb167]">
                  {active.displayLocationLabel.toUpperCase()}
                </div>
                <h3 className="display mt-3 text-5xl leading-none text-[#fbf5eb]">
                  {renderSplitEditorialTitle(active.titleEn)}
                </h3>
                <p className="mt-4 max-w-[360px] text-sm leading-6 text-white/70">
                  {active.subtitleEn || `${active.category} · ${active.unescoDomain}`}
                </p>
                {active.traditionSlug && (
                  <button
                    type="button"
                    onClick={() =>
                      setLocation(
                        `/traditions/${encodeURIComponent(active.traditionSlug!)}`
                      )
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ef9d45] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                  >
                    Open Multi-Region Tradition Dossier <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              <article className="rounded-[2rem] bg-[#e6ddd0] p-7 md:p-9">
                <SectionKicker light>THE PRACTICE</SectionKicker>
                <h3 className="display text-4xl leading-tight">
                  What does it mean to make something with place in it?
                </h3>
                <p className="mt-5 max-w-[570px] text-sm leading-7 text-[#5b4a4b]">
                  {active.practiceContextEn || active.summaryEn}
                </p>
                {active.sourceAttribution && (
                  <div className="mt-5 rounded-xl border border-[#6d463b]/15 bg-[#fff9ef]/80 px-4 py-3 text-xs leading-5 text-[#5b4a4b]">
                    <strong className="text-[#332530]">
                      {isVerified ? "Verification & Source:" : "Reference Source Attribution:"}
                    </strong>{" "}
                    {active.sourceAttribution}
                    {active.sourceUrl && (
                      <a
                        href={active.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 font-semibold text-[#9c5540] underline"
                      >
                        Official Source ↗
                      </a>
                    )}
                  </div>
                )}
                <div className="mt-7 flex flex-wrap gap-2">
                  {(active.tags && active.tags.length > 0
                    ? active.tags
                    : [active.category, active.stateName]
                  ).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#fff9ef] px-3 py-2 text-xs text-[#6e5551]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>

              <article className="rounded-[2rem] bg-[#202e39] p-7 text-[#f5eee4] md:p-9">
                <div className="flex items-start justify-between">
                  <div>
                    <SectionKicker>ORIGINAL VOICE</SectionKicker>
                    <h3 className="display text-4xl">
                      The record begins
                      <br />
                      <em className="text-[#8ed5bd]">with listening.</em>
                    </h3>
                  </div>
                  <AudioLines className="text-[#8ed5bd]" />
                </div>
                {active?.originalVoiceAudioUrl && active.canPlayAudioVideo && (
                  <audio
                    ref={audioRef}
                    src={active.originalVoiceAudioUrl}
                    onEnded={() => setPlaying(false)}
                  />
                )}
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ef9d45] text-[#2a1c25]"
                      aria-label={playing ? "Pause audio" : "Play audio"}
                    >
                      {playing ? (
                        <Pause size={17} />
                      ) : (
                        <Play size={17} fill="currentColor" />
                      )}
                    </button>
                    <div className="flex h-10 flex-1 items-end gap-1 overflow-hidden">
                      {Array.from({ length: 44 }).map((_, index) => (
                        <span
                          key={index}
                          className={`wave-bar min-w-[2px] flex-1 rounded-full bg-[#8ed5bd]/70 ${
                            playing ? "" : "[animation-play-state:paused]"
                          }`}
                          style={{
                            height: `${18 + ((index * 19) % 24)}%`,
                            animationDelay: `${index * 0.025}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="eyebrow text-white/40">00:00 / —</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="eyebrow text-[#8ed5bd]">
                      {(active?.originalVoiceLanguage || "MARATHI").toUpperCase()}{" "}
                      /{" "}
                      {isVerified
                        ? active?.translationPermitted
                          ? "CONTEXT APPROVED"
                          : "ORIGINAL ONLY"
                        : "TRANSLATION PENDING"}
                    </span>
                    <span className="eyebrow text-white/35">
                      {isVerified
                        ? `AUDIO: ${active?.publicRightsCard.audioVideoAccess}`
                        : "COLLECTION IN PROGRESS · VOICE RECORDING PENDING"}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-white/55">
                  {isVerified && active?.originalVoiceTranscriptMr
                    ? `“${active.originalVoiceTranscriptMr}”`
                    : "“Future recordings will be collected with practitioner consent. AI may assist transcription; human review remains required.”"}
                </p>
              </article>
            </div>
          </div>

          {/* Row 2: Heritage Vocabulary & Story Companion */}
          <div className="mt-20 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-[2rem] bg-[#fffaf1] p-7 md:p-9">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionKicker light>HERITAGE VOCABULARY</SectionKicker>
                  <h3 className="display text-4xl">Context matters.</h3>
                </div>
                <span className="eyebrow text-[#b96844]">
                  {isVerified ? "MARATHI / PRACTITIONER-APPROVED" : "MARATHI / REFERENCE VOCABULARY"}
                </span>
              </div>
              {active?.vocabulary && active.vocabulary.length > 0 ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {active.vocabulary.map((item) => (
                  <div
                    key={item.id || item.termRoman}
                    className="rounded-2xl border border-[#6d463b]/12 bg-[#f3eee4] p-4"
                  >
                    <div className="font-serif text-2xl text-[#9c5540]">
                      {item.termRoman}
                    </div>
                    <div className="mt-1 text-sm text-[#7e6960]">
                      {item.termDevanagari}
                    </div>
                    <div className="mt-7 text-xs leading-5 text-[#6e5a55]">
                      {item.meaningEn}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setToast(
                          `Term '${item.termRoman}' (${item.termDevanagari}): ${item.meaningEn}`
                        )
                      }
                      className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#b96844]"
                    >
                      Listen <AudioLines size={12} />
                    </button>
                  </div>
                ))}
              </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-[#6d463b]/20 bg-[#f3eee4] p-6 text-xs leading-6 text-[#6e5a55]">
                  Indigenous and regional terminology for{" "}
                  <strong>{active?.titleEn}</strong> is being compiled with
                  language reviewers. No vocabulary from unrelated traditions is
                  substituted.
                </div>
              )}
            </article>

            <article className="rounded-[2rem] bg-[#332530] p-7 text-[#f5eee4] md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionKicker>STORY COMPANION</SectionKicker>
                <div className="mb-3 flex flex-wrap gap-1">
                  {[
                    { id: "QA", label: "Guide" },
                    { id: "M3", label: "M3 · Companion" },
                    { id: "M1", label: "M1 · Subtitles" },
                    { id: "M2", label: "M2 · Synthetic" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMediationTab(tab.id as any)}
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] transition ${
                        mediationTab === tab.id
                          ? "bg-[#ef9d45] text-[#251922]"
                          : "bg-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <h3 className="display text-4xl leading-tight">
                Before you look,
                <br />
                <em className="text-[#efb167]">learn how to see.</em>
              </h3>

              {mediationTab !== "QA" && !active?.translationPermitted ? (
                <div className="mt-6 rounded-2xl border border-[#ef9d45]/30 bg-black/20 p-4 text-xs leading-6 text-[#efb167]">
                  Translation Scope on this record’s Rights Passport is set to{" "}
                  <strong>{active?.publicRightsCard.translationScope}</strong>.
                  The performance stays untranslated per practitioner decision.
                </div>
              ) : mediationTab === "M3" &&
                active?.mediationM3HumanStoryCompanionText ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="eyebrow text-[#8ed5bd]">
                    MODE 3 · HUMAN STORY COMPANION
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/80">
                    {active.mediationM3HumanStoryCompanionText}
                  </p>
                  {active.mediationM3NarratorCredit && (
                    <div className="mt-2 text-[11px] text-[#efb167]">
                      Narrator: {active.mediationM3NarratorCredit}
                    </div>
                  )}
                </div>
              ) : mediationTab === "M1" && active?.mediationM1SubtitlesEn ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="eyebrow text-[#efb167]">
                    MODE 1 · APPROVED SUBTITLES
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/80">
                    {active.mediationM1SubtitlesEn}
                  </p>
                </div>
              ) : mediationTab === "M2" &&
                active?.mediationM2SyntheticContextText ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="eyebrow text-white/50">
                    MODE 2 · SYNTHETIC CONTEXT NARRATION
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/80">
                    {active.mediationM2SyntheticContextText}
                  </p>
                </div>
              ) : null}

              <div className="mt-7 space-y-4">
                {(active?.storyCompanionPrompts &&
                active.storyCompanionPrompts.length >= 3
                  ? active.storyCompanionPrompts
                  : [
                      {
                        question: "What is this practice?",
                        answer:
                          "A living material and social knowledge system.",
                      },
                      {
                        question: "Why does it matter?",
                        answer: "Because continuity is made, not assumed.",
                      },
                      {
                        question: "What should visitors respect?",
                        answer: "Consent, context, and the right to say no.",
                      },
                    ]
                ).map(({ question, answer }) => (
                  <div
                    key={question}
                    className="border-b border-white/10 pb-4"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-white/85">
                      <span>{question}</span>
                      <ChevronRight size={14} className="text-[#efb167]" />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/48">
                      {answer}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* Row 3: Cultural Rights Passport & Cultural Provenance Record */}
          <div className="mt-20 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <article className="rounded-[2rem] bg-[#203742] p-7 text-[#f5eee4] md:p-9">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <SectionKicker>CULTURAL RIGHTS PASSPORT</SectionKicker>
                  <h3 className="display text-4xl">
                    Permission is part
                    <br />
                    of the story.
                  </h3>
                </div>
                <span className="passport-stamp">
                  {isVerified
                    ? `PASSPORT v${active?.publicRightsCard.version || 1} · VERIFIED`
                    : "RIGHTS INFORMATION NOT YET ESTABLISHED"}
                </span>
              </div>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {[
                  [
                    "Practitioner",
                    active?.creditedPractitionerLabel ||
                      "Community verification pending",
                  ],
                  ["Community", active?.communityLabel || "To be identified"],
                  [
                    "Educational use",
                    isVerified
                      ? active?.publicRightsCard.downloadReuse ||
                        "PERMISSION_REQUIRED"
                      : "Reference information (source attributed)",
                  ],
                  [
                    "Commercial use",
                    isVerified
                      ? active?.publicRightsCard.commercialUse || "PROHIBITED"
                      : "Permission required",
                  ],
                  [
                    "Media use",
                    isVerified
                      ? active?.publicRightsCard.audioVideoAccess || "PRIVATE"
                      : "Review required",
                  ],
                  [
                    "Withdrawal",
                    active?.publicRightsCard.withdrawalStatus === "ACTIVE"
                      ? "Always available"
                      : active?.publicRightsCard.withdrawalStatus ||
                        "Always available",
                  ],
                ].map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3"
                  >
                    <span className="text-xs text-white/45">{key}</span>
                    <span className="text-right text-xs font-semibold text-[#b8e4d2]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] bg-[#ded0bf] p-7 md:p-9">
              <div className="flex items-end justify-between">
                <div>
                  <SectionKicker light>
                    CULTURAL PROVENANCE RECORD
                  </SectionKicker>
                  <h3 className="display text-4xl text-[#332530]">
                    A chain of care.
                  </h3>
                </div>
                <span className="eyebrow text-[#a55b43]">
                  {isVerified ? "PRACTITIONER-APPROVED" : "COMMUNITY VERIFICATION PENDING"}
                </span>
              </div>
              <div className="relative mt-9 grid gap-4 sm:grid-cols-2">
                {provenanceVisualSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="relative flex items-center gap-3 rounded-xl bg-[#f5eee4]/65 p-3"
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        step.done
                          ? "bg-[#b96844] text-white"
                          : "border border-[#a55b43]/25 text-[#a55b43]"
                      }`}
                    >
                      {step.done ? <Check size={13} /> : index + 1}
                    </span>
                    <span className="text-xs font-semibold text-[#5e4747]">
                      {step.label}
                    </span>
                    {index < 5 && (
                      <span className="absolute -bottom-3 left-[25px] hidden h-3 w-px bg-[#a55b43]/25 sm:block" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-7 text-xs leading-5 text-[#715b56]">
                This is not blockchain. It is a human-readable record of how
                cultural material earns its way into public view.
              </p>
            </article>
          </div>
          </>
          )}
        </div>
      </section>

      {/* =====================================================================
          03 / LEARN & MEET (#learn)
          ===================================================================== */}
      <section
        id="learn"
        className="scroll-mt-28 bg-[#10121c] py-24 md:py-32"
      >
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <SectionKicker>03 / LEARN & MEET</SectionKicker>
              <h2 className="display max-w-[480px] text-5xl leading-[.98] md:text-7xl">
                Knowledge is an invitation.
              </h2>
              <p className="mt-6 max-w-[410px] text-sm leading-7 text-white/48">
                Not a product to extract. Not a spectacle to consume. A
                relationship to enter with humility.
              </p>
              <button
                type="button"
                className="button-lift mt-8 inline-flex items-center gap-3 rounded-full bg-[#ef9d45] px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#251922]"
                onClick={() =>
                  openEnquiryModal(
                    "WORKSHOP_ENQUIRY",
                    "Send a Moderated Learning Enquiry",
                    `Request a workshop, demonstration, or learning conversation connected to ${active?.titleEn || "regional heritage practices"}.`
                  )
                }
              >
                Send learning enquiry <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  "Workshop",
                  "Make alongside a practitioner",
                  "90 min · in place",
                  BookOpen,
                ],
                [
                  "Apprenticeship",
                  "Stay with the process",
                  "4–12 weeks · enquiry",
                  Sprout,
                ],
                [
                  "Demonstration",
                  "See the gesture up close",
                  "60 min · small group",
                  Eye,
                ],
                [
                  "Community session",
                  "Ask better questions together",
                  "Open format · moderated enquiry",
                  Users,
                ],
              ].map(([name, body, meta, Icon]) => {
                const IconComp = Icon as any;
                return (
                  <button
                    key={name as string}
                    type="button"
                    onClick={() =>
                      openEnquiryModal(
                        "WORKSHOP_ENQUIRY",
                        `${name as string} — Moderated Learning Enquiry`,
                        `${body as string} (${meta as string}). Enquiries are reviewed before contacting practitioners.`
                      )
                    }
                    className="group rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6 text-left transition hover:-translate-y-1 hover:border-[#ef9d45]/35 hover:bg-[#ef9d45]/[.06]"
                  >
                    <div className="flex items-start justify-between">
                      <IconCircle>
                        <IconComp size={17} />
                      </IconCircle>
                      <MoveUpRight
                        size={16}
                        className="text-white/25 transition group-hover:-translate-y-1 group-hover:text-[#efb167]"
                      />
                    </div>
                    <h3 className="mt-8 font-serif text-3xl text-white">
                      {name as string}
                    </h3>
                    <p className="mt-2 text-sm text-white/50">
                      {body as string}
                    </p>
                    <div className="eyebrow mt-7 text-[#efb167]">
                      {meta as string}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          04 / THE WIDER ECOSYSTEM (#ecosystem)
          ===================================================================== */}
      <section
        id="ecosystem"
        className="scroll-mt-28 bg-[#e6ddd0] py-24 text-[#332530] md:py-32"
      >
        <div className="container">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <SectionKicker light>04 / THE WIDER ECOSYSTEM</SectionKicker>
              <h2 className="display max-w-[690px] text-5xl leading-[.96] md:text-7xl">
                From hidden hands
                <br />
                to <em className="text-[#b96844]">shared futures.</em>
              </h2>
            </div>
            <p className="max-w-[300px] text-sm leading-6 text-[#6e5a55]">
              The map is a gateway — not the whole house.
            </p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <article className="group min-h-[420px] overflow-hidden rounded-[2rem] bg-[#6c3b43] p-7 text-white md:p-9">
              <div className="flex items-start justify-between">
                <span className="eyebrow text-[#f4bd84]">HERCRAFT</span>
                <Sparkles size={18} className="text-[#f4bd84]" />
              </div>
              <h3 className="display mt-32 text-4xl">
                Women-led
                <br />
                <em className="text-[#f4bd84]">knowledge & making.</em>
              </h3>
              <p className="mt-5 text-sm leading-6 text-white/60">
                Craft, story, learning, maker, and opportunity — connecting reference knowledge with practitioner-approved records.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f4bd84] px-4 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#20151a] hover:bg-[#f7cca0] transition"
                  onClick={() => setLocation("/hercraft")}
                >
                  Discover HerCraft Hub <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.12em] text-[#f4bd84]/90 hover:text-white"
                  onClick={() => {
                    const womenLed = records.find((r) => r.isWomenLed);
                    if (womenLed) {
                      setSelectedRecord(womenLed);
                      scrollTo("practice-profile");
                    }
                  }}
                >
                  Filter Map Records
                </button>
              </div>
            </article>
            <article className="group min-h-[420px] overflow-hidden rounded-[2rem] bg-[#203742] p-7 text-white md:p-9">
              <div className="flex items-start justify-between">
                <span className="eyebrow text-[#8ed5bd]">HIDDEN HANDS</span>
                <Users size={18} className="text-[#8ed5bd]" />
              </div>
              <h3 className="display mt-32 text-4xl">
                The work deserves
                <br />
                <em className="text-[#8ed5bd]">to be seen.</em>
              </h3>
              <p className="mt-5 text-sm leading-6 text-white/60">
                Nominate a practitioner. A nomination never automatically
                becomes a public profile.
              </p>
              <button
                type="button"
                className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#8ed5bd]"
                onClick={() =>
                  openEnquiryModal(
                    "PRACTITIONER_NOMINATION",
                    "Nominate a Practitioner or Tradition (Hidden Hands)",
                    "Suggest a practitioner or living tradition for documentation. Nominations never become public without field verification and signed consent."
                  )
                }
              >
                Nominate someone <ArrowRight size={14} />
              </button>
            </article>
            <article className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-[#f8f2e8] p-7 md:p-9">
              <img
                src={TEXTILE_IMAGE}
                alt="Traditional woven textile detail"
                className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply"
              />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="eyebrow text-[#a55b43]">
                    FAMILY MEMORY ARCHIVE
                  </span>
                  <Library size={18} className="text-[#a55b43]" />
                </div>
                <h3 className="display mt-32 text-4xl text-[#332530]">
                  Keep the
                  <br />
                  <em className="text-[#b96844]">small things.</em>
                </h3>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#a55b43]/35 bg-[#a55b43]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8e4731]">
                  Planned Phase-2 Module • No Active Cloud Vault Yet
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6e5a55]">
                  Planned private-first family memory vault for household photos, oral histories, and heirlooms (default visibility will always be PRIVATE).
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#a55b43]/40 bg-[#a55b43]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#8e4731] hover:bg-[#a55b43]/20 transition"
                  onClick={() =>
                    setToast(
                      "Planned Phase-2 Feature — The encrypted Family Memory Archive is on the roadmap and is not yet an active cloud vault. Default privacy is strictly PRIVATE."
                    )
                  }
                >
                  Planned Feature Status (Phase 2) <ArrowRight size={14} />
                </button>
              </div>
            </article>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#6d463b]/20 bg-[#f4ecdf] px-5 py-4">
            <div className="flex items-center gap-3">
              <Store size={18} className="text-[#b96844]" />
              <span className="text-sm font-medium text-[#332530]">
                Bharat Art-Mart & Practitioner Directory — Explore 12+ regional craft listings, seller storefronts, simulated checkout, and master practitioner workshops.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-[#b96844] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                onClick={() => setLocation("/art-mart")}
              >
                Open Art-Mart Catalogue <ArrowRight size={13} className="ml-1 inline" />
              </button>
              <button
                type="button"
                className="rounded-full border border-[#332530]/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#332530]"
                onClick={() => setLocation("/practitioners")}
              >
                Meet Practitioners →
              </button>
            </div>
          </div>

          {/* Spatial Industry-to-Art Collaboration Workflow (#industry-to-art) */}
          <div
            id="industry-to-art"
            className="mt-12 scroll-mt-28 rounded-[2rem] border border-[#6d463b]/15 bg-[#fffaf1] p-7 md:p-10"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow text-[#b96844]">
                  SPATIAL WORKFLOW · ENTREPRENEURSHIP & INDUSTRY-TO-ART COLLABORATION
                </div>
                <h3 className="display mt-2 text-3xl text-[#332530] md:text-5xl">
                  From Regional Material Streams to Consented Craft Collaborations
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLocation("/industry-to-art")}
                  className="rounded-full bg-[#332530] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fbf5eb]"
                >
                  Open Industry-to-Art Hub →
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/government-resources")}
                  className="rounded-full border border-[#332530]/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#332530]"
                >
                  Government & Partners →
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                {
                  stage: "STAGE 01 · MATERIAL",
                  title: "Regional Material & By-Product Streams",
                  region: "Assam, Gujarat, Maharashtra, Odisha",
                  detail:
                    "Traceable natural indigo & vegetable dyes, brass/bell-metal offcuts, handspun cotton, muga/eri yarn, and seasoned wood.",
                  badge: "Material Registry",
                },
                {
                  stage: "STAGE 02 · ARTISAN REQUEST",
                  title: "Cluster Material & Tooling Requests",
                  region: "Raghurajpur, Kolhapur, Bhuj, Majuli",
                  detail:
                    "Documented craft clusters specify raw-material grades, seasonal production windows, and fair-compensation minimums.",
                  badge: "Cluster Verified",
                },
                {
                  stage: "STAGE 03 · RIGHTS & APPROVAL",
                  title: "Consented Design & IP Agreement",
                  region: "Cultural Rights Passport Gate",
                  detail:
                    "Every collaboration verifies GI attribution, motif credit, and commercial-use consent before production begins.",
                  badge: "Rights Cleared",
                },
                {
                  stage: "STAGE 04 · RESULTING WORK",
                  title: "Traceable Craft Editions & Art-Mart",
                  region: "Pan-India & Institutional Partners",
                  detail:
                    "Completed editions carry full provenance logs linking the material source, artisan cluster, and community share.",
                  badge: "Moderated Enquiry",
                },
              ].map((node, idx) => (
                <div
                  key={node.stage}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#6d463b]/15 bg-[#f3eee4] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-[9px] text-[#b96844]">
                        {node.stage}
                      </span>
                      <span className="rounded-full bg-[#332530]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#332530]">
                        {node.badge}
                      </span>
                    </div>
                    <h4 className="mt-3 font-serif text-xl text-[#332530]">
                      {node.title}
                    </h4>
                    <div className="mt-1 text-xs font-semibold text-[#9c5540]">
                      {node.region}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#5b4a4b]">
                      {node.detail}
                    </p>
                  </div>
                  {idx < 3 && (
                    <ArrowRight
                      size={16}
                      className="mt-3 hidden self-end text-[#b96844] md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Government Resources & Ecosystem Organisations (#gov-resources) */}
          <div
            id="gov-resources"
            className="mt-10 scroll-mt-28 rounded-[2rem] border border-[#6d463b]/15 bg-[#332530] p-7 text-[#fbf5eb] md:p-10"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow text-[#efb167]">
                  OFFICIAL ARCHIVES, SCHEMES & CULTURAL INSTITUTIONS
                </div>
                <h3 className="display mt-2 text-3xl text-white md:text-5xl">
                  Government Resources & Cultural Ecosystem Partners
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLocation("/traditions")}
                className="rounded-full border border-[#ef9d45]/50 bg-[#ef9d45]/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#efb167]"
              >
                Inspect Citation Registry →
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  org: "Ministry of Culture, Government of India",
                  title: "National Mission on Cultural Mapping (NMCM)",
                  desc: "National mission documenting India's artistic heritage, village cultural directories, and artist registries.",
                  url: "https://culture.gov.in/offering/mission/national-mission-cultural-mapping-and-roadmap",
                },
                {
                  org: "Ministry of Culture · MGMD Portal",
                  title: "Mera Gaon Meri Dharohar",
                  desc: "Village-level cultural mapping initiative covering oral traditions, fairs, crafts, and local heritage across India.",
                  url: "https://culture.gov.in/meri-gaon-meri-dharohar-cms",
                },
                {
                  org: "Government of India National Portal",
                  title: "Indian Culture Portal (NVLI)",
                  desc: "Digital repository of archival manuscripts, museum collections, intangible heritage, and gazetteers.",
                  url: "https://indianculture.gov.in/",
                },
                {
                  org: "National Academy for Music, Dance & Drama",
                  title: "Sangeet Natak Akademi Library & Archive",
                  desc: "Apex performing-arts institution documenting classical, folk, and tribal dance, music, and theatre traditions.",
                  url: "https://www.sangeetnatak.gov.in/library",
                },
                {
                  org: "UNESCO 2003 Convention",
                  title: "UNESCO Intangible Cultural Heritage — India",
                  desc: "Official dossiers and archival media for India's 15 inscribed Intangible Cultural Heritage elements.",
                  url: "https://ich.unesco.org/en/state/india-IN",
                },
                {
                  org: "DPIIT, Ministry of Commerce & Industry",
                  title: "Geographical Indications (GI) Registry",
                  desc: "Official registry of GI-certified handicrafts, handlooms, agricultural, and food traditions across Indian states.",
                  url: "https://ipindia.gov.in/",
                },
              ].map((res) => (
                <a
                  key={res.title}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col justify-between rounded-2xl border border-white/12 bg-white/[.05] p-5 transition hover:border-[#ef9d45] hover:bg-white/[.09]"
                >
                  <div>
                    <div className="eyebrow text-[9px] text-[#8ed5bd]">
                      {res.org}
                    </div>
                    <h4 className="mt-2 font-serif text-xl text-white">
                      {res.title}
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-white/70">
                      {res.desc}
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#efb167]">
                    Visit Official Portal <MoveUpRight size={13} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          05 / AI WITH BOUNDARIES (#governance)
          ===================================================================== */}
      <section
        id="governance"
        className="scroll-mt-28 bg-[#10121c] py-24 md:py-32"
      >
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <SectionKicker>05 / AI WITH BOUNDARIES</SectionKicker>
              <h2 className="display max-w-[510px] text-5xl leading-[.98] md:text-7xl">
                People remain the <em className="text-[#efb167]">authority.</em>
              </h2>
              <p className="mt-6 max-w-[430px] text-sm leading-7 text-white/48">
                AI can process information. It cannot replace practitioner,
                community, consent, cultural interpretation, human verification,
                or rights decisions.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[#57c5a9]/25 bg-[#163239] p-7">
                <div className="eyebrow text-[#8ed5bd]">AI MAY ASSIST</div>
                <ul className="mt-7 space-y-4">
                  {[
                    "Transcription",
                    "Translation drafts",
                    "Search & categorization",
                    "Metadata & organization",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/75"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#57c5a9]/15 text-[#8ed5bd]">
                        <Check size={13} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.5rem] border border-[#ef9d45]/25 bg-[#3b2730] p-7">
                <div className="eyebrow text-[#efb167]">
                  AI DOES NOT REPLACE
                </div>
                <ul className="mt-7 space-y-4">
                  {[
                    "Practitioner authority",
                    "Community review",
                    "Consent",
                    "Cultural interpretation",
                    "Rights decisions",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/75"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ef9d45]/15 text-[#efb167]">
                        <ShieldCheck size={13} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-20 rounded-[2rem] border border-white/10 bg-[#171b29] p-7 md:p-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="eyebrow text-[#efb167]">
                  COMMUNITY GOVERNANCE
                </div>
                <h3 className="display mt-3 text-4xl md:text-5xl">
                  Document with care. Publish with permission.
                </h3>
              </div>
              <button
                type="button"
                className="button-lift inline-flex items-center gap-2 rounded-full border border-[#efb167]/40 px-5 py-3 text-[11px] font-bold uppercase tracking-[.14em] text-[#efb167]"
                onClick={() => setLocation("/admin")}
              >
                View the workflow <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-10 grid gap-2 md:grid-cols-7">
              {[
                "Document",
                "Consent",
                "Community review",
                "Verification",
                "Practitioner approval",
                "Publish",
                "Update / withdraw",
              ].map((step, index) => (
                <div
                  key={step}
                  className="relative rounded-xl border border-white/8 bg-white/[.03] p-4"
                >
                  <div className="eyebrow text-[#efb167]">0{index + 1}</div>
                  <div className="mt-5 text-sm font-semibold text-white/78">
                    {step}
                  </div>
                  {index < 6 && (
                    <ArrowRight
                      size={13}
                      className="absolute -right-3 top-1/2 z-10 hidden text-[#efb167] md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          06 / IMPACT & RESEARCH
          ===================================================================== */}
      <section className="bg-[#1a2131] py-24 md:py-28">
        <div className="container">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end">
            <div>
              <SectionKicker>06 / IMPACT & RESEARCH</SectionKicker>
              <h2 className="display max-w-[710px] text-5xl leading-[.96] md:text-7xl">
                Make the future
                <br />
                <em className="text-[#8ed5bd]">countable, later.</em>
              </h2>
            </div>
            <DemoBadge isVerified={fieldVerifiedRecordsCount > 0} />
          </div>
          <div className="grid gap-8 pt-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="eyebrow text-white/35">DATABASE COVERAGE & VERIFICATION STATUS</div>
              <div className="mt-5 font-serif text-7xl text-[#efb167]">
                {fieldVerifiedRecordsCount > 0
                  ? String(fieldVerifiedRecordsCount)
                  : "—"}
              </div>
              <p className="mt-4 max-w-[330px] text-sm leading-6 text-white/48">
                {fieldVerifiedRecordsCount > 0
                  ? `${fieldVerifiedRecordsCount} field-verified record(s) have passed informed consent, review, and sustained practitioner approval.`
                  : `${mapStats?.totalLocations || 175} geographic places indexed across all 36 States & Union Territories, ${records.length || 68} published cultural records (${fieldVerifiedRecordsCount} practitioner-approved), and ${(events?.length || 4)} upcoming cultural events.`}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <div className="eyebrow text-[#8ed5bd]">FUTURE FIELDWORK</div>
                <div className="mt-8 text-2xl font-semibold text-white/80">
                  Documented voices
                </div>
                <div className="mt-2 text-xs text-white/38">
                  counted only after consent
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <div className="eyebrow text-[#8ed5bd]">FUTURE LEARNING</div>
                <div className="mt-8 text-2xl font-semibold text-white/80">
                  Open pathways
                </div>
                <div className="mt-2 text-xs text-white/38">
                  measured by relationships
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <div className="eyebrow text-[#8ed5bd]">FUTURE GOVERNANCE</div>
                <div className="mt-8 text-2xl font-semibold text-white/80">
                  Trusted records
                </div>
                <div className="mt-2 text-xs text-white/38">
                  updated with accountability
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <div className="eyebrow text-[#8ed5bd]">FUTURE OPPORTUNITY</div>
                <div className="mt-8 text-2xl font-semibold text-white/80">
                  Ethical support
                </div>
                <div className="mt-2 text-xs text-white/38">
                  never reduced to a transaction
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0b0d14] py-10">
        <div className="container">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[#ef9d45]/60 text-[#efb167]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ef9d45]" />
                </span>
                <div className="leading-none">
                  <span className="block text-[11px] font-semibold tracking-[.22em] text-white/70">
                    BHARAT
                  </span>
                  <span className="block font-serif text-lg text-[#efb167]">
                    CultureMap
                  </span>
                </div>
              </div>
              <p className="mt-5 max-w-[380px] text-xs leading-5 text-white/35">
                Preserving voices. Connecting people. Sustaining living culture.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white/38">
              <button
                type="button"
                onClick={() => scrollTo("culturemap")}
                className="hover:text-[#efb167]"
              >
                Explore
              </button>
              <button
                type="button"
                onClick={() => scrollTo("governance")}
                className="hover:text-[#efb167]"
              >
                Governance
              </button>
              <button
                type="button"
                onClick={() => setLocation("/admin")}
                className="hover:text-[#efb167]"
              >
                Admin Panel
              </button>
              <button
                type="button"
                onClick={() =>
                  openEnquiryModal(
                    "GENERAL_CONTACT",
                    "Contact Bharat CultureMap",
                    "Share a research collaboration, source attribution update, or community governance question."
                  )
                }
                className="hover:text-[#efb167]"
              >
                Contact
              </button>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/8 pt-5 text-[10px] uppercase tracking-[.12em] text-white/25 md:flex-row">
            <span>© 2026 Bharat CultureMap · Living Cultural Atlas & Heritage Registry</span>
            <span>
              {fieldVerifiedRecordsCount > 0
                ? `${fieldVerifiedRecordsCount} practitioner-approved record(s) · Reference entries include source attribution`
                : "Reference entries include source attribution · Community verification in progress"}
            </span>
          </div>
        </div>
      </footer>

      {toast && (
        <div
          role="status"
          className="glass fixed bottom-5 left-1/2 z-[1300] flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 text-xs text-white/80 shadow-2xl"
        >
          <CircleHelp size={16} className="shrink-0 text-[#efb167]" />
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast("")}
            aria-label="Close notification"
            className="ml-2 text-white/40 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Moderated Community Enquiry / Nomination Modal */}
      {enquiryModal.open && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#151927] p-6 text-white shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-[#efb167]">
                  MODERATED COMMUNITY FLOW
                </div>
                <h3 className="mt-2 font-serif text-3xl text-white">
                  {enquiryModal.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-white/65">
                  {enquiryModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEnquiryModal((prev) => ({ ...prev, open: false }))
                }
                className="rounded-full border border-white/15 p-2 text-white/60 hover:text-white"
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEnquirySubmit} className="mt-6 space-y-4">
              <div>
                <label className="eyebrow block text-[10px] text-white/60">
                  YOUR NAME OR ORGANIZATION
                </label>
                <input
                  required
                  value={enqName}
                  onChange={(e) => setEnqName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#ef9d45]"
                />
              </div>
              <div>
                <label className="eyebrow block text-[10px] text-white/60">
                  EMAIL OR PHONE CONTACT
                </label>
                <input
                  required
                  value={enqContact}
                  onChange={(e) => setEnqContact(e.target.value)}
                  placeholder="name@example.org or +91-..."
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#ef9d45]"
                />
              </div>
              <div>
                <label className="eyebrow block text-[10px] text-white/60">
                  DETAILS & CONTEXT
                </label>
                <textarea
                  required
                  rows={4}
                  value={enqMessage}
                  onChange={(e) => setEnqMessage(e.target.value)}
                  placeholder="Describe your learning interest, practitioner nomination, or source contribution…"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#ef9d45]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEnquiryModal((prev) => ({ ...prev, open: false }))
                  }
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enqSubmitting}
                  className="rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                >
                  {enqSubmitting ? "Submitting…" : "Submit Moderated Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;
