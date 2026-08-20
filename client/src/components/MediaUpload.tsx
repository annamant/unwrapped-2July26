import { useRef, useState } from "react";
import { getSessionToken } from "../trpc";
import DropMedia from "./DropMedia";
import {
  MAX_DROP_VIDEO_SECONDS,
  readVideoDuration,
  resolveDropMediaType,
  type DropMediaType,
} from "../lib/dropMedia";

const FG = "#141210";
const BG = "#FAFAF8";
const BORDER = "#E0DFD9";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

/**
 * Photo or short clip picker: uploads to /api/upload (Cloudinary) and reports
 * the hosted URL + media type. Parent forms can still paste a URL manually.
 */
export default function MediaUpload({ value, mediaType, onChange }: {
  value: string;
  mediaType?: DropMediaType;
  onChange: (url: string, mediaType: DropMediaType) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const resolvedType = resolveDropMediaType(value, mediaType);

  async function handleFile(file: File) {
    setError("");
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Choose a photo or short video.");
      return;
    }
    if (isImage && file.size > 10 * 1024 * 1024) {
      setError("Photo must be under 10 MB.");
      return;
    }
    if (isVideo && file.size > 25 * 1024 * 1024) {
      setError("Video must be under 25 MB.");
      return;
    }

    if (isVideo) {
      try {
        const duration = await readVideoDuration(file);
        if (duration > MAX_DROP_VIDEO_SECONDS + 0.25) {
          setError(`Keep clips to ${MAX_DROP_VIDEO_SECONDS} seconds or less.`);
          return;
        }
      } catch {
        setError("Couldn't read that video — try another file.");
        return;
      }
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = getSessionToken();
      const resp = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok || !data.url) {
        setError(data.error ?? "Upload failed — try again.");
      } else {
        onChange(data.url, data.mediaType ?? (isVideo ? "video" : "image"));
      }
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const hasMedia = !!value;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "10px 18px", background: uploading ? MUTED_FG : FG, color: BG, border: "none",
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          {uploading ? "UPLOADING…" : hasMedia ? "REPLACE MEDIA" : "UPLOAD PHOTO OR CLIP"}
        </button>
        {hasMedia && !uploading && (
          <>
            <div style={{
              height: 44, width: 66, border: `1px solid ${BORDER}`, overflow: "hidden", flexShrink: 0,
            }}>
              <DropMedia url={value} mediaType={resolvedType} variant="thumb" />
            </div>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: MUTED_FG,
            }}>
              {resolvedType === "video" ? "VIDEO" : "PHOTO"}
            </span>
            <button
              type="button"
              onClick={() => onChange("", "image")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, textDecoration: "underline", padding: 0,
              }}
            >
              remove
            </button>
          </>
        )}
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 8, marginBottom: 0 }}>
        Raw phone photo or up to {MAX_DROP_VIDEO_SECONDS}s vertical clip — no editing needed.
      </p>
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: V, marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}
