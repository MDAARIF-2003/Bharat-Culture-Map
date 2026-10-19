import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Filter,
  Globe2,
  Info,
  ListFilter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  MapView,
  type GeoMapMarker,
  type MapController,
} from "@/components/Map";
import CultureTripPlanner from "@/components/CultureTripPlanner";
import { apiClient } from "@/lib/api";
import {
  CULTURE_CATEGORIES,
  EVENT_SCHEDULE_STATUSES,
  VISITOR_INTEREST_TAGS,
} from "@shared/const";
import type {
  CalendarQueryPayload,
  CulturalEventItem,
  GeoLocation,
  PublicCulturalRecord,
} from "@shared/contracts";

function getScheduleBadgeStyle(status: string): {
  bg: string;
  label: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        bg: "border-[#57c5a9]/45 bg-[#57c5a9]/15 text-[#8ed5bd]",
        label: "Confirmed Schedule",
      };
    case "PROVISIONAL":
      return {
        bg: "border-[#ef9d45]/45 bg-[#ef9d45]/15 text-[#efb167]",
        label: "Provisional Dates",
      };
    case "SEASONAL_ESTIMATE":
      return {
        bg: "border-sky-400/40 bg-sky-500/15 text-sky-200",
        label: "Seasonal / Lunar Estimate",
      };
    case "CANCELLED":
      return {
        bg: "border-red-400/50 bg-red-500/20 text-red-200",
        label: "Cancelled",
      };
    case "PAST":
      return {
        bg: "border-white/20 bg-white/10 text-white/60",
        label: "Past Event",
      };
    default:
      return {
        bg: "border-white/20 bg-white/10 text-white/75",
        label: status,
      };
  }
}

function getVisitorAccessSafeguard(access: string): {
  allowedForGeneralVisitors: boolean;
  headline: string;
  detail: string;
  style: string;
} {
  switch (access) {
    case "DOMESTIC_AND_FOREIGN_PERMITTED":
      return {
        allowedForGeneralVisitors: true,
        headline: "Open to Domestic & International Visitors",
        detail:
          "Visitor access is permitted subject to the registration and on-site etiquette conditions below.",
        style: "border-[#57c5a9]/40 bg-[#57c5a9]/10 text-[#8ed5bd]",
      };
    case "OPEN_PUBLIC":
      return {
        allowedForGeneralVisitors: true,
        headline: "Open Public Cultural Gathering",
        detail:
          "Public attendance is permitted; please respect local community seating and photography rules.",
        style: "border-[#57c5a9]/40 bg-[#57c5a9]/10 text-[#8ed5bd]",
      };
    case "INVITATION_OR_PERMIT_REQUIRED":
      return {
        allowedForGeneralVisitors: false,
        headline: "Advance Registration or Organizer Permit Required",
        detail:
          "Not open for unannounced walk-in tourism. Request participation in advance and wait for confirmation.",
        style: "border-[#ef9d45]/45 bg-[#ef9d45]/15 text-[#efb167]",
      };
    case "LOCAL_COMMUNITY_ONLY":
      return {
        allowedForGeneralVisitors: false,
        headline: "Local Community Observance Only (Not Open to Tourists)",
        detail:
          "This tradition is documented for cultural context only. External visitors should not attend uninvited.",
        style: "border-red-400/40 bg-red-500/15 text-red-200",
      };
    case "ACCESS_NOT_ESTABLISHED":
    default:
      return {
        allowedForGeneralVisitors: false,
        headline: "Visitor Access Not Yet Established",
        detail:
          "Visitor permissions for domestic or foreign guests have not been established. Do not travel without confirming directly with the official organizer.",
        style: "border-[#ef9d45]/45 bg-[#ef9d45]/15 text-[#efb167]",
      };
  }
}

function formatPhotographyRule(rule: string): string {
  switch (rule) {
    case "ALLOWED_NON_COMMERCIAL":
      return "Non-commercial photography allowed (respect personal boundaries)";
    case "PERMISSION_REQUIRED_ON_SITE":
      return "Ask explicit on-site permission from practitioners before photographing";
    case "NO_FLASH_OR_DRONES":
      return "No flash photography, tripods, or drones permitted";
    case "PROHIBITED":
      return "Photography and audio/video recording strictly prohibited";
    default:
      return rule;
  }
}

export default function CulturalCalendar() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const mapControllerRef = useRef<MapController | null>(null);

  const eventIdParam = params?.id ? decodeURIComponent(params.id) : null;

  // Detail View State (/calendar/:id)
  const [detailEvent, setDetailEvent] = useState<CulturalEventItem | null>(null);
  const [detailLinkedRecord, setDetailLinkedRecord] =
    useState<PublicCulturalRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Directory & Filter State (/calendar)
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "map" | "planner">(
    typeof window !== "undefined" &&
      (window.location.pathname.startsWith("/trip-planner") ||
        new URLSearchParams(window.location.search).get("view") === "planner")
      ? "planner"
      : "list"
  );
  const [locations, setLocations] = useState<GeoLocation[]>([]);
  const [calendarData, setCalendarData] =
    useState<CalendarQueryPayload | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // Filters
  const [stateId, setStateId] = useState<string>("");
  const [districtId, setDistrictId] = useState<string>("");
  const [placeId, setPlaceId] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [scheduleStatus, setScheduleStatus] = useState<string>("ALL");
  const [visitorInterest, setVisitorInterest] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [onlyRecurring, setOnlyRecurring] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 6;

  // Month Grid State for Calendar View
  const [calendarMonth, setCalendarMonth] = useState<{
    year: number;
    month: number; // 0-indexed (9 = Oct, 10 = Nov, 11 = Dec)
  }>({ year: 2026, month: 10 }); // Default November 2026 where core Kolhapur events start

  // Public Event Submission Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [subTitleEn, setSubTitleEn] = useState("");
  const [subTitleMr, setSubTitleMr] = useState("");
  const [subCategory, setSubCategory] = useState("Festival");
  const [subStateId, setSubStateId] = useState("loc-state-maharashtra");
  const [subDistrictId, setSubDistrictId] = useState(
    "loc-district-kolhapur-district"
  );
  const [subVenueLabel, setSubVenueLabel] = useState("");
  const [subStartDate, setSubStartDate] = useState("2026-11-20");
  const [subEndDate, setSubEndDate] = useState("2026-11-20");
  const [subDescriptionEn, setSubDescriptionEn] = useState("");
  const [subSourceAttribution, setSubSourceAttribution] = useState("");
  const [subSourceUrl, setSubSourceUrl] = useState("");
  const [subName, setSubName] = useState("");
  const [subContact, setSubContact] = useState("");
  const [subBanner, setSubBanner] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);

  useEffect(() => {
    apiClient
      .getLocations()
      .then(({ locations: locs }) => setLocations(locs))
      .catch(() => {});
  }, []);

  // Load single event detail when /calendar/:id is active
  useEffect(() => {
    if (!eventIdParam) {
      setDetailEvent(null);
      setDetailLinkedRecord(null);
      return;
    }
    let mounted = true;
    setLoadingDetail(true);
    setDetailError("");
    apiClient
      .getPublicEventById(eventIdParam)
      .then(({ event, linkedRecord }) => {
        if (!mounted) return;
        setDetailEvent(event);
        setDetailLinkedRecord(linkedRecord);
      })
      .catch((err) => {
        if (!mounted) return;
        setDetailError(
          err?.message || "Cultural event not found or not published."
        );
      })
      .finally(() => {
        if (mounted) setLoadingDetail(false);
      });
    return () => {
      mounted = false;
    };
  }, [eventIdParam]);

  // Load filtered calendar events when /calendar is active
  useEffect(() => {
    if (eventIdParam) return;
    let mounted = true;
    setLoadingList(true);
    setListError("");
    apiClient
      .queryPublicCalendar({
        stateId: stateId || undefined,
        districtId: districtId || undefined,
        placeId: placeId || undefined,
        category: category !== "All" ? category : undefined,
        scheduleStatus: scheduleStatus !== "ALL" ? scheduleStatus : undefined,
        visitorInterest:
          visitorInterest !== "All" ? visitorInterest : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        onlyRecurring: onlyRecurring || undefined,
        q: searchQuery.trim() || undefined,
        page,
        pageSize: viewMode === "list" ? pageSize : 50,
      })
      .then((payload) => {
        if (!mounted) return;
        setCalendarData(payload);
      })
      .catch((err) => {
        if (!mounted) return;
        setListError(err?.message || "Failed to load cultural calendar.");
      })
      .finally(() => {
        if (mounted) setLoadingList(false);
      });
    return () => {
      mounted = false;
    };
  }, [
    eventIdParam,
    stateId,
    districtId,
    placeId,
    category,
    scheduleStatus,
    visitorInterest,
    dateFrom,
    dateTo,
    onlyRecurring,
    searchQuery,
    page,
    viewMode,
  ]);

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

  const events = calendarData?.events || [];

  const mapMarkers: GeoMapMarker[] = useMemo(() => {
    const sourceEvents = eventIdParam
      ? detailEvent
        ? [detailEvent]
        : []
      : events;
    const list: GeoMapMarker[] = [];
    for (const evt of sourceEvents) {
      if (evt.locationGranularity === "HIDDEN" || !evt.publicCenter) continue;
      list.push({
        id: `cal-evt-${evt.id}`,
        position: evt.publicCenter,
        title: `${evt.titleEn} (${evt.startDate} · ${evt.scheduleStatus})`,
        badgeText: `${evt.titleEn} · ${evt.startDate}`,
        variant:
          evt.scheduleStatus === "CONFIRMED"
            ? "verified-record"
            : "demo-record",
        onClick: () => {
          if (!eventIdParam) {
            setLocation(`/calendar/${encodeURIComponent(evt.id)}`);
          }
        },
      });
    }
    return list;
  }, [eventIdParam, detailEvent, events, setLocation]);

  // Build Month Calendar Grid cells for Calendar View
  const monthDaysGrid = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells: Array<{
      day: number | null;
      isoDate: string | null;
      dayEvents: CulturalEventItem[];
    }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, isoDate: null, dayEvents: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const dayEvents = events.filter((evt) => {
        const start = evt.startDate;
        const end = evt.endDate || evt.startDate;
        if (isoDate >= start && isoDate <= end) return true;
        return (evt.occurrences || []).some((occ) => {
          const oStart = occ.startDate;
          const oEnd = occ.endDate || occ.startDate;
          return isoDate >= oStart && isoDate <= oEnd;
        });
      });
      cells.push({ day: d, isoDate, dayEvents });
    }
    return cells;
  }, [calendarMonth, events]);

  const monthLabel = useMemo(() => {
    const dt = new Date(Date.UTC(calendarMonth.year, calendarMonth.month, 1));
    return dt.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }, [calendarMonth]);

  const clearAllFilters = () => {
    setStateId("");
    setDistrictId("");
    setPlaceId("");
    setCategory("All");
    setScheduleStatus("ALL");
    setVisitorInterest("All");
    setDateFrom("");
    setDateTo("");
    setOnlyRecurring(false);
    setSearchQuery("");
    setPage(1);
  };

  const handlePublicSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEvent(true);
    setSubBanner("");
    try {
      const resp = await apiClient.submitPublicCalendarEvent({
        titleEn: subTitleEn,
        titleMr: subTitleMr,
        category: subCategory,
        stateId: subStateId,
        districtId: subDistrictId || null,
        venueLabel: subVenueLabel,
        startDate: subStartDate,
        endDate: subEndDate || subStartDate,
        descriptionEn: subDescriptionEn,
        sourceAttribution: subSourceAttribution,
        sourceUrl: subSourceUrl || null,
        submittedByPublicName: subName,
        submittedByPublicContact: subContact,
      });
      setSubBanner(resp.message);
      setSubTitleEn("");
      setSubTitleMr("");
      setSubVenueLabel("");
      setSubDescriptionEn("");
      setSubSourceAttribution("");
      setSubSourceUrl("");
      setSubmitModalOpen(false);
    } catch (err: any) {
      setSubBanner(err?.message || "Failed to submit event for moderation.");
    } finally {
      setSubmittingEvent(false);
    }
  };

  // ===========================================================================
  // EVENT DETAIL VIEW (/calendar/:id)
  // ===========================================================================
  if (eventIdParam) {
    const schedBadge = detailEvent
      ? getScheduleBadgeStyle(detailEvent.scheduleStatus)
      : null;
    const safeguard = detailEvent
      ? getVisitorAccessSafeguard(detailEvent.visitorAccess)
      : null;

    return (
      <div className="min-h-screen bg-[#10121c] text-[#fbf5eb]">
        <header className="sticky top-0 z-[1200] border-b border-white/10 bg-[#111522]/90 backdrop-blur-xl">
          <div className="container flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLocation("/calendar")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/80 hover:border-[#ef9d45] hover:text-white"
              >
                <ArrowLeft size={14} />
                Back to Cultural Calendar
              </button>
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="hidden text-xs text-white/60 hover:text-white sm:inline-block"
              >
                Home
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLocation("/admin")}
              className="rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3.5 py-1.5 text-xs font-semibold text-[#efb167]"
            >
              Admin Panel
            </button>
          </div>
        </header>

        <div className="container py-10 md:py-14">
          {loadingDetail ? (
            <div className="rounded-3xl border border-white/10 bg-[#151927] p-12 text-center text-sm text-white/60">
              Loading cultural event details…
            </div>
          ) : detailError || !detailEvent ? (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-10 text-center">
              <h1 className="font-serif text-3xl text-white">
                Cultural Event Not Available
              </h1>
              <p className="mt-2 text-sm text-white/65">{detailError}</p>
              <button
                type="button"
                onClick={() => setLocation("/calendar")}
                className="mt-6 rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
              >
                Return to Cultural Calendar
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cancelled or Outdated Banner */}
              {detailEvent.scheduleStatus === "CANCELLED" && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-400/50 bg-red-500/15 p-5 text-red-100">
                  <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="eyebrow font-bold text-red-200">
                      EVENT CANCELLED
                    </div>
                    <p className="mt-1 text-xs leading-5">
                      {detailEvent.cancellationReason ||
                        "This cultural event occurrence has been marked as cancelled by the organizer or administrator. Do not travel for this occurrence."}
                    </p>
                  </div>
                </div>
              )}

              {detailEvent.scheduleStatus === "PAST" && (
                <div className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-4 text-white/75">
                  <Clock size={18} className="mt-0.5 shrink-0 text-[#efb167]" />
                  <div className="text-xs leading-5">
                    <strong>Past Event Record:</strong> This event window (
                    {detailEvent.startDate}) has already passed. Future
                    occurrences are never automatically inferred from a prior
                    year’s date and will be posted only after verification.
                  </div>
                </div>
              )}

              {/* Header + Map Grid */}
              <div className="grid gap-8 rounded-[2rem] border border-white/12 bg-[#151927] p-6 md:p-9 lg:grid-cols-[1.2fr_.8fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="eyebrow rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3 py-1 text-[#efb167]">
                      {detailEvent.category} · {detailEvent.eventType}
                    </span>
                    {schedBadge && (
                      <span
                        className={`eyebrow rounded-full border px-3 py-1 ${schedBadge.bg}`}
                      >
                        {schedBadge.label}
                      </span>
                    )}
                    {detailEvent.isRecurringTradition && (
                      <span className="eyebrow rounded-full border border-purple-400/40 bg-purple-500/15 px-3 py-1 text-purple-200">
                        Recurring Tradition ({detailEvent.recurrencePattern})
                      </span>
                    )}
                  </div>

                  <h1 className="display mt-4 text-4xl text-[#fbf5eb] md:text-6xl">
                    {detailEvent.titleEn}
                  </h1>
                  {detailEvent.titleMr && (
                    <div className="mt-2 font-serif text-2xl text-[#efb167]">
                      {detailEvent.titleMr}
                    </div>
                  )}

                  <p className="mt-4 text-sm leading-7 text-white/75">
                    {detailEvent.descriptionEn}
                  </p>
                  {detailEvent.descriptionMr && (
                    <p className="mt-2 text-xs leading-6 text-white/55">
                      {detailEvent.descriptionMr}
                    </p>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="eyebrow text-[10px] text-[#efb167]">
                        DATE & TIME ({detailEvent.timezone})
                      </div>
                      <div className="mt-1.5 font-serif text-xl text-white">
                        {detailEvent.startDate}
                        {detailEvent.endDate &&
                        detailEvent.endDate !== detailEvent.startDate
                          ? ` → ${detailEvent.endDate}`
                          : ""}
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {detailEvent.startTime
                          ? `${detailEvent.startTime}${detailEvent.endTime ? ` – ${detailEvent.endTime}` : ""}`
                          : "Specific hours subject to local announcement"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="eyebrow text-[10px] text-[#8ed5bd]">
                        LOCATION & PRIVACY GRANULARITY (
                        {detailEvent.locationGranularity})
                      </div>
                      <div className="mt-1.5 text-sm font-semibold text-white">
                        {detailEvent.venueLabel}
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {[
                          detailEvent.cityTownName,
                          detailEvent.talukaName,
                          detailEvent.districtName,
                          detailEvent.stateName,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  </div>

                  {/* Direct Links to Associated Geographic Place & Cultural Practice Profile */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const targetPlaceId =
                          detailEvent.cityTownId ||
                          detailEvent.talukaId ||
                          detailEvent.districtId ||
                          detailEvent.stateId;
                        setLocation(
                          `/places/${encodeURIComponent(targetPlaceId)}`
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-[#ef9d45] hover:text-[#efb167]"
                    >
                      <MapPin size={13} className="text-[#57c5a9]" />
                      Explore Location Profile (
                      {detailEvent.cityTownName ||
                        detailEvent.districtName ||
                        detailEvent.stateName}
                      )
                    </button>

                    {(detailEvent.culturalRecordSlug ||
                      detailLinkedRecord?.slug) && (
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/?record=${encodeURIComponent(
                              detailEvent.culturalRecordSlug ||
                                detailLinkedRecord!.slug
                            )}#practice-profile`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#ef9d45]/45 bg-[#ef9d45]/15 px-4 py-2 text-xs font-semibold text-[#efb167] hover:bg-[#ef9d45]/25"
                      >
                        <Sparkles size={13} />
                        Associated Cultural Practice:{" "}
                        {detailEvent.culturalRecordTitle ||
                          detailLinkedRecord?.titleEn}
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Map or Masked Location Notice */}
                <div className="flex flex-col gap-4">
                  {detailEvent.locationGranularity === "HIDDEN" ||
                  !detailEvent.publicCenter ? (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#101622] p-6 text-center">
                      <ShieldAlert size={28} className="text-[#efb167]" />
                      <div className="eyebrow mt-3 text-[#efb167]">
                        PROTECTED LOCATION
                      </div>
                      <p className="mt-2 max-w-xs text-xs leading-5 text-white/60">
                        Exact venue coordinates are masked to protect community
                        privacy.
                      </p>
                    </div>
                  ) : (
                    <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#101622]">
                      <MapView
                        className="h-full w-full"
                        center={detailEvent.publicCenter}
                        zoom={
                          detailEvent.locationGranularity === "DISTRICT"
                            ? 9
                            : 12
                        }
                        markers={mapMarkers}
                        onMapReady={(ctrl) => {
                          mapControllerRef.current = ctrl;
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tourist Safeguards, Visitor Access, Etiquette & Photography Rules */}
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
                  <div className="eyebrow text-[#efb167]">
                    VISITOR ACCESS & TOURIST SAFEGUARDS
                  </div>
                  <h2 className="mt-2 font-serif text-3xl text-white">
                    Know before you consider visiting
                  </h2>

                  {safeguard && (
                    <div
                      className={`mt-4 rounded-2xl border p-4 ${safeguard.style}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck size={15} />
                        {safeguard.headline}
                      </div>
                      <p className="mt-1.5 text-xs leading-5 opacity-90">
                        {detailEvent.visitorAccessNote || safeguard.detail}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3.5">
                      <span className="text-white/50">
                        Registration Requirement
                      </span>
                      <span className="text-right font-semibold text-white">
                        {detailEvent.registrationRequirement}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3.5">
                      <span className="text-white/50">
                        Photography & Recording Rule
                      </span>
                      <span className="text-right font-semibold text-[#efb167]">
                        {formatPhotographyRule(detailEvent.photographyRule)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3.5">
                      <span className="text-white/50">Entry Fee</span>
                      <span className="text-right text-white/85">
                        {detailEvent.entryFeeInfo ||
                          "Not established — confirm with official organizer"}
                      </span>
                    </div>
                    {detailEvent.accessibilityInfo && (
                      <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3.5">
                        <span className="text-white/50">Accessibility</span>
                        <span className="text-right text-white/85">
                          {detailEvent.accessibilityInfo}
                        </span>
                      </div>
                    )}
                  </div>

                  {detailEvent.etiquetteNotes && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-xs leading-6 text-white/75">
                      <strong className="text-[#8ed5bd]">
                        Cultural Etiquette & Boundaries:
                      </strong>{" "}
                      {detailEvent.etiquetteNotes}
                    </div>
                  )}
                </section>

                {/* Recurring Tradition vs. Confirmed Occurrences + Source Verification */}
                <section className="flex flex-col justify-between gap-6 rounded-[2rem] border border-white/10 bg-[#151927] p-6 md:p-8">
                  <div>
                    <div className="eyebrow text-[#8ed5bd]">
                      SCHEDULE OCCURRENCES & RECURRENCE DISTINCTION
                    </div>
                    <h2 className="mt-2 font-serif text-3xl text-white">
                      {detailEvent.isRecurringTradition
                        ? "Recurring Tradition vs. Verified Occurrences"
                        : "Documented Schedule Occurrences"}
                    </h2>
                    <p className="mt-2 text-xs leading-6 text-white/65">
                      {detailEvent.recurrenceNote ||
                        "Dates below reflect only documented occurrences. Future festival dates are never inferred automatically from previous years."}
                    </p>

                    <div className="mt-4 space-y-2.5">
                      {(detailEvent.occurrences || []).map((occ) => {
                        const occBadge = getScheduleBadgeStyle(
                          occ.scheduleStatus
                        );
                        return (
                          <div
                            key={occ.id}
                            className="rounded-xl border border-white/10 bg-black/20 p-3.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-white">
                                {occ.label}
                              </span>
                              <span
                                className={`eyebrow rounded-full border px-2.5 py-0.5 text-[9px] ${occBadge.bg}`}
                              >
                                {occBadge.label}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-[#efb167]">
                              {occ.startDate}
                              {occ.endDate && occ.endDate !== occ.startDate
                                ? ` → ${occ.endDate}`
                                : ""}
                              {occ.startTime
                                ? ` · ${occ.startTime}${occ.endTime ? `–${occ.endTime}` : ""}`
                                : ""}
                            </div>
                            {occ.verificationNote && (
                              <div className="mt-1 text-[11px] text-white/55">
                                {occ.verificationNote}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Source Attribution, Last Verification Timestamp & Organizer */}
                  <div className="rounded-2xl border border-white/12 bg-[#101522] p-4 text-xs">
                    <div className="eyebrow text-[10px] text-[#efb167]">
                      SOURCE ATTRIBUTION & VERIFICATION TIMESTAMP
                    </div>
                    <div className="mt-2 text-white/85">
                      <strong>Documented Source:</strong>{" "}
                      {detailEvent.sourceAttribution}
                      {detailEvent.sourceUrl && (
                        <a
                          href={detailEvent.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-[#efb167] underline"
                        >
                          Official Source <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className="mt-1.5 text-white/65">
                      <strong>Organizer:</strong> {detailEvent.organizerDisplay}
                      {detailEvent.organizerContactAuthorized &&
                      detailEvent.organizerPublicContact ? (
                        <span>
                          {" "}
                          · Authorized Contact:{" "}
                          <strong className="text-[#8ed5bd]">
                            {detailEvent.organizerPublicContact}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-white/45">
                          {" "}
                          (Direct contact protected or moderated)
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[11px] text-white/50">
                      <strong>Last Verified:</strong>{" "}
                      {detailEvent.lastVerifiedAt
                        ? new Date(detailEvent.lastVerifiedAt).toUTCString()
                        : "Verification timestamp pending"}{" "}
                      · Always confirm final schedule changes with the official
                      organizer before travelling.
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // PUBLIC CULTURAL CALENDAR DIRECTORY VIEW (/calendar)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-[#10121c] text-[#fbf5eb]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-[1200] border-b border-white/10 bg-[#111522]/90 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
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
              className="hidden items-center gap-1.5 text-xs text-white/70 hover:text-[#efb167] sm:inline-flex"
            >
              <Globe2 size={14} />
              Places Directory
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#57c5a9]/45 bg-[#57c5a9]/15 px-3.5 py-1.5 text-xs font-semibold text-[#8ed5bd] hover:bg-[#57c5a9]/25"
            >
              <Plus size={13} />
              Submit Event for Review
            </button>
            <button
              type="button"
              onClick={() => setLocation("/admin")}
              className="rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3.5 py-1.5 text-xs font-semibold text-[#efb167]"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </header>

      <div className="container py-10 md:py-14">
        {/* Hero Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="eyebrow text-[#efb167]">
              BHARAT CULTUREMAP · CULTURAL CALENDAR
            </div>
            <h1 className="display mt-3 text-5xl text-[#fbf5eb] md:text-6xl">
              Living rhythms,
              <br />
              <em className="text-[#8ed5bd]">documented with care.</em>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
              Distinguishing confirmed event occurrences from recurring lunisolar
              and seasonal traditions. Every listing includes visitor-access
              safeguards, etiquette boundaries, and source verification
              timestamps.
            </p>
          </div>

          {/* View Switcher: List View / Calendar Month Grid / Map View */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/12 bg-[#151927] p-1.5">
            {[
              { id: "list", label: "Event-List View" },
              { id: "calendar", label: "Calendar Grid View" },
              { id: "map", label: "Map View" },
              { id: "planner", label: "Culture Trip Planner" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id as any)}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  viewMode === tab.id
                    ? "bg-[#ef9d45] text-[#241a20]"
                    : "text-white/65 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {subBanner && (
          <div className="mt-6 rounded-2xl border border-[#57c5a9]/40 bg-[#57c5a9]/15 px-4 py-3 text-xs text-[#8ed5bd]">
            {subBanner}
          </div>
        )}

        {/* Summary Counters */}
        {calendarData && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-[#151927] p-3.5">
              <div className="font-serif text-2xl text-white">
                {calendarData.facets.totalPublished}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-white/45">
                Published Events
              </div>
            </div>
            <div className="rounded-2xl border border-[#57c5a9]/30 bg-[#57c5a9]/10 p-3.5">
              <div className="font-serif text-2xl text-[#8ed5bd]">
                {calendarData.facets.confirmedCount}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-[#8ed5bd]/80">
                Confirmed Dates
              </div>
            </div>
            <div className="rounded-2xl border border-[#ef9d45]/30 bg-[#ef9d45]/10 p-3.5">
              <div className="font-serif text-2xl text-[#efb167]">
                {calendarData.facets.provisionalCount}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-[#efb167]/80">
                Provisional
              </div>
            </div>
            <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3.5">
              <div className="font-serif text-2xl text-sky-200">
                {calendarData.facets.seasonalEstimateCount}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-sky-200/80">
                Seasonal / Lunar
              </div>
            </div>
            <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-3.5">
              <div className="font-serif text-2xl text-purple-200">
                {calendarData.facets.recurringTraditionsCount}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-purple-200/80">
                Recurring Traditions
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151927] p-3.5">
              <div className="font-serif text-2xl text-white/75">
                {calendarData.facets.cancelledCount +
                  calendarData.facets.pastCount}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-white/45">
                Cancelled / Past
              </div>
            </div>
          </div>
        )}

        {viewMode === "planner" ? (
          <CultureTripPlanner locations={locations} />
        ) : (
          <>
        {/* Comprehensive Filter Bar (Date Range, State, District, Place, Category, Schedule Status, Visitor Interest) */}
        <section className="mt-6 rounded-3xl border border-white/12 bg-[#151927] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <span className="eyebrow flex items-center gap-2 text-xs text-[#efb167]">
              <Filter size={13} />
              FILTER CULTURAL CALENDAR
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-white/55 underline hover:text-white"
            >
              Reset all filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                SEARCH
              </label>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Event, place, or practice…"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white outline-none"
              />
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
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="">All States & UTs</option>
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
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="">All Districts</option>
                {districtsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                PLACE (TALUKA / CITY / VILLAGE)
              </label>
              <select
                value={placeId}
                onChange={(e) => {
                  setPlaceId(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="">All Places</option>
                {placesList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameEn} ({p.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="All">All Categories</option>
                {CULTURE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                SCHEDULE STATUS
              </label>
              <select
                value={scheduleStatus}
                onChange={(e) => {
                  setScheduleStatus(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="ALL">All Statuses</option>
                {EVENT_SCHEDULE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                FROM DATE
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                TO DATE
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="eyebrow block text-[9px] text-white/45">
                VISITOR INTEREST
              </label>
              <select
                value={visitorInterest}
                onChange={(e) => {
                  setVisitorInterest(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
              >
                <option value="All">All Visitor Interests</option>
                {VISITOR_INTEREST_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-2.5 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={onlyRecurring}
                  onChange={(e) => {
                    setOnlyRecurring(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 accent-[#ef9d45]"
                />
                Recurring traditions only
              </label>
            </div>
          </div>
        </section>

        {/* Loading / Error / Results */}
        {loadingList ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#151927] p-12 text-center text-sm text-white/60">
            Loading cultural events from database…
          </div>
        ) : listError ? (
          <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center text-xs text-red-200">
            {listError}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[#ef9d45]/35 bg-[#ef9d45]/5 p-10 text-center">
            <CalendarIcon size={28} className="mx-auto text-[#efb167]" />
            <div className="eyebrow mt-3 text-[#efb167]">
              NO MATCHING CULTURAL EVENTS
            </div>
            <h2 className="mt-2 font-serif text-3xl text-white">
              No verified events match the current filter criteria
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-white/60">
              Bharat CultureMap never fabricates festival schedules or infers
              dates from prior years. Try broadening your date range or clearing
              filters, or submit a documented regional event for review.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(true)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-xs text-white/80 hover:border-[#ef9d45]"
              >
                Submit an Event
              </button>
            </div>
          </div>
        ) : viewMode === "list" ? (
          /* =================================================================
             1. EVENT-LIST VIEW (with Pagination)
             ================================================================= */
          <div className="mt-8 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              {events.map((evt) => {
                const badge = getScheduleBadgeStyle(evt.scheduleStatus);
                const accessInfo = getVisitorAccessSafeguard(evt.visitorAccess);
                return (
                  <article
                    key={evt.id}
                    className="flex flex-col justify-between rounded-3xl border border-white/12 bg-[#151927] p-6 transition hover:border-[#ef9d45]/45"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="eyebrow text-[10px] text-[#efb167]">
                          {evt.category} · {evt.startDate}
                          {evt.endDate && evt.endDate !== evt.startDate
                            ? ` → ${evt.endDate}`
                            : ""}
                        </span>
                        <span
                          className={`eyebrow rounded-full border px-2.5 py-0.5 text-[9px] ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <h2 className="mt-3 font-serif text-3xl text-white">
                        {evt.titleEn}
                      </h2>
                      {evt.titleMr && (
                        <div className="mt-0.5 text-sm text-[#efb167]">
                          {evt.titleMr}
                        </div>
                      )}

                      <p className="mt-2.5 text-xs leading-6 text-white/70">
                        {evt.descriptionEn}
                      </p>

                      {evt.isRecurringTradition && (
                        <div className="mt-3 rounded-xl border border-purple-400/25 bg-purple-500/10 px-3 py-2 text-[11px] text-purple-200">
                          <strong>Recurring Tradition:</strong>{" "}
                          {evt.recurrenceNote || evt.recurrencePattern}
                        </div>
                      )}

                      {evt.scheduleStatus === "CANCELLED" && (
                        <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-[11px] text-red-200">
                          <strong>Cancelled:</strong>{" "}
                          {evt.cancellationReason ||
                            "This occurrence has been cancelled."}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                        <MapPin size={12} className="text-[#57c5a9]" />
                        <span>{evt.venueLabel}</span>
                        <span>·</span>
                        <span
                          className={
                            accessInfo.allowedForGeneralVisitors
                              ? "text-[#8ed5bd]"
                              : "text-[#efb167]"
                          }
                        >
                          {accessInfo.headline}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-white/45">
                        Source: {evt.sourceAttribution}
                        {evt.lastVerifiedAt
                          ? ` · Verified ${evt.lastVerifiedAt.slice(0, 10)}`
                          : ""}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const pid =
                              evt.cityTownId ||
                              evt.talukaId ||
                              evt.districtId ||
                              evt.stateId;
                            setLocation(`/places/${encodeURIComponent(pid)}`);
                          }}
                          className="rounded-full border border-white/15 px-3 py-1 text-[10px] text-white/75 hover:border-[#ef9d45]"
                        >
                          Place: {evt.cityTownName || evt.districtName || evt.stateName}
                        </button>
                        {evt.culturalRecordSlug && (
                          <button
                            type="button"
                            onClick={() =>
                              setLocation(
                                `/?record=${encodeURIComponent(
                                  evt.culturalRecordSlug!
                                )}#practice-profile`
                              )
                            }
                            className="rounded-full border border-[#57c5a9]/35 bg-[#57c5a9]/10 px-3 py-1 text-[10px] text-[#8ed5bd]"
                          >
                            Practice: {evt.culturalRecordTitle || "View Profile"}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setLocation(`/calendar/${encodeURIComponent(evt.id)}`)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#efb167] hover:underline"
                      >
                        Event Details <ArrowRight size={13} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Bar */}
            {calendarData && calendarData.totalPages > 1 && (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#151927] px-5 py-3 text-xs">
                <span className="text-white/60">
                  Page {calendarData.page} of {calendarData.totalPages} (
                  {calendarData.total} matching events)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full border border-white/15 px-3.5 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= calendarData.totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(calendarData.totalPages, p + 1))
                    }
                    className="rounded-full border border-white/15 px-3.5 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "calendar" ? (
          /* =================================================================
             2. CALENDAR MONTH GRID VIEW
             ================================================================= */
          <div className="mt-8 rounded-3xl border border-white/12 bg-[#151927] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="eyebrow text-[#efb167]">MONTHLY SCHEDULE GRID</div>
                <h2 className="mt-1 font-serif text-3xl text-white">
                  {monthLabel}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth((prev) =>
                      prev.month === 0
                        ? { year: prev.year - 1, month: 11 }
                        : { year: prev.year, month: prev.month - 1 }
                    )
                  }
                  className="rounded-full border border-white/15 p-2 text-white/80 hover:border-[#ef9d45]"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth({ year: 2026, month: 9 })}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:border-[#ef9d45]"
                >
                  Oct 2026
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth({ year: 2026, month: 10 })}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:border-[#ef9d45]"
                >
                  Nov 2026
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth({ year: 2026, month: 11 })}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:border-[#ef9d45]"
                >
                  Dec 2026
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth((prev) =>
                      prev.month === 11
                        ? { year: prev.year + 1, month: 0 }
                        : { year: prev.year, month: prev.month + 1 }
                    )
                  }
                  className="rounded-full border border-white/15 p-2 text-white/80 hover:border-[#ef9d45]"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/45">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthDaysGrid.map((cell, idx) => (
                <div
                  key={cell.isoDate || `blank-${idx}`}
                  className={`min-h-[104px] rounded-2xl border p-2 ${
                    cell.day
                      ? "border-white/10 bg-black/20"
                      : "border-transparent bg-transparent"
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className="text-right text-xs font-semibold text-white/55">
                        {cell.day}
                      </div>
                      <div className="mt-1 space-y-1">
                        {cell.dayEvents.map((evt) => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() =>
                              setLocation(
                                `/calendar/${encodeURIComponent(evt.id)}`
                              )
                            }
                            className={`block w-full truncate rounded-lg border px-2 py-1 text-left text-[10px] font-semibold ${
                              evt.scheduleStatus === "CONFIRMED"
                                ? "border-[#57c5a9]/40 bg-[#57c5a9]/15 text-[#8ed5bd]"
                                : evt.scheduleStatus === "CANCELLED"
                                  ? "border-red-400/40 bg-red-500/20 text-red-200 line-through"
                                  : "border-[#ef9d45]/40 bg-[#ef9d45]/15 text-[#efb167]"
                            }`}
                            title={`${evt.titleEn} (${evt.scheduleStatus})`}
                          >
                            {evt.titleEn}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =================================================================
             3. INTERACTIVE MAP VIEW
             ================================================================= */
          <div className="mt-8 grid gap-6 rounded-3xl border border-white/12 bg-[#151927] p-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#101622]">
              <MapView
                className="h-full w-full"
                center={{ lat: 17.3, lng: 74.4 }}
                zoom={7}
                markers={mapMarkers}
                onMapReady={(ctrl) => {
                  mapControllerRef.current = ctrl;
                }}
              />
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
              <div className="eyebrow text-[#efb167]">
                MAPPED CULTURAL EVENTS ({mapMarkers.length} PINNED)
              </div>
              <p className="text-xs leading-5 text-white/55">
                Events with District-level visibility are pinned to their
                district centroid; Protected/Hidden locations are omitted from
                map coordinates.
              </p>
              {events.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() =>
                    setLocation(`/calendar/${encodeURIComponent(evt.id)}`)
                  }
                  className="block w-full rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left hover:border-[#ef9d45]/50"
                >
                  <div className="text-xs font-semibold text-[#efb167]">
                    {evt.startDate} · {evt.scheduleStatus}
                  </div>
                  <div className="mt-1 font-serif text-xl text-white">
                    {evt.titleEn}
                  </div>
                  <div className="mt-1 text-xs text-white/55">
                    {evt.venueLabel} ({evt.locationGranularity})
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Public Event Submission Modal (Moderation Queue) */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#151927] p-6 text-white shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-[#8ed5bd]">
                  MODERATED CALENDAR SUBMISSION
                </div>
                <h2 className="mt-1 font-serif text-3xl text-white">
                  Submit a Cultural Event for Verification
                </h2>
                <p className="mt-1 text-xs leading-5 text-white/60">
                  Public submissions enter the moderation queue (`UNDER_REVIEW`)
                  and are published only after source attribution and visitor
                  access boundaries are verified.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="rounded-full border border-white/15 p-2 text-white/60 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handlePublicSubmitEvent} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    EVENT TITLE (ENGLISH) *
                  </label>
                  <input
                    required
                    value={subTitleEn}
                    onChange={(e) => setSubTitleEn(e.target.value)}
                    placeholder="e.g., Regional Handloom Exhibition"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    LOCAL-LANGUAGE TITLE (MARATHI / REGIONAL)
                  </label>
                  <input
                    value={subTitleMr}
                    onChange={(e) => setSubTitleMr(e.target.value)}
                    placeholder="मराठी / स्थानिक नाव"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    CATEGORY *
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#10121c] px-3 py-2 text-xs text-white"
                  >
                    {CULTURE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    START DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={subStartDate}
                    onChange={(e) => setSubStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    END DATE
                  </label>
                  <input
                    type="date"
                    value={subEndDate}
                    onChange={(e) => setSubEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    VENUE / PUBLIC LOCATION LABEL *
                  </label>
                  <input
                    required
                    value={subVenueLabel}
                    onChange={(e) => setSubVenueLabel(e.target.value)}
                    placeholder="e.g., Town Hall Courtyard, Kolhapur"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    DOCUMENTED SOURCE OR OFFICIAL NOTICE *
                  </label>
                  <input
                    required
                    value={subSourceAttribution}
                    onChange={(e) => setSubSourceAttribution(e.target.value)}
                    placeholder="e.g., District Cultural Office Notice / Official Gazette"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block text-[10px] text-white/60">
                  DESCRIPTION & VISITOR ETIQUETTE NOTES *
                </label>
                <textarea
                  required
                  rows={3}
                  value={subDescriptionEn}
                  onChange={(e) => setSubDescriptionEn(e.target.value)}
                  placeholder="Describe the event, whether it is open to visitors, and any etiquette rules…"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-xs text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    SUBMITTER NAME *
                  </label>
                  <input
                    required
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="Your name or organization"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="eyebrow block text-[10px] text-white/60">
                    SUBMITTER CONTACT (PRIVATE — FOR REVIEWER ONLY) *
                  </label>
                  <input
                    required
                    value={subContact}
                    onChange={(e) => setSubContact(e.target.value)}
                    placeholder="Email or phone (never published)"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="rounded-full bg-[#ef9d45] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#241a20]"
                >
                  {submittingEvent ? "Submitting…" : "Submit to Moderation Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
