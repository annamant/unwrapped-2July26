# Unwrapped

Local drop discovery and reservation platform. Businesses publish time-limited drops; consumers reserve and collect with a QR code.

**This is the ACTIVE repository.** The other `unwrapped*` repos on this account (`unwrapped`, `unwrappedjuly26manus`, `unwrapped-emergent`) are archived predecessors — do not work in them.

## Deployment

- **Live site:** https://shopunwrapped.com
- **Hosting:** Railway, project **UNWRAPPED JULY26** (the only Railway project connected to this repo). Pushes to `master` auto-deploy to production — there is no staging environment, so verify builds locally before committing.
- Client build on Railway is `vite build` only. `tsc` is NOT part of the build (cross-directory type imports don't work in the monorepo build); run `npm run typecheck` locally instead. Known pre-existing tRPC type errors exist and are unrelated to most changes.
- Server pre-deploy runs `drizzle-kit push` (see `server/railway.json`), so schema changes in `server/src/db/schema.ts` are applied to the database on deploy.

## Structure

```
client/   Vite + React 18 + TypeScript, wouter routing, tRPC client, Stripe, Leaflet
server/   Express + tRPC v11, Drizzle ORM (Postgres), Stripe, web-push
```

## Conventions (read before editing the client)

- **No CSS files, no Tailwind.** All styling is inline React `style` props with design-token constants (`BG`, `FG`, `BORDER`, `MUTED`, `MUTED_FG`, `V`) declared at the top of each file.
- **Responsive behaviour is done in JS**, not media queries: use the shared hook `client/src/hooks/useIsMobile.ts` (`const isMobile = useIsMobile()`, default breakpoint 640px; dashboards use 768, sign-in split screens use 900). Global mobile CSS lives in `client/index.html` only.
- Auth is email/password with Bearer tokens (third-party cookies are blocked cross-domain). Session token helpers are in `client/src/trpc.ts`.
- Business accounts are NOT self-registered: businesses apply via `/business-apply`; an account is created/claimed when an admin approves the application (`server/src/router/auth.ts`). Do not add a register flow to `BusinessSignIn.tsx` — one was removed deliberately because it created consumer accounts.
- Reservation creation relies on a unique DB constraint on `stripePaymentIntentId` to prevent payment double-spend — keep that logic intact when touching `server/src/router/reservations.ts`.

## For AI agents / new chat sessions

- Work in THIS repo (`annamant/unwrapped-2July26`), branch `master`.
- If a local clone shows stale `.git/*.lock` files (a known issue with fuse-mounted folders), do not fight it — make changes against a fresh clone of `origin/master` instead, and never push old stranded commits over newer master history.
