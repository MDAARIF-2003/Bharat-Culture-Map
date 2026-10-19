import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  ExternalLink,
  FileCheck2,
  Filter,
  Globe2,
  Image as ImageIcon,
  Info,
  Layers,
  MapPin,
  MessageSquarePlus,
  Music,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  MapView,
  type GeoMapMarker,
  type MapController,
} from "@/components/Map";
import { apiClient } from "@/lib/api";
import {
  EVIDENCE_STATUSES,
  TRADITION_DIRECTORY_CATEGORIES,
  type EvidenceStatus,
  type TraditionDirectoryCategory,
} from "@shared/const";
import type {
  MediaAssetItem,
  TraditionDetail,
  TraditionDirectoryPayload,
  TraditionSummary,
} from "@shared/contracts";

function EvidenceBadge({
  status,
  label,
}: {
  status: EvidenceStatus;
  label: string;
}) {
  const isOfficial = status === "OFFICIAL_INSTITUTIONAL";
  const isPractitioner = status === "PRACTITIONER_CONFIRMED";
  return (
    <span
      className={`eyebrow inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] ${
        isPractitioner
          ? "border-[#57c5a9]/45 bg-[#57c5a9]/15 text-[#8ed5bd]"
          : isOfficial
            ? "border-[#ef9d45]/45 bg-[#ef9d45]/15 text-[#efb167]"
            : "border-white/20 bg-white/10 text-white/80"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPractitioner
            ? "bg-[#57c5a9]"
            : isOfficial
              ? "bg-[#ef9d45]"
              : "bg-white/60"
        }`}
      />
      {label}
    </span>
  );
}

function NeutralTraditionPlaceholder({
  name,
  category,
  subcategory,
  onContribute,
}: {
  name: string;
  category: string;
  subcategory?: string;
  onContribute?: () => void;
}) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[radial-gradient(circle_at_50%_30%,rgba(239,157,69,0.12),rgba(16,20,34,0.95))] p-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-[#ef9d45]/35 bg-[#ef9d45]/10 text-[#efb167]">
        <Compass size={20} />
      </div>
      <div className="eyebrow mt-3 text-[10px] text-[#efb167]">
        {category}
        {subcategory ? ` · ${subcategory}` : ""}
      </div>
      <div className="mt-1 font-serif text-lg text-white">{name}</div>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-white/55">
        Verified open-license or practitioner-consented photography for this
        tradition is awaiting rights clearance. No unrelated fallback image is
        substituted.
      </p>
      {onContribute && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContribute();
          }}
          className="mt-3 rounded-full border border-[#ef9d45]/45 bg-[#ef9d45]/15 px-3.5 py-1.5 text-[11px] font-semibold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#241a20]"
        >
          Contribute Verified Media
        </button>
      )}
    </div>
  );
}

function MediaAttributionCard({ asset }: { asset: MediaAssetItem }) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-[#0d111b]/90 p-3.5 text-xs text-white/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow text-[9px] text-[#8ed5bd]">
          VERIFIED MEDIA ATTRIBUTION · {asset.rightsStatus}
        </span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-[#efb167]">
          {asset.licenseIdentifier}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-white/85">
        {asset.attributionText}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/55">
        {asset.creatorOrPerformer && (
          <span>
            <strong className="text-white/75">Creator / Performer:</strong>{" "}
            {asset.creatorOrPerformer}
          </span>
        )}
        <span>
          <strong className="text-white/75">Source:</strong>{" "}
          {asset.sourceOrganisation}
        </span>
        <span>
          <strong className="text-white/75">Retrieved:</strong>{" "}
          {asset.retrievalDate}
        </span>
        {asset.sourcePageUrl && (
          <a
            href={asset.sourcePageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#efb167] underline"
          >
            Source & Rights Record <ExternalLink size={11} />
          </a>
        )}
        {asset.licenseUrl && (
          <a
            href={asset.licenseUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#8ed5bd] underline"
          >
            License Terms <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function TraditionExplorer() {
  const params = useParams<{ slug?: string }>();
  const [, setLocation] = useLocation();
  const slugParam = params?.slug ? decodeURIComponent(params.slug) : null;

  if (slugParam) {
    return <TraditionDetailView slug={slugParam} />;
  }
  return <TraditionDirectoryView />;
}

function TraditionDirectoryView() {
  const [, setLocation] = useLocation();
  const mapControllerRef = useRef<MapController | null>(null);

  const initialSearch = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return {
      q: sp.get("q") || "",
      category:
        (sp.get("category") as TraditionDirectoryCategory | "All") || "All",
      stateId: sp.get("stateId") || "All",
      language: sp.get("language") || "All",
      evidenceStatus:
        (sp.get("evidenceStatus") as EvidenceStatus | "ALL") || "ALL",
      hasVerifiedMedia: sp.get("hasVerifiedMedia") === "true",
    };
  }, []);

  const [q, setQ] = useState(initialSearch.q);
  const [selectedCategory, setSelectedCategory] = useState<
    TraditionDirectoryCategory | "All"
  >(initialSearch.category);
  const [selectedStateId, setSelectedStateId] = useState(initialSearch.stateId);
  const [selectedLanguage, setSelectedLanguage] = useState(
    initialSearch.language
  );
  const [selectedEvidence, setSelectedEvidence] = useState<
    EvidenceStatus | "ALL"
  >(initialSearch.evidenceStatus);
  const [onlyVerifiedMedia, setOnlyVerifiedMedia] = useState(
    initialSearch.hasVerifiedMedia
  );

  const [directoryData, setDirectoryData] =
    useState<TraditionDirectoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightedTradition, setHighlightedTradition] =
    useState<TraditionSummary | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (selectedCategory !== "All") sp.set("category", selectedCategory);
    if (selectedStateId !== "All") sp.set("stateId", selectedStateId);
    if (selectedLanguage !== "All") sp.set("language", selectedLanguage);
    if (selectedEvidence !== "ALL") sp.set("evidenceStatus", selectedEvidence);
    if (onlyVerifiedMedia) sp.set("hasVerifiedMedia", "true");
    const qs = sp.toString();
    const nextUrl = `/traditions${qs ? `?${qs}` : ""}`;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }

    let mounted = true;
    setLoading(true);
    setError("");
    apiClient
      .queryPublicTraditions({
        q: q.trim() || undefined,
        traditionCategory: selectedCategory,
        stateId: selectedStateId,
        language: selectedLanguage,
        evidenceStatus: selectedEvidence,
        hasVerifiedMedia: onlyVerifiedMedia,
        pageSize: 50,
      })
      .then((res) => {
        if (!mounted) return;
        setDirectoryData(res);
        if (
          highlightedTradition &&
          !res.traditions.some((t) => t.id === highlightedTradition.id)
        ) {
          setHighlightedTradition(null);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Failed to load Tradition Explorer directory.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [
    q,
    selectedCategory,
    selectedStateId,
    selectedLanguage,
    selectedEvidence,
    onlyVerifiedMedia,
  ]);

  const traditions = directoryData?.traditions || [];

  const mapMarkers: GeoMapMarker[] = useMemo(() => {
    const list: GeoMapMarker[] = [];
    const targetTraditions = highlightedTradition
      ? [highlightedTradition]
      : traditions;

    for (const trad of targetTraditions) {
      for (const place of trad.places) {
        list.push({
          id: `tp-${trad.id}-${place.id}`,
          position: place.center,
          title: `${trad.nameEn} — ${place.locationNameEn}, ${place.stateName} (${place.relationshipRole.replace(/_/g, " ")})`,
          badgeText: `${trad.nameEn} · ${place.locationNameEn}`,
          variant:
            trad.evidenceStatus === "PRACTITIONER_CONFIRMED"
              ? "verified-record"
              : "demo-record",
          selected: highlightedTradition?.id === trad.id,
          onClick: () => {
            setHighlightedTradition(trad);
            mapControllerRef.current?.panTo(place.center, 8);
          },
        });
      }
    }
    return list;
  }, [traditions, highlightedTradition]);

  const resetFilters = () => {
    setQ("");
    setSelectedCategory("All");
    setSelectedStateId("All");
    setSelectedLanguage("All");
    setSelectedEvidence("ALL");
    setOnlyVerifiedMedia(false);
    setHighlightedTradition(null);
    mapControllerRef.current?.panTo({ lat: 21.15, lng: 79.0 }, 5);
  };

  return (
    <div className="min-h-screen bg-[#10121c] text-[#fbf5eb]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-[1200] border-b border-white/10 bg-[#111522]/95 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/85 hover:border-[#ef9d45] hover:text-white"
            >
              <ArrowLeft size={14} />
              Home & CultureMap
            </button>
            <span className="hidden text-white/25 sm:inline">|</span>
            <span className="font-serif text-lg text-[#efb167]">
              Bharat Tradition Explorer
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLocation("/places/loc-country-in")}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:border-[#ef9d45]/50 hover:text-[#efb167]"
            >
              Places Directory
            </button>
            <button
              type="button"
              onClick={() => setLocation("/calendar")}
              className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-3 py-1.5 text-xs font-semibold text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
            >
              Cultural Calendar
            </button>
            <button
              type="button"
              onClick={() => setLocation("/trip-planner")}
              className="rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3 py-1.5 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#241a20]"
            >
              Trip Planner
            </button>
            <button
              type="button"
              onClick={() => setLocation("/admin")}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:border-[#ef9d45]"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8 md:py-12">
        {/* Hero Header */}
        <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,#171c2d_0%,#111522_65%,#1d1726_100%)] p-6 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="eyebrow text-[#efb167]">
                PAN-INDIA LIVING HERITAGE DIRECTORY · MULTI-REGION & SOURCE-VERIFIED
              </div>
              <h1 className="display mt-3 text-4xl text-[#fbf5eb] md:text-6xl">
                Explore India’s Living Traditions
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/70 md:text-base">
                Browse documented traditions across classical and folk dance,
                regional music, folk theatre and puppetry, handloom and crafts,
                painting and sculpture, cuisine, festivals, and oral knowledge
                systems. Every entry links its multi-state geographical
                associations, structured institutional sources, and individually
                licensed media credits.
              </p>
            </div>

            {directoryData && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#ef9d45]/30 bg-[#ef9d45]/10 px-4 py-3">
                  <div className="font-serif text-2xl text-[#efb167]">
                    {directoryData.facets.totalPublished}
                  </div>
                  <div className="eyebrow mt-0.5 text-[9px] text-white/65">
                    Documented Traditions
                  </div>
                </div>
                <div className="rounded-2xl border border-[#57c5a9]/30 bg-[#57c5a9]/10 px-4 py-3">
                  <div className="font-serif text-2xl text-[#8ed5bd]">
                    {directoryData.facets.multiRegionCount}
                  </div>
                  <div className="eyebrow mt-0.5 text-[9px] text-white/65">
                    Multi-Region Traditions
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 sm:col-span-1">
                  <div className="font-serif text-2xl text-white">
                    {directoryData.facets.states.length}
                  </div>
                  <div className="eyebrow mt-0.5 text-[9px] text-white/65">
                    States & UTs Linked
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search & Multi-Facet Filter Bar */}
          <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-[#0e121d]/90 p-4 md:grid-cols-12">
            <div className="relative md:col-span-4">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#efb167]"
              />
              <input
                type="search"
                aria-label="Search traditions by name, native script, place or language"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, alternative spelling, place, GI tag…"
                className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-[#ef9d45]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by tradition category"
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value as TraditionDirectoryCategory | "All"
                  )
                }
                className="w-full rounded-xl border border-white/15 bg-[#151a2a] px-3 py-2.5 text-xs text-white outline-none focus:border-[#ef9d45]"
              >
                <option value="All">All 9 Heritage Categories</option>
                {TRADITION_DIRECTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by State or Union Territory"
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#151a2a] px-3 py-2.5 text-xs text-white outline-none focus:border-[#ef9d45]"
              >
                <option value="All">All States / UTs</option>
                {(directoryData?.facets.states || []).map((st) => (
                  <option key={st.stateId} value={st.stateId}>
                    {st.stateName} ({st.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#151a2a] px-3 py-2.5 text-xs text-white outline-none focus:border-[#ef9d45]"
              >
                <option value="All">All Languages</option>
                {(directoryData?.facets.languages || []).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 md:col-span-1">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-white/75 hover:border-[#ef9d45] hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Category Quick Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                selectedCategory === "All"
                  ? "bg-[#ef9d45] font-bold text-[#241a20]"
                  : "border border-white/12 bg-white/5 text-white/75 hover:border-[#ef9d45]/50"
              }`}
            >
              All Categories
            </button>
            {TRADITION_DIRECTORY_CATEGORIES.map((cat) => {
              const count =
                directoryData?.facets.categories.find((c) => c.category === cat)
                  ?.count ?? 0;
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(active ? "All" : cat)
                  }
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    active
                      ? "bg-[#ef9d45] font-bold text-[#241a20]"
                      : "border border-white/12 bg-white/5 text-white/75 hover:border-[#ef9d45]/50"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Spatial Multi-Region Map + Selected Tradition Relationship Bar */}
        <section className="mt-8 grid gap-6 rounded-[2rem] border border-white/10 bg-[#151927] p-5 md:p-7 lg:grid-cols-[1.15fr_.85fr]">
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#0e1320]">
            <MapView
              className="h-full w-full"
              center={{ lat: 21.15, lng: 79.0 }}
              zoom={5}
              markers={mapMarkers}
              onMapReady={(ctrl) => {
                mapControllerRef.current = ctrl;
              }}
            />
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#101421] p-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow text-[10px] text-[#8ed5bd]">
                  SPATIAL TRADITION-TO-PLACE RELATIONSHIPS
                </span>
                {highlightedTradition && (
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightedTradition(null);
                      mapControllerRef.current?.panTo(
                        { lat: 21.15, lng: 79.0 },
                        5
                      );
                    }}
                    className="text-xs text-[#efb167] underline"
                  >
                    Show all {traditions.length} traditions on map
                  </button>
                )}
              </div>

              {highlightedTradition ? (
                <div className="mt-3">
                  <h2 className="font-serif text-2xl text-white">
                    {highlightedTradition.nameEn}{" "}
                    {highlightedTradition.nameNative && (
                      <span className="text-base text-[#efb167]">
                        ({highlightedTradition.nameNative})
                      </span>
                    )}
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-white/70">
                    {highlightedTradition.summary}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="eyebrow text-[10px] text-[#efb167]">
                      DOCUMENTED GEOGRAPHICAL ASSOCIATIONS (
                      {highlightedTradition.places.length})
                    </div>
                    {highlightedTradition.places.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {p.locationNameEn}, {p.stateName}
                          </div>
                          {p.regionalVariantName && (
                            <div className="text-[11px] text-[#8ed5bd]">
                              {p.regionalVariantName}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setLocation(
                              `/places/${encodeURIComponent(p.locationId)}`
                            )
                          }
                          className="text-xs font-semibold text-[#efb167] hover:underline"
                        >
                          Open Place →
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLocation(
                        `/traditions/${encodeURIComponent(
                          highlightedTradition.slug
                        )}`
                      )
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                  >
                    Open Full Tradition Dossier <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <h2 className="font-serif text-2xl text-white">
                    Multi-Region Cultural Geography
                  </h2>
                  <p className="text-xs leading-6 text-white/65">
                    Living traditions frequently span multiple districts and
                    states—such as Chhau Dance across Odisha, Jharkhand, and
                    West Bengal, or GI-certified Kolhapuri Chappal clusters
                    across Maharashtra and Karnataka. Click any marker on the
                    map or select “Highlight on Map” on a card below to inspect
                    all of a tradition’s documented regional associations.
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/[.03] p-3.5 text-xs text-white/75">
                    <div className="font-semibold text-[#efb167]">
                      Active Filter Summary
                    </div>
                    <div className="mt-1 text-white/60">
                      Showing <strong>{traditions.length}</strong> documented
                      traditions across{" "}
                      <strong>{mapMarkers.length}</strong> verified place
                      connections.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/50">
              Coordinates reflect administrative centers or documented practice
              clusters. Private artisan workshops remain protected by the
              Cultural Rights Passport.
            </div>
          </div>
        </section>

        {/* Directory Results Grid */}
        <section className="mt-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-96 animate-pulse rounded-3xl border border-white/10 bg-[#151927] p-5"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center">
              <h3 className="font-serif text-2xl text-white">
                Could Not Load Tradition Directory
              </h3>
              <p className="mt-2 text-sm text-white/70">{error}</p>
            </div>
          ) : traditions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#ef9d45]/40 bg-[#151927] p-12 text-center">
              <Compass size={32} className="mx-auto text-[#efb167]" />
              <h3 className="mt-3 font-serif text-3xl text-white">
                No Matching Traditions Found
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-white/65">
                No documented traditions matched your current filter combination.
                We never substitute unrelated cultural records when a filter has
                zero matches.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                >
                  Reset All Filters
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/admin")}
                  className="rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold text-white/85 hover:border-[#ef9d45]"
                >
                  Add Tradition in Admin Panel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {traditions.map((trad) => {
                const hero = trad.primaryHeroMedia;
                const hasValidImage =
                  hero &&
                  hero.directMediaUrl &&
                  !brokenImages[trad.id];

                return (
                  <article
                    key={trad.id}
                    className={`group flex flex-col justify-between overflow-hidden rounded-[1.75rem] border transition ${
                      highlightedTradition?.id === trad.id
                        ? "border-[#ef9d45] bg-[#1a1f33]"
                        : "border-white/10 bg-[#151927] hover:border-[#ef9d45]/50"
                    }`}
                  >
                    <div>
                      {/* Media Header or Honest Neutral Placeholder */}
                      <div className="relative h-56 w-full overflow-hidden bg-[#0e121d]">
                        {hasValidImage ? (
                          <>
                            <img
                              src={hero!.directMediaUrl!}
                              alt={hero!.altText || trad.nameEn}
                              onError={() =>
                                setBrokenImages((prev) => ({
                                  ...prev,
                                  [trad.id]: true,
                                }))
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#151927] via-transparent to-black/35" />
                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-[10px] text-white/80">
                              <span className="truncate rounded-full bg-black/65 px-2.5 py-1 backdrop-blur-sm">
                                {hero!.licenseIdentifier} ·{" "}
                                {hero!.creatorOrPerformer ||
                                  hero!.sourceOrganisation}
                              </span>
                              <span className="rounded-full bg-[#57c5a9]/20 px-2.5 py-1 font-semibold text-[#8ed5bd] backdrop-blur-sm">
                                {trad.mediaCount} Media
                              </span>
                            </div>
                          </>
                        ) : (
                          <NeutralTraditionPlaceholder
                            name={trad.nameEn}
                            category={trad.traditionCategory}
                            subcategory={trad.subcategory}
                          />
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="eyebrow text-[10px] text-[#efb167]">
                            {trad.traditionCategory}
                          </span>
                          <EvidenceBadge
                            status={trad.evidenceStatus}
                            label={trad.evidenceStatusLabel}
                          />
                        </div>

                        <h2 className="mt-3 font-serif text-2xl text-white">
                          <button
                            type="button"
                            onClick={() =>
                              setLocation(
                                `/traditions/${encodeURIComponent(trad.slug)}`
                              )
                            }
                            className="text-left hover:text-[#efb167]"
                          >
                            {trad.nameEn}
                          </button>
                        </h2>

                        {(trad.nameNative ||
                          trad.alternativeNames.length > 0) && (
                          <div className="mt-1 text-xs text-white/55">
                            {trad.nameNative && (
                              <span className="mr-2 font-serif text-sm text-[#efb167]">
                                {trad.nameNative}
                              </span>
                            )}
                            {trad.alternativeNames.length > 0 && (
                              <span>
                                Also: {trad.alternativeNames.slice(0, 3).join(", ")}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="mt-3 line-clamp-3 text-xs leading-6 text-white/70">
                          {trad.summary}
                        </p>

                        {/* Multi-Region Places Pills */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {trad.places.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() =>
                                setLocation(
                                  `/places/${encodeURIComponent(p.locationId)}`
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 hover:border-[#ef9d45] hover:text-[#efb167]"
                            >
                              <MapPin size={10} className="text-[#efb167]" />
                              {p.locationNameEn}, {p.stateName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 bg-black/15 px-5 py-3.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-white/55">
                        <span>
                          {trad.sourceCount} Verified Source
                          {trad.sourceCount === 1 ? "" : "s"} ·{" "}
                          {trad.languages.slice(0, 2).join(", ")}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setHighlightedTradition(trad);
                              if (trad.places[0]) {
                                mapControllerRef.current?.panTo(
                                  trad.places[0].center,
                                  7
                                );
                              }
                            }}
                            className="text-xs text-[#8ed5bd] hover:underline"
                          >
                            Map ({trad.places.length})
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setLocation(
                                `/traditions/${encodeURIComponent(trad.slug)}`
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#efb167] hover:underline"
                          >
                            Explore <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TraditionDetailView({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const mapControllerRef = useRef<MapController | null>(null);
  const [tradition, setTradition] = useState<TraditionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Moderated Enquiry / Practitioner Contribution Modal
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setBanner("");
    apiClient
      .getPublicTraditionBySlug(slug)
      .then(({ tradition: detail }) => {
        if (!mounted) return;
        setTradition(detail);
        if (detail.places[0]) {
          mapControllerRef.current?.panTo(
            detail.places[0].center,
            detail.places.length > 1 ? 6 : 8
          );
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err?.message || "Tradition not found or not cleared for public display."
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug]);

  const mapMarkers: GeoMapMarker[] = useMemo(() => {
    if (!tradition) return [];
    return tradition.places.map((p) => ({
      id: `detail-place-${p.id}`,
      position: p.center,
      title: `${p.locationNameEn}, ${p.stateName} (${p.relationshipRole.replace(
        /_/g,
        " "
      )})`,
      badgeText: `${p.locationNameEn} · ${p.stateName}`,
      variant: p.isPrimary ? "verified-record" : "demo-record",
      onClick: () => setLocation(`/places/${encodeURIComponent(p.locationId)}`),
    }));
  }, [tradition, setLocation]);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradition) return;
    setSubmitting(true);
    try {
      await apiClient.submitCommunityEnquiry({
        enquiryType: "WORKSHOP_ENQUIRY",
        culturalRecordId: tradition.linkedRecords[0]?.id || null,
        locationId: tradition.places[0]?.locationId || null,
        senderName,
        senderContact,
        message: `[Tradition: ${tradition.nameEn}] ${enquiryMessage}`,
      });
      setSenderName("");
      setSenderContact("");
      setEnquiryMessage("");
      setShowEnquiry(false);
      setBanner(
        `Your moderated enquiry regarding ${tradition.nameEn} has been logged for community coordinator review.`
      );
    } catch (err: any) {
      setBanner(err?.message || "Could not submit enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#10121c] p-12 text-center text-white/70">
        Loading verified tradition dossier…
      </div>
    );
  }

  if (error || !tradition) {
    return (
      <div className="min-h-screen bg-[#10121c] p-12 text-center text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-400/30 bg-red-500/10 p-10">
          <h1 className="font-serif text-3xl">Tradition Record Not Found</h1>
          <p className="mt-3 text-sm text-white/70">
            {error ||
              "This tradition does not exist or is restricted. Bharat CultureMap never falls back to an unrelated cultural record."}
          </p>
          <button
            type="button"
            onClick={() => setLocation("/traditions")}
            className="mt-6 rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
          >
            Back to Tradition Explorer
          </button>
        </div>
      </div>
    );
  }

  const imageAssets = tradition.mediaAssets.filter(
    (m) => m.mediaType === "IMAGE" && m.directMediaUrl
  );
  const videoAssets = tradition.mediaAssets.filter(
    (m) => m.mediaType === "VIDEO" && (m.embedUrl || m.directMediaUrl)
  );
  const audioAssets = tradition.mediaAssets.filter(
    (m) => m.mediaType === "AUDIO" && m.directMediaUrl
  );
  const primaryHero =
    imageAssets.find((m) => m.isPrimaryHero && !brokenImages[m.id]) ||
    imageAssets.find((m) => !brokenImages[m.id]) ||
    null;

  return (
    <div className="min-h-screen bg-[#10121c] text-[#fbf5eb]">
      {/* Sticky Breadcrumb Header */}
      <header className="sticky top-0 z-[1200] border-b border-white/10 bg-[#111522]/95 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-white/80 hover:border-[#ef9d45] hover:text-white"
            >
              Home
            </button>
            <ChevronRight size={13} className="text-white/30" />
            <button
              type="button"
              onClick={() => setLocation("/traditions")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-white/80 hover:border-[#ef9d45] hover:text-white"
            >
              Tradition Explorer
            </button>
            <ChevronRight size={13} className="text-white/30" />
            <button
              type="button"
              onClick={() =>
                setLocation(
                  `/traditions?category=${encodeURIComponent(
                    tradition.traditionCategory
                  )}`
                )
              }
              className="rounded-full border border-[#ef9d45]/35 bg-[#ef9d45]/10 px-3 py-1.5 text-[#efb167]"
            >
              {tradition.traditionCategory}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEnquiry((v) => !v)}
              className="rounded-full bg-[#ef9d45] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
            >
              Enquire / Contribute
            </button>
            <button
              type="button"
              onClick={() => setLocation("/admin")}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:border-[#ef9d45]"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8 md:py-12">
        {banner && (
          <div className="mb-6 rounded-2xl border border-[#57c5a9]/40 bg-[#57c5a9]/15 px-5 py-3.5 text-xs text-[#8ed5bd]">
            {banner}
          </div>
        )}

        {showEnquiry && (
          <form
            onSubmit={handleEnquirySubmit}
            className="mb-8 rounded-3xl border border-[#ef9d45]/40 bg-[#151927] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow text-[#efb167]">
                  MODERATED COMMUNITY & PRACTITIONER ENQUIRY
                </div>
                <h2 className="mt-1 font-serif text-2xl text-white">
                  Connect or Contribute to {tradition.nameEn}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEnquiry(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name or institution"
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none"
              />
              <input
                required
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
                placeholder="Email or phone for coordinator reply"
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none"
              />
              <input
                required
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                placeholder="Workshop enquiry, practitioner registration, or source/media contribution…"
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-white/55">
                All enquiries are moderated to protect practitioner privacy and
                community consent rules.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#ef9d45] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#241a20]"
              >
                {submitting ? "Submitting…" : "Submit Moderated Request"}
              </button>
            </div>
          </form>
        )}

        {/* Top Dossier Hero + Primary Verified Media */}
        <div className="grid gap-8 rounded-[2.25rem] border border-white/12 bg-[#151927] p-6 md:p-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <EvidenceBadge
                status={tradition.evidenceStatus}
                label={tradition.evidenceStatusLabel}
              />
              <span className="eyebrow rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] text-white/80">
                {tradition.traditionCategory} · {tradition.subcategory}
              </span>
              {tradition.unescoStatus && (
                <span className="eyebrow rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-3 py-1 text-[10px] text-[#8ed5bd]">
                  {tradition.unescoStatus}
                </span>
              )}
              {tradition.giTagStatus && (
                <span className="eyebrow rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3 py-1 text-[10px] text-[#efb167]">
                  {tradition.giTagStatus}
                </span>
              )}
            </div>

            <h1 className="display mt-4 text-4xl text-[#fbf5eb] md:text-6xl">
              {tradition.nameEn}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
              {tradition.nameNative && (
                <span className="font-serif text-2xl text-[#efb167]">
                  {tradition.nameNative}{" "}
                  {tradition.nativeScriptLang && (
                    <span className="text-xs text-white/50">
                      ({tradition.nativeScriptLang})
                    </span>
                  )}
                </span>
              )}
              {tradition.alternativeNames.length > 0 && (
                <span className="text-xs text-white/60">
                  Alternative names:{" "}
                  <strong className="text-white/85">
                    {tradition.alternativeNames.join(" · ")}
                  </strong>
                </span>
              )}
            </div>

            <p className="mt-5 text-base leading-7 text-white/85">
              {tradition.summary}
            </p>

            {/* Languages & Multi-State Summary */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                <div className="eyebrow text-[10px] text-[#efb167]">
                  ASSOCIATED STATES & REGIONS ({tradition.places.length})
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tradition.places.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setLocation(`/places/${encodeURIComponent(p.locationId)}`)
                      }
                      className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:border-[#ef9d45] hover:text-[#efb167]"
                    >
                      {p.locationNameEn} ({p.stateName})
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                <div className="eyebrow text-[10px] text-[#8ed5bd]">
                  LANGUAGES & REVIEW METADATA
                </div>
                <div className="mt-1.5 text-xs text-white/85">
                  <strong>Languages:</strong>{" "}
                  {tradition.languages.join(", ") || "Regional languages"}
                </div>
                <div className="mt-1 text-xs text-white/60">
                  <strong>Reviewed:</strong> {tradition.lastReviewedAt} by{" "}
                  {tradition.reviewedByDisplay}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Hero Media with Full Credit & License Panel */}
          <div className="flex flex-col justify-between">
            {primaryHero ? (
              <div>
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0d111b]">
                  <img
                    src={primaryHero.directMediaUrl!}
                    alt={primaryHero.altText}
                    onError={() =>
                      setBrokenImages((prev) => ({
                        ...prev,
                        [primaryHero.id]: true,
                      }))
                    }
                    className="max-h-[380px] w-full object-cover"
                  />
                </div>
                <MediaAttributionCard asset={primaryHero} />
              </div>
            ) : (
              <NeutralTraditionPlaceholder
                name={tradition.nameEn}
                category={tradition.traditionCategory}
                subcategory={tradition.subcategory}
                onContribute={() => setShowEnquiry(true)}
              />
            )}
          </div>
        </div>

        {/* Cultural Description, Historical Background & Community Context */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#efb167]">
              01 · CULTURAL DESCRIPTION
            </div>
            <h2 className="mt-2 font-serif text-2xl text-white">
              Form, Practice & Aesthetics
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              {tradition.culturalDescription || tradition.summary}
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#8ed5bd]">
              02 · HISTORICAL BACKGROUND
            </div>
            <h2 className="mt-2 font-serif text-2xl text-white">
              Documented Lineage & Continuity
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              {tradition.historicalBackground ||
                "Historical lineage is documented in the cited institutional and gazetteer sources below."}
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#efb167]">
              03 · COMMUNITY & SOCIAL CONTEXT
            </div>
            <h2 className="mt-2 font-serif text-2xl text-white">
              Custodians & Transmission
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              {tradition.communityContext ||
                "Practiced and transmitted by regional custodian communities and master artisans."}
            </p>
          </section>
        </div>

        {/* Techniques, Materials, Instruments & Regional Variations */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#efb167]">
              TECHNIQUES & MATERIALS
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-white/80">
              {tradition.techniquesAndMaterials.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2"
                >
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-[#efb167]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#8ed5bd]">
              INSTRUMENTS, REPERTOIRE OR FORMS
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-white/80">
              {tradition.instrumentsOrForms.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2"
                >
                  <Sparkles
                    size={14}
                    className="mt-0.5 shrink-0 text-[#8ed5bd]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#efb167]">
              REGIONAL VARIATIONS & STYLES
            </div>
            <div className="mt-3 space-y-3">
              {tradition.regionalVariations.map((rv, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[.03] p-3.5"
                >
                  <div className="font-semibold text-white">
                    {rv.name ? `${rv.name} — ${rv.regionLabel}` : rv.regionLabel}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    {rv.description || rv.distinctiveFeatures}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Spatial Multi-Region Map & Place Relationships */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="eyebrow text-[#8ed5bd]">
                SPATIAL GEOGRAPHY · MULTI-REGION ASSOCIATIONS
              </div>
              <h2 className="mt-1 font-serif text-3xl text-white">
                Documented Places Associated with {tradition.nameEn} (
                {tradition.places.length})
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div className="min-h-[340px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d121f]">
              <MapView
                className="h-full w-full"
                center={
                  tradition.places[0]?.center || { lat: 21.15, lng: 79.0 }
                }
                zoom={tradition.places.length > 1 ? 5 : 8}
                markers={mapMarkers}
                onMapReady={(ctrl) => {
                  mapControllerRef.current = ctrl;
                }}
              />
            </div>

            <div className="space-y-3">
              {tradition.places.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="eyebrow text-[10px] text-[#efb167]">
                      {p.relationshipRole.replace(/_/g, " ")}
                      {p.isPrimary ? " · PRIMARY CLUSTER" : ""}
                    </span>
                    <span className="text-xs text-white/50">
                      {p.center.lat.toFixed(3)}° N, {p.center.lng.toFixed(3)}° E
                    </span>
                  </div>
                  <div className="mt-1.5 font-serif text-xl text-white">
                    {p.locationNameEn}
                    {p.districtName ? `, ${p.districtName}` : ""} ·{" "}
                    {p.stateName}
                  </div>
                  {p.regionalVariantName && (
                    <div className="mt-1 text-xs font-semibold text-[#8ed5bd]">
                      Variant / Cluster: {p.regionalVariantName}
                    </div>
                  )}
                  {p.notes && (
                    <p className="mt-1.5 text-xs leading-5 text-white/65">
                      {p.notes}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        mapControllerRef.current?.panTo(p.center, 10)
                      }
                      className="text-xs text-[#8ed5bd] hover:underline"
                    >
                      Center on Map
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLocation(`/places/${encodeURIComponent(p.locationId)}`)
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#efb167] hover:underline"
                    >
                      Open Place Directory Page <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verified Video, Audio & Image Media Gallery */}
        {(videoAssets.length > 0 ||
          audioAssets.length > 0 ||
          imageAssets.length > 1) && (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
            <div className="eyebrow text-[#efb167]">
              VERIFIED MULTIMEDIA ARCHIVE & RIGHTS REGISTRY
            </div>
            <h2 className="mt-1 font-serif text-3xl text-white">
              Official Video Documentaries & Licensed Media
            </h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {videoAssets.map((vid) => (
                <div
                  key={vid.id}
                  className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
                >
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                    {vid.embedUrl ? (
                      <iframe
                        src={vid.embedUrl}
                        title={vid.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-serif text-xl text-white">
                    {vid.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/70">
                    {vid.caption}
                  </p>
                  {vid.transcriptOrSummary && (
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
                      <strong className="text-white/85">
                         Archival Summary / Transcript Note ({vid.language}):
                      </strong>{" "}
                      {vid.transcriptOrSummary}
                    </div>
                  )}
                  <MediaAttributionCard asset={vid} />
                </div>
              ))}

              {audioAssets.map((aud) => (
                <div
                  key={aud.id}
                  className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
                >
                  <h3 className="font-serif text-xl text-white">{aud.title}</h3>
                  <p className="mt-1 text-xs text-white/70">{aud.caption}</p>
                  <audio
                    controls
                    src={aud.directMediaUrl!}
                    className="mt-3 w-full"
                  />
                  {aud.transcriptOrSummary && (
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
                      <strong>Transcript ({aud.language}):</strong>{" "}
                      {aud.transcriptOrSummary}
                    </div>
                  )}
                  <MediaAttributionCard asset={aud} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Structured Source Citations & Fact-Verification Registry */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="eyebrow text-[#8ed5bd]">
                FACT EVIDENCE & CITATION REGISTRY (SEPARATED FROM MEDIA RIGHTS)
              </div>
              <h2 className="mt-1 font-serif text-3xl text-white">
                Source Citations & Fact-Verification Log (
                {tradition.sources.length})
              </h2>
            </div>
            <div className="text-xs text-white/60">
              Last reviewed: <strong>{tradition.lastReviewedAt}</strong> ·{" "}
              {tradition.reviewedByDisplay}
            </div>
          </div>

          {tradition.verificationNotes && (
            <div className="mt-4 rounded-2xl border border-[#57c5a9]/30 bg-[#57c5a9]/10 p-4 text-xs leading-6 text-[#8ed5bd]">
              <strong>Verification Scope Note:</strong>{" "}
              {tradition.verificationNotes}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tradition.sources.map((src) => (
              <div
                key={src.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.03] p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="eyebrow rounded-full border border-[#ef9d45]/35 bg-[#ef9d45]/10 px-2.5 py-0.5 text-[9px] text-[#efb167]">
                      {src.sourceType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-[#8ed5bd]">
                      Status: {src.reviewStatus} · Reviewed {src.lastReviewedAt}
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-serif text-xl text-white">
                    {src.sourceTitle}
                  </h3>
                  <div className="mt-1 text-xs font-semibold text-[#efb167]">
                    {src.sourceOrganisation}
                    {src.publicationOrInscribedDate
                      ? ` (${src.publicationOrInscribedDate})`
                      : ""}
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-5 text-white/80">
                    <strong className="text-white">
                      Specific Facts Supported:
                    </strong>{" "}
                    {src.specificFactsSupported}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-white/55">
                  <span>
                    Retrieved: {src.retrievalDate} · Reviewer: {src.reviewedBy}
                  </span>
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#efb167] underline"
                  >
                    Open Official Source <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Linked Cultural Records, Learning Opportunities & Related Events */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#efb167]">
              PRACTITIONER PROFILES & REGIONAL RECORDS
            </div>
            <h2 className="mt-1 font-serif text-2xl text-white">
              Associated Cultural Records ({tradition.linkedRecords.length})
            </h2>
            {tradition.linkedRecords.length > 0 ? (
              <div className="mt-4 space-y-3">
                {tradition.linkedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-[9px] text-[#8ed5bd]">
                        {rec.verificationStateLabel}
                      </span>
                      <span className="text-xs text-white/50">
                        {rec.displayLocationLabel}
                      </span>
                    </div>
                    <div className="mt-1 font-serif text-xl text-white">
                      {rec.titleEn}
                    </div>
                    <div className="mt-1 text-xs text-white/65">
                      Practitioner / Attribution:{" "}
                      <strong>{rec.creditedPractitionerLabel}</strong>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/?record=${encodeURIComponent(
                              rec.slug
                            )}#practice-profile`
                          )
                        }
                        className="text-xs font-semibold text-[#efb167] hover:underline"
                      >
                        Open Cultural Profile & Rights Passport →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-xs leading-6 text-white/65">
                Individual practitioner profiles for {tradition.nameEn} are
                published only after signed Cultural Rights Passports are
                completed. No fabricated artist biographies are displayed. Use
                the moderated enquiry button above to register as a practitioner
                or request an institutional introduction.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6">
            <div className="eyebrow text-[#8ed5bd]">
              WORKSHOPS, LEARNING & CONSENT CONTROLS
            </div>
            <h2 className="mt-1 font-serif text-2xl text-white">
              Learning Pathways & Ethical Access
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs leading-6 text-white/80">
              {tradition.learningOpportunities.map((op, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2.5"
                >
                  {typeof op === "string" ? (
                    op
                  ) : (
                    <div>
                      <div className="font-semibold text-white">
                        {op.title}{" "}
                        <span className="text-[11px] font-normal text-[#efb167]">
                          ({op.format})
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#8ed5bd]">
                        {op.institutionOrContext}
                      </div>
                      <div className="mt-1 text-white/70">{op.accessNote}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl border border-[#ef9d45]/30 bg-[#ef9d45]/10 p-4 text-xs leading-6 text-[#efb167]">
              <strong>Consent & Publication Control:</strong>{" "}
              {tradition.consentAndAccessNote}
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setShowEnquiry(true)}
                className="rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
              >
                Request Workshop / Academic Introduction
              </button>
              <button
                type="button"
                onClick={() => setLocation("/practitioners")}
                className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-4 py-2 text-xs font-semibold text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
              >
                Discover Linked Practitioners →
              </button>
              <button
                type="button"
                onClick={() => setLocation("/art-mart")}
                className="rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-4 py-2 text-xs font-semibold text-[#efb167]"
              >
                Explore Craft Works on Art-Mart →
              </button>
              <button
                type="button"
                onClick={() => setLocation("/trip-planner")}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85"
              >
                Open Trip Planner →
              </button>
            </div>
          </section>
        </div>

        {/* Related Traditions */}
        {tradition.relatedTraditions.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
            <div className="eyebrow text-[#efb167]">
              CONTINUING DISCOVERY
            </div>
            <h2 className="mt-1 font-serif text-2xl text-white">
              Related Traditions in {tradition.traditionCategory}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tradition.relatedTraditions.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() =>
                    setLocation(`/traditions/${encodeURIComponent(rel.slug)}`)
                  }
                  className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left hover:border-[#ef9d45]"
                >
                  <div className="eyebrow text-[9px] text-[#efb167]">
                    {rel.statesRepresented.join(" · ")}
                  </div>
                  <div className="mt-1 font-serif text-lg text-white">
                    {rel.nameEn}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-white/60">
                    {rel.summary}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
