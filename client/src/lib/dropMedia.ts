export type DropMediaType = "image" | "video";

export function resolveDropMediaType(
  url: string | null | undefined,
  explicit?: DropMediaType | null,
): DropMediaType {
  if (explicit === "image" || explicit === "video") return explicit;
  if (!url) return "image";
  if (/\/video\/upload\//.test(url)) return "video";
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return "video";
  return "image";
}

/** White paper Phase 1: raw 15-second vertical smartphone clips. */
export const MAX_DROP_VIDEO_SECONDS = 15;

export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Couldn't read video metadata."));
    };
    video.src = URL.createObjectURL(file);
  });
}
