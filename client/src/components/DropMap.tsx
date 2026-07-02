import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DropPin {
  id: string;
  title: string;
  price: number; // in pence
  lat: number;
  lng: number;
  availableQuantity: number;
  businessName: string;
  collectionEnd: string;
  isLive: boolean;
}

interface DropMapProps {
  drops: DropPin[];
  onDropClick?: (id: string) => void;
  defaultLat?: number;
  defaultLng?: number;
  zoom?: number;
  height?: string;
}

// ─── Custom SVG marker (branded, no image assets) ────────────────────────────

function makeMarkerSVG(isLive: boolean, scarce: boolean): string {
  const fill = scarce ? "#E8341C" : "#141210";
  if (isLive) {
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">',
      `<circle cx="16" cy="16" r="13" fill="${fill}" opacity="0.2">`,
      '<animate attributeName="r" from="13" to="18" dur="2s" repeatCount="indefinite"/>',
      '<animate attributeName="opacity" from="0.2" to="0" dur="2s" repeatCount="indefinite"/>',
      "</circle>",
      `<circle cx="16" cy="16" r="10" fill="${fill}" />`,
      "</svg>",
    ].join("");
  }
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">',
    `<circle cx="10" cy="10" r="8" fill="${fill}" />`,
    "</svg>",
  ].join("");
}

function makeIcon(isLive: boolean, scarce: boolean): L.DivIcon {
  const size = isLive ? 32 : 20;
  return L.divIcon({
    className: "",
    html: makeMarkerSVG(isLive, scarce),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

// ─── Popup HTML ───────────────────────────────────────────────────────────────

function makePopupHTML(drop: DropPin): string {
  const end = new Date(drop.collectionEnd);
  const endStr = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const scarce = drop.availableQuantity <= 3;
  const availBadge = scarce
    ? `<span style="color:#E8341C;font-size:10px;font-family:'Space Mono',monospace">${drop.availableQuantity} left</span>`
    : `<span style="color:#7A7A7A;font-size:10px;font-family:'Space Mono',monospace">${drop.availableQuantity} available</span>`;

  return `
    <div style="font-family:'DM Sans',sans-serif;min-width:190px">
      <div style="font-size:10px;color:#7A7A7A;font-family:'Space Mono',monospace;letter-spacing:0.1em;margin-bottom:4px">
        ${drop.businessName.toUpperCase()}
      </div>
      <div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:#141210;margin-bottom:8px;line-height:1.2">
        ${drop.title}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:#141210">
          £${(drop.price / 100).toFixed(2)}
        </span>
        ${availBadge}
      </div>
      <div style="font-size:11px;color:#7A7A7A;margin-bottom:12px">
        Until ${endStr}
      </div>
      <button
        onclick="window.__unwrappedDropClick && window.__unwrappedDropClick('${drop.id}')"
        style="background:#141210;color:#FAFAF8;border:none;font-family:'Space Mono',monospace;
               font-size:10px;letter-spacing:0.1em;padding:9px 0;cursor:pointer;width:100%;display:block"
      >
        VIEW DROP
      </button>
    </div>
  `;
}

// ─── Popup style (injected once) ─────────────────────────────────────────────

const POPUP_CSS = `
  .uw-popup .leaflet-popup-content-wrapper {
    border-radius: 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
    padding: 0;
    border: 1px solid #E0DFD9;
  }
  .uw-popup .leaflet-popup-content {
    margin: 16px;
  }
  .uw-popup .leaflet-popup-tip-container {
    display: none;
  }
  .leaflet-control-attribution {
    font-size: 9px !important;
  }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  const style = document.createElement("style");
  style.textContent = POPUP_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DropMap({
  drops,
  onDropClick,
  defaultLat = 51.509865,
  defaultLng = -0.118092,
  zoom = 13,
  height = "480px",
}: DropMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    injectCSS();

    const map = L.map(containerRef.current, {
      center: [defaultLat, defaultLng],
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // CartoDB light tiles — free, no API key, matches cream palette
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recenter when search changes defaultLat/defaultLng ──────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([defaultLat, defaultLng], mapRef.current.getZoom(), { animate: true });
  }, [defaultLat, defaultLng]);

  // ── Expose drop-click handler to popup buttons ───────────────────────────
  useEffect(() => {
    (window as any).__unwrappedDropClick = (id: string) => {
      onDropClick?.(id);
    };
    return () => {
      delete (window as any).__unwrappedDropClick;
    };
  }, [onDropClick]);

  // ── Render/update markers whenever drops list changes ────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    drops.forEach(drop => {
      const scarce = drop.availableQuantity > 0 && drop.availableQuantity <= 3;
      const icon = makeIcon(drop.isLive, scarce);

      const marker = L.marker([drop.lat, drop.lng], { icon }).addTo(mapRef.current!);

      marker.bindPopup(makePopupHTML(drop), {
        closeButton: false,
        className: "uw-popup",
        maxWidth: 240,
      });

      markersRef.current.push(marker);
    });
  }, [drops]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}

// ─── Helper: convert tRPC drop result to DropPin ─────────────────────────────

export function toDropPin(item: { drop: any; business: any; location: any }): DropPin {
  const now = new Date();
  const start = new Date(item.drop.collectionStart);
  const end = new Date(item.drop.collectionEnd);
  return {
    id: item.drop.id,
    title: item.drop.title,
    price: item.drop.price,
    lat: item.location.latitude,
    lng: item.location.longitude,
    availableQuantity: item.drop.availableQuantity,
    businessName: item.business.name,
    collectionEnd: item.drop.collectionEnd,
    isLive: now >= start && now <= end,
  };
}
