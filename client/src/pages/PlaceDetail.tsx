import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe2,
  Layers3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  MapView,
  type GeoMapMarker,
  type MapController,
} from "@/components/Map";
import { apiClient } from "@/lib/api";
import type { PlaceDetailPayload } from "@shared/contracts";

function formatLevelLabel(level: string): string {
  switch (level) {
    case "COUNTRY":
      return "Country";
    case "STATE":
      return "State / Union Territory";
    case "DISTRICT":
      return "District";
    case "TALUKA":
      return "Subdistrict / Taluka";
    case "CITY_TOWN":
      return "City / Town";
    case "VILLAGE":
      return "Village";
    default:
      return level;
  }
}

export default function PlaceDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const mapControllerRef = useRef<MapController | null>(null);

  const [data, setData] = useState<PlaceDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Community contribution / enquiry form for empty or active places
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitBanner, setSubmitBanner] = useState("");

  useEffect(() => {
    const placeId = params?.id || "loc-country-in";
    let mounted = true;
    setLoading(true);
    setError("");
    setSubmitBanner("");
    apiClient
      .getPlaceDetail(placeId)
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
        mapControllerRef.current?.panTo(
          { lat: payload.place.centerLat, lng: payload.place.centerLng },
          payload.place.defaultZoom
        );
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Failed to load geographic place details.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params?.id]);

  const markers: GeoMapMarker[] = useMemo(() => {
    if (!data) return [];
    const list: GeoMapMarker[] = [];

    for (const child of data.childPlaces) {
      const variant =
        child.level === "STATE"
          ? "state"
          : child.level === "DISTRICT"
            ? "district"
            : "city";
      list.push({
        id: `child-${child.id}`,
        position: { lat: child.centerLat, lng: child.centerLng },
        title: `${child.nameEn} (${child.recordCount} record${child.recordCount === 1 ? "" : "s"})`,
        badgeText: `${child.abbr || child.nameEn.replace(/ (District|Taluka)$/i, "")} · ${child.recordCount}`,
        variant,
        onClick: () => setLocation(`/places/${encodeURIComponent(child.id)}`),
      });
    }

    for (const rec of data.records) {
      if (rec.locationGranularity === "HIDDEN" || !rec.publicCenter) continue;
      list.push({
        id: `rec-${rec.id}`,
        position: rec.publicCenter,
        title: `${rec.titleEn} (${rec.verificationStateLabel})`,
        badgeText: rec.titleEn,
        variant:
          rec.recordOrigin === "FIELD_VERIFIED"
            ? "verified-record"
            : "demo-record",
        onClick: () =>
          setLocation(`/?record=${encodeURIComponent(rec.slug)}#practice-profile`),
      });
    }

    return list;
  }, [data, setLocation]);

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    setSubmitBanner("");
    try {
      await apiClient.submitCommunityEnquiry({
        enquiryType: "PLACE_CONTRIBUTION",
        locationId: data.place.id,
        senderName,
        senderContact,
        message,
      });
      setSenderName("");
      setSenderContact("");
      setMessage("");
      setShowContributeForm(false);
      setSubmitBanner(
        `Thank you. Your cultural documentation note for ${data.place.nameEn} has been recorded for community and researcher review.`
      );
    } catch (err: any) {
      setSubmitBanner(err?.message || "Could not submit contribution note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10121c] text-[#fbf5eb]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-[1200] border-b border-white/10 bg-[#111522]/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/80 hover:border-[#ef9d45] hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to CultureMap
            </button>
            <button
              type="button"
              onClick={() => setLocation("/places/loc-country-in")}
              className="hidden items-center gap-2 text-xs text-[#efb167] hover:underline sm:inline-flex"
            >
              <Globe2 size={14} />
              All-India Geographic Directory
            </button>
            <button
              type="button"
              onClick={() => setLocation("/traditions")}
              className="hidden items-center gap-2 rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-3 py-1 text-xs font-semibold text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124] sm:inline-flex"
            >
              <Compass size={13} />
              Tradition Explorer
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLocation("/admin")}
            className="rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3.5 py-1.5 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45]/20"
          >
            Admin Panel
          </button>
        </div>
      </header>

      <div className="container py-10 md:py-14">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#151927] p-12 text-center text-sm text-white/60">
            Loading geographic directory entry…
          </div>
        ) : error || !data ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-10 text-center">
            <h1 className="font-serif text-3xl text-white">
              Geographic Place Not Found
            </h1>
            <p className="mt-2 text-sm text-white/65">{error}</p>
            <button
              type="button"
              onClick={() => setLocation("/places/loc-country-in")}
              className="mt-6 rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
            >
              Explore India Directory
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Hierarchical Breadcrumbs: India -> State/UT -> District -> Subdistrict/Taluka -> City/Town/Village */}
            <nav
              aria-label="Geographic Breadcrumbs"
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#151927] px-4 py-3"
            >
              <span className="eyebrow mr-2 text-[10px] text-white/40">
                GEOGRAPHIC HIERARCHY:
              </span>
              {data.breadcrumbs.map((crumb, idx) => {
                const isCurrent = crumb.id === data.place.id;
                return (
                  <div key={crumb.id} className="flex items-center gap-2">
                    {idx > 0 && (
                      <ChevronRight size={13} className="text-white/25" />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setLocation(`/places/${encodeURIComponent(crumb.id)}`)
                      }
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        isCurrent
                          ? "bg-[#ef9d45] font-bold text-[#241a20]"
                          : "bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {crumb.nameEn}
                      <span className="ml-1.5 text-[10px] opacity-65">
                        ({formatLevelLabel(crumb.level)})
                      </span>
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* Place Header + Cultural Coverage Status */}
            <div className="grid gap-8 rounded-[2rem] border border-white/12 bg-[#151927] p-6 md:p-9 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="eyebrow rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3 py-1 text-[#efb167]">
                    {formatLevelLabel(data.place.level)}
                  </span>
                  <span
                    className={`eyebrow rounded-full border px-3 py-1 ${
                      data.coverageSummary.practitionerApprovedCount > 0
                        ? "border-[#57c5a9]/40 bg-[#57c5a9]/15 text-[#8ed5bd]"
                        : data.coverageSummary.referenceCount > 0
                          ? "border-[#ef9d45]/40 bg-[#ef9d45]/10 text-[#efb167]"
                          : "border-white/20 bg-white/5 text-white/70"
                    }`}
                  >
                    {data.coverageSummary.statusLabel}
                  </span>
                </div>

                <h1 className="display mt-4 text-5xl text-[#fbf5eb] md:text-6xl">
                  {data.place.nameEn}
                </h1>
                {data.place.nameMr && (
                  <div className="mt-2 font-serif text-2xl text-[#efb167]">
                    {data.place.nameMr}
                  </div>
                )}

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                  Administrative coordinates:{" "}
                  <strong className="text-white/85">
                    {data.place.centerLat.toFixed(4)}° N,{" "}
                    {data.place.centerLng.toFixed(4)}° E
                  </strong>
                  {data.parentPlace ? (
                    <>
                      {" "}
                      · Part of{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/places/${encodeURIComponent(data.parentPlace!.id)}`
                          )
                        }
                        className="text-[#efb167] underline underline-offset-2"
                      >
                        {data.parentPlace.nameEn}
                      </button>
                    </>
                  ) : null}
                </p>

                {/* Coverage Statistics Grid */}
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-[#57c5a9]/30 bg-[#57c5a9]/10 p-3.5">
                    <div className="font-serif text-2xl text-[#8ed5bd]">
                      {data.coverageSummary.practitionerApprovedCount}
                    </div>
                    <div className="eyebrow mt-1 text-[9px] text-[#8ed5bd]/80">
                      Practitioner-approved
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#ef9d45]/30 bg-[#ef9d45]/10 p-3.5">
                    <div className="font-serif text-2xl text-[#efb167]">
                      {data.coverageSummary.referenceCount}
                    </div>
                    <div className="eyebrow mt-1 text-[9px] text-[#efb167]/80">
                      Reference information
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
                    <div className="font-serif text-2xl text-white">
                      {data.coverageSummary.childPlacesTotal}
                    </div>
                    <div className="eyebrow mt-1 text-[9px] text-white/45">
                      Child subdivisions
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
                    <div className="font-serif text-2xl text-white">
                      {data.coverageSummary.upcomingEventsCount}
                    </div>
                    <div className="eyebrow mt-1 text-[9px] text-white/45">
                      Upcoming events
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map Centered on This Place */}
              <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#101622]">
                <MapView
                  className="h-full w-full"
                  center={{
                    lat: data.place.centerLat,
                    lng: data.place.centerLng,
                  }}
                  zoom={data.place.defaultZoom}
                  markers={markers}
                  onMapReady={(ctrl) => {
                    mapControllerRef.current = ctrl;
                  }}
                />
              </div>
            </div>

            {/* Child Locations / Subdivisions Links */}
            {data.childPlaces.length > 0 && (
              <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="eyebrow text-[#efb167]">
                      ADMINISTRATIVE SUBDIVISIONS IN {data.place.nameEn.toUpperCase()}
                    </div>
                    <h2 className="mt-2 font-serif text-3xl text-white">
                      Explore child places ({data.childPlaces.length})
                    </h2>
                  </div>
                  <div className="text-xs text-white/50">
                    {data.coverageSummary.childPlacesWithRecords} with published
                    records ·{" "}
                    {data.childPlaces.length -
                      data.coverageSummary.childPlacesWithRecords}{" "}
                    with collection in progress
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {data.childPlaces.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() =>
                        setLocation(`/places/${encodeURIComponent(child.id)}`)
                      }
                      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left transition hover:border-[#ef9d45]/50 hover:bg-[#ef9d45]/10"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="eyebrow text-[9px] text-white/45">
                            {formatLevelLabel(child.level)}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-white/30 group-hover:translate-x-0.5 group-hover:text-[#efb167]"
                          />
                        </div>
                        <div className="mt-1.5 font-serif text-xl text-white">
                          {child.nameEn}
                        </div>
                        {child.nameMr && (
                          <div className="text-xs text-white/45">
                            {child.nameMr}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-2.5">
                        {child.practitionerApprovedCount > 0 ? (
                          <span className="eyebrow text-[9px] text-[#8ed5bd]">
                            {child.practitionerApprovedCount} practitioner-approved
                            {child.referenceCount > 0
                              ? ` · ${child.referenceCount} reference`
                              : ""}
                          </span>
                        ) : child.referenceCount > 0 ? (
                          <span className="eyebrow text-[9px] text-[#efb167]">
                            {child.referenceCount} reference record
                            {child.referenceCount === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="eyebrow text-[9px] text-white/40">
                            Collection in progress
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Associated Multi-Region Living Traditions Section */}
            {data.traditions && data.traditions.length > 0 && (
              <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="eyebrow text-[#efb167]">
                      SOURCE-VERIFIED LIVING HERITAGE DIRECTORY
                    </div>
                    <h2 className="mt-2 font-serif text-3xl text-white">
                      Documented Traditions Associated with {data.place.nameEn} ({data.traditions.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLocation(
                        `/traditions?placeId=${encodeURIComponent(data.place.id)}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-4 py-2 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45] hover:text-[#241a20]"
                  >
                    Filter in Tradition Explorer <ArrowRight size={13} />
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.traditions.map((trad) => (
                    <article
                      key={trad.id}
                      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.03] p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="eyebrow text-[10px] text-[#efb167]">
                            {trad.traditionCategory}
                          </span>
                          <span className="rounded-full bg-[#57c5a9]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#8ed5bd]">
                            {trad.sourceCount} Source{trad.sourceCount === 1 ? "" : "s"} · {trad.mediaCount} Media
                          </span>
                        </div>
                        <h3 className="mt-2.5 font-serif text-2xl text-white">
                          {trad.nameEn}
                          {trad.nameNative && (
                            <span className="ml-2 text-base font-normal text-[#efb167]">
                              {trad.nameNative}
                            </span>
                          )}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-xs leading-6 text-white/70">
                          {trad.summary}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {trad.places.map((tp) => (
                            <span
                              key={tp.id}
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70"
                            >
                              {tp.locationNameEn}, {tp.stateName}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="text-[11px] text-white/50">
                          {trad.evidenceStatusLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLocation(
                              `/traditions/${encodeURIComponent(trad.slug)}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#efb167] hover:underline"
                        >
                          Open Tradition Dossier <ArrowRight size={13} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Cultural Practices Section OR "Discover the culture of this place" Empty State */}
            <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="eyebrow text-[#8ed5bd]">
                    CULTURAL COVERAGE STATUS
                  </div>
                  <h2 className="mt-2 font-serif text-3xl text-white">
                    Cultural practices in {data.place.nameEn}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContributeForm((v) => !v)}
                  className="rounded-full border border-[#ef9d45]/45 bg-[#ef9d45]/15 px-4 py-2 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45]/25"
                >
                  {showContributeForm
                    ? "Close contribution form"
                    : "Nominate or contribute a record"}
                </button>
              </div>

              {submitBanner && (
                <div className="mt-4 rounded-2xl border border-[#57c5a9]/40 bg-[#57c5a9]/15 px-4 py-3 text-xs text-[#8ed5bd]">
                  {submitBanner}
                </div>
              )}

              {showContributeForm && (
                <form
                  onSubmit={handleContributeSubmit}
                  className="mt-5 grid gap-3 rounded-2xl border border-white/15 bg-[#101522] p-5 md:grid-cols-3"
                >
                  <input
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your name or community organization"
                    className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white outline-none"
                  />
                  <input
                    required
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                    placeholder="Email or phone for researcher follow-up"
                    className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white outline-none"
                  />
                  <input
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Cultural practice or tradition in ${data.place.nameEn}…`}
                    className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white outline-none"
                  />
                  <div className="md:col-span-3 flex items-center justify-between">
                    <span className="text-[11px] text-white/50">
                      Submissions never auto-publish; field verification and
                      informed practitioner consent remain required.
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-[#ef9d45] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                    >
                      {submitting ? "Submitting…" : "Submit for review"}
                    </button>
                  </div>
                </form>
              )}

              {data.records.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {data.records.map((rec) => {
                    const isVerified = rec.recordOrigin === "FIELD_VERIFIED";
                    return (
                      <article
                        key={rec.id}
                        className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[.03] p-5"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="eyebrow text-[10px] text-[#efb167]">
                              {rec.category} · {rec.unescoDomain}
                            </span>
                            <span
                              className={`eyebrow rounded-full px-2.5 py-1 text-[9px] ${
                                isVerified
                                  ? "bg-[#57c5a9]/15 text-[#8ed5bd]"
                                  : "bg-[#ef9d45]/15 text-[#efb167]"
                              }`}
                            >
                              {isVerified
                                ? "Practitioner-approved"
                                : "Reference information · Community verification pending"}
                            </span>
                          </div>

                          <h3 className="mt-3 font-serif text-2xl text-white">
                            {rec.titleEn}
                            {rec.titleMr ? (
                              <span className="ml-2 text-base font-normal text-white/50">
                                {rec.titleMr}
                              </span>
                            ) : null}
                          </h3>

                          <p className="mt-2 text-xs leading-6 text-white/70">
                            {rec.summaryEn}
                          </p>

                          {rec.sourceAttribution && (
                            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/60">
                              <strong className="text-white/80">Source:</strong>{" "}
                              {rec.sourceAttribution}
                              {rec.sourceUrl ? (
                                <a
                                  href={rec.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-2 inline-flex items-center gap-1 text-[#efb167] underline"
                                >
                                  Reference link <ExternalLink size={10} />
                                </a>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                          <span className="text-[11px] text-white/50">
                            Location visibility: {rec.locationGranularity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLocation(
                                `/?record=${encodeURIComponent(rec.slug)}#practice-profile`
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#efb167] hover:underline"
                          >
                            Open Cultural Profile <ArrowRight size={13} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-[#ef9d45]/35 bg-[#ef9d45]/5 p-8 text-center">
                  <Compass size={28} className="mx-auto text-[#efb167]" />
                  <div className="eyebrow mt-3 text-[#efb167]">
                    COLLECTION IN PROGRESS
                  </div>
                  <h3 className="mt-2 font-serif text-3xl text-white">
                    Discover the culture of this place
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">
                    {data.place.nameEn} is active in the Bharat CultureMap
                    geographic directory. More cultural entries for this place
                    are being documented and will appear here as reference
                    sources are verified and practitioner-governed consent
                    records are completed.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowContributeForm(true)}
                      className="rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                    >
                      Nominate a practice in {data.place.nameEn}
                    </button>
                    {data.parentPlace && (
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/places/${encodeURIComponent(data.parentPlace!.id)}`
                          )
                        }
                        className="rounded-full border border-white/15 px-5 py-2.5 text-xs text-white/80 hover:border-[#ef9d45]"
                      >
                        Explore {data.parentPlace.nameEn}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Upcoming Published Cultural Events */}
            {data.events.length > 0 && (
              <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
                <div className="eyebrow text-[#efb167]">
                  PUBLISHED CULTURAL CALENDAR
                </div>
                <h2 className="mt-2 font-serif text-3xl text-white">
                  Upcoming cultural events ({data.events.length})
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {data.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-2xl border border-white/10 bg-white/[.03] p-5"
                    >
                      <div className="flex items-center justify-between text-xs text-[#8ed5bd]">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <Calendar size={13} />
                          {evt.startDate}
                          {evt.endDate && evt.endDate !== evt.startDate
                            ? ` → ${evt.endDate}`
                            : ""}
                        </span>
                        <span className="eyebrow text-[10px] text-[#efb167]">
                          {evt.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(`/calendar/${encodeURIComponent(evt.id)}`)
                        }
                        className="mt-2 block text-left font-serif text-2xl text-white hover:text-[#efb167] hover:underline"
                      >
                        {evt.titleEn}
                      </button>
                      <p className="mt-1.5 text-xs leading-5 text-white/65">
                        {evt.descriptionEn}
                      </p>
                      <div className="mt-3 text-[11px] text-white/50">
                        Venue: {evt.venueLabel} · Organizer:{" "}
                        {evt.organizerDisplay}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Documented Geography Dataset Sources & Licensing */}
            <section className="rounded-[2rem] border border-white/10 bg-[#111522] p-6 text-xs text-white/60">
              <div className="eyebrow text-[#8ed5bd]">
                GEOGRAPHY DATASET SOURCE, COVERAGE & LICENSING
              </div>
              <p className="mt-2 leading-6">{data.datasetMetadata.coverageNote}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {data.datasetMetadata.sources.map((src) => (
                  <div
                    key={src.name}
                    className="rounded-xl border border-white/10 bg-white/[.02] p-3.5"
                  >
                    <div className="font-semibold text-white/85">{src.name}</div>
                    <div className="mt-1 text-[11px] text-white/50">
                      {src.publisher} · {src.license}
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#efb167] underline"
                    >
                      Source documentation <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
