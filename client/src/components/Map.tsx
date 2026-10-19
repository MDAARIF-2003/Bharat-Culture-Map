/// <reference types="@types/google.maps" />

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Layers, Loader2, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    L?: any;
    google?: typeof google;
  }
}

const GOOGLE_MAPS_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
).trim();

export type BasemapStyleId = "osm-dark" | "osm-standard" | "carto-dark";

export interface GeoMapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  subtitle?: string;
  badgeText?: string;
  variant:
    | "state"
    | "district"
    | "city"
    | "verified-record"
    | "demo-record";
  selected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface MapController {
  panTo: (center: { lat: number; lng: number }, zoom?: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
}

interface TileConfig {
  id: BasemapStyleId;
  label: string;
  url: string;
  subdomains: string[];
  attribution: string;
  maxZoom: number;
  containerClass?: string;
}

const TILE_PROVIDERS: Record<BasemapStyleId, TileConfig> = {
  "osm-dark": {
    id: "osm-dark",
    label: "Dark Atlas (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    containerClass: "bcm-osm-dark-filter",
  },
  "osm-standard": {
    id: "osm-standard",
    label: "Standard OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    containerClass: "",
  },
  "carto-dark": {
    id: "carto-dark",
    label: "CARTO Dark Matter",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    containerClass: "",
  },
};

async function loadLeafletLibrary(): Promise<any> {
  if (typeof window === "undefined") return null;
  if (window.L && typeof window.L.map === "function") {
    return window.L;
  }

  // Try Vite bundled npm package first (`pnpm install` -> `node_modules/leaflet`)
  try {
    const pkgName = "leaflet";
    const mod = await import(/* @vite-ignore */ pkgName);
    const L = mod.default || mod;
    if (L && typeof L.map === "function") {
      window.L = L;
      return L;
    }
  } catch {
    // Fall back to official unpkg Leaflet 1.9.4 script if not bundled in node_modules
  }

  if (window.L && typeof window.L.map === "function") {
    return window.L;
  }

  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.crossOrigin = "";
    script.onload = () => {
      if (window.L && typeof window.L.map === "function") {
        resolve(window.L);
      } else {
        reject(new Error("Leaflet loaded but window.L is unavailable"));
      }
    };
    script.onerror = () => {
      reject(new Error("Unable to load Leaflet geographic mapping library"));
    };
    document.head.appendChild(script);
  });
}

/**
 * Separates markers that share the exact same coordinate (e.g. multiple records
 * masked to the same District or City centroid) in a small visual ring so every
 * marker is visible and clickable without altering the underlying data coordinate.
 */
function computeVisualMarkerPositions(
  markers: GeoMapMarker[],
  currentZoom: number
): Array<{ marker: GeoMapMarker; displayLat: number; displayLng: number }> {
  const groups = new Map<string, GeoMapMarker[]>();
  for (const m of markers) {
    const key = `${m.position.lat.toFixed(4)},${m.position.lng.toFixed(4)}`;
    const list = groups.get(key) || [];
    list.push(m);
    groups.set(key, list);
  }

  // Scale visual ring radius based on zoom level so pins separate cleanly
  const radiusDeg =
    currentZoom >= 12
      ? 0.0045
      : currentZoom >= 9
        ? 0.018
        : currentZoom >= 7
          ? 0.06
          : 0.15;

  const output: Array<{
    marker: GeoMapMarker;
    displayLat: number;
    displayLng: number;
  }> = [];

  for (const list of Array.from(groups.values())) {
    if (list.length === 1) {
      output.push({
        marker: list[0],
        displayLat: list[0].position.lat,
        displayLng: list[0].position.lng,
      });
    } else {
      list.forEach((m: GeoMapMarker, idx: number) => {
        const angle = (2 * Math.PI * idx) / list.length;
        output.push({
          marker: m,
          displayLat: m.position.lat + Math.sin(angle) * radiusDeg,
          displayLng: m.position.lng + Math.cos(angle) * radiusDeg,
        });
      });
    }
  }
  return output;
}

function buildMarkerHtml(marker: GeoMapMarker): string {
  const isSelected = Boolean(marker.selected);

  if (marker.variant === "state") {
    const borderColor = isSelected ? "#57c5a9" : "rgba(239,157,69,0.75)";
    const bg = isSelected ? "#ef9d45" : "rgba(16, 21, 34, 0.92)";
    const textColor = isSelected ? "#1e141a" : "#efb167";
    return `
      <div style="
        display:inline-flex;align-items:center;gap:4px;
        padding:3px 8px;border-radius:999px;
        border:1.5px solid ${borderColor};
        background:${bg};color:${textColor};
        font:700 10px 'DM Mono',monospace;letter-spacing:0.06em;
        box-shadow:0 4px 14px rgba(0,0,0,0.45);
        white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);
        transition:transform 0.18s ease;
      " title="${marker.title}">
        <span>${marker.badgeText || marker.title}</span>
      </div>
    `;
  }

  if (marker.variant === "district") {
    const isKolhapur = marker.title.toLowerCase().includes("kolhapur");
    const color = isKolhapur ? "#57c5a9" : "#ef9d45";
    return `
      <div style="
        display:inline-flex;align-items:center;gap:6px;
        padding:4px 10px;border-radius:999px;
        border:2px solid #fff8ed;
        background:rgba(16,21,34,0.92);color:#fff8ed;
        font:600 11px 'Manrope',sans-serif;
        box-shadow:0 0 0 5px ${color}33, 0 6px 18px rgba(0,0,0,0.5);
        white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);
      " title="${marker.title}">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span>${marker.badgeText || marker.title}</span>
      </div>
    `;
  }

  if (marker.variant === "city") {
    return `
      <div style="
        display:inline-flex;align-items:center;gap:6px;
        padding:4px 10px;border-radius:999px;
        border:2px solid #fff8ed;
        background:#57c5a9;color:#102124;
        font:700 11px 'Manrope',sans-serif;
        box-shadow:0 0 0 6px rgba(87,197,169,0.28), 0 6px 18px rgba(0,0,0,0.45);
        white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);
      " title="${marker.title}">
        <span>●</span>
        <span>${marker.badgeText || marker.title}</span>
      </div>
    `;
  }

  // Cultural practice marker: verified-record vs demo-record
  const isVerified = marker.variant === "verified-record";
  const bg = isVerified ? "#57c5a9" : "#ef9d45";
  const ringColor = isSelected
    ? "#ffffff"
    : isVerified
      ? "rgba(87,197,169,0.45)"
      : "rgba(239,157,69,0.40)";
  const scale = isSelected ? "scale(1.18)" : "scale(1)";

  return `
    <div style="
      display:inline-flex;align-items:center;gap:6px;
      padding:5px 10px;border-radius:999px;
      border:2px solid #fff8ed;
      background:${bg};color:#1d151c;
      font:700 11px 'Manrope',sans-serif;
      box-shadow:0 0 0 ${isSelected ? "8px" : "5px"} ${ringColor}, 0 8px 22px rgba(0,0,0,0.55);
      white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%) ${scale};
      transition:transform 0.18s ease, box-shadow 0.18s ease;
    " title="${marker.title}">
      <span style="font-size:12px;">${isVerified ? "✓" : "✦"}</span>
      <span>${marker.title}</span>
    </div>
  `;
}

export interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: GeoMapMarker[];
  onMapReady?: (controller: any) => void;
  onTileStatusChange?: (
    status: "loading" | "ready" | "unavailable"
  ) => void;
  offlineFallbackContent?: React.ReactNode;
}

export function MapView({
  className,
  initialCenter = { lat: 21.15, lng: 79.0 },
  initialZoom = 5,
  center,
  zoom,
  markers = [],
  onMapReady,
  onTileStatusChange,
  offlineFallbackContent,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerLayerGroupRef = useRef<any>(null);

  const [basemapStyle, setBasemapStyle] =
    useState<BasemapStyleId>("osm-dark");
  const [tileStatus, setTileStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const [currentZoom, setCurrentZoom] = useState<number>(
    zoom ?? initialZoom
  );
  const [retryCount, setRetryCount] = useState(0);

  const updateStatus = useCallback(
    (next: "loading" | "ready" | "unavailable") => {
      setTileStatus(next);
      onTileStatusChange?.(next);
    },
    [onTileStatusChange]
  );

  // Initialize Leaflet Geographic Map
  useEffect(() => {
    let cancelled = false;
    let tileLoadSucceeded = false;
    let tileErrorCount = 0;

    async function initMap() {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        updateStatus("unavailable");
        return;
      }

      updateStatus("loading");

      try {
        const L = await loadLeafletLibrary();
        if (cancelled || !mapContainerRef.current || !L) return;

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const startCenter = center || initialCenter;
        const startZoom = zoom ?? initialZoom;

        const mapInstance = L.map(mapContainerRef.current, {
          center: [startCenter.lat, startCenter.lng],
          zoom: startZoom,
          minZoom: 3,
          maxZoom: 19,
          zoomControl: false,
          attributionControl: true,
        });

        L.control.scale({ position: "bottomleft", imperial: false }).addTo(
          mapInstance
        );

        const provider = TILE_PROVIDERS[basemapStyle];
        const tileLayer = L.tileLayer(provider.url, {
          subdomains: provider.subdomains,
          maxZoom: provider.maxZoom,
          attribution: provider.attribution,
          crossOrigin: true,
        });

        tileLayer.on("tileload", () => {
          if (cancelled) return;
          tileLoadSucceeded = true;
          updateStatus("ready");
        });

        tileLayer.on("tileerror", () => {
          if (cancelled) return;
          tileErrorCount += 1;
          if (!tileLoadSucceeded && tileErrorCount >= 4) {
            // Try fallback CARTO tile server before declaring offline/unavailable
            if (basemapStyle !== "carto-dark") {
              setBasemapStyle("carto-dark");
            } else {
              updateStatus("unavailable");
            }
          }
        });

        tileLayer.addTo(mapInstance);
        tileLayerRef.current = tileLayer;

        const markerGroup = L.layerGroup().addTo(mapInstance);
        markerLayerGroupRef.current = markerGroup;

        mapInstance.on("zoomend", () => {
          if (!cancelled) {
            setCurrentZoom(mapInstance.getZoom());
          }
        });

        leafletMapRef.current = mapInstance;

        // Expose unified MapController for parent panTo / setZoom calls
        const controller: MapController = {
          panTo: (targetCenter, targetZoom) => {
            if (!leafletMapRef.current) return;
            const z =
              targetZoom !== undefined
                ? targetZoom
                : leafletMapRef.current.getZoom();
            leafletMapRef.current.flyTo(
              [targetCenter.lat, targetCenter.lng],
              z,
              {
                animate: true,
                duration: 0.65,
              }
            );
          },
          setZoom: (nextZoom: number) => {
            if (!leafletMapRef.current) return;
            leafletMapRef.current.setZoom(nextZoom);
          },
          getZoom: () => {
            return leafletMapRef.current
              ? leafletMapRef.current.getZoom()
              : startZoom;
          },
        };

        onMapReady?.(controller);

        // Ensure container dimensions are recalculated after mount
        window.setTimeout(() => {
          if (!cancelled && leafletMapRef.current) {
            leafletMapRef.current.invalidateSize();
          }
        }, 120);
      } catch {
        if (!cancelled) {
          updateStatus("unavailable");
        }
      }
    }

    void initMap();

    const handleOffline = () => updateStatus("unavailable");
    const handleOnline = () => setRetryCount((c) => c + 1);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [retryCount]);

  // Switch tile layer when user changes basemap style
  useEffect(() => {
    const mapInstance = leafletMapRef.current;
    const L = window.L;
    if (!mapInstance || !L) return;

    const provider = TILE_PROVIDERS[basemapStyle];
    if (tileLayerRef.current) {
      mapInstance.removeLayer(tileLayerRef.current);
    }

    let loadedAny = false;
    let errors = 0;
    const nextLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains,
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
      crossOrigin: true,
    });

    nextLayer.on("tileload", () => {
      loadedAny = true;
      updateStatus("ready");
    });

    nextLayer.on("tileerror", () => {
      errors += 1;
      if (!loadedAny && errors >= 6) {
        updateStatus("unavailable");
      }
    });

    nextLayer.addTo(mapInstance);
    tileLayerRef.current = nextLayer;
  }, [basemapStyle, updateStatus]);

  // Synchronize center & zoom props when updated declaratively
  useEffect(() => {
    const mapInstance = leafletMapRef.current;
    if (!mapInstance || !center) return;
    const targetZoom = zoom ?? mapInstance.getZoom();
    mapInstance.flyTo([center.lat, center.lng], targetZoom, {
      animate: true,
      duration: 0.65,
    });
  }, [center?.lat, center?.lng, zoom]);

  // Render declarative markers onto Leaflet LayerGroup
  useEffect(() => {
    const mapInstance = leafletMapRef.current;
    const group = markerLayerGroupRef.current;
    const L = window.L;
    if (!mapInstance || !group || !L) return;

    group.clearLayers();
    const separated = computeVisualMarkerPositions(markers, currentZoom);

    for (const { marker, displayLat, displayLng } of separated) {
      const icon = L.divIcon({
        className: "leaflet-div-icon",
        html: buildMarkerHtml(marker),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const leafletMarker = L.marker([displayLat, displayLng], {
        icon,
        title: marker.title,
        alt: marker.title,
      });

      if (marker.onClick) {
        leafletMarker.on("click", () => marker.onClick?.());
      }
      if (marker.onMouseEnter) {
        leafletMarker.on("mouseover", () => marker.onMouseEnter?.());
      }
      if (marker.onMouseLeave) {
        leafletMarker.on("mouseout", () => marker.onMouseLeave?.());
      }

      leafletMarker.addTo(group);
    }
  }, [markers, currentZoom, tileStatus]);

  const activeProvider = TILE_PROVIDERS[basemapStyle];

  return (
    <div
      className={cn(
        "relative w-full h-[560px] lg:h-[680px] bg-[#141d2b]",
        activeProvider.containerClass,
        className
      )}
    >
      {/* Real Leaflet Geographic Map Canvas */}
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        aria-label="Interactive Geographic Map of India"
      />

      {/* Basemap Tile Style Switcher (Bottom-Left above scale) */}
      {tileStatus !== "unavailable" && (
        <div className="
          absolute bottom-8 left-3 z-[400] flex flex-wrap items-center gap-1
          rounded-full border border-white/15 bg-[#101622]/85 p-1 backdrop-blur-xl
        ">
          <span className="eyebrow flex items-center gap-1 px-2 text-[9px] text-white/55">
            <Layers size={11} className="text-[#efb167]" />
            Basemap:
          </span>
          {(Object.keys(TILE_PROVIDERS) as BasemapStyleId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setBasemapStyle(id)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                basemapStyle === id
                  ? "bg-[#ef9d45] text-[#241a20]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {TILE_PROVIDERS[id].label}
            </button>
          ))}
          {GOOGLE_MAPS_KEY ? (
            <span className="eyebrow px-2 text-[9px] text-[#8ed5bd]">
              OSM + Google Key Active
            </span>
          ) : null}
        </div>
      )}

      {/* Loading Indicator */}
      {tileStatus === "loading" && (
        <div className="
          pointer-events-none absolute right-16 top-5 z-[400] inline-flex items-center gap-2
          rounded-full border border-white/15 bg-[#101622]/85 px-3 py-1.5 text-xs text-white/75 backdrop-blur-xl
        ">
          <Loader2 size={13} className="animate-spin text-[#efb167]" />
          <span className="eyebrow text-[10px]">
            Loading geographic map tiles…
          </span>
        </div>
      )}

      {/* Honest Offline / Map Tile Service Unavailable State (Never a Fake Decorative Map) */}
      {tileStatus === "unavailable" && (
        <div className="
          absolute inset-0 z-[500] flex flex-col justify-between overflow-y-auto
          bg-[#131826] p-6 text-[#f3eee5] md:p-8
        ">
          <div className="rounded-2xl border border-[#ef9d45]/40 bg-[#1e1926] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-[#ef9d45]"
                />
                <div>
                  <div className="eyebrow text-[#efb167]">
                    GEOGRAPHIC MAP TILES UNAVAILABLE (OFFLINE MODE)
                  </div>
                  <h4 className="mt-1 font-serif text-2xl text-white">
                    Live OpenStreetMap tiles cannot be reached right now.
                  </h4>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-white/65">
                    Rather than displaying a decorative illustration in place of
                    a real map, Bharat CultureMap provides direct geographic
                    hierarchy navigation below while offline. Connect to the
                    internet and click retry to restore live geographic tiles.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-2 rounded-full bg-[#ef9d45] px-4 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-[#241a20]"
              >
                <RefreshCw size={13} />
                Retry Map Tiles
              </button>
            </div>
          </div>

          <div className="mt-6 flex-1">{offlineFallbackContent}</div>
        </div>
      )}
    </div>
  );
}
