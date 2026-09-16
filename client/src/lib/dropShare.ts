import { format } from "date-fns";

export const PUBLIC_SITE_ORIGIN = "https://shopunwrapped.com";

export const DROP_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDropId(id: string): boolean {
  return DROP_ID_RE.test(id);
}

export function dropPublicUrl(dropId: string): string {
  return `${PUBLIC_SITE_ORIGIN}/drop/${dropId}`;
}

export function formatCollectionWindow(
  collectionStart: Date | string,
  collectionEnd: Date | string,
): string {
  const start = new Date(collectionStart);
  const end = new Date(collectionEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "window TBC";
  }
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${format(start, "EEE d MMM")}, ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${format(start, "EEE d MMM, h:mm a")} – ${format(end, "EEE d MMM, h:mm a")}`;
}

export function dropShareText(opts: {
  title: string;
  collectionStart: Date | string;
  collectionEnd: Date | string;
  dropId: string;
}): string {
  return [
    opts.title,
    `Collect ${formatCollectionWindow(opts.collectionStart, opts.collectionEnd)}`,
    dropPublicUrl(opts.dropId),
  ].join("\n");
}

export function whatsappShareUrl(opts: {
  title: string;
  collectionStart: Date | string;
  collectionEnd: Date | string;
  dropId: string;
}): string {
  return `https://wa.me/?text=${encodeURIComponent(dropShareText(opts))}`;
}

export function dropShareNudge(opts: {
  title: string;
  collectionStart: Date | string;
  collectionEnd: Date | string;
  dropId: string;
}): string {
  const windowLabel = formatCollectionWindow(opts.collectionStart, opts.collectionEnd);
  return [
    `We've just dropped ${opts.title} on Unwrapped.`,
    "",
    `Collect ${windowLabel}. Limited quantity — reserve on the link, then come in.`,
    "",
    dropPublicUrl(opts.dropId),
  ].join("\n");
}

export async function copyText(
  text: string,
  input?: HTMLInputElement | HTMLTextAreaElement | null,
): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // HTTP, denied permission, or older WebViews — fall through to select/copy.
    }
  }
  return copyTextFallback(text, input);
}

function copyTextFallback(
  text: string,
  input?: HTMLInputElement | HTMLTextAreaElement | null,
): boolean {
  const target = input ?? makeHiddenCopyField(text);
  const borrowed = !input;
  const wasReadOnly = target.hasAttribute("readonly");
  try {
    if (wasReadOnly) target.removeAttribute("readonly");
    target.focus();
    target.select();
    target.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (wasReadOnly && !borrowed) target.setAttribute("readonly", "");
    if (borrowed) target.remove();
  }
}

function makeHiddenCopyField(text: string): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  return el;
}
