import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users, sessions, notificationPreferences, locationZones, businesses } from "../db/schema";
import { getLoginUrl } from "../auth/oauth";
import { TRPCError } from "@trpc/server";

export const authRouter = router({

  // Current user + their business status
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

  // Get login URL for a given return path
  getLoginUrl: publicProcedure
    .input(z.object({ returnPath: z.string().optional() }))
    .query(({ input }) => {
      return { url: getLoginUrl(input.returnPath ?? "/") };
    }),

  // Sign out
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const token = ctx.req.cookies?.session_token;
    if (token) {
      await ctx.db.delete(sessions).where(eq(sessions.token, token));
    }
    ctx.res.clearCookie("session_token");
    return { success: true };
  }),

  // Complete onboarding — save interests
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
        .set({
          interestCategories: input.interestCategories,
          onboardingComplete: true,
        })
        .where(eq(users.id, ctx.user.id));

      // Save notification preferences
      await ctx.db
        .insert(notificationPreferences)
        .values({
          userId: ctx.user.id,
          enabledCategories: input.interestCategories,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: { enabledCategories: input.interestCategories },
        });

      // Save location zone if provided
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

  // Update notification preferences
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

  // Get notification preferences
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const [prefs] = await ctx.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id))
      .limit(1);
    return prefs ?? null;
  }),

  // Add location zone
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

  // Remove location zone
  removeLocationZone: protectedProcedure
    .input(z.object({ zoneId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(locationZones)
        .where(eq(locationZones.id, input.zoneId));
      return { success: true };
    }),

  // Delete account (GDPR right to erasure — automated, no admin required)
  deleteAccount: protectedProcedure
    .input(z.object({ confirmation: z.literal("DELETE") }))
    .mutation(async ({ ctx }) => {
      // Cancel all active reservations (Stripe refunds would be triggered here)
      // Mark user for deletion — actual cascade delete via DB relations
      await ctx.db.delete(users).where(eq(users.id, ctx.user.id));
      ctx.res.clearCookie("session_token");
      return { success: true };
    }),
});
