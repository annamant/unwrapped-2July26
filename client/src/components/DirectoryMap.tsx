import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { PrelaunchDirectoryPin } from "../lib/prelaunch_wave1_directory_pins";

export interface DirectoryMapProps {
  pins: PrelaunchDirectoryPin[];
  defaultLat?: number;
  defaultLng?: number;
  zoom?: number;
  height?: string;
  focusedId?: string;
  onPinSelect?: (id: string) => void;
}

function makePinSVG(): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">',
    `<circle cx="14" cy="14" r="12" fill="#E8341C" opacity="0.18">`,
    '<animate attributeName="r" from="12" to="17" dur="2.2s" repeatCount="indefinite"/>',
    '<animate attributeName="opacity" from="0.18" to="0" dur="2.2s" repeatCount="indefinite"/>',
    "</circle>",
    `<circle cx="14" cy="14" r="8" fill="#E8341C" />`,
    "</svg>",
  ].join("");
}

function makeIcon(): L.DivIcon {
  const size = 28;
  return L.divIcon({
    className: "",
    html: makePinSVG(),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makePopupHTML(pin: PrelaunchDirectoryPin): string {
  const addressLine = pin.address
    ? esc(pin.address)
    : pin.postcode
      ? esc(pin.postcode)
      : "—";

  const trackLine = pin.track ? `<div style="font-size:11px;color:#7A7A7A;margin-top:6px">${esc(pin.track)}</div>` : "";

  // List page controls "claim" in-page; for now we just let users apply.
  return `
    <div style="font-family:'DM Sans',sans-serif;min-width:220px">
      <div style="font-size:10px;color:#7A7A7A;font-family:'Space Mono',monospace;letter-spacing:0.1em;margin-bottom:6px">
        DIRECTORY LISTING
      </div>
      <div style="font-size:15px;font-weight:700;color:#141210;line-height:1.2;margin-bottom:8px">
        ${esc(pin.name)}
      </div>
      <div style="font-size:13px;color:#141210;margin-bottom:10px;line-height:1.5">
        ${addressLine}
      </div>
      ${trackLine}
      <a href="/business-apply"
         style="display:block;margin-top:12px;background:#141210;color:#FAFAF8;
                text-decoration:none;font-family:'Space Mono',monospace;font-size:10px;
                letter-spacing:0.1em;padding:10px 0;text-align:center">
        APPLY TO LIST YOUR BUSINESS
      </a>
    </div>
  `;
}

const POPUP_CSS = `
  .uw-popup .leaflet-popup-content-wrapper {
    border-radius: 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
    padding: 0;
    border: 1px solid #E0DFD9;
  }
  .uw-popup .leaflet-popup-content { margin: 16px; }
  .uw-popup .leaflet-popup-tip-container { display: none; }
  .leaflet-control-attribution { font-size: 9px !important; }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  const style = document.createElement("style");
  style.textContent = POPUP_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

export default function DirectoryMap({
  pins,
  defaultLat = 51.509865,
  defaultLng = -0.118092,
  zoom = 13,
  height = "520px",
  focusedId,
  onPinSelect,
}: DirectoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());

  const pinById = useMemo(() => {
    const m = new Map<string, PrelaunchDirectoryPin>();
    pins.forEach(p => m.set(p.id, p));
    return m;
  }, [pins]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    // StrictMode double-effect guard
    if ((container as any)._leaflet_id) return;

    injectCSS();

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [defaultLat, defaultLng],
        zoom,
        zoomControl: false,
        attributionControl: true,
      });
    } catch {
      return;
    }

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => {
      if (mapRef.current && container.offsetWidth > 0) mapRef.current.invalidateSize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersByIdRef.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([defaultLat, defaultLng], mapRef.current.getZoom(), { animate: true });
  }, [defaultLat, defaultLng]);

  // Expose selection handler to popup button (if we later add one).
  useEffect(() => {
    (window as any).__unwrappedDirectorySelect = (id: string) => onPinSelect?.(id);
    return () => {
      delete (window as any).__unwrappedDirectorySelect;
    };
  }, [onPinSelect]);

  // Render/update markers whenever pins change
  useEffect(() => {
    if (!mapRef.current) return;

    markersByIdRef.current.forEach(marker => marker.remove());
    markersByIdRef.current.clear();

    pins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], { icon: makeIcon() }).addTo(mapRef.current!);
      marker.bindPopup(makePopupHTML(pin), {
        closeButton: false,
        className: "uw-popup",
        maxWidth: 260,
      });
      markersByIdRef.current.set(pin.id, marker);
    });
  }, [pins]);

  // Focus from list interactions
  useEffect(() => {
    if (!mapRef.current) return;
    if (!focusedId) return;
    const marker = markersByIdRef.current.get(focusedId);
    const pin = pinById.get(focusedId);
    if (!marker || !pin) return;

    mapRef.current.setView([pin.lat, pin.lng], Math.max(zoom, 14), { animate: true });
    marker.openPopup();
  }, [focusedId, pinById, zoom]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}

