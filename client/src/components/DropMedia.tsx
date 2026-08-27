import { resolveDropMediaType, type DropMediaType } from "../lib/dropMedia";
import { BG, FG, MUTED, MUTED_FG, V } from "../theme";


function VideoBadge({ variant }: { variant: DropMediaProps["variant"] }) {
  if (variant === "thumb") return null;
  return (
    <div style={{
      position: "absolute",
      bottom: variant === "hero" ? 16 : 12,
      right: variant === "hero" ? 16 : 12,
      display: "flex",
      alignItems: "center",
      gap: 5,
      background: V,
      color: BG,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: variant === "hero" ? 10 : 9,
      fontWeight: 800,
      letterSpacing: "0.04em",
      padding: variant === "hero" ? "6px 11px" : "5px 9px",
      borderRadius: 999,
      pointerEvents: "none",
      zIndex: 2,
      boxShadow: "0 6px 16px rgba(36,75,54,0.35)",
    }}>
      <span aria-hidden style={{ fontSize: variant === "hero" ? 10 : 9 }}>▶</span>
      CLIP
    </div>
  );
}

type DropMediaProps = {
  url?: string | null;
  mediaType?: DropMediaType | null;
  /** card = list thumbnail; hero = drop detail; thumb = small merchant preview */
  variant?: "card" | "hero" | "thumb";
  placeholder?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function DropMedia({
  url,
  mediaType,
  variant = "card",
  placeholder,
  style,
}: DropMediaProps) {
  const kind = resolveDropMediaType(url, mediaType);
  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: MUTED,
    ...style,
  };

  if (!url) {
    return (
      <div style={{
        ...baseStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {placeholder ?? (
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: MUTED_FG, fontStyle: "italic" }}>
            No media
          </span>
        )}
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <video
          src={url}
          muted
          loop
          playsInline
          autoPlay
          controls={variant === "hero"}
          style={baseStyle}
        />
        <VideoBadge variant={variant} />
      </div>
    );
  }

  return <img src={url} alt="" style={baseStyle} />;
}
