import { z } from "zod";
import { and, eq, desc, count, gte, lte } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import { businesses, businessApplications, users, drops, reservations, follows } from "../db/schema";
import { TRPCError } from "@trpc/server";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50)
    + "-" + Math.random().toString(36).slice(2, 6);
}

export const adminRouter = router({

  // List all pending business applications
  listApplications: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(businessApplications)
        .where(input.status ? eq(businessApplications.status, input.status) : undefined)
        .orderBy(desc(businessApplications.createdAt));
    }),

  // Get a single application with full details
  getApplication: adminProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [app] = await ctx.db
        .select()
        .from(businessApplications)
        .where(eq(businessApplications.id, input.applicationId))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      return app;
    }),

  // Approve application — creates a business record and links to applicant (by contactEmail)
  approveApplication: adminProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [app] = await ctx.db
        .select()
        .from(businessApplications)
        .where(eq(businessApplications.id, input.applicationId))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      if (app.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Application already reviewed" });

      // Find the applicant's user account by contactEmail. If they haven't
      // registered yet, create a passwordless placeholder account — they claim
      // it by registering with the same email (handled in auth.register).
      const email = app.contactEmail.toLowerCase();
      const [owner] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let ownerId = owner?.id;
      if (!ownerId) {
        const [placeholder] = await ctx.db
          .insert(users)
          .values({ email, name: app.name, role: "consumer", onboardingComplete: false })
          .returning();
        ownerId = placeholder.id;
      }

      const [business] = await ctx.db
        .insert(businesses)
        .values({
          ownerId,
          name: app.name,
          slug: generateSlug(app.name),
          description: app.description ?? undefined,
          category: app.category,
          contactEmail: app.contactEmail,
          instagramHandle: app.instagramHandle ?? undefined,
          website: app.website ?? undefined,
          city: app.city,
          address: app.address ?? undefined,
          postcode: app.postcode ?? undefined,
          status: "active",
          approvedAt: new Date(),
        })
        .returning();

      await ctx.db
        .update(businessApplications)
        .set({ status: "approved", reviewedAt: new Date() })
        .where(eq(businessApplications.id, input.applicationId));

      return business;
    }),

  // Reject application
  rejectApplication: adminProcedure
    .input(z.object({ applicationId: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(businessApplications)
        .set({
          status: "rejected",
          reviewedAt: new Date(),
          rejectionReason: input.reason ?? null,
        })
        .where(eq(businessApplications.id, input.applicationId));

      return { success: true };
    }),

  // List all businesses (with status filter)
  listBusinesses: adminProcedure
    .input(z.object({ status: z.enum(["pending", "active", "suspended"]).optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = input.status ? [eq(businesses.status, input.status)] : [];
      return ctx.db
        .select()
        .from(businesses)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(businesses.createdAt));
    }),

  // Suspend / unsuspend a business
  setBusinessStatus: adminProcedure
    .input(z.object({
      businessId: z.string().uuid(),
      status: z.enum(["active", "suspended"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(businesses)
        .set({ status: input.status })
        .where(eq(businesses.id, input.businessId));
      return { success: true };
    }),

  // List all users
  listUsers: adminProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          onboardingComplete: users.onboardingComplete,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit);
    }),

  // Promote user to admin
  setUserRole: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      role: z.enum(["consumer", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Platform stats for admin dashboard
  stats: adminProcedure.query(async ({ ctx }) => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [userCount] = await ctx.db.select({ count: count() }).from(users);
    const [bizCount] = await ctx.db.select({ count: count() }).from(businesses).where(eq(businesses.status, "active"));
    const [pendingApps] = await ctx.db.select({ count: count() }).from(businessApplications).where(eq(businessApplications.status, "pending"));
    const [dropCount] = await ctx.db.select({ count: count() }).from(drops).where(eq(drops.status, "active"));
    const [resCount] = await ctx.db.select({ count: count() }).from(reservations);
    const [fulfilledToday] = await ctx.db.select({ count: count() }).from(reservations)
      .where(and(eq(reservations.status, "fulfilled"), gte(reservations.fulfilledAt, todayStart), lte(reservations.fulfilledAt, todayEnd)));

    // Gross revenue = sum of fulfilled reservation prices
    const fulfilledRes = await ctx.db
      .select({ price: drops.price })
      .from(reservations)
      .innerJoin(drops, eq(reservations.dropId, drops.id))
      .where(eq(reservations.status, "fulfilled"));

    const grossRevenue = fulfilledRes.reduce((sum, r) => sum + r.price, 0);
    const platformRevenue = Math.floor(grossRevenue * 0.15);

    return {
      totalUsers: userCount.count,
      totalBusinesses: bizCount.count,
      pendingApplications: pendingApps.count,
      activeDrops: dropCount.count,
      totalReservations: resCount.count,
      fulfillmentsToday: fulfilledToday.count,
      grossRevenue,
      platformRevenue,
    };
  }),

  // Recent drops for admin overview
  recentDrops: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: drops.id,
          title: drops.title,
          status: drops.status,
          collectionStart: drops.collectionStart,
          availableQuantity: drops.availableQuantity,
          totalQuantity: drops.totalQuantity,
          businessName: businesses.name,
        })
        .from(drops)
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .orderBy(desc(drops.createdAt))
        .limit(input.limit);
    }),

  // List all drops with moderation info
  listDrops: adminProcedure
    .input(z.object({
      status: z.enum(["active", "cancelled", "sold_out", "expired"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = input.status ? [eq(drops.status, input.status)] : [];
      return ctx.db
        .select({
          drop: drops,
          business: { id: businesses.id, name: businesses.name, slug: businesses.slug },
        })
        .from(drops)
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(drops.createdAt))
        .limit(input.limit);
    }),
});
