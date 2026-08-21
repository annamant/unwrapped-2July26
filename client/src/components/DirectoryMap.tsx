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

const CURATED_COLOR = "#FF2D12";
const MEMBER_COLOR = "#3A1610";

function makePinSVG(color: string): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">',
    `<circle cx="17" cy="17" r="14" fill="${color}" opacity="0.22">`,
    '<animate attributeName="r" from="14" to="20" dur="2.2s" repeatCount="indefinite"/>',
    '<animate attributeName="opacity" from="0.18" to="0" dur="2.2s" repeatCount="indefinite"/>',
    "</circle>",
    `<circle cx="17" cy="17" r="9" fill="${color}" stroke="#FFF7F2" stroke-width="2" />`,
    color === MEMBER_COLOR
      ? `<circle cx="17" cy="17" r="3.5" fill="#FFF4EF" />`
      : "",
    "</svg>",
  ].join("");
}

function makeIcon(isMember: boolean): L.DivIcon {
  const size = 34;
  return L.divIcon({
    className: "",
    html: makePinSVG(isMember ? MEMBER_COLOR : CURATED_COLOR),
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

  if (pin.isMember && pin.slug) {
    const categoryLine = pin.category
      ? `<div style="font-size:11px;color:#7A7A7A;margin-top:6px">${esc(pin.category)}</div>`
      : "";
    return `
      <div style="font-family:'DM Sans',sans-serif;min-width:220px">
        <div style="font-size:10px;color:#141210;font-family:'Space Mono',monospace;letter-spacing:0.1em;margin-bottom:6px">
          UNWRAPPED MEMBER
        </div>
        <div style="font-size:15px;font-weight:700;color:#141210;line-height:1.2;margin-bottom:8px">
          ${esc(pin.name)}
        </div>
        <div style="font-size:13px;color:#141210;margin-bottom:10px;line-height:1.5">
          ${addressLine}
        </div>
        ${categoryLine}
        <a href="/business/${esc(pin.slug)}"
           style="display:block;margin-top:12px;background:#141210;color:#FAFAF8;
                  text-decoration:none;font-family:'Space Mono',monospace;font-size:10px;
                  letter-spacing:0.1em;padding:10px 0;text-align:center">
          VIEW PROFILE
        </a>
      </div>
    `;
  }

  const trackLine = pin.track
    ? `<div style="font-size:11px;color:#7A7A7A;margin-top:6px">${esc(pin.track)}</div>`
    : "";

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
    pins.forEach((p) => m.set(p.id, p));
    return m;
  }, [pins]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
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

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abc",
      maxZoom: 19,
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

  useEffect(() => {
    (window as any).__unwrappedDirectorySelect = (id: string) => onPinSelect?.(id);
    return () => {
      delete (window as any).__unwrappedDirectorySelect;
    };
  }, [onPinSelect]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersByIdRef.current.forEach((marker) => marker.remove());
    markersByIdRef.current.clear();

    pins.forEach((pin) => {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: makeIcon(!!pin.isMember),
        zIndexOffset: pin.isMember ? 200 : 0,
      }).addTo(mapRef.current!);
      marker.bindPopup(makePopupHTML(pin), {
        closeButton: false,
        className: "uw-popup",
        maxWidth: 260,
      });
      markersByIdRef.current.set(pin.id, marker);
    });
  }, [pins]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!focusedId) return;
    const marker = markersByIdRef.current.get(focusedId);
    const pin = pinById.get(focusedId);
    if (!marker || !pin) return;

    mapRef.current.setView([pin.lat, pin.lng], Math.max(zoom, 14), { animate: true });
    marker.openPopup();
  }, [focusedId, pinById, zoom]);

  return <div ref={containerRef} className="uw-directory-map" style={{ width: "100%", height, background: "#E9E1DB" }} />;
}
