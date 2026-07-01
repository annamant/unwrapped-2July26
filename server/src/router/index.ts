import { router } from "../trpc";
import { authRouter } from "./auth";
import { dropsRouter } from "./drops";
import { reservationsRouter } from "./reservations";
import { businessesRouter } from "./businesses";
import { adminRouter } from "./admin";
import { waitlistRouter } from "./waitlist";

export const appRouter = router({
  auth: authRouter,
  drops: dropsRouter,
  reservations: reservationsRouter,
  businesses: businessesRouter,
  admin: adminRouter,
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
