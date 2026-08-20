import { resolveDropMediaType, type DropMediaType } from "../lib/dropMedia";

const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const FG = "#141210";
const BG = "#FAFAF8";

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
      background: FG,
      color: BG,
      fontFamily: "'Space Mono', monospace",
      fontSize: variant === "hero" ? 9 : 8,
      letterSpacing: "0.12em",
      padding: variant === "hero" ? "5px 10px" : "4px 8px",
      pointerEvents: "none",
      zIndex: 2,
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
