import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server/src/router";

const TOKEN_KEY = "uw_session";

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { /* private mode — cookie fallback still applies */ }
}

export function clearSessionToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL ?? ""}/api/trpc`,
      // Auth via Bearer token: the API lives on a different domain, and
      // third-party cookies are blocked by modern browsers.
      headers: () => {
        const token = getSessionToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch: (url, options) =>
        fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});
