import { z } from "zod";
import { and, eq, desc, count, gte, lte, inArray, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, businessOwnerProcedure, adminProcedure } from "../trpc";
import { businesses, businessApplications, follows, notificationMutes, locations, drops, reservations, users } from "../db/schema";
import { TRPCError } from "@trpc/server";
import { effectiveReceive } from "../payments/fees";
import { isIndexablePartner } from "../seoIndexable";

const UNCLAIMED_OWNER_EMAIL = "unclaimed-directory@shopunwrapped.com";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50)
    + "-" + Math.random().toString(36).slice(2, 6);
}

export const businessesRouter = router({

  // Public: claimed member shops for the landing directory and shopper home.
  // Lat/lng are optional — shops without a pin still appear in the list.
  directoryMembers: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        category: businesses.category,
        description: businesses.description,
        logoUrl: businesses.logoUrl,
        city: businesses.city,
        address: businesses.address,
        postcode: businesses.postcode,
        lat: sql<number | null>`(
          SELECT ${locations.latitude} FROM ${locations}
          WHERE ${locations.businessId} = ${businesses.id}
          ORDER BY ${locations.createdAt} DESC
          LIMIT 1
        )`,
        lng: sql<number | null>`(
          SELECT ${locations.longitude} FROM ${locations}
          WHERE ${locations.businessId} = ${businesses.id}
          ORDER BY ${locations.createdAt} DESC
          LIMIT 1
        )`,
      })
      .from(businesses)
      .innerJoin(users, eq(businesses.ownerId, users.id))
      .where(and(
        eq(businesses.status, "active"),
        sql`lower(${businesses.contactEmail}) <> ${UNCLAIMED_OWNER_EMAIL}`,
        sql`${users.passwordHash} IS NOT NULL`,
      ))
      .orderBy(businesses.name);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      description: r.description,
      logoUrl: r.logoUrl,
      city: r.city,
      address: r.address,
      postcode: r.postcode,
      lat: r.lat,
      lng: r.lng,
    }));
  }),

  // Public: get a business profile by slug (includes active drops)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [biz] = await ctx.db
        .select({
          id: businesses.id,
          slug: businesses.slug,
          name: businesses.name,
          description: businesses.description,
          category: businesses.category,
          instagramHandle: businesses.instagramHandle,
          website: businesses.website,
          logoUrl: businesses.logoUrl,
          coverUrl: businesses.coverUrl,
          city: businesses.city,
          address: businesses.address,
          postcode: businesses.postcode,
          status: businesses.status,
          contactEmail: businesses.contactEmail,
          passwordHash: users.passwordHash,
        })
        .from(businesses)
        .innerJoin(users, eq(businesses.ownerId, users.id))
        .where(eq(businesses.slug, input.slug))
        .limit(1);

      const isAdminViewer = ctx.user?.role === "admin";
      if (!biz || (biz.status !== "active" && !isAdminViewer)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }

      const [followCount] = await ctx.db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.businessId, biz.id));

      // Only expose publicly visible drops (no drafts/cancelled)
      const bizDrops = await ctx.db
        .select({
          id: drops.id,
          businessId: drops.businessId,
          locationId: drops.locationId,
          format: drops.format,
          category: drops.category,
          title: drops.title,
          description: drops.description,
          imageUrl: drops.imageUrl,
          price: drops.price,
          originalPrice: drops.originalPrice,
          totalQuantity: drops.totalQuantity,
          availableQuantity: drops.availableQuantity,
          collectionStart: drops.collectionStart,
          collectionEnd: drops.collectionEnd,
          status: drops.status,
          featured: drops.featured,
        })
        .from(drops)
        .where(and(
          eq(drops.businessId, biz.id),
          inArray(drops.status, ["active", "sold_out", "expired"]),
        ))
        .orderBy(desc(drops.collectionStart))
        .limit(20);

      const { contactEmail, passwordHash, ...publicBiz } = biz;
      const indexable = isIndexablePartner({
        name: biz.name,
        slug: biz.slug,
        status: biz.status,
        contactEmail,
        passwordHash,
      });

      return { business: publicBiz, followCount: followCount.count, drops: bizDrops, indexable };
    }),

  // Shopper: follow a business
  follow: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [biz] = await ctx.db
        .select({ id: businesses.id, status: businesses.status })
        .from(businesses)
        .where(eq(businesses.id, input.businessId))
        .limit(1);

      if (!biz || biz.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      }

      await ctx.db
        .insert(follows)
        .values({ userId: ctx.user.id, businessId: input.businessId })
        .onConflictDoNothing();

      return { success: true };
    }),

  // Shopper: unfollow a business
  unfollow: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(follows)
        .where(and(eq(follows.userId, ctx.user.id), eq(follows.businessId, input.businessId)));
      return { success: true };
    }),

  // Shopper: check follow status for a business
  followStatus: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ id: follows.id })
        .from(follows)
        .where(and(eq(follows.userId, ctx.user.id), eq(follows.businessId, input.businessId)))
        .limit(1);
      return { following: !!row };
    }),

  // Shopper: list followed businesses
  myFollows: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        business: { id: businesses.id, name: businesses.name, slug: businesses.slug, logoUrl: businesses.logoUrl, category: businesses.category },
        since: follows.createdAt,
      })
      .from(follows)
      .innerJoin(businesses, eq(follows.businessId, businesses.id))
      .where(eq(follows.userId, ctx.user.id))
      .orderBy(desc(follows.createdAt));
  }),

  // Shopper: mute/unmute notifications from a business
  toggleMute: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: notificationMutes.id })
        .from(notificationMutes)
        .where(and(eq(notificationMutes.userId, ctx.user.id), eq(notificationMutes.businessId, input.businessId)))
        .limit(1);

      if (existing) {
        await ctx.db
          .delete(notificationMutes)
          .where(eq(notificationMutes.id, existing.id));
        return { muted: false };
      } else {
        await ctx.db
          .insert(notificationMutes)
          .values({ userId: ctx.user.id, businessId: input.businessId });
        return { muted: true };
      }
    }),

  // Public: submit a business application (no auth required)
  submitApplication: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      contactEmail: z.string().email(),
      city: z.string().min(1),
      address: z.string().optional(),
      postcode: z.string().optional(),
      instagramHandle: z.string().optional(),
      website: z.string().url().optional().or(z.literal("")),
      category: z.string().min(1),
      description: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [application] = await ctx.db
        .insert(businessApplications)
        .values({ ...input, status: "pending" })
        .returning();
      return { id: application.id };
    }),

  // Business owner: get full profile (includes stripe status etc.)
  myProfile: businessOwnerProcedure.query(async ({ ctx }) => {
    const bizLocations = await ctx.db
      .select()
      .from(locations)
      .where(eq(locations.businessId, ctx.business.id));

    return { ...ctx.business, locations: bizLocations };
  }),

  // Business owner: update profile
  updateProfile: businessOwnerProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      instagramHandle: z.string().optional(),
      website: z.string().url().optional().or(z.literal("")),
      logoUrl: z.string().url().optional(),
      coverUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(businesses)
        .set(input)
        .where(eq(businesses.id, ctx.business.id))
        .returning();
      return updated;
    }),

  // Business owner: add a location
  addLocation: businessOwnerProcedure
    .input(z.object({
      name: z.string().default("Main Location"),
      address: z.string().min(1),
      city: z.string().min(1),
      postcode: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [loc] = await ctx.db
        .insert(locations)
        .values({ businessId: ctx.business.id, ...input })
        .returning();
      return loc;
    }),

  // Business owner: remove a location (only if no active drops)
  removeLocation: businessOwnerProcedure
    .input(z.object({ locationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [loc] = await ctx.db
        .select()
        .from(locations)
        .where(and(eq(locations.id, input.locationId), eq(locations.businessId, ctx.business.id)))
        .limit(1);

      if (!loc) throw new TRPCError({ code: "NOT_FOUND", message: "Location not found" });

      // Check no active drops reference this location
      const [activeDrop] = await ctx.db
        .select({ id: drops.id })
        .from(drops)
        .where(and(eq(drops.locationId, input.locationId), eq(drops.status, "active")))
        .limit(1);

      if (activeDrop) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot remove location with active drops. Cancel all drops first.",
        });
      }

      await ctx.db.delete(locations).where(eq(locations.id, input.locationId));
      return { success: true };
    }),

  // Business owner: dashboard stats
  dashboardStats: businessOwnerProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const activeDropsList = await ctx.db
      .select({ id: drops.id })
      .from(drops)
      .where(and(eq(drops.businessId, ctx.business.id), eq(drops.status, "active")));

    const [resToday] = await ctx.db
      .select({ count: count() })
      .from(reservations)
      .innerJoin(drops, eq(reservations.dropId, drops.id))
      .where(and(
        eq(drops.businessId, ctx.business.id),
        gte(reservations.createdAt, todayStart),
        lte(reservations.createdAt, todayEnd),
      ));

    const [collectToday] = await ctx.db
      .select({ count: count() })
      .from(reservations)
      .innerJoin(drops, eq(reservations.dropId, drops.id))
      .where(and(
        eq(drops.businessId, ctx.business.id),
        eq(reservations.status, "fulfilled"),
        gte(reservations.fulfilledAt, todayStart),
        lte(reservations.fulfilledAt, todayEnd),
      ));

    const [followerCount] = await ctx.db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.businessId, ctx.business.id));

    return {
      businessName: ctx.business.name,
      activeDrops: activeDropsList.length,
      reservationsToday: resToday.count,
      collectionsToday: collectToday.count,
      followers: followerCount.count,
    };
  }),

  // Business owner: simple analytics summary
  analytics: businessOwnerProcedure
    .input(z.object({ dropId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      // Total reservations across all drops
      const allDropIds = await ctx.db
        .select({ id: drops.id })
        .from(drops)
        .where(eq(drops.businessId, ctx.business.id));

      const dropIds = input.dropId
        ? [input.dropId]
        : allDropIds.map(d => d.id);

      if (dropIds.length === 0) {
        return { totalReservations: 0, totalFulfilled: 0, totalRevenuePence: 0 };
      }

      const allReservations = await ctx.db
        .select({
          status: reservations.status,
          drop: { price: drops.price, sellerReceive: drops.sellerReceive },
        })
        .from(reservations)
        .innerJoin(drops, eq(reservations.dropId, drops.id))
        .where(and(
          eq(drops.businessId, ctx.business.id),
          inArray(reservations.dropId, dropIds),
        ));

      const fulfilled = allReservations.filter(r => r.status === "fulfilled");
      const totalRevenuePence = fulfilled.reduce(
        (sum, r) => sum + effectiveReceive(r.drop.price, r.drop.sellerReceive),
        0,
      );

      return {
        totalReservations: allReservations.length,
        totalFulfilled: fulfilled.length,
        totalRevenuePence,
        conversionRate: allReservations.length > 0
          ? Math.round((fulfilled.length / allReservations.length) * 100)
          : 0,
      };
    }),
});
