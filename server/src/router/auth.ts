import { z } from "zod";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users, sessions, notificationPreferences, locationZones, businesses } from "../db/schema";
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
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(key === derived.toString("hex"));
    });
  });
}

async function createSession(ctx: any, userId: string) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  await ctx.db.insert(sessions).values({ userId, token, expiresAt });
  ctx.res.cookie("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
      const existing = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      }

      const passwordHash = await hashPassword(input.password);

      const [user] = await ctx.db
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
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

  // ── Current user ─────────────────────────────────────────────────────────
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
      await ctx.db.delete(locationZones).where(eq(locationZones.id, input.zoneId));
      return { success: true };
    }),

  // ── Delete account ────────────────────────────────────────────────────────
  deleteAccount: protectedProcedure
    .input(z.object({ confirmation: z.literal("DELETE") }))
    .mutation(async ({ ctx }) => {
      await ctx.db.delete(users).where(eq(users.id, ctx.user.id));
      ctx.res.clearCookie("session_token");
      return { success: true };
    }),
});
