import { useEffect, useRef, useCallback } from "react";

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

// ─── Google Maps loader (singleton) ──────────────────────────────────────────

let scriptLoaded = false;
let scriptLoading = false;
const callbacks: Array<() => void> = [];

function loadGoogleMaps(apiKey: string, onLoad: () => void) {
  if (scriptLoaded) { onLoad(); return; }
  callbacks.push(onLoad);
  if (scriptLoading) return;
  scriptLoading = true;

  (window as any).__gmapsReady = () => {
    scriptLoaded = true;
    callbacks.forEach(cb => cb());
    callbacks.length = 0;
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__gmapsReady`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// ─── Minimal light map style (matches #FAFAF8 palette) ───────────────────────

const MAP_STYLE = [
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#7a7a7a" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.fill", stylers: [{ color: "#F5F4F0" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#F5F4F0" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#E0DFD9" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#7a7a7a" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#E0DFD9" }] },
];

// ─── SVG pin for vermillion drop marker ──────────────────────────────────────

function makeMarkerSVG(isLive: boolean, scarce: boolean) {
  const fill = scarce ? "#E8341C" : "#141210";
  const size = isLive ? 14 : 10;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}">
      <circle cx="${size}" cy="${size}" r="${size - 1}" fill="${fill}" />
      ${isLive ? `<circle cx="${size}" cy="${size}" r="${size - 1}" fill="${fill}" opacity="0.3">
        <animate attributeName="r" from="${size - 1}" to="${size + 4}" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>` : ""}
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
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
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? "";

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;
    const google = (window as any).google;

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom,
      styles: MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      clickableIcons: false,
    });

    infoWindowRef.current = new google.maps.InfoWindow({
      pixelOffset: new google.maps.Size(0, -10),
    });
  }, [defaultLat, defaultLng, zoom]);

  // Place/update markers whenever drops change
  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return;
    const google = (window as any).google;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    drops.forEach(drop => {
      const scarce = drop.availableQuantity <= 3;
      const marker = new google.maps.Marker({
        position: { lat: drop.lat, lng: drop.lng },
        map: mapRef.current,
        icon: {
          url: makeMarkerSVG(drop.isLive, scarce),
          scaledSize: new google.maps.Size(drop.isLive ? 28 : 20, drop.isLive ? 28 : 20),
          anchor: new google.maps.Point(drop.isLive ? 14 : 10, drop.isLive ? 14 : 10),
        },
        title: drop.title,
      });

      marker.addListener("click", () => {
        const end = new Date(drop.collectionEnd);
        const endStr = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const scarceBadge = drop.availableQuantity <= 3
          ? `<span style="color:#E8341C;font-size:10px;font-family:'Space Mono',monospace">${drop.availableQuantity} left</span>`
          : `<span style="color:#7a7a7a;font-size:10px;font-family:'Space Mono',monospace">${drop.availableQuantity} available</span>`;

        infoWindowRef.current.setContent(`
          <div style="font-family:'DM Sans',sans-serif;min-width:200px;padding:4px">
            <div style="font-size:11px;color:#7a7a7a;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:4px">
              ${drop.businessName.toUpperCase()}
            </div>
            <div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:#141210;margin-bottom:6px;line-height:1.2">
              ${drop.title}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:#141210">
                £${(drop.price / 100).toFixed(2)}
              </span>
              ${scarceBadge}
            </div>
            <div style="font-size:11px;color:#7a7a7a;margin-bottom:10px">
              Until ${endStr}
            </div>
            <button
              onclick="window.__unwrappedDropClick && window.__unwrappedDropClick('${drop.id}')"
              style="background:#141210;color:#FAFAF8;border:none;font-family:'Space Mono',monospace;
                     font-size:10px;letter-spacing:0.08em;padding:8px 16px;cursor:pointer;width:100%"
            >
              VIEW DROP
            </button>
          </div>
        `);
        infoWindowRef.current.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [drops]);

  // Expose click handler to window so info window button can call it
  useEffect(() => {
    (window as any).__unwrappedDropClick = (id: string) => {
      infoWindowRef.current?.close();
      onDropClick?.(id);
    };
    return () => { delete (window as any).__unwrappedDropClick; };
  }, [onDropClick]);

  // Load Google Maps and initialise
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey, () => {
      initMap();
      updateMarkers();
    });
  }, [apiKey, initMap, updateMarkers]);

  // Re-draw markers when drops list changes (after map already loaded)
  useEffect(() => {
    if (mapRef.current) updateMarkers();
  }, [drops, updateMarkers]);

  if (!apiKey) {
    return (
      <div style={{
        height, background: "#F5F4F0",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#7a7a7a", fontStyle: "italic" }}>
          Map coming soon
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#b0a89e", letterSpacing: "0.1em" }}>
          Set VITE_GOOGLE_MAPS_API_KEY to enable
        </span>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}

// ─── Helper: convert tRPC drop result to DropPin ──────────────────────────────

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
