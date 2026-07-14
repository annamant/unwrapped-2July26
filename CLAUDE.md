# CLAUDE.md — read this before doing anything

## The one repo that matters

This is the ACTIVE repository: `annamant/unwrapped-2July26`, branch `master`. The other `unwrapped*` repos on this account are archived — never work in them.

**One session at a time.** Multiple AI chat sessions have previously edited this repo concurrently and overwrote each other's changes to the same file (client/index.html, twice). Before editing anything, check `git log origin/master -5` for commits from the last hour you don't recognise, and always base edits on the latest origin/master content — not on a stale local copy.

## Deployment — be careful

- Pushes to `master` auto-deploy to **production** (https://shopunwrapped.com) via the Railway project **UNWRAPPED JULY26**. There is no staging environment.
- Verify the client builds before committing: `cd client && npx vite build`. Railway runs `vite build` only — `tsc` is NOT part of the build and has known pre-existing tRPC type errors unrelated to most changes. Do not try to "fix" the build by adding tsc.
- Server pre-deploy runs `drizzle-kit push` (`server/railway.json`) — schema edits hit the live database on deploy.

## Client conventions — do not deviate

- **No CSS files, no Tailwind, no styled-components.** All styling is inline `style` props using per-file design-token constants (`BG`, `FG`, `BORDER`, `MUTED`, `MUTED_FG`, `V`).
- **Responsive = JS, not media queries.** Use `client/src/hooks/useIsMobile.ts`. Breakpoints in use: 640 default, 768 dashboards, 900 sign-in split screens. Global mobile CSS lives only in `client/index.html`.
- Routing is wouter; API is tRPC v11; auth is email/password with Bearer tokens (cookies don't work cross-domain).

## Things deliberately removed — do not reintroduce

- `BusinessSignIn.tsx` is login-only. A "Create account" tab was removed because it silently created shopper accounts. Business accounts are created/claimed when an admin approves an application submitted at `/business-apply` (`server/src/router/auth.ts`).
- `server/src/router/reservations.ts` relies on a unique DB constraint on `stripePaymentIntentId` to prevent payment double-spend. Keep that intact.

## What already exists — do not rebuild

- Password reset: `auth.requestPasswordReset` / `auth.resetPassword` + `/reset-password` page + `password_reset_tokens` table.
- Reservation confirmation + password reset + application decision + drop alert emails, all via Resend in `server/src/notifications/dispatch.ts` (silently no-op without `RESEND_API_KEY`).
- Stripe webhook `/api/stripe/webhook` in `server/src/index.ts` — signature-verified, reconciles orphaned payments after 90s. Needs `STRIPE_WEBHOOK_SECRET` env.
- Camera QR scanning in `Scanner.tsx` via the `qr-scanner` package.
- `drops.update` mutation (title/description/image; quantity increase-only; window extend-only).
- Admin promotion via `ADMIN_EMAILS` env (comma-separated, applied on login).
- Legal pages `/privacy` + `/terms` (`client/src/pages/Legal.tsx`), SEO/OG meta in `client/index.html`, favicon/manifest/OG image in `client/public/`.
- Rate limiting on auth mutations (in-memory, in `server/src/router/auth.ts`).
- Support/contact email everywhere: **anna@shopunwrapped.com**.

## Env vars the server expects

`DATABASE_URL`, `CLIENT_URL` (comma-separated origins), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`, `ADMIN_EMAILS`. Client build needs `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`.

## Known gaps (deliberate, pending decisions — see unwrapped-launch-readiness.md history)

- No payout mechanism (Stripe Connect vs manual — awaiting decision).
- Image upload endpoint exists but returns 501 until R2/S3 storage is configured.
- No email verification on signup (UX decision pending).
- Per-route OG tags for drop/business pages (SPA serves one shell — needs prerender/bot middleware).

## Known pitfalls

- Fuse-mounted local clones may have stuck `.git/*.lock` files that cannot be deleted from a sandbox. Don't fight them: work from a fresh clone of `origin/master`. Never push old stranded commits over newer master history (a commit `ca8cd72` in an old clone is obsolete — its fix is already on master as `656e870`).
