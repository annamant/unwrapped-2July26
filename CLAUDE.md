# CLAUDE.md — read this before doing anything

## The one repo that matters

This is the ACTIVE repository: `annamant/unwrapped-2July26`, branch `master`. The other `unwrapped*` repos on this account are archived — never work in them.

## Deployment — be careful

- Pushes to `master` auto-deploy to **production** (https://shopunwrapped.com) via the Railway project **UNWRAPPED JULY26**. There is no staging environment.
- Verify the client builds before committing: `cd client && npx vite build`. Railway runs `vite build` only — `tsc` is NOT part of the build and has known pre-existing tRPC type errors unrelated to most changes. Do not try to "fix" the build by adding tsc.
- Server pre-deploy runs `drizzle-kit push` (`server/railway.json`) — schema edits hit the live database on deploy.

## Client conventions — do not deviate

- **No CSS files, no Tailwind, no styled-components.** All styling is inline `style` props using per-file design-token constants (`BG`, `FG`, `BORDER`, `MUTED`, `MUTED_FG`, `V`).
- **Responsive = JS, not media queries.** Use `client/src/hooks/useIsMobile.ts`. Breakpoints in use: 640 default, 768 dashboards, 900 sign-in split screens. Global mobile CSS lives only in `client/index.html`.
- Routing is wouter; API is tRPC v11; auth is email/password with Bearer tokens (cookies don't work cross-domain).

## Things deliberately removed — do not reintroduce

- `BusinessSignIn.tsx` is login-only. A "Create account" tab was removed because it silently created consumer accounts. Business accounts are created/claimed when an admin approves an application submitted at `/business-apply` (`server/src/router/auth.ts`).
- `server/src/router/reservations.ts` relies on a unique DB constraint on `stripePaymentIntentId` to prevent payment double-spend. Keep that intact.

## Known pitfalls

- Fuse-mounted local clones may have stuck `.git/*.lock` files that cannot be deleted from a sandbox. Don't fight them: work from a fresh clone of `origin/master`. Never push old stranded commits over newer master history (a commit `ca8cd72` in an old clone is obsolete — its fix is already on master as `656e870`).
