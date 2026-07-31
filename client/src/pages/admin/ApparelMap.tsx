import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "./Dashboard";
import { APPAREL_PLACES, type ApparelPlace } from "./apparelMapData";
import useIsMobile from "../../hooks/useIsMobile";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

const PALETTE = [
  V, FG, "#2563eb", "#15803d", "#a16207", "#7c3aed",
  "#0f766e", "#be123c", "#1d4ed8", "#b45309", "#334155", "#047857", "#9333ea",
];

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
  setStyle: (opts: object) => void;
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

export default function AdminApparelMap() {
  const isMobile = useIsMobile(768);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const markersRef = useRef<Record<number, LeafletMarker>>({});

  const corridors = useMemo(() => {
    const set = new Set(APPAREL_PLACES.map((p) => p.corridor));
    return [...set].sort();
  }, []);

  const colors = useMemo(() => {
    const m: Record<string, string> = {};
    corridors.forEach((c, i) => { m[c] = PALETTE[i % PALETTE.length]; });
    return m;
  }, [corridors]);

  const [corridorOn, setCorridorOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(corridors.map((c) => [c, true])),
  );
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const visible = useMemo(
    () => APPAREL_PLACES
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => corridorOn[p.corridor])
      .sort((a, b) => a.p.corridor.localeCompare(b.p.corridor) || a.p.name.localeCompare(b.p.name)),
    [corridorOn],
  );

  const selectedWithWeb = [...selected].filter((i) => APPAREL_PLACES[i]?.website).length;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current).setView([51.46, -0.11], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
      const bounds = L.latLngBounds(APPAREL_PLACES.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds.pad(0.08));
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

    visible.forEach(({ p, i }) => {
      const isSel = selected.has(i);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: isSel ? 9 : 6,
        color: isSel ? V : colors[p.corridor],
        weight: isSel ? 2 : 1,
        fillColor: isSel ? V : colors[p.corridor],
        fillOpacity: isSel ? 0.95 : 0.75,
      });
      marker.bindPopup(() => popupHtml(p, i, selected.has(i)));
      marker.on("click", () => setActiveIdx(i));
      marker.addTo(layer);
      markersRef.current[i] = marker;
    });
  }, [visible, selected, colors, mapReady]);

  useEffect(() => {
    (window as unknown as { __apparelToggle?: (i: number) => void }).__apparelToggle = (i: number) => {
      const place = APPAREL_PLACES[i];
      if (!place?.website) {
        window.alert("No website — cannot email-scrape this one.");
        return;
      }
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i);
        else next.add(i);
        return next;
      });
    };
    return () => {
      delete (window as unknown as { __apparelToggle?: (i: number) => void }).__apparelToggle;
    };
  }, []);

  function popupHtml(p: ApparelPlace, i: number, isSel: boolean) {
    const web = p.website
      ? `<div style="margin-top:4px"><a href="${esc(p.website)}" target="_blank" rel="noreferrer">${esc(p.website)}</a></div>`
      : `<div style="margin-top:4px;color:#b45309">No website</div>`;
    return `<strong>${esc(p.name)}</strong><br/>${esc(p.type || "")}<br/>${esc(p.address)}<br/>${esc(p.postcode)}${web}
      <button type="button" onclick="window.__apparelToggle && window.__apparelToggle(${i})"
        style="margin-top:8px;width:100%;padding:8px;font-family:monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;border:1px solid #141210;background:${isSel ? "#FAFAF8" : "#141210"};color:${isSel ? "#141210" : "#FAFAF8"};cursor:pointer">
        ${isSel ? "Deselect" : "Select for email"}
      </button>`;
  }

  function focusPlace(i: number) {
    const p = APPAREL_PLACES[i];
    const map = mapRef.current;
    const marker = markersRef.current[i];
    if (!p || !map) return;
    map.setView([p.lat, p.lng], 16);
    marker?.openPopup();
    setActiveIdx(i);
  }

  function toggleSelect(i: number) {
    const place = APPAREL_PLACES[i];
    if (!place.website) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function exportSelected() {
    const rows = [...selected].map((i) => APPAREL_PLACES[i]).filter((p) => p.website);
    const header = ["name", "website", "type", "city", "address", "postcode", "district", "corridor"] as const;
    const escCsv = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;
    const csv = [header.join(",")]
      .concat(rows.map((r) => header.map((h) => escCsv(r[h] || "")).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lambeth_apparel_selected_for_email.csv";
    a.click();
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    APPAREL_PLACES.forEach((p) => { m[p.corridor] = (m[p.corridor] || 0) + 1; });
    return m;
  }, []);

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
              Lambeth apparel
            </h1>
            <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, lineHeight: 1.45 }}>
              Admin-only high-street map. Tick shops with a website, then export for Outscraper email scrape.
            </p>
          </div>

          <div style={{
            display: "flex", gap: 12, padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG,
          }}>
            <div><span style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 16, color: FG }}>{visible.length}</span>shown</div>
            <div><span style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 16, color: FG }}>{selected.size}</span>selected</div>
            <div><span style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 16, color: FG }}>{selectedWithWeb}</span>with website</div>
          </div>

          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, maxHeight: 150, overflow: "auto" }}>
            {corridors.map((c) => (
              <label key={c} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "3px 0", cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={!!corridorOn[c]}
                  onChange={(e) => setCorridorOn((prev) => ({ ...prev, [c]: e.target.checked }))}
                />
                <span style={{ display: "inline-block", width: 8, height: 8, background: colors[c], flexShrink: 0 }} />
                {c}
                <span style={{ color: MUTED_FG }}>({counts[c]})</span>
              </label>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {visible.map(({ p, i }) => {
              const isSel = selected.has(i);
              const isActive = activeIdx === i;
              return (
                <div
                  key={`${p.name}-${p.postcode}-${i}`}
                  onClick={() => focusPlace(i)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "22px 1fr",
                    gap: 8,
                    padding: "10px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: "pointer",
                    background: isSel ? "#FFF5F3" : isActive ? MUTED : BG,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    disabled={!p.website}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(i)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: FG }}>{p.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginTop: 2, lineHeight: 1.35 }}>
                      {p.corridor} · {p.postcode} · {p.type || "—"}
                    </div>
                    {p.website ? (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: FG, marginTop: 2, wordBreak: "break-all" }}>
                        {p.website}
                      </div>
                    ) : (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#b45309", marginTop: 2 }}>
                        No website — skip for email scrape
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={exportSelected}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.06em",
                textTransform: "uppercase", padding: "10px 12px",
                border: `1px solid ${FG}`, background: selected.size ? FG : BORDER,
                color: BG, cursor: selected.size ? "pointer" : "not-allowed",
              }}
            >
              Export selected websites CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  visible.forEach(({ p, i }) => { if (p.website) next.add(i); });
                  return next;
                });
              }}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.06em",
                textTransform: "uppercase", padding: "10px 12px",
                border: `1px solid ${FG}`, background: BG, color: FG, cursor: "pointer",
              }}
            >
              Select all with website (visible)
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.06em",
                textTransform: "uppercase", padding: "10px 12px",
                border: `1px solid ${BORDER}`, background: BG, color: MUTED_FG, cursor: "pointer",
              }}
            >
              Clear selection
            </button>
          </div>
        </aside>

        <div ref={mapEl} style={{ height: isMobile ? "50vh" : "100%", width: "100%", background: MUTED }} />
      </div>
    </AdminLayout>
  );
}
