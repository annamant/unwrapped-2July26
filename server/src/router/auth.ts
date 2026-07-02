import { z } from "zod";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { and } from "drizzle-orm";
import {
  users, sessions, notificationPreferences, locationZones, businesses,
  reservations, waitlist, follows, notificationMutes, pushSubscriptions,
} from "../db/schema";
import { TRPCError } from "@trpc/server";

// ─── Password hashing via Node built-in crypto.scrypt ─────────────────────────

const SESSION_DURATION_DAYS = 90;

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = stored.split(":");
    if (!salt || !key) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      const keyBuf = Buffer.from(key, "hex");
      resolve(keyBuf.length === derived.length && crypto.timingSafeEqual(keyBuf, derived));
    });
  });
}

// ─── Simple in-memory rate limiter (per key, sliding window) ──────────────────

const attempts = new Map<string, number[]>();
function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter(t => now - t < windowMs);
  if (list.length >= max) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again in a few minutes." });
  }
  list.push(now);
  attempts.set(key, list);
  if (attempts.size > 10_000) attempts.clear(); // crude memory cap
}

async function createSession(ctx: any, userId: string) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  await ctx.db.insert(sessions).values({ userId, token, expiresAt });
  ctx.res.cookie("session_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: expiresAt,
    path: "/",
  });
  return token;
}

// ─── Auth Router ──────────────────────────────────────────────────────────────

export const authRouter = router({

  // ── Register (email + password) ───────────────────────────────────────────
  register: publicProcedure
    .input(z.object({
      email: z.string().email("Invalid email"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required").max(80),
    }))
    .mutation(async ({ ctx, input }) => {
      rateLimit(`register-ip:${ctx.req.ip ?? "unknown"}`, 20, 10 * 60 * 1000);

      const email = input.email.toLowerCase();
      const [existing] = await ctx.db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const passwordHash = await hashPassword(input.password);

      // Placeholder accounts (created when an admin approves a business
      // application before the owner registered) have no password — let the
      // owner claim the account by registering with the matching email.
      if (existing) {
        if (existing.passwordHash) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        }
        await ctx.db
          .update(users)
          .set({ passwordHash, name: input.name })
          .where(eq(users.id, existing.id));
        await createSession(ctx, existing.id);
        return { success: true, redirect: "/onboarding" };
      }

      const [user] = await ctx.db
        .insert(users)
        .values({
          email,
          passwordHash,
          name: input.name,
          role: "consumer",
          onboardingComplete: false,
        })
        .returning();

      await createSession(ctx, user.id);
      return { success: true, redirect: "/onboarding" };
    }),

  // ── Login (email + password) ──────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      rateLimit(`login:${input.email.toLowerCase()}`, 10, 10 * 60 * 1000);
      rateLimit(`login-ip:${ctx.req.ip ?? "unknown"}`, 30, 10 * 60 * 1000);

      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      }

      await createSession(ctx, user.id);

      const [business] = await ctx.db
        .select({ id: businesses.id, status: businesses.status })
        .from(businesses)
        .where(eq(businesses.ownerId, user.id))
        .limit(1);

      const redirect = !user.onboardingComplete
        ? "/onboarding"
        : business?.status === "active"
        ? "/dashboard"
        : "/home";

      return { success: true, redirect };
    }),

  // ── Current user ──────────────────────────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    const [business] = await ctx.db
      .select({ id: businesses.id, name: businesses.name, status: businesses.status, slug: businesses.slug })
      .from(businesses)
      .where(eq(businesses.ownerId, ctx.user.id))
      .limit(1);

    return {
      ...ctx.user,
      business: business ?? null,
      hasBusiness: !!business && business.status === "active",
    };
  }),

  // ── Sign out ──────────────────────────────────────────────────────────────
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const token = ctx.req.cookies?.session_token;
    if (token) {
      await ctx.db.delete(sessions).where(eq(sessions.token, token));
    }
    ctx.res.clearCookie("session_token");
    return { success: true };
  }),

  // ── Complete onboarding ───────────────────────────────────────────────────
  completeOnboarding: protectedProcedure
    .input(z.object({
      interestCategories: z.array(z.string()).min(3, "Select at least 3 categories"),
      locationZone: z.object({
        label: z.string(),
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ interestCategories: input.interestCategories, onboardingComplete: true })
        .where(eq(users.id, ctx.user.id));

      await ctx.db
        .insert(notificationPreferences)
        .values({ userId: ctx.user.id, enabledCategories: input.interestCategories })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: { enabledCategories: input.interestCategories },
        });

      if (input.locationZone) {
        await ctx.db.insert(locationZones).values({
          userId: ctx.user.id,
          label: input.locationZone.label,
          latitude: input.locationZone.latitude,
          longitude: input.locationZone.longitude,
        });
      }

      return { success: true };
    }),

  // ── Notification preferences ──────────────────────────────────────────────
  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      enabledCategories: z.array(z.string()).optional(),
      quietHoursEnabled: z.boolean().optional(),
      quietHoursStart: z.number().min(0).max(23).optional(),
      quietHoursEnd: z.number().min(0).max(23).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(notificationPreferences)
        .values({
          userId: ctx.user.id,
          enabledCategories: input.enabledCategories ?? [],
          quietHoursEnabled: input.quietHoursEnabled ?? true,
          quietHoursStart: input.quietHoursStart ?? 22,
          quietHoursEnd: input.quietHoursEnd ?? 8,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            ...(input.enabledCategories !== undefined && { enabledCategories: input.enabledCategories }),
            ...(input.quietHoursEnabled !== undefined && { quietHoursEnabled: input.quietHoursEnabled }),
            ...(input.quietHoursStart !== undefined && { quietHoursStart: input.quietHoursStart }),
            ...(input.quietHoursEnd !== undefined && { quietHoursEnd: input.quietHoursEnd }),
            updatedAt: new Date(),
          },
        });
      return { success: true };
    }),

  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const [prefs] = await ctx.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id))
      .limit(1);
    return prefs ?? null;
  }),

  // ── Location zones ────────────────────────────────────────────────────────
  addLocationZone: protectedProcedure
    .input(z.object({
      label: z.string().min(1),
      latitude: z.number(),
      longitude: z.number(),
      radiusKm: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [zone] = await ctx.db
        .insert(locationZones)
        .values({ userId: ctx.user.id, ...input })
        .returning();
      return zone;
    }),

  removeLocationZone: protectedProcedure
    .input(z.object({ zoneId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(locationZones)
        .where(and(eq(locationZones.id, input.zoneId), eq(locationZones.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Delete account ────────────────────────────────────────────────────────
  deleteAccount: protectedProcedure
    .input(z.object({ confirmation: z.literal("DELETE") }))
    .mutation(async ({ ctx }) => {
      // Business owners must contact support (deleting a business with live
      // drops/reservations has financial consequences).
      const [owned] = await ctx.db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.ownerId, ctx.user.id))
        .limit(1);
      if (owned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You own a business on Unwrapped. Contact support to close your business account first.",
        });
      }

      // Remove dependent rows that don't cascade, then the user.
      const uid = ctx.user.id;
      await ctx.db.delete(reservations).where(eq(reservations.userId, uid));
      await ctx.db.delete(waitlist).where(eq(waitlist.userId, uid));
      await ctx.db.delete(follows).where(eq(follows.userId, uid));
      await ctx.db.delete(notificationMutes).where(eq(notificationMutes.userId, uid));
      await ctx.db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, uid));
      await ctx.db.delete(notificationPreferences).where(eq(notificationPreferences.userId, uid));
      await ctx.db.delete(locationZones).where(eq(locationZones.userId, uid));
      await ctx.db.delete(sessions).where(eq(sessions.userId, uid));
      await ctx.db.delete(users).where(eq(users.id, uid));

      ctx.res.clearCookie("session_token");
      return { success: true };
    }),
});
