/** Infer drop media type from an explicit value or hosted URL shape. */
export function resolveDropMediaType(
  url: string | null | undefined,
  explicit?: "image" | "video" | null,
): "image" | "video" {
  if (explicit === "image" || explicit === "video") return explicit;
  if (!url) return "image";
  if (/\/video\/upload\//.test(url)) return "video";
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return "video";
  return "image";
}
