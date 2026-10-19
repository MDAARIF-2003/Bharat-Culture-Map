import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookmarkCheck,
  Calendar as CalendarIcon,
  Check,
  Compass,
  ExternalLink,
  Globe2,
  MapPin,
  Plus,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  MapView,
  type GeoMapMarker,
  type MapController,
} from "@/components/Map";
import { apiClient } from "@/lib/api";
import {
  CULTURE_CATEGORIES,
  VISITOR_INTEREST_TAGS,
} from "@shared/const";
import type {
  GeoLocation,
  TripItineraryItem,
  TripPlan,
} from "@shared/contracts";

const LOCAL_STORAGE_TRIP_KEY = "bharat_culturemap_saved_trip_v1";

function getCertaintyStyle(certainty: TripItineraryItem["dateCertainty"]): string {
  switch (certainty) {
    case "CONFIRMED_DATE":
      return "border-[#57c5a9]/45 bg-[#57c5a9]/15 text-[#8ed5bd]";
    case "PROVISIONAL_DATE":
      return "border-[#ef9d45]/45 bg-[#ef9d45]/15 text-[#efb167]";
    case "SEASONAL_ESTIMATE_WINDOW":
      return "border-sky-400/40 bg-sky-500/15 text-sky-200";
    case "FLEXIBLE_PRACTICE_VISIT":
    default:
      return "border-purple-400/40 bg-purple-500/15 text-purple-200";
  }
}

export default function CultureTripPlanner({
  locations,
}: {
  locations: GeoLocation[];
}) {
  const [, setLocation] = useLocation();
  const mapControllerRef = useRef<MapController | null>(null);

  // Trip Configuration State — Dynamic current date & open destination selection (no hardcoded Kolhapur/historical date defaults)
  const [tripTitle, setTripTitle] = useState(
    "Cultural Discovery & Living Heritage Itinerary"
  );
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [durationDays, setDurationDays] = useState<number>(3);
  const [stateId, setStateId] = useState("loc-state-maharashtra");
  const [districtId, setDistrictId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [confirmedOnly, setConfirmedOnly] = useState<boolean>(false);

  // Active Trip Plan State
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadTripIdInput, setLoadTripIdInput] = useState("");
  const [candidateDayTarget, setCandidateDayTarget] = useState<number>(1);

  const statesList = useMemo(
    () =>
      locations
        .filter((l) => l.level === "STATE")
        .sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    [locations]
  );

  const districtsList = useMemo(
    () =>
      locations
        .filter(
          (l) => l.level === "DISTRICT" && (!stateId || l.parentId === stateId)
        )
        .sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    [locations, stateId]
  );

  const placesList = useMemo(
    () =>
      locations
        .filter(
          (l) =>
            (l.level === "TALUKA" ||
              l.level === "CITY_TOWN" ||
              l.level === "VILLAGE") &&
            (!districtId || l.parentId === districtId)
        )
        .sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    [locations, districtId]
  );

  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingPlan(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const { plan } = await apiClient.generateTripPlan({
        title: tripTitle,
        startDate,
        durationDays,
        stateId: stateId || undefined,
        districtId: districtId || null,
        placeId: placeId || null,
        categories: selectedCategories,
        visitorInterests: selectedInterests,
        confirmedOnly,
      });
      setTripPlan(plan);
      setCandidateDayTarget(1);
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not generate trip itinerary.");
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    // Restore saved plan from localStorage if present, otherwise generate default Kolhapur plan
    try {
      const cached = window.localStorage.getItem(LOCAL_STORAGE_TRIP_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as TripPlan;
        if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
          setTripPlan(parsed);
          setTripTitle(parsed.title);
          setStartDate(parsed.startDate);
          setDurationDays(parsed.durationDays);
          return;
        }
      }
    } catch {
      // Ignore storage read error
    }
    void handleGeneratePlan();
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
    );
  };

  // Add an eligible candidate item to a specific day
  const handleAddItemToDay = (
    candidate: TripItineraryItem,
    dayNumber: number
  ) => {
    if (!tripPlan) return;
    const copyItem: TripItineraryItem = {
      ...structuredClone(candidate),
      id: `${candidate.id}-day${dayNumber}-${Date.now().toString(36)}`,
    };
    const nextDays = tripPlan.days.map((d) =>
      d.dayNumber === dayNumber ? { ...d, items: [...d.items, copyItem] } : d
    );
    const updated = { ...tripPlan, days: nextDays };
    setTripPlan(updated);
    setStatusMessage(`Added "${candidate.titleEn}" to Day ${dayNumber}.`);
  };

  // Remove an item from a day
  const handleRemoveItemFromDay = (dayNumber: number, itemIndex: number) => {
    if (!tripPlan) return;
    const nextDays = tripPlan.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      return {
        ...d,
        items: d.items.filter((_, idx) => idx !== itemIndex),
      };
    });
    setTripPlan({ ...tripPlan, days: nextDays });
  };

  // Reorder an item within a day (direction: -1 for Up, +1 for Down)
  const handleMoveItemInDay = (
    dayNumber: number,
    itemIndex: number,
    direction: -1 | 1
  ) => {
    if (!tripPlan) return;
    const nextDays = tripPlan.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const targetIndex = itemIndex + direction;
      if (targetIndex < 0 || targetIndex >= d.items.length) return d;
      const nextItems = [...d.items];
      const [moved] = nextItems.splice(itemIndex, 1);
      nextItems.splice(targetIndex, 0, moved);
      return { ...d, items: nextItems };
    });
    setTripPlan({ ...tripPlan, days: nextDays });
  };

  // Move an item from one day to another day
  const handleMoveItemBetweenDays = (
    fromDayNumber: number,
    itemIndex: number,
    toDayNumber: number
  ) => {
    if (!tripPlan || fromDayNumber === toDayNumber) return;
    let movedItem: TripItineraryItem | null = null;
    const removedDays = tripPlan.days.map((d) => {
      if (d.dayNumber !== fromDayNumber) return d;
      movedItem = d.items[itemIndex] || null;
      return {
        ...d,
        items: d.items.filter((_, idx) => idx !== itemIndex),
      };
    });
    if (!movedItem) return;
    const finalDays = removedDays.map((d) =>
      d.dayNumber === toDayNumber
        ? { ...d, items: [...d.items, movedItem!] }
        : d
    );
    setTripPlan({ ...tripPlan, days: finalDays });
  };

  // Update personal visitor note on an item
  const handleUpdateVisitorNote = (
    dayNumber: number,
    itemIndex: number,
    note: string
  ) => {
    if (!tripPlan) return;
    const nextDays = tripPlan.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const nextItems = d.items.map((it, idx) =>
        idx === itemIndex ? { ...it, visitorNotes: note } : it
      );
      return { ...d, items: nextItems };
    });
    setTripPlan({ ...tripPlan, days: nextDays });
  };

  // Save itinerary to SQLite backend + localStorage
  const handleSaveItinerary = async () => {
    if (!tripPlan) return;
    setSavingPlan(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const payload = {
        ...tripPlan,
        title: tripTitle || tripPlan.title,
      };
      const { plan: saved } = await apiClient.saveTripPlan(payload);
      setTripPlan(saved);
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_TRIP_KEY,
          JSON.stringify(saved)
        );
      } catch {
        // Ignore storage quota errors
      }
      setStatusMessage(
        `Saved itinerary "${saved.title}" (Trip ID: ${saved.id}). You can reload or print this plan anytime.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save itinerary.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleLoadSavedTripById = async () => {
    if (!loadTripIdInput.trim()) return;
    setLoadingPlan(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const { plan } = await apiClient.getTripPlanById(loadTripIdInput.trim());
      setTripPlan(plan);
      setTripTitle(plan.title);
      setStartDate(plan.startDate);
      setDurationDays(plan.durationDays);
      setStatusMessage(`Loaded saved itinerary "${plan.title}" (${plan.id}).`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Saved trip plan ID not found.");
    } finally {
      setLoadingPlan(false);
    }
  };

  // Collect all scheduled items across days for the interactive trip map
  const tripMarkers: GeoMapMarker[] = useMemo(() => {
    if (!tripPlan) return [];
    const list: GeoMapMarker[] = [];
    for (const day of tripPlan.days) {
      for (const item of day.items) {
        if (!item.publicCenter || item.locationGranularity === "HIDDEN")
          continue;
        list.push({
          id: `trip-pin-${day.dayNumber}-${item.id}`,
          position: item.publicCenter,
          title: `Day ${day.dayNumber} (${day.isoDate}): ${item.titleEn}`,
          badgeText: `D${day.dayNumber} · ${item.titleEn.slice(0, 22)}`,
          variant:
            item.dateCertainty === "CONFIRMED_DATE"
              ? "verified-record"
              : "demo-record",
          onClick: () => {
            if (item.eventId) {
              setLocation(`/calendar/${encodeURIComponent(item.eventId)}`);
            } else if (item.placeId) {
              setLocation(`/places/${encodeURIComponent(item.placeId)}`);
            }
          },
        });
      }
    }
    return list;
  }, [tripPlan, setLocation]);

  return (
    <div className="mt-8 space-y-8 print:bg-white print:text-black">
      {/* 1. Trip Configuration Form */}
      <section className="rounded-3xl border border-white/12 bg-[#151927] p-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="eyebrow text-[#efb167]">
              CULTURE-BASED TRIP PLANNER
            </div>
            <h2 className="mt-1 font-serif text-3xl text-white">
              Plan a respectful day-by-day cultural itinerary
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Uses only published events and cultural practices with verified
              visitor-access guidance. Private or restricted ceremonies are
              never included.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={loadTripIdInput}
              onChange={(e) => setLoadTripIdInput(e.target.value)}
              placeholder="Paste saved Trip ID (trip-…)"
              className="rounded-full border border-white/15 bg-black/25 px-3.5 py-1.5 text-xs text-white outline-none"
            />
            <button
              type="button"
              onClick={handleLoadSavedTripById}
              className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/80 hover:border-[#ef9d45]"
            >
              Load Saved Plan
            </button>
          </div>
        </div>

        <form onSubmit={handleGeneratePlan} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="sm:col-span-2">
              <label className="eyebrow block text-[9px] text-white/45">
                ITINERARY TITLE
              </label>
              <input
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                START DATE
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                DURATION (1–7 DAYS)
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? "Day" : "Days"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                STATE / UT
              </label>
              <select
                value={stateId}
                onChange={(e) => {
                  setStateId(e.target.value);
                  setDistrictId("");
                  setPlaceId("");
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                {statesList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                DISTRICT
              </label>
              <select
                value={districtId}
                onChange={(e) => {
                  setDistrictId(e.target.value);
                  setPlaceId("");
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="">All Districts in State</option>
                {districtsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                CULTURAL CATEGORIES (OPTIONAL FILTER)
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CULTURE_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                        active
                          ? "bg-[#ef9d45] text-[#241a20]"
                          : "border border-white/10 bg-white/5 text-white/65 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                VISITOR INTERESTS (OPTIONAL FILTER)
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {VISITOR_INTEREST_TAGS.map((tag) => {
                  const active = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                        active
                          ? "bg-[#57c5a9] text-[#102124]"
                          : "border border-white/10 bg-white/5 text-white/65 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                checked={confirmedOnly}
                onChange={(e) => setConfirmedOnly(e.target.checked)}
                className="h-4 w-4 accent-[#57c5a9]"
              />
              Include only events with Confirmed dates (exclude provisional
              events & flexible practice visits)
            </label>

            <button
              type="submit"
              disabled={loadingPlan}
              className="rounded-full bg-[#ef9d45] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#241a20]"
            >
              {loadingPlan
                ? "Building Itinerary…"
                : "Generate Suggested Itinerary"}
            </button>
          </div>
        </form>
      </section>

      {statusMessage && (
        <div className="rounded-2xl border border-[#57c5a9]/40 bg-[#57c5a9]/15 px-4 py-3 text-xs text-[#8ed5bd] print:hidden">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-xs text-red-200 print:hidden">
          {errorMessage}
        </div>
      )}

      {tripPlan && (
        <>
          {/* 2. Itinerary Header, Disclaimer, Save & Print Bar */}
          <section className="rounded-3xl border border-white/12 bg-[#151927] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="eyebrow text-[#8ed5bd]">
                  SUGGESTED CULTURAL ITINERARY · {tripPlan.regionLabel.toUpperCase()}
                </div>
                <h2 className="mt-1 font-serif text-3xl text-white">
                  {tripTitle || tripPlan.title}
                </h2>
                <div className="mt-1 text-xs text-white/60">
                  Dates: <strong>{tripPlan.startDate}</strong> →{" "}
                  <strong>{tripPlan.endDate}</strong> ({tripPlan.durationDays}{" "}
                  {tripPlan.durationDays === 1 ? "day" : "days"}) · Plan ID:{" "}
                  <code className="text-[#efb167]">{tripPlan.id}</code>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                <button
                  type="button"
                  onClick={handleSaveItinerary}
                  disabled={savingPlan}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#57c5a9] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#102124]"
                >
                  <BookmarkCheck size={14} />
                  {savingPlan ? "Saving…" : "Save Itinerary"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-[#ef9d45]"
                >
                  <Printer size={14} />
                  Print / Export PDF
                </button>
              </div>
            </div>

            {/* Honest Transport & Booking Safeguard Disclaimer */}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#ef9d45]/35 bg-[#ef9d45]/10 p-4 text-xs leading-5 text-[#efb167]">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <div>
                <strong>Important Visitor & Transport Notice:</strong>{" "}
                {tripPlan.disclaimer}
              </div>
            </div>

            {/* Interactive Trip Map + Day-by-Day Schedule Grid */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <div className="space-y-5">
                {tripPlan.days.map((day) => (
                  <div
                    key={day.dayNumber}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="eyebrow text-[#efb167]">
                          DAY {day.dayNumber} · {day.isoDate}
                        </span>
                        <h3 className="mt-0.5 font-serif text-2xl text-white">
                          Day {day.dayNumber} Schedule ({day.items.length}{" "}
                          {day.items.length === 1 ? "stop" : "stops"})
                        </h3>
                      </div>
                    </div>

                    {day.items.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-white/50">
                        No cultural stops scheduled for Day {day.dayNumber} yet.
                        Add an eligible event or open practice from the
                        candidate list on the right.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {day.items.map((item, idx) => (
                          <article
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-[#151927] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="eyebrow text-[10px] text-[#efb167]">
                                STOP {idx + 1} ·{" "}
                                {item.itemType === "CULTURAL_EVENT"
                                  ? "PUBLISHED CULTURAL EVENT"
                                  : "CULTURAL PRACTICE CONTEXT"}{" "}
                                · {item.category}
                              </span>
                              <span
                                className={`eyebrow rounded-full border px-2.5 py-0.5 text-[9px] ${getCertaintyStyle(
                                  item.dateCertainty
                                )}`}
                              >
                                {item.dateCertaintyLabel}
                              </span>
                            </div>

                            <h4 className="mt-2 font-serif text-2xl text-white">
                              {item.titleEn}
                            </h4>
                            {item.titleMr && (
                              <div className="text-xs text-[#efb167]">
                                {item.titleMr}
                              </div>
                            )}

                            <p className="mt-1.5 text-xs leading-5 text-white/70">
                              {item.summaryEn}
                            </p>

                            <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/70 sm:grid-cols-2">
                              <div>
                                <strong className="text-white/90">
                                  Schedule Window:
                                </strong>{" "}
                                {item.scheduleWindowLabel}
                              </div>
                              <div>
                                <strong className="text-white/90">
                                  Venue & Visibility:
                                </strong>{" "}
                                {item.venueLabel} ({item.locationGranularity})
                              </div>
                              <div>
                                <strong className="text-[#8ed5bd]">
                                  Visitor Access:
                                </strong>{" "}
                                {item.visitorAccessLabel} (
                                {item.registrationRequirement})
                              </div>
                              <div>
                                <strong className="text-[#efb167]">
                                  Photography:
                                </strong>{" "}
                                {item.photographyRule}
                              </div>
                              <div className="sm:col-span-2">
                                <strong className="text-white/90">
                                  Etiquette & Boundaries:
                                </strong>{" "}
                                {item.etiquetteNotes}
                              </div>
                              <div className="sm:col-span-2 text-white/55">
                                <strong className="text-white/80">
                                  Official Source:
                                </strong>{" "}
                                {item.sourceAttribution}
                                {item.sourceUrl && (
                                  <a
                                    href={item.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-2 inline-flex items-center gap-1 text-[#efb167] underline"
                                  >
                                    Source Link <ExternalLink size={10} />
                                  </a>
                                )}
                                {" · "}
                                <strong>Last Verified:</strong>{" "}
                                {item.lastVerifiedAt
                                  ? item.lastVerifiedAt.slice(0, 10)
                                  : "Pending confirmation"}
                              </div>
                            </div>

                            {/* Personal Visitor Note Input */}
                            <div className="mt-3 print:hidden">
                              <input
                                value={item.visitorNotes || ""}
                                onChange={(e) =>
                                  handleUpdateVisitorNote(
                                    day.dayNumber,
                                    idx,
                                    e.target.value
                                  )
                                }
                                placeholder="Add personal note or reminder for this stop (e.g., bring notebook, reconfirm morning hours)…"
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white outline-none focus:border-[#ef9d45]"
                              />
                            </div>
                            {item.visitorNotes && (
                              <div className="mt-2 hidden text-xs italic print:block">
                                Visitor Note: {item.visitorNotes}
                              </div>
                            )}

                            {/* Links to Event Page, Place Page & Practice Profile + Reorder/Remove Controls */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 print:hidden">
                              <div className="flex flex-wrap gap-2">
                                {item.eventId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLocation(
                                        `/calendar/${encodeURIComponent(
                                          item.eventId!
                                        )}`
                                      )
                                    }
                                    className="rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/15 px-3 py-1 text-[10px] font-semibold text-[#efb167]"
                                  >
                                    Event Page →
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLocation(
                                      `/places/${encodeURIComponent(
                                        item.placeId
                                      )}`
                                    )
                                  }
                                  className="rounded-full border border-white/15 px-3 py-1 text-[10px] text-white/80 hover:border-[#ef9d45]"
                                >
                                  Location: {item.placeName} →
                                </button>
                                {item.culturalRecordSlug && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLocation(
                                        `/?record=${encodeURIComponent(
                                          item.culturalRecordSlug!
                                        )}#practice-profile`
                                      )
                                    }
                                    className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-3 py-1 text-[10px] text-[#8ed5bd]"
                                  >
                                    Practice:{" "}
                                    {item.culturalRecordTitle || "Profile"} →
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() =>
                                    handleMoveItemInDay(day.dayNumber, idx, -1)
                                  }
                                  className="rounded-lg border border-white/15 p-1 text-white/75 disabled:opacity-30"
                                  title="Move up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === day.items.length - 1}
                                  onClick={() =>
                                    handleMoveItemInDay(day.dayNumber, idx, 1)
                                  }
                                  className="rounded-lg border border-white/15 p-1 text-white/75 disabled:opacity-30"
                                  title="Move down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                {tripPlan.days.length > 1 && (
                                  <select
                                    value={day.dayNumber}
                                    onChange={(e) =>
                                      handleMoveItemBetweenDays(
                                        day.dayNumber,
                                        idx,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="rounded-lg border border-white/15 bg-[#10121c] px-2 py-1 text-[10px] text-white"
                                    title="Move to another day"
                                  >
                                    {tripPlan.days.map((dOpt) => (
                                      <option
                                        key={dOpt.dayNumber}
                                        value={dOpt.dayNumber}
                                      >
                                        Day {dOpt.dayNumber}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveItemFromDay(day.dayNumber, idx)
                                  }
                                  className="rounded-lg border border-red-400/40 bg-red-500/15 p-1 text-red-200 hover:bg-red-500/30"
                                  title="Remove stop"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column: Interactive Map + Add Candidates + Excluded Safeguards */}
              <div className="space-y-6 print:hidden">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101622]">
                  <div className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold text-[#efb167]">
                    ITINERARY GEOGRAPHIC MAP ({tripMarkers.length} STOPS PINNED)
                  </div>
                  <div className="h-[300px] w-full">
                    <MapView
                      className="h-full w-full"
                      center={
                        tripMarkers[0]?.position || { lat: 16.705, lng: 74.2433 }
                      }
                      zoom={9}
                      markers={tripMarkers}
                      onMapReady={(ctrl) => {
                        mapControllerRef.current = ctrl;
                      }}
                    />
                  </div>
                </div>

                {/* Add More Eligible Regional Candidates to Any Day */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="eyebrow text-[10px] text-[#8ed5bd]">
                      ADD ELIGIBLE REGIONAL STOPS (
                      {tripPlan.availableCandidates.length})
                    </span>
                    <select
                      value={candidateDayTarget}
                      onChange={(e) =>
                        setCandidateDayTarget(Number(e.target.value))
                      }
                      className="rounded-lg border border-white/15 bg-[#10121c] px-2.5 py-1 text-xs text-white"
                    >
                      {tripPlan.days.map((d) => (
                        <option key={d.dayNumber} value={d.dayNumber}>
                          Add to Day {d.dayNumber} ({d.isoDate})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                    {tripPlan.availableCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#151927] p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white">
                            {cand.titleEn}
                          </div>
                          <div className="mt-0.5 text-[10px] text-white/50">
                            {cand.category} · {cand.placeName} ·{" "}
                            {cand.dateCertaintyLabel}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddItemToDay(cand, candidateDayTarget)
                          }
                          className="shrink-0 rounded-full border border-[#57c5a9]/45 bg-[#57c5a9]/15 px-3 py-1 text-[10px] font-bold text-[#8ed5bd] hover:bg-[#57c5a9]/25"
                        >
                          + Day {candidateDayTarget}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Excluded by Tourist & Community Safeguards Panel */}
                {tripPlan.excludedSafeguardSummary.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs">
                    <div className="eyebrow flex items-center gap-1.5 text-[10px] text-[#efb167]">
                      <ShieldCheck size={13} />
                      EXCLUDED BY COMMUNITY & TOURIST SAFEGUARDS
                    </div>
                    <p className="mt-1 text-[11px] text-white/55">
                      The following regional entries were intentionally excluded
                      from this itinerary to respect community privacy or
                      unverified visitor access:
                    </p>
                    <ul className="mt-2.5 space-y-1.5 text-[11px] text-white/70">
                      {tripPlan.excludedSafeguardSummary.map((ex, i) => (
                        <li
                          key={`${ex.titleEn}-${i}`}
                          className="rounded-lg border border-white/8 bg-white/[.02] px-2.5 py-1.5"
                        >
                          <strong className="text-white">{ex.titleEn}:</strong>{" "}
                          {ex.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
