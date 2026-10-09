import { z } from "zod";
import { and, eq, desc, count, gte, lte, inArray, or, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, businessOwnerProcedure, adminProcedure } from "../trpc";
import { businesses, businessApplications, follows, notificationMutes, locations, drops, reservations, users } from "../db/schema";
import { TRPCError } from "@trpc/server";
import { effectiveReceive } from "../payments/fees";
import { isIndexablePartner } from "../seoIndexable";
import { applyFollow, applyUnfollow, isFollowing } from "../follows/persist";
import { takeRateLimit } from "../follows/rateLimit";
import { matchCuratedPinToBusiness } from "../curatedDirectory";
import { WAVE1_DIRECTORY_PINS } from "../wave1Directory";
import { linkBusinessToDirectoryPin } from "../follows/linkPin";

const UNCLAIMED_OWNER_EMAIL = "unclaimed-directory@shopunwrapped.com";

const followTargetInput = z.object({
  businessId: z.string().uuid().optional(),
  directoryPinId: z.string().trim().min(1).max(200).optional(),
}).refine((value) => Boolean(value.businessId || value.directoryPinId), {
  message: "Choose a shop",
});

function assertFollowRate(userId: string, ip: string | undefined) {
  const okUser = takeRateLimit(`follow-user:${userId}`, 40, 10 * 60 * 1000);
  const okIp = takeRateLimit(`follow-ip:${ip ?? "unknown"}`, 80, 10 * 60 * 1000);
  if (!okUser || !okIp) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many follow changes. Try again in a few minutes." });
  }
}

function followerWhere(businessId: string, directoryPinId: string | null | undefined) {
  if (!directoryPinId) return eq(follows.businessId, businessId);
  return or(eq(follows.businessId, businessId), eq(follows.directoryPinId, directoryPinId));
}

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
          directoryPinId: businesses.directoryPinId,
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
        .where(followerWhere(biz.id, biz.directoryPinId));

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

  // Public shop page for an unclaimed curated pin (and the claimed business, once linked).
  directoryShop: publicProcedure
    .input(z.object({ pinId: z.string().min(1).max(200) }))
    .query(async ({ ctx, input }) => {
      const pin = WAVE1_DIRECTORY_PINS.find((candidate) => candidate.id === input.pinId);
      if (!pin) return null;

      let [biz] = await ctx.db
        .select({
          id: businesses.id,
          slug: businesses.slug,
          name: businesses.name,
          postcode: businesses.postcode,
          status: businesses.status,
          directoryPinId: businesses.directoryPinId,
        })
        .from(businesses)
        .where(and(eq(businesses.directoryPinId, pin.id), eq(businesses.status, "active")))
        .limit(1);

      if (!biz) {
        const candidates = await ctx.db
          .select({
            id: businesses.id,
            name: businesses.name,
            postcode: businesses.postcode,
            slug: businesses.slug,
            status: businesses.status,
            directoryPinId: businesses.directoryPinId,
          })
          .from(businesses)
          .where(eq(businesses.status, "active"));
        const match = matchCuratedPinToBusiness(pin, candidates);
        if (match) {
          try {
            await linkBusinessToDirectoryPin(ctx.db, match);
          } catch (err) {
            console.error("[follows] directory shop link failed:", err);
          }
          biz = match;
        }
      }

      return {
        pin: {
          id: pin.id,
          name: pin.name,
          address: pin.address ?? null,
          postcode: pin.postcode ?? null,
          type: pin.type ?? null,
        },
        business: biz ? { id: biz.id, slug: biz.slug, name: biz.name } : null,
      };
    }),

  // Shopper: follow a curated pin and/or a live business.
  follow: protectedProcedure
    .input(followTargetInput)
    .mutation(async ({ ctx, input }) => {
      assertFollowRate(ctx.user.id, ctx.req.ip);
      await applyFollow(ctx.db, ctx.user.id, input, false);
      return { success: true };
    }),

  // Shopper: unfollow a curated pin and/or a live business.
  unfollow: protectedProcedure
    .input(followTargetInput)
    .mutation(async ({ ctx, input }) => {
      assertFollowRate(ctx.user.id, ctx.req.ip);
      await applyUnfollow(ctx.db, ctx.user.id, input);
      return { success: true };
    }),

  // Shopper: check follow status
  followStatus: protectedProcedure
    .input(followTargetInput)
    .query(async ({ ctx, input }) => {
      return { following: await isFollowing(ctx.db, ctx.user.id, input) };
    }),

  // Shopper: list followed shops, including unclaimed curated pins.
  myFollows: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        follow: {
          businessId: follows.businessId,
          directoryPinId: follows.directoryPinId,
          requestedAtSignup: follows.requestedAtSignup,
          createdAt: follows.createdAt,
        },
        business: {
          id: businesses.id,
          name: businesses.name,
          slug: businesses.slug,
          logoUrl: businesses.logoUrl,
          category: businesses.category,
        },
      })
      .from(follows)
      .leftJoin(businesses, eq(follows.businessId, businesses.id))
      .where(eq(follows.userId, ctx.user.id))
      .orderBy(desc(follows.createdAt));

    const pinById = new Map(WAVE1_DIRECTORY_PINS.map((pin) => [pin.id, pin]));
    return rows.map((row) => {
      const pin = row.follow.directoryPinId ? pinById.get(row.follow.directoryPinId) : undefined;
      const name = row.business?.name ?? pin?.name ?? "Shop";
      const slug = row.business?.slug ?? null;
      const directoryPinId = row.follow.directoryPinId;
      const path = slug
        ? `/business/${slug}`
        : directoryPinId
          ? `/shop/${encodeURIComponent(directoryPinId)}`
          : "/home?tab=shops";
      return {
        name,
        category: row.business?.category ?? pin?.type ?? null,
        slug,
        businessId: row.follow.businessId,
        directoryPinId,
        path,
        since: row.follow.createdAt,
        requestedAtSignup: row.follow.requestedAtSignup,
        business: row.business,
      };
    });
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
      .where(followerWhere(ctx.business.id, ctx.business.directoryPinId));

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
