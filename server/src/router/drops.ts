import { z } from "zod";
import { and, eq, gte, lte, inArray, sql, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, businessOwnerProcedure, adminProcedure } from "../trpc";
import { drops, businesses, locations, reservations, waitlist } from "../db/schema";
import { TRPCError } from "@trpc/server";
import { dispatchDropNotifications } from "../notifications/dispatch";
import { stripeEnabled, refundPaymentIntent } from "../payments/stripe";
import { geocodeAddress, haversineKm } from "../geo";

const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

export const dropsRouter = router({

  // Public: list active drops (with optional filters)
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      timeWindow: z.enum(["now", "today", "tomorrow"]).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      radiusKm: z.number().default(10),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const tomorrowStart = new Date(); tomorrowStart.setDate(tomorrowStart.getDate() + 1); tomorrowStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1); tomorrowEnd.setHours(23, 59, 59, 999);

      const conditions = [
        eq(drops.status, "active"),
        gte(drops.collectionEnd, now), // Not expired
      ];

      if (input.category) conditions.push(eq(drops.category, input.category));

      if (input.timeWindow === "now") {
        conditions.push(lte(drops.collectionStart, now));
        conditions.push(gte(drops.collectionEnd, now));
      } else if (input.timeWindow === "today") {
        conditions.push(lte(drops.collectionStart, todayEnd));
        conditions.push(gte(drops.collectionEnd, now));
      } else if (input.timeWindow === "tomorrow") {
        conditions.push(gte(drops.collectionStart, tomorrowStart));
        conditions.push(lte(drops.collectionStart, tomorrowEnd));
      }

      const results = await ctx.db
        .select({
          drop: drops,
          business: { id: businesses.id, name: businesses.name, slug: businesses.slug, logoUrl: businesses.logoUrl },
          location: { id: locations.id, address: locations.address, latitude: locations.latitude, longitude: locations.longitude },
        })
        .from(drops)
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .innerJoin(locations, eq(drops.locationId, locations.id))
        .where(and(...conditions))
        .orderBy(desc(drops.featured), desc(drops.createdAt))
        .limit(input.limit);

      // Optional proximity filter
      if (input.lat !== undefined && input.lng !== undefined) {
        return results.filter(r =>
          haversineKm(input.lat!, input.lng!, r.location.latitude, r.location.longitude) <= input.radiusKm,
        );
      }

      return results;
    }),

  // Public: get a single drop by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          drop: drops,
          business: businesses,
          location: locations,
        })
        .from(drops)
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .innerJoin(locations, eq(drops.locationId, locations.id))
        .where(eq(drops.id, input.id))
        .limit(1);

      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });
      return result;
    }),

  // Business: create a drop (with inline location creation)
  create: businessOwnerProcedure
    .input(z.object({
      // Optional locationId — if omitted, location is created from inline fields
      locationId: z.string().uuid().optional(),
      location: z.object({
        address: z.string().min(1),
        city: z.string().optional(),
        postcode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).optional(),
      format: z.enum(["limited_item", "clearance_discount", "bundle", "service_window"]).default("limited_item"),
      category: z.string(),
      title: z.string().min(1).max(100),
      description: z.string().max(1000).optional(),
      imageUrl: z.string().url().optional(),
      price: z.number().int().min(0), // in pence; 0 = free
      totalQuantity: z.number().int().positive().max(999),
      collectionStart: z.string().datetime(),
      collectionEnd: z.string().datetime(),
      sendEarlyAccess: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate the collection window
      const windowStart = new Date(input.collectionStart);
      const windowEnd = new Date(input.collectionEnd);
      if (windowEnd <= windowStart) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Collection window must end after it starts" });
      }
      if (windowEnd <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Collection window is entirely in the past" });
      }

      let loc: typeof locations.$inferSelect | undefined;

      if (input.locationId) {
        // Verify location belongs to this business
        const [existing] = await ctx.db
          .select()
          .from(locations)
          .where(and(eq(locations.id, input.locationId), eq(locations.businessId, ctx.business.id)))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "FORBIDDEN", message: "Location not found" });
        loc = existing;
      } else if (input.location) {
        // Resolve coordinates: use provided lat/lng, otherwise geocode the address
        let latitude = input.location.latitude;
        let longitude = input.location.longitude;
        if (latitude === undefined || longitude === undefined) {
          const geo = await geocodeAddress({
            address: input.location.address,
            postcode: input.location.postcode,
            city: input.location.city ?? ctx.business.city,
          });
          if (!geo) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Couldn't locate that address on the map. Check the address/postcode, or enter latitude and longitude manually.",
            });
          }
          latitude = geo.latitude;
          longitude = geo.longitude;
        }

        // Create location on the fly
        const [created] = await ctx.db
          .insert(locations)
          .values({
            businessId: ctx.business.id,
            name: "Drop location",
            address: input.location.address,
            city: input.location.city ?? ctx.business.city ?? "London",
            postcode: input.location.postcode ?? undefined,
            latitude,
            longitude,
          })
          .returning();
        loc = created;
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide locationId or location object" });
      }

      if (!loc) throw new TRPCError({ code: "FORBIDDEN", message: "Location not found" });

      const [drop] = await ctx.db
        .insert(drops)
        .values({
          businessId: ctx.business.id,
          locationId: loc.id,
          format: input.format as any,
          category: input.category,
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          price: input.price,
          totalQuantity: input.totalQuantity,
          availableQuantity: input.totalQuantity,
          collectionStart: new Date(input.collectionStart),
          collectionEnd: new Date(input.collectionEnd),
          status: "active",
        })
        .returning();

      // Fire notifications to matching users (non-blocking — don't await)
      dispatchDropNotifications({
        id: drop.id,
        title: drop.title,
        businessId: ctx.business.id,
        businessName: ctx.business.name,
        category: drop.category,
        price: drop.price,
        availableQuantity: drop.availableQuantity,
        collectionEnd: drop.collectionEnd.toISOString(),
        locationLat: loc.latitude,
        locationLng: loc.longitude,
      }).catch(err => console.error("[drops.create] notification dispatch failed:", err));

      // Send early access to waitlist if toggled
      if (input.sendEarlyAccess) {
        // Get waitlist entries for this business from previous drops
        const waitlistUsers = await ctx.db
          .select({ userId: waitlist.userId })
          .from(waitlist)
          .innerJoin(drops, eq(waitlist.dropId, drops.id))
          .where(and(eq(drops.businessId, ctx.business.id)))
          .limit(500);

        // In production: fire push notifications to waitlistUsers 30 min before public launch
        // For now: mark early access sent timestamp
        if (waitlistUsers.length > 0) {
          await ctx.db.update(drops).set({ earlyAccessSentAt: new Date() }).where(eq(drops.id, drop.id));
        }
      }

      return drop;
    }),

  // Business: cancel a drop
  cancel: businessOwnerProcedure
    .input(z.object({
      dropId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [drop] = await ctx.db
        .select()
        .from(drops)
        .where(and(eq(drops.id, input.dropId), eq(drops.businessId, ctx.business.id)))
        .limit(1);

      if (!drop) throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });
      if (drop.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Already cancelled" });

      const now = new Date();
      const oneHourBeforeWindow = new Date(drop.collectionStart.getTime() - 60 * 60 * 1000);

      if (now >= oneHourBeforeWindow) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot cancel within 1 hour of collection window. Contact Unwrapped support.",
        });
      }

      await ctx.db
        .update(drops)
        .set({ status: "cancelled", cancelledAt: now, cancelledBy: "business" })
        .where(eq(drops.id, input.dropId));

      // Get active reservations for this drop
      const activeReservations = await ctx.db
        .select()
        .from(reservations)
        .where(and(eq(reservations.dropId, input.dropId), eq(reservations.status, "active")));

      // Mark all reservations as cancelled and refund their payments
      if (activeReservations.length > 0) {
        await ctx.db
          .update(reservations)
          .set({ status: "cancelled", cancelledAt: now })
          .where(and(eq(reservations.dropId, input.dropId), eq(reservations.status, "active")));

        if (stripeEnabled()) {
          await Promise.allSettled(
            activeReservations
              .filter(r => r.stripePaymentIntentId)
              .map(r => refundPaymentIntent(r.stripePaymentIntentId!)),
          );
        }
      }

      return { success: true, refundedCount: activeReservations.length };
    }),

  // Business: list drops for dashboard
  myDrops: businessOwnerProcedure
    .input(z.object({ limit: z.number().default(100) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(drops)
        .where(eq(drops.businessId, ctx.business.id))
        .orderBy(desc(drops.createdAt))
        .limit(input?.limit ?? 100);
    }),

  // Admin: feature or unfeature a drop
  setFeatured: adminProcedure
    .input(z.object({ dropId: z.string().uuid(), featured: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(drops).set({ featured: input.featured }).where(eq(drops.id, input.dropId));
      return { success: true };
    }),

  // Admin: takedown a drop
  takedown: adminProcedure
    .input(z.object({ dropId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(drops)
        .set({ status: "cancelled", cancelledAt: new Date(), cancelledBy: "admin" })
        .where(eq(drops.id, input.dropId));
      return { success: true };
    }),
});
