import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "./Dashboard";
import { trpc } from "../../trpc";
import useIsMobile from "../../hooks/useIsMobile";
import { BG, FG, BORDER, MUTED, MUTED_FG, V } from "../../theme";


type LeafletNS = {
  map: (el: HTMLElement, opts?: object) => LeafletMap;
  tileLayer: (url: string, opts?: object) => { addTo: (m: LeafletMap) => void };
  layerGroup: () => LeafletLayerGroup;
  circleMarker: (latlng: [number, number], opts?: object) => LeafletMarker;
  latLngBounds: (latlngs: [number, number][]) => { pad: (n: number) => object };
};

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => void;
  fitBounds: (b: object) => void;
  remove: () => void;
};

type LeafletLayerGroup = {
  addTo: (m: LeafletMap) => LeafletLayerGroup;
  clearLayers: () => void;
  addLayer: (layer: LeafletMarker) => void;
};

type LeafletMarker = {
  bindPopup: (html: string | (() => string)) => LeafletMarker;
  addTo: (g: LeafletLayerGroup) => LeafletMarker;
  on: (ev: string, fn: () => void) => void;
  openPopup: () => void;
};

declare global {
  interface Window {
    L?: LeafletNS;
  }
}

function loadLeaflet(): Promise<LeafletNS> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet failed to load"));
    };
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(script);
  });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type ClaimedBiz = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  city: string | null;
  address: string | null;
  postcode: string | null;
  website: string | null;
  contactEmail: string;
  ownerEmail: string | null;
  lat: number | null;
  lng: number | null;
};

export default function AdminApparelMap() {
  const isMobile = useIsMobile(768);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const markersRef = useRef<Record<string, LeafletMarker>>({});
  const [mapReady, setMapReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: claimed, isLoading } = trpc.admin.claimedBusinesses.useQuery();

  const places = useMemo(() => (claimed ?? []) as ClaimedBiz[], [claimed]);
  const withCoords = useMemo(
    () => places.filter((p) => p.lat != null && p.lng != null),
    [places],
  );
  const withoutCoords = useMemo(
    () => places.filter((p) => p.lat == null || p.lng == null),
    [places],
  );

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current).setView([51.5074, -0.1278], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    }).catch(() => setMapReady(false));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer || !mapReady) return;

    layer.clearLayers();
    markersRef.current = {};

    withCoords.forEach((p) => {
      const marker = L.circleMarker([p.lat!, p.lng!], {
        radius: activeId === p.id ? 9 : 7,
        color: V,
        weight: activeId === p.id ? 2 : 1,
        fillColor: V,
        fillOpacity: 0.9,
      });
      marker.bindPopup(() => {
        const web = p.website
          ? `<div style="margin-top:4px"><a href="${esc(p.website)}" target="_blank" rel="noreferrer">${esc(p.website)}</a></div>`
          : "";
        return `<strong>${esc(p.name)}</strong><br/>${esc(p.category || "")}<br/>${esc(p.address || p.city || "")}<br/>${esc(p.postcode || "")}${web}
          <div style="margin-top:6px"><a href="/business/${esc(p.slug)}" target="_blank" rel="noreferrer">View profile</a></div>`;
      });
      marker.on("click", () => setActiveId(p.id));
      marker.addTo(layer);
      markersRef.current[p.id] = marker;
    });

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((p) => [p.lat!, p.lng!]));
      map.fitBounds(bounds.pad(0.15));
    }
  }, [withCoords, mapReady]);

  // Restyle markers when selection changes without rebuilding the layer / fitBounds.
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      marker.setStyle({
        radius: activeId === id ? 9 : 7,
        weight: activeId === id ? 2 : 1,
      });
    });
  }, [activeId]);

  function focusPlace(p: ClaimedBiz) {
    setActiveId(p.id);
    if (p.lat == null || p.lng == null) return;
    mapRef.current?.setView([p.lat, p.lng], 15);
    markersRef.current[p.id]?.openPopup();
  }

  return (
    <AdminLayout>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "340px 1fr",
        gridTemplateRows: isMobile ? "auto 50vh" : "calc(100vh - 0px)",
        height: isMobile ? "auto" : "100vh",
        maxHeight: isMobile ? "none" : "100vh",
        overflow: "hidden",
      }}>
        <aside style={{
          borderRight: isMobile ? "none" : `1px solid ${BORDER}`,
          borderBottom: isMobile ? `1px solid ${BORDER}` : "none",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          background: BG,
          maxHeight: isMobile ? "48vh" : "100vh",
        }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${BORDER}` }}>
            <h1 style={{ margin: "0 0 4px", fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: FG }}>
              Claimed businesses
            </h1>
            <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, lineHeight: 1.45 }}>
              Only shops whose owner has signed up. Pins use their saved location when available.
            </p>
          </div>

          <div style={{
            display: "flex", gap: 12, padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG,
          }}>
            <div>
              <span style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 16, color: FG }}>
                {isLoading ? "…" : places.length}
              </span>
              claimed
            </div>
            <div>
              <span style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 16, color: FG }}>
                {withCoords.length}
              </span>
              on map
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {isLoading && (
              <div style={{ padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
                Loading…
              </div>
            )}
            {!isLoading && places.length === 0 && (
              <div style={{ padding: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
                No claimed businesses yet.
              </div>
            )}
            {places.map((p) => {
              const isActive = activeId === p.id;
              const hasPin = p.lat != null && p.lng != null;
              return (
                <div
                  key={p.id}
                  onClick={() => focusPlace(p)}
                  style={{
                    padding: "10px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: hasPin ? "pointer" : "default",
                    background: isActive ? MUTED : BG,
                  }}
                >
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: FG }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginTop: 2, lineHeight: 1.35 }}>
                    {p.category || "—"} · {p.city || "—"} · {p.postcode || "—"}
                  </div>
                  {!hasPin && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#b45309", marginTop: 2 }}>
                      No location pin yet
                    </div>
                  )}
                </div>
              );
            })}
            {!isLoading && withoutCoords.length > 0 && withCoords.length > 0 && (
              <div style={{ padding: "10px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG }}>
                {withoutCoords.length} claimed without a map pin
              </div>
            )}
          </div>
        </aside>

        <div ref={mapEl} style={{ height: isMobile ? "50vh" : "100%", width: "100%", background: MUTED }} />
      </div>
    </AdminLayout>
  );
}
