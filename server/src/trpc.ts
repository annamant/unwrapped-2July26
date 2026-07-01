import { initTRPC, TRPCError } from "@trpc/server";
import { Request, Response } from "express";
import { getUserFromRequest } from "./auth/oauth";
import { db } from "./db";
import { businesses } from "./db/schema";
import { eq } from "drizzle-orm";

// ─── Context ──────────────────────────────────────────────────────────────────

export async function createContext({ req, res }: { req: Request; res: Response }) {
  const user = await getUserFromRequest(req);
  return { req, res, user, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// ─── tRPC init ────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Protected — any signed-in user ──────────────────────────────────────────

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// ─── Admin only ───────────────────────────────────────────────────────────────

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access only" });
  }
  return next({ ctx });
});

// ─── Business owner — signed in + approved business ──────────────────────────

export const businessOwnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [business] = await ctx.db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, ctx.user.id))
    .limit(1);

  if (!business || business.status !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: business ? "Business account is not active" : "No business account found",
    });
  }

  return next({ ctx: { ...ctx, business } });
});
