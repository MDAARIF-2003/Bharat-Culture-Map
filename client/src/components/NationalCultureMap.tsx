import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronRight,
  Compass,
  Filter,
  Globe2,
  Layers3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  MapView,
  type GeoMapMarker,
  type MapController,
} from "@/components/Map";
import { apiClient } from "@/lib/api";
import type {
  CultureCategory,
  LocationGranularityOption,
  RecordOrigin,
} from "@shared/const";
import type {
  MapDiscoveryPayload,
  MapRecordSummary,
} from "@shared/contracts";

type Category = CultureCategory;

export type CityRecordItem = {
  id?: string;
  slug?: string;
  traditionSlug?: string | null;
  heroImageUrl?: string | null;
  name: string;
  nameMr?: string;
  category: Category;
  description: string;
  recordOrigin?: RecordOrigin;
  originBadgeLabel?: string;
  verificationStateLabel?: string;
  sourceAttribution?: string | null;
  sourceUrl?: string | null;
  creditedPractitionerLabel?: string;
  displayLocationLabel?: string;
  locationGranularity?: LocationGranularityOption;
  stateName?: string;
  districtName?: string | null;
  cityTownName?: string | null;
  publicCenter?: { lat: number; lng: number } | null;
};

export type CityNode = {
  id?: string;
  name: string;
  nameMr?: string;
  state: string;
  district?: string | null;
  center: { lat: number; lng: number };
  records: CityRecordItem[];
  fieldVerifiedCount?: number;
  demoCount?: number;
};

export type DistrictNode = {
  id: string;
  name: string;
  nameMr?: string;
  center: { lat: number; lng: number };
  cities: string[];
  subdistricts?: Array<{
    id: string;
    name: string;
    nameMr?: string;
    center: { lat: number; lng: number };
    recordCount: number;
  }>;
  records?: CityRecordItem[];
  recordCount: number;
  fieldVerifiedCount: number;
  demoCount: number;
};

export type StateNode = {
  id?: string;
  name: string;
  nameMr?: string;
  abbr: string;
  center: { lat: number; lng: number };
  districts: DistrictNode[];
  cities: string[];
  recordCount: number;
  fieldVerifiedCount: number;
  demoCount: number;
};

type NationalCultureMapProps = {
  onExploreStory?: (record: CityRecordItem, city: CityNode) => void;
  refreshTrigger?: number;
};

const categories: Category[] = [
  "Craft",
  "Music",
  "Dance",
  "Performance",
  "Festival",
  "Traditional Knowledge",
  "Textile",
  "Food Heritage",
  "Games",
];

function formatOriginCounts(verified: number, reference: number): string {
  if (verified > 0 && reference > 0) {
    return `${verified} practitioner-approved · ${reference} reference`;
  }
  if (verified > 0) {
    return `${verified} practitioner-approved record${verified === 1 ? "" : "s"}`;
  }
  if (reference > 0) {
    return `${reference} reference (${verified} practitioner-approved)`;
  }
  return "Collection in progress (0 entries)";
}

export default function NationalCultureMap({
  onExploreStory,
  refreshTrigger = 0,
}: NationalCultureMapProps) {
  const [, setLocation] = useLocation();
  const mapControllerRef = useRef<MapController | null>(null);
  const [mapLayerFilter, setMapLayerFilter] = useState<"all" | "places" | "records" | "practitioner-approved" | "events">("all");
  const [mapData, setMapData] = useState<MapDiscoveryPayload | null>(null);
  const [loadingApi, setLoadingApi] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string>("");
  const [includeDemo, setIncludeDemo] = useState(true);
  const [mapLevel, setMapLevel] = useState<
    "india" | "state" | "district" | "city"
  >("india");
  const [viewTarget, setViewTarget] = useState<{
    center: { lat: number; lng: number };
    zoom: number;
  }>({
    center: { lat: 21.15, lng: 79.0 },
    zoom: 5,
  });
  const [selectedState, setSelectedState] = useState<StateNode | null>(null);
  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictNode | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityNode | null>(null);
  const [hoveredState, setHoveredState] = useState<StateNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeRecord, setActiveRecord] = useState<{
    record: CityRecordItem;
    city: CityNode;
  } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoadingApi(true);
    setApiError("");
    apiClient
      .getMapDiscovery(includeDemo)
      .then((payload) => {
        if (!mounted) return;
        setMapData(payload);
        if (selectedState) {
          const updatedState =
            payload.states.find((s) => s.name === selectedState.name) || null;
          setSelectedState(updatedState);
          if (selectedDistrict && updatedState) {
            const updatedDist =
              updatedState.districts.find(
                (d) => d.name === selectedDistrict.name
              ) || null;
            setSelectedDistrict(updatedDist);
          }
        }
        if (selectedCity) {
          const updatedCity = payload.cities[selectedCity.name] || null;
          setSelectedCity(updatedCity);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setApiError(
          err?.message || "Failed to load geographic discovery data from API."
        );
      })
      .finally(() => {
        if (mounted) setLoadingApi(false);
      });
    return () => {
      mounted = false;
    };
  }, [includeDemo, refreshTrigger]);

  const stateList: StateNode[] = useMemo(
    () => mapData?.states || [],
    [mapData]
  );
  const cities: Record<string, CityNode> = useMemo(
    () => mapData?.cities || {},
    [mapData]
  );

  // Deduplicate records across cities/districts by slug/id
  const allRecords = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<CityRecordItem & { city: CityNode }> = [];
    for (const city of Object.values(cities)) {
      for (const item of city.records) {
        const key = item.id || item.slug || `${city.name}-${item.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ ...item, city });
      }
    }
    return list;
  }, [cities]);

  const fieldVerifiedCount =
    mapData?.stats.fieldVerifiedPublished ??
    allRecords.filter((r) => r.recordOrigin === "FIELD_VERIFIED").length;
  const demoReferenceCount =
    mapData?.stats.demoReferencePublished ??
    allRecords.filter((r) => r.recordOrigin === "DEMO_REFERENCE").length;

  const eventsList = useMemo(() => mapData?.events || [], [mapData]);
  const traditionsList = useMemo(() => mapData?.traditions || [], [mapData]);

  const placeConnectedTraditions = useMemo(() => {
    if (selectedCity) {
      return traditionsList.filter((t) =>
        t.places.some(
          (p) =>
            p.locationId === selectedCity.id ||
            p.locationNameEn.toLowerCase() === selectedCity.name.toLowerCase() ||
            (selectedCity.district &&
              p.districtName &&
              selectedCity.district
                .toLowerCase()
                .includes(p.districtName.toLowerCase()))
        )
      );
    }
    if (selectedDistrict) {
      return traditionsList.filter((t) =>
        t.places.some(
          (p) =>
            p.districtId === selectedDistrict.id ||
            (p.districtName &&
              selectedDistrict.name
                .toLowerCase()
                .includes(p.districtName.toLowerCase()))
        )
      );
    }
    if (selectedState) {
      return traditionsList.filter(
        (t) =>
          t.statesRepresented.includes(selectedState.name) ||
          t.places.some((p) => p.stateName === selectedState.name)
      );
    }
    return [];
  }, [traditionsList, selectedCity, selectedDistrict, selectedState]);

  const visibleCityRecords = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.records.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (mapLayerFilter === "practitioner-approved" && item.recordOrigin !== "FIELD_VERIFIED") return false;
      return true;
    });
  }, [selectedCity, activeCategory, mapLayerFilter]);

  const visibleDistrictRecords = useMemo(() => {
    if (!selectedDistrict) return [];
    const raw = selectedDistrict.records || [];
    return raw.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (mapLayerFilter === "practitioner-approved" && item.recordOrigin !== "FIELD_VERIFIED") return false;
      return true;
    });
  }, [selectedDistrict, activeCategory, mapLayerFilter]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { cities: [] as CityNode[], records: [] as Array<CityRecordItem & { city: CityNode }> };
    const matchedCities = Object.values(cities).filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        (city.nameMr || "").toLowerCase().includes(q) ||
        (city.district || "").toLowerCase().includes(q) ||
        city.state.toLowerCase().includes(q)
    );
    const matchedRecords = allRecords.filter(
      (rec) =>
        rec.name.toLowerCase().includes(q) ||
        (rec.nameMr || "").toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        (rec.displayLocationLabel || "").toLowerCase().includes(q)
    );
    return {
      cities: matchedCities.slice(0, 6),
      records: matchedRecords.slice(0, 6),
    };
  }, [search, cities, allRecords]);

  const moveToLocation = (
    center: { lat: number; lng: number },
    zoom: number
  ) => {
    setViewTarget({ center, zoom });
    mapControllerRef.current?.panTo(center, zoom);
  };

  const openState = (state: StateNode) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setMapLevel("state");
    setActiveRecord(null);
    moveToLocation(state.center, 7);
  };

  const openDistrict = (district: DistrictNode, parentState?: StateNode) => {
    const st =
      parentState ||
      selectedState ||
      stateList.find((s) =>
        s.districts.some((d) => d.id === district.id || d.name === district.name)
      ) ||
      null;
    if (st) setSelectedState(st);
    setSelectedDistrict(district);
    setSelectedCity(null);
    setMapLevel("district");
    setActiveRecord(null);
    moveToLocation(district.center, 10);
  };

  const openCity = (city: CityNode) => {
    const state =
      stateList.find((item) => item.name === city.state) || selectedState;
    const district =
      state?.districts.find((d) => d.name === city.district) ||
      selectedDistrict;
    setSelectedState(state ?? null);
    setSelectedDistrict(district ?? null);
    setSelectedCity(city);
    setMapLevel("city");
    setActiveRecord(null);
    moveToLocation(city.center, 12);
  };

  const selectRecordOnMap = (record: CityRecordItem, fallbackCity: CityNode) => {
    setActiveRecord({ record, city: fallbackCity });
    const targetCoord = record.publicCenter || fallbackCity.center;
    moveToLocation(targetCoord, mapLevel === "city" ? 13 : 11);
  };

  const resetMap = () => {
    setMapLevel("india");
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setActiveRecord(null);
    moveToLocation({ lat: 21.15, lng: 79.0 }, 5);
  };

  // Build declarative geographic markers from backend data (zero hardcoded dummy points)
  const mapMarkers: GeoMapMarker[] = useMemo(() => {
    const list: GeoMapMarker[] = [];

    if (mapLayerFilter === "events") {
      for (const evt of eventsList) {
        if (activeCategory !== "All" && evt.category !== activeCategory) continue;
        list.push({
          id: `evt-${evt.id}`,
          position: evt.center,
          title: `${evt.titleEn} (${evt.startDate} · ${evt.venueLabel})`,
          badgeText: `${evt.titleEn} · ${evt.startDate}`,
          variant: "verified-record",
          onClick: () => {
            if (evt.cityTownId) {
              setLocation(`/places/${encodeURIComponent(evt.cityTownId)}`);
            } else if (evt.districtId) {
              setLocation(`/places/${encodeURIComponent(evt.districtId)}`);
            }
          },
        });
      }
      return list;
    }

    if (mapLevel === "india") {
      for (const state of stateList) {
        if (
          activeCategory !== "All" &&
          !allRecords.some(
            (r) =>
              r.city.state === state.name && r.category === activeCategory
          )
        ) {
          continue;
        }
        list.push({
          id: `state-${state.abbr}`,
          position: state.center,
          title: `${state.name} (${formatOriginCounts(state.fieldVerifiedCount || 0, state.demoCount || 0)})`,
          badgeText: `${state.abbr} · ${state.recordCount}`,
          variant: "state",
          selected: hoveredState?.name === state.name,
          onClick: () => openState(state),
          onMouseEnter: () => setHoveredState(state),
          onMouseLeave: () => setHoveredState(null),
        });
      }
      return list;
    }

    if (mapLevel === "state" && selectedState) {
      for (const district of selectedState.districts) {
        list.push({
          id: `dist-${district.id}`,
          position: district.center,
          title: `${district.name} (${formatOriginCounts(district.fieldVerifiedCount, district.demoCount)})`,
          badgeText: `${district.name.replace(/ District$/i, "")} · ${district.recordCount}`,
          variant: "district",
          onClick: () => openDistrict(district, selectedState),
        });
      }
      return list;
    }

    if (mapLevel === "district" && selectedDistrict) {
      // 1. Render Taluka / City / Town pins inside this district
      for (const cityName of selectedDistrict.cities) {
        const city = cities[cityName];
        if (!city) continue;
        list.push({
          id: `city-${city.name}`,
          position: city.center,
          title: `${city.name}, ${selectedDistrict.name}`,
          badgeText: city.name,
          variant: "city",
          onClick: () => openCity(city),
        });
      }

      // 2. Render cultural practice markers in this district using privacy-enforced publicCenter
      const fallbackCity =
        (selectedDistrict.cities[0] && cities[selectedDistrict.cities[0]]) || {
          name: selectedDistrict.name,
          state: selectedState?.name || "Maharashtra",
          district: selectedDistrict.name,
          center: selectedDistrict.center,
          records: [],
        };

      for (const rec of visibleDistrictRecords) {
        if (rec.locationGranularity === "HIDDEN" || !rec.publicCenter) continue;
        const recCity =
          (rec.cityTownName && cities[rec.cityTownName]) || fallbackCity;
        const isSelected =
          activeRecord?.record.slug === rec.slug ||
          activeRecord?.record.name === rec.name;
        list.push({
          id: `rec-dist-${rec.id || rec.slug || rec.name}`,
          position: rec.publicCenter,
          title: `${rec.name} (${rec.recordOrigin === "FIELD_VERIFIED" ? "Practitioner-approved" : "Reference information"})`,
          badgeText: rec.name,
          variant:
            rec.recordOrigin === "FIELD_VERIFIED"
              ? "verified-record"
              : "demo-record",
          selected: isSelected,
          onClick: () => selectRecordOnMap(rec, recCity),
        });
      }
      return list;
    }

    if (mapLevel === "city" && selectedCity) {
      for (const rec of visibleCityRecords) {
        if (rec.locationGranularity === "HIDDEN") continue;
        // Respect Rights Passport locationGranularity: use backend-masked publicCenter
        const pos = rec.publicCenter || selectedCity.center;
        const isSelected =
          activeRecord?.record.slug === rec.slug ||
          activeRecord?.record.name === rec.name;
        list.push({
          id: `rec-city-${rec.id || rec.slug || rec.name}`,
          position: pos,
          title: `${rec.name} — ${rec.displayLocationLabel || selectedCity.name}`,
          badgeText: rec.name,
          variant:
            rec.recordOrigin === "FIELD_VERIFIED"
              ? "verified-record"
              : "demo-record",
          selected: isSelected,
          onClick: () => selectRecordOnMap(rec, selectedCity),
        });
      }
      return list;
    }

    return list;
  }, [
    mapLevel,
    stateList,
    cities,
    allRecords,
    selectedState,
    selectedDistrict,
    selectedCity,
    visibleDistrictRecords,
    visibleCityRecords,
    activeCategory,
    hoveredState,
    activeRecord,
    mapLayerFilter,
    eventsList,
    setLocation,
  ]);

  const panelTitle =
    selectedCity?.name ??
    selectedDistrict?.name ??
    selectedState?.name ??
    "India";
  const panelSubtitle = selectedCity
    ? `${selectedCity.district ? selectedCity.district + " · " : ""}${selectedCity.state}, India`
    : selectedDistrict
      ? `${selectedState?.name || "Maharashtra"}, India · District Layer`
      : selectedState
        ? "Explore districts, talukas/cities, and living traditions in this state"
        : "OpenStreetMap geographic discovery layer";

  // Structured Offline Fallback Browser (shown inside map viewport only when tiles are unreachable)
  const offlineHierarchyBrowser = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="eyebrow text-[#8ed5bd]">
          OFFLINE GEOGRAPHIC HIERARCHY DIRECTORY ({mapLevel.toUpperCase()} VIEW)
        </div>
        <div className="flex gap-2">
          {mapLevel !== "india" && (
            <button
              type="button"
              onClick={resetMap}
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:border-[#ef9d45] hover:text-white"
            >
              ← All India States
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const mh = stateList.find((s) => s.name === "Maharashtra");
              const kol = mh?.districts.find(
                (d) => d.name === "Kolhapur District"
              );
              if (mh && kol) openDistrict(kol, mh);
            }}
            className="rounded-full bg-[#ef9d45]/20 border border-[#ef9d45]/50 px-3 py-1 text-xs font-semibold text-[#efb167]"
          >
            Jump to Kolhapur District
          </button>
        </div>
      </div>

      {mapLevel === "india" && (
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {stateList.map((st) => (
            <button
              key={st.name}
              type="button"
              onClick={() => openState(st)}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] p-3 text-left hover:border-[#ef9d45]/50"
            >
              <div>
                <div className="text-sm font-semibold text-white">
                  {st.name}
                </div>
                <div className="eyebrow mt-1 text-[9px] text-white/45">
                  {formatOriginCounts(st.fieldVerifiedCount, st.demoCount)}
                </div>
              </div>
              <span className="eyebrow rounded-full bg-white/5 px-2 py-1 text-[#efb167]">
                {st.abbr}
              </span>
            </button>
          ))}
        </div>
      )}

      {mapLevel === "state" && selectedState && (
        <div className="grid gap-3 sm:grid-cols-2">
          {selectedState.districts.map((dist) => (
            <button
              key={dist.id}
              type="button"
              onClick={() => openDistrict(dist, selectedState)}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] p-4 text-left hover:border-[#ef9d45]/50"
            >
              <div>
                <div className="font-serif text-xl text-white">{dist.name}</div>
                <div className="mt-1 text-xs text-white/50">
                  Cities/Talukas: {dist.cities.join(", ")}
                </div>
                <div className="eyebrow mt-2 text-[#8ed5bd]">
                  {formatOriginCounts(dist.fieldVerifiedCount, dist.demoCount)}
                </div>
              </div>
              <ChevronRight size={16} className="text-[#efb167]" />
            </button>
          ))}
        </div>
      )}

      {(mapLevel === "district" || mapLevel === "city") && (
        <div className="space-y-4">
          {selectedDistrict && (
            <div className="flex flex-wrap gap-2">
              {selectedDistrict.cities.map((cName) => {
                const cNode = cities[cName];
                if (!cNode) return null;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => openCity(cNode)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                      selectedCity?.name === cName
                        ? "border-[#ef9d45] bg-[#ef9d45] text-[#241a20]"
                        : "border-white/15 bg-white/5 text-white/80 hover:border-[#ef9d45]/50"
                    }`}
                  >
                    {cName} ({cNode.records.length})
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            {(selectedCity ? visibleCityRecords : visibleDistrictRecords).map(
              (rec) => {
                const targetCity: CityNode | undefined =
                  selectedCity ||
                  (rec.cityTownName && cities[rec.cityTownName]) ||
                  (selectedDistrict
                    ? {
                        name: selectedDistrict.name,
                        state: selectedState?.name || rec.stateName || "India",
                        district: selectedDistrict.name,
                        center: selectedDistrict.center,
                        records: [],
                      }
                    : undefined);
                return (
                  <button
                    key={rec.id || rec.slug || rec.name}
                    type="button"
                    onClick={() => {
                      if (targetCity) {
                        setActiveRecord({ record: rec, city: targetCity });
                        onExploreStory?.(rec, targetCity);
                      }
                    }}
                    className="rounded-xl border border-white/10 bg-white/[.03] p-3.5 text-left hover:border-[#ef9d45]/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-lg text-white">
                        {rec.name}
                      </span>
                      <span
                        className={`eyebrow text-[9px] ${
                          rec.recordOrigin === "FIELD_VERIFIED"
                            ? "text-[#8ed5bd]"
                            : "text-[#efb167]"
                        }`}
                      >
                        {rec.recordOrigin === "FIELD_VERIFIED"
                          ? "PRACTITIONER-APPROVED"
                          : "REFERENCE"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {rec.displayLocationLabel} · Granularity:{" "}
                      {rec.locationGranularity || "DISTRICT"}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section
      id="culturemap"
      className="grain relative isolate z-10 scroll-mt-28 bg-[#151927] py-24 md:py-32"
    >
      <div className="container">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="eyebrow mb-4 flex items-center gap-3 text-[#e7a25b]">
              <span className="h-px w-8 bg-current" />
              01 / CULTUREMAP
            </div>
            <h2 className="display max-w-[680px] text-5xl leading-[.95] text-[#fbf5eb] md:text-7xl">
              Travel through India.
              <br />
              <em className="text-[#efb167]">Let culture appear.</em>
            </h2>
          </div>
          <div className="max-w-[360px] text-sm leading-6 text-white/50">
            Geographic discovery from India to State, District (including{" "}
            <button
              type="button"
              onClick={() => {
                const mh = stateList.find((s) => s.name === "Maharashtra");
                const kol = mh?.districts.find(
                  (d) => d.name === "Kolhapur District"
                );
                if (mh && kol) openDistrict(kol, mh);
              }}
              className="underline decoration-[#ef9d45] underline-offset-4 text-[#efb167] hover:text-white"
            >
              Kolhapur District
            </button>
            ), Taluka/City/Town, and Cultural Practice.
          </div>
        </div>

        {apiError && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            <span className="flex items-center gap-2">
              <AlertCircle size={15} />
              {apiError}
            </span>
            <button
              type="button"
              onClick={() => setIncludeDemo((v) => v)}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="glass overflow-hidden rounded-[2rem] border-white/12">
          {/* Top Breadcrumb + Search + Demo Toggle Bar */}
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetMap}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  mapLevel === "india"
                    ? "bg-[#ef9d45] font-bold text-[#241a20]"
                    : "text-white/52 hover:bg-white/10 hover:text-white"
                }`}
              >
                India
              </button>
              {selectedState && (
                <>
                  <ChevronRight size={13} className="text-white/25" />
                  <button
                    type="button"
                    onClick={() => openState(selectedState)}
                    className={`rounded-full px-3 py-2 text-xs transition ${
                      mapLevel === "state"
                        ? "bg-[#ef9d45] font-bold text-[#241a20]"
                        : "text-white/52 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {selectedState.name}
                  </button>
                </>
              )}
              {selectedDistrict && (
                <>
                  <ChevronRight size={13} className="text-white/25" />
                  <button
                    type="button"
                    onClick={() => openDistrict(selectedDistrict)}
                    className={`rounded-full px-3 py-2 text-xs transition ${
                      mapLevel === "district"
                        ? "bg-[#ef9d45] font-bold text-[#241a20]"
                        : "text-white/52 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {selectedDistrict.name}
                  </button>
                </>
              )}
              {selectedCity && (
                <>
                  <ChevronRight size={13} className="text-white/25" />
                  <button
                    type="button"
                    onClick={() => openCity(selectedCity)}
                    className="rounded-full bg-[#ef9d45] px-3 py-2 text-xs font-bold text-[#241a20]"
                  >
                    {selectedCity.name}
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIncludeDemo((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] transition ${
                  includeDemo
                    ? "border-[#ef9d45]/40 bg-[#ef9d45]/10 text-[#efb167]"
                    : "border-[#57c5a9]/50 bg-[#57c5a9]/15 text-[#8ed5bd]"
                }`}
                title="Toggle between showing all records (including demonstration reference data) or only field-verified consented records"
              >
                {includeDemo
                  ? `Records: Approved (${fieldVerifiedCount}) + Reference (${demoReferenceCount})`
                  : `Records: Practitioner-Approved Only (${fieldVerifiedCount})`}
              </button>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2">
                <Search size={13} className="text-[#efb167]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search state, district, city or practice…"
                  className="w-36 bg-transparent text-xs text-white outline-none placeholder:text-white/35 md:w-52"
                />
              </div>
            </div>
          </div>

          {/* Map Layer & Coverage Status Filter Bar (Objective 3) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#101522]/90 px-4 py-2.5 md:px-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="eyebrow mr-2 text-[9px] text-white/40">
                MAP LAYERS:
              </span>
              {[
                { id: "all", label: `All Layers (${mapData?.stats.totalLocations || stateList.length} places)` },
                { id: "places", label: `Geographic Places (${mapData?.stats.totalLocations || 168})` },
                { id: "records", label: `Published Cultural Records (${fieldVerifiedCount + demoReferenceCount})` },
                {
                  id: "practitioner-approved",
                  label: `Practitioner-Approved (${fieldVerifiedCount})`,
                },
                {
                  id: "events",
                  label: `Upcoming Cultural Events (${eventsList.length})`,
                },
              ].map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => {
                    setMapLayerFilter(layer.id as any);
                    if (layer.id === "practitioner-approved") {
                      setIncludeDemo(false);
                    } else if (layer.id === "records" || layer.id === "all") {
                      setIncludeDemo(true);
                    }
                  }}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                    mapLayerFilter === layer.id
                      ? "bg-[#57c5a9] text-[#102124]"
                      : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const targetId =
                  selectedCity?.id ||
                  selectedDistrict?.id ||
                  selectedState?.id ||
                  "loc-country-in";
                setLocation(`/places/${encodeURIComponent(targetId)}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ef9d45]/40 bg-[#ef9d45]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#efb167] hover:bg-[#ef9d45]/20"
            >
              Open Geographic Page ({panelTitle}) <ArrowRight size={11} />
            </button>
          </div>

          {search.trim() && (
            <div className="border-b border-white/10 bg-[#101522] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow text-[9px] text-white/40">
                  LOCATIONS & PRACTICES:
                </span>
                {searchResults.cities.map((city) => (
                  <button
                    key={`loc-${city.name}`}
                    type="button"
                    onClick={() => {
                      openCity(city);
                      setSearch("");
                    }}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/75 hover:border-[#efb167]/50 hover:text-[#efb167]"
                  >
                    <MapPin size={11} className="mr-1 inline text-[#57c5a9]" />
                    {city.name}
                    {city.district ? (
                      <span className="ml-1 text-white/40">
                        · {city.district}
                      </span>
                    ) : null}
                  </button>
                ))}
                {searchResults.records.map((rec) => (
                  <button
                    key={`rec-${rec.id || rec.slug || rec.name}`}
                    type="button"
                    onClick={() => {
                      openCity(rec.city);
                      setActiveRecord({ record: rec, city: rec.city });
                      setSearch("");
                    }}
                    className="rounded-full border border-[#ef9d45]/30 bg-[#ef9d45]/10 px-3 py-1.5 text-xs text-[#efb167] hover:bg-[#ef9d45]/20"
                  >
                    {rec.name}{" "}
                    <span className="text-white/50">
                      ({rec.recordOrigin === "FIELD_VERIFIED" ? "Practitioner-approved" : "Reference"})
                    </span>
                  </button>
                ))}
                {searchResults.cities.length === 0 &&
                  searchResults.records.length === 0 && (
                    <span className="text-xs text-white/45">
                      No matching locations or cultural practices found.
                    </span>
                  )}
              </div>
            </div>
          )}

          <div className="grid min-h-[680px] lg:grid-cols-[1.45fr_.85fr]">
            {/* Left Viewport: Genuine Interactive Geographic Map */}
            <div className="relative min-h-[560px] overflow-hidden bg-[#141d2b] lg:min-h-[680px]">
              <MapView
                className="h-full w-full"
                center={viewTarget.center}
                zoom={viewTarget.zoom}
                markers={mapMarkers}
                onMapReady={(ctrl) => {
                  mapControllerRef.current = ctrl;
                }}
                offlineFallbackContent={offlineHierarchyBrowser}
              />

              {/* Top-left Layer Indicator Pill */}
              <div className="pointer-events-none absolute left-4 top-4 z-[400] flex items-center gap-2 rounded-full border border-white/15 bg-[#101622]/85 px-3 py-2 backdrop-blur-xl">
                <Globe2 size={14} className="text-[#efb167]" />
                <span className="eyebrow text-white/80">
                  {mapLevel === "india"
                    ? "INDIA GEOGRAPHIC BASEMAP"
                    : `${panelTitle.toUpperCase()} · ${mapLevel.toUpperCase()} LAYER`}
                </span>
              </div>

              {/* Hovered State Signal Overlay */}
              {hoveredState && mapLevel === "india" && (
                <div className="glass pointer-events-none absolute left-4 top-16 z-[400] w-68 rounded-2xl p-4">
                  <div className="eyebrow text-[#efb167]">STATE SIGNAL</div>
                  <div className="mt-1 font-serif text-3xl text-white">
                    {hoveredState.name}
                  </div>
                  <p className="mt-1 text-xs text-white/65">
                    {formatOriginCounts(
                      hoveredState.fieldVerifiedCount,
                      hoveredState.demoCount
                    )}{" "}
                    across {hoveredState.districts.length} district(s)
                  </p>
                  <div className="mt-3 h-px bg-white/10" />
                  <span className="eyebrow mt-2 block text-[#8ed5bd]">
                    CLICK STATE MARKER TO ZOOM IN
                  </span>
                </div>
              )}

              {/* Selected Cultural Marker Popup Card */}
              {activeRecord && (
                <div className="glass absolute bottom-16 left-4 z-[400] w-[min(390px,calc(100%-32px))] rounded-2xl p-4">
                  <button
                    type="button"
                    onClick={() => setActiveRecord(null)}
                    className="absolute right-3 top-3 text-white/45 hover:text-white"
                    aria-label="Close culture popup"
                  >
                    <X size={14} />
                  </button>
                  <div className="eyebrow text-[#efb167]">
                    CULTURAL MARKER /{" "}
                    {activeRecord.record.category.toUpperCase()}
                  </div>
                  <h4 className="mt-1.5 pr-5 font-serif text-2xl text-white">
                    {activeRecord.record.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/65">
                    <MapPin size={12} className="text-[#8ed5bd]" />
                    <span>
                      {activeRecord.record.displayLocationLabel ||
                        `${activeRecord.city.name}, ${activeRecord.city.state}`}
                    </span>
                    <span
                      className={
                        activeRecord.record.recordOrigin === "FIELD_VERIFIED"
                          ? "font-semibold text-[#8ed5bd]"
                          : "text-[#efb167]"
                      }
                    >
                      ·{" "}
                      {activeRecord.record.recordOrigin === "FIELD_VERIFIED"
                        ? "PRACTITIONER-APPROVED"
                        : "REFERENCE INFORMATION"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    Location Granularity:{" "}
                    <strong>
                      {activeRecord.record.locationGranularity || "DISTRICT"}
                    </strong>{" "}
                    (Rights Passport enforced)
                  </div>
                  <p className="mt-2.5 text-xs leading-5 text-white/70">
                    {activeRecord.record.description}
                  </p>
                  <div className="mt-3.5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onExploreStory?.(activeRecord.record, activeRecord.city)
                      }
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#efb167]"
                    >
                      Explore Cultural Story <ArrowRight size={13} />
                    </button>
                    {activeRecord.record.traditionSlug && (
                      <button
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/traditions/${encodeURIComponent(
                              activeRecord.record.traditionSlug!
                            )}`
                          )
                        }
                        className="flex items-center gap-1.5 rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
                      >
                        Open Tradition Dossier <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Zoom In / Out & Reset Controls */}
              <div className="absolute right-4 top-4 z-[400] flex flex-col overflow-hidden rounded-xl border border-white/15 bg-[#101622]/85 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => {
                    const current =
                      mapControllerRef.current?.getZoom() ?? viewTarget.zoom;
                    mapControllerRef.current?.setZoom(Math.min(18, current + 1));
                  }}
                  aria-label="Zoom in"
                  className="grid h-9 w-9 place-items-center text-white/80 hover:bg-white/10 hover:text-white"
                >
                  +
                </button>
                <div className="h-px bg-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    const current =
                      mapControllerRef.current?.getZoom() ?? viewTarget.zoom;
                    mapControllerRef.current?.setZoom(Math.max(3, current - 1));
                  }}
                  aria-label="Zoom out"
                  className="grid h-9 w-9 place-items-center text-white/80 hover:bg-white/10 hover:text-white"
                >
                  −
                </button>
              </div>
            </div>

            {/* Right-hand Discovery Panel */}
            <aside className="relative z-20 flex flex-col bg-[#111522] p-5 md:p-7">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="eyebrow text-[#efb167]">
                    {selectedCity
                      ? "TALUKA / CITY / TOWN"
                      : selectedDistrict
                        ? "DISTRICT"
                        : selectedState
                          ? "STATE"
                          : "COUNTRY"}
                  </div>
                  <h3 className="mt-3 font-serif text-4xl text-[#fbf5eb]">
                    {panelTitle}
                  </h3>
                  <p className="mt-1 text-sm text-white/45">{panelSubtitle}</p>
                </div>
                <span
                  className={`eyebrow rounded-full border px-3 py-1.5 text-right ${
                    fieldVerifiedCount > 0
                      ? "border-[#57c5a9]/40 bg-[#57c5a9]/10 text-[#8ed5bd]"
                      : "border-[#ef9d45]/30 bg-[#ef9d45]/10 text-[#efb167]"
                  }`}
                >
                  {fieldVerifiedCount > 0
                    ? `${fieldVerifiedCount} APPROVED · ${demoReferenceCount} REFERENCE`
                    : `${fieldVerifiedCount} APPROVED · ${demoReferenceCount} REFERENCE`}
                </span>
              </div>

              {loadingApi && !mapData ? (
                <div className="my-auto py-12 text-center text-xs text-white/50">
                  Loading geographic records from database…
                </div>
              ) : null}

              {mapLevel === "india" && (
                <>
                  <p className="mt-7 text-sm leading-6 text-white/58">
                    Pan and zoom across the geographic map of India, select any
                    state marker, or jump directly into{" "}
                    <button
                      type="button"
                      onClick={() => {
                        const mh = stateList.find(
                          (s) => s.name === "Maharashtra"
                        );
                        const kol = mh?.districts.find(
                          (d) => d.name === "Kolhapur District"
                        );
                        if (mh && kol) openDistrict(kol, mh);
                      }}
                      className="font-semibold text-[#efb167] underline decoration-[#ef9d45]/50 underline-offset-2"
                    >
                      Kolhapur District, Maharashtra
                    </button>
                    .
                  </p>

                  {/* Distinct Verified vs. Demo Reference Counter Cards */}
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-[#57c5a9]/30 bg-[#57c5a9]/10 p-3">
                      <div className="font-serif text-xl text-[#8ed5bd]">
                        {fieldVerifiedCount}
                      </div>
                      <div className="eyebrow mt-1 text-[9px] text-[#8ed5bd]/80">
                        field-verified
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#ef9d45]/30 bg-[#ef9d45]/10 p-3">
                      <div className="font-serif text-xl text-[#efb167]">
                        {demoReferenceCount}
                      </div>
                      <div className="eyebrow mt-1 text-[9px] text-[#efb167]/80">
                        reference entries
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                      <div className="font-serif text-xl text-white">
                        {stateList.length}
                      </div>
                      <div className="eyebrow mt-1 text-[9px] text-white/40">
                        states in map
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="eyebrow text-white/38">
                        <BarChart3 size={12} className="mr-1 inline" />
                        CATEGORY SIGNALS
                      </span>
                      <span className="text-[10px] text-white/35">
                        approved vs. reference
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map((category) => {
                        const catRecs = allRecords.filter(
                          (item) => item.category === category
                        );
                        const catVerified = catRecs.filter(
                          (r) => r.recordOrigin === "FIELD_VERIFIED"
                        ).length;
                        const catDemo = catRecs.filter(
                          (r) => r.recordOrigin === "DEMO_REFERENCE"
                        ).length;
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() =>
                              setActiveCategory(
                                activeCategory === category ? "All" : category
                              )
                            }
                            className={`rounded-xl border px-2 py-3 text-left transition ${
                              activeCategory === category
                                ? "border-[#57c5a9]/60 bg-[#57c5a9]/15 text-[#b8e4d2]"
                                : "border-white/8 bg-white/[.03] text-white/52 hover:border-[#efb167]/40 hover:text-white"
                            }`}
                          >
                            <span className="mb-2 block h-1.5 w-8 rounded-full bg-gradient-to-r from-[#ef9d45] to-[#57c5a9]" />
                            <span className="block text-[10px] font-semibold leading-4">
                              {category}
                            </span>
                            <span className="eyebrow mt-1 block text-[9px] text-white/35">
                              {catVerified > 0
                                ? `${catVerified} appr · ${catDemo} ref`
                                : `${catDemo} ref`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {mapLevel === "state" && selectedState && (
                <>
                  <p className="mt-7 text-sm leading-6 text-white/58">
                    {selectedState.name} opens into districts, talukas/cities,
                    and cultural practices. Select a district below or on the
                    geographic map.
                  </p>
                  <div className="mt-7">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="eyebrow text-white/38">DISTRICTS</span>
                      <span className="text-xs text-white/35">
                        {selectedState.districts.length} visible
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedState.districts.map((dist) => (
                        <button
                          key={dist.id}
                          type="button"
                          onClick={() => openDistrict(dist, selectedState)}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-3 text-left transition hover:border-[#ef9d45]/45 hover:bg-[#ef9d45]/10"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#57c5a9]/15 text-[#8ed5bd]">
                            <MapPin size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-white/85">
                              {dist.name}
                              {dist.nameMr ? (
                                <span className="ml-2 text-xs font-normal text-white/45">
                                  {dist.nameMr}
                                </span>
                              ) : null}
                            </span>
                            <span className="eyebrow mt-1 block text-white/40">
                              {formatOriginCounts(
                                dist.fieldVerifiedCount,
                                dist.demoCount
                              )}
                            </span>
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#efb167]"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mapLevel === "district" && selectedDistrict && (
                <>
                  <p className="mt-5 text-xs leading-5 text-white/58">
                    Explore talukas/cities in {selectedDistrict.name}, or view
                    records pinned at district-level visibility per their
                    Cultural Rights Passport.
                  </p>
                  {selectedDistrict.subdistricts &&
                    selectedDistrict.subdistricts.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="eyebrow text-white/38">
                            SUBDISTRICTS / TALUKAS
                          </span>
                          <span className="text-xs text-white/35">
                            {selectedDistrict.subdistricts.length} talukas
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDistrict.subdistricts.map((tal) => (
                            <button
                              key={tal.id}
                              type="button"
                              onClick={() =>
                                setLocation(
                                  `/places/${encodeURIComponent(tal.id)}`
                                )
                              }
                              className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] text-white/80 hover:border-[#ef9d45]/50 hover:text-[#efb167]"
                            >
                              {tal.name.replace(/ Taluka$/i, "")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="eyebrow text-white/38">
                        CITIES / TOWNS / VILLAGES
                      </span>
                      <span className="text-xs text-white/35">
                        {selectedDistrict.cities.length} places
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDistrict.cities.map((cityName) => {
                        const city = cities[cityName];
                        const cVer = city?.fieldVerifiedCount || 0;
                        const cDemo = city?.demoCount || 0;
                        return (
                          <button
                            key={cityName}
                            type="button"
                            onClick={() => city && openCity(city)}
                            className="group flex items-center justify-between rounded-xl border border-white/8 bg-white/[.035] p-2.5 text-left transition hover:border-[#ef9d45]/45 hover:bg-[#ef9d45]/10"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-white/85">
                                {cityName}
                              </div>
                              <div className="eyebrow mt-0.5 text-[9px] text-white/40">
                                {cVer + cDemo > 0 ? `${cVer} appr · ${cDemo} ref` : "Collection in progress"}
                              </div>
                            </div>
                            <ChevronRight
                              size={13}
                              className="shrink-0 text-white/25 group-hover:text-[#efb167]"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="eyebrow text-white/38">
                      CULTURAL RECORDS IN {selectedDistrict.name.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/35">
                      {visibleDistrictRecords.length} visible
                    </span>
                  </div>
                  <div className="scrollbar-thin mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                    {visibleDistrictRecords.map((item) => {
                      const isVerified = item.recordOrigin === "FIELD_VERIFIED";
                      const fallbackCity =
                        (item.cityTownName && cities[item.cityTownName]) ||
                        (selectedDistrict.cities[0] &&
                          cities[selectedDistrict.cities[0]]) || {
                          name: selectedDistrict.name,
                          state: selectedState?.name || "Maharashtra",
                          district: selectedDistrict.name,
                          center: selectedDistrict.center,
                          records: [],
                        };
                      return (
                        <button
                          key={item.id || item.slug || item.name}
                          type="button"
                          onClick={() => {
                            selectRecordOnMap(item, fallbackCity);
                            onExploreStory?.(item, fallbackCity);
                          }}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-3 text-left transition hover:border-[#ef9d45]/45 hover:bg-[#ef9d45]/10"
                        >
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                              isVerified
                                ? "bg-[#57c5a9]/20 text-[#8ed5bd]"
                                : "bg-[#ef9d45]/15 text-[#efb167]"
                            }`}
                          >
                            {isVerified ? (
                              <ShieldCheck size={14} />
                            ) : (
                              <Sparkles size={14} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-white/85">
                              {item.name}
                            </span>
                            <span
                              className={`eyebrow mt-0.5 block text-[9px] ${
                                isVerified ? "text-[#8ed5bd]" : "text-white/40"
                              }`}
                            >
                              {item.category} ·{" "}
                              {isVerified ? "PRACTITIONER-APPROVED" : "REFERENCE INFORMATION"}{" "}
                              · {item.locationGranularity || "DISTRICT"}
                            </span>
                          </span>
                          <ChevronRight
                            size={13}
                            className="text-white/25 group-hover:text-[#efb167]"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {placeConnectedTraditions.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="eyebrow text-[#8ed5bd]">
                          CONNECTED TRADITIONS ({placeConnectedTraditions.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {placeConnectedTraditions.map((trad) => (
                          <button
                            key={trad.id}
                            type="button"
                            onClick={() =>
                              setLocation(`/traditions/${trad.slug}`)
                            }
                            className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
                          >
                            {trad.nameEn} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {mapLevel === "city" && selectedCity && (
                <>
                  <div className="mt-7 flex items-center justify-between">
                    <span className="eyebrow text-white/38">
                      CULTURE FOUND HERE
                    </span>
                    <span className="text-xs text-white/35">
                      {formatOriginCounts(
                        visibleCityRecords.filter(
                          (r) => r.recordOrigin === "FIELD_VERIFIED"
                        ).length,
                        visibleCityRecords.filter(
                          (r) => r.recordOrigin === "DEMO_REFERENCE"
                        ).length
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    Cultural practices in {selectedCity.name}. District-level
                    consented records keep their coordinates masked to the
                    district centroid.
                  </p>
                  <div className="scrollbar-thin mt-5 max-h-[290px] space-y-2 overflow-y-auto pr-1">
                    {visibleCityRecords.length ? (
                      visibleCityRecords.map((item) => {
                        const isVerified =
                          item.recordOrigin === "FIELD_VERIFIED";
                        const isSelected =
                          activeRecord?.record.slug === item.slug ||
                          activeRecord?.record.name === item.name;
                        return (
                          <button
                            key={item.slug || item.name}
                            type="button"
                            onClick={() => {
                              selectRecordOnMap(item, selectedCity);
                              onExploreStory?.(item, selectedCity);
                            }}
                            className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                              isSelected
                                ? "border-[#ef9d45] bg-[#ef9d45]/15"
                                : "border-white/8 bg-white/[.035] hover:border-[#ef9d45]/45 hover:bg-[#ef9d45]/10"
                            }`}
                          >
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-xl ${
                                isVerified
                                  ? "bg-[#57c5a9]/20 text-[#8ed5bd]"
                                  : "bg-[#ef9d45]/15 text-[#efb167]"
                              }`}
                            >
                              {isVerified ? (
                                <ShieldCheck size={15} />
                              ) : (
                                <Sparkles size={15} />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-white/85">
                                {item.name}
                              </span>
                              <span
                                className={`eyebrow mt-1 block ${
                                  isVerified
                                    ? "text-[#8ed5bd]"
                                    : "text-white/40"
                                }`}
                              >
                                {item.category} ·{" "}
                                {isVerified
                                  ? "PRACTITIONER-APPROVED · CONSENT VERIFIED"
                                  : "REFERENCE INFORMATION · SOURCE ATTRIBUTED"}
                              </span>
                            </span>
                            <ChevronRight
                              size={14}
                              className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#efb167]"
                            />
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#ef9d45]/35 bg-[#ef9d45]/5 p-5">
                        <div className="eyebrow text-[#efb167]">
                          COLLECTION IN PROGRESS
                        </div>
                        <h4 className="mt-1.5 font-serif text-2xl text-white">
                          Discover the culture of this place
                        </h4>
                        <p className="mt-2 text-xs leading-5 text-white/60">
                          {selectedCity.name} is indexed in the geographic
                          directory. More cultural entries for this locality are
                          being documented with community consent and review.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {selectedCity.id && (
                            <button
                              type="button"
                              onClick={() =>
                                setLocation(
                                  `/places/${encodeURIComponent(selectedCity.id!)}`
                                )
                              }
                              className="text-[10px] font-bold uppercase tracking-[.12em] text-[#efb167] underline"
                            >
                              Open Geographic Page{" "}
                              <ArrowRight size={11} className="ml-1 inline" />
                            </button>
                          )}
                          {activeCategory !== "All" && (
                            <button
                              type="button"
                              onClick={() => setActiveCategory("All")}
                              className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8ed5bd]"
                            >
                              Show all categories
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {placeConnectedTraditions.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="eyebrow text-[#8ed5bd]">
                          TRADITIONS ASSOCIATED WITH {selectedCity.name.toUpperCase()} ({placeConnectedTraditions.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {placeConnectedTraditions.map((trad) => (
                          <button
                            key={trad.id}
                            type="button"
                            onClick={() =>
                              setLocation(`/traditions/${trad.slug}`)
                            }
                            className="rounded-full border border-[#57c5a9]/40 bg-[#57c5a9]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8ed5bd] hover:bg-[#57c5a9] hover:text-[#102124]"
                          >
                            {trad.nameEn} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto border-t border-white/10 pt-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {categories.slice(0, 5).map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            setActiveCategory(
                              activeCategory === category ? "All" : category
                            )
                          }
                          className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] ${
                            activeCategory === category
                              ? "bg-[#57c5a9] text-[#102124]"
                              : "bg-white/[.04] text-white/45 hover:text-white"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCategory("All")}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#efb167]"
                    >
                      Clear category filter <Filter size={12} />
                    </button>
                  </div>
                </>
              )}

              {mapLevel === "india" && (
                <div className="mt-auto border-t border-white/10 pt-6">
                  <div className="flex items-start gap-3">
                    <Layers3 size={17} className="mt-0.5 text-[#8ed5bd]" />
                    <div>
                      <div className="eyebrow text-[#8ed5bd]">
                        PRIVACY-ENFORCED GEOGRAPHIC LAYER
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-white/45">
                        Reference entries with source attribution ({demoReferenceCount}) and
                        practitioner-approved records ({fieldVerifiedCount})
                        are tracked separately. Exact coordinates are masked
                        whenever a practitioner selects district-level
                        visibility.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#101522] px-4 py-3 md:px-5">
            <span className="eyebrow mr-2 text-white/35">
              <Filter size={12} className="mr-1 inline" />
              CATEGORY FILTER
            </span>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category ? "All" : category
                  )
                }
                className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] transition ${
                  activeCategory === category
                    ? "bg-[#57c5a9] text-[#102124]"
                    : "bg-white/[.04] text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
