import { useRef, useState } from "react";
import { getSessionToken } from "../trpc";

const FG = "#141210";
const BG = "#FAFAF8";
const BORDER = "#E0DFD9";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

/**
 * Image picker: uploads to /api/upload (Cloudinary behind the scenes) and
 * reports the hosted URL. Falls back gracefully — a URL can still be pasted
 * in the separate URL field kept by the parent form.
 */
export default function ImageUpload({ value, onChange }: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB."); return; }

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
        onChange(data.url);
      }
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
          {uploading ? "UPLOADING…" : value ? "REPLACE PHOTO" : "UPLOAD PHOTO"}
        </button>
        {value && !uploading && (
          <>
            <img src={value} alt="preview" style={{ height: 44, width: 66, objectFit: "cover", border: `1px solid ${BORDER}` }} />
            <button
              type="button"
              onClick={() => onChange("")}
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
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: V, marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}
