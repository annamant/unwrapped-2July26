import { z } from "zod";
import { and, eq, asc, desc, count, gte, lte, sql, isNull, isNotNull, inArray } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import { businesses, businessApplications, users, drops, reservations, passwordResetTokens } from "../db/schema";
import { TRPCError } from "@trpc/server";
import {
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  sendBusinessClaimInviteEmail,
} from "../notifications/dispatch";
import crypto from "crypto";
import type { DB } from "../db";

const BUSINESS_CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
] as const;

const importRowSchema = z.object({
  name: z.string().min(1).max(120),
  // Optional for directory seeding (e.g. Google Maps scrape without email enrichment).
  // When omitted, the business is owned by a shared unclaimed placeholder account
  // and no claim invite is sent.
  contactEmail: z.string().email().optional(),
  category: z.enum(BUSINESS_CATEGORIES),
  city: z.string().min(1).max(80),
  address: z.string().max(200).optional(),
  postcode: z.string().max(20).optional(),
  instagramHandle: z.string().max(80).optional(),
  website: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

const UNCLAIMED_OWNER_EMAIL = "unclaimed-directory@shopunwrapped.com";

async function getUnclaimedOwnerId(db: DB): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, UNCLAIMED_OWNER_EMAIL))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({
      email: UNCLAIMED_OWNER_EMAIL,
      name: "Unclaimed Directory",
      role: "consumer",
      onboardingComplete: true,
    })
    .returning({ id: users.id });
  return created.id;
}

type ProvisionInput = {
  name: string;
  contactEmail: string;
  category: string;
  city: string;
  address?: string;
  postcode?: string;
  instagramHandle?: string;
  website?: string;
  description?: string;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50)
    + "-" + Math.random().toString(36).slice(2, 6);
}

function clientBaseUrl(): string {
  return (process.env.CLIENT_URL ?? "https://shopunwrapped.com").split(",")[0].trim();
}

/**
 * Ensure the business is owned by a user for its contactEmail (not the shared
 * unclaimed-directory placeholder). Creates a passwordless user when needed.
 */
async function attachContactOwner(
  db: DB,
  business: { id: string; name: string; contactEmail: string; ownerId: string },
): Promise<{ ownerId: string; needsPassword: boolean }> {
  const email = business.contactEmail.toLowerCase().trim();
  if (!email || email === UNCLAIMED_OWNER_EMAIL) {
    throw new Error("Business has no real contact email");
  }

  const [existing] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let ownerId = existing?.id;
  let needsPassword = !existing?.passwordHash;
  if (!ownerId) {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: business.name,
        role: "consumer",
        onboardingComplete: false,
      })
      .returning({ id: users.id });
    ownerId = created.id;
    needsPassword = true;
  }

  if (business.ownerId !== ownerId) {
    await db
      .update(businesses)
      .set({ ownerId })
      .where(eq(businesses.id, business.id));
  }

  return { ownerId, needsPassword };
}

async function issueClaimInvite(
  db: DB,
  opts: { ownerId: string; contactEmail: string; businessName: string },
) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({
    userId: opts.ownerId,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const setupUrl = `${clientBaseUrl()}/reset-password?token=${rawToken}`;
  await sendBusinessClaimInviteEmail(opts.contactEmail, opts.businessName, setupUrl);
}

/** Create (or reuse) a passwordless owner + active business. Optionally email a claim link. */
async function provisionClaimableBusiness(
  db: DB,
  input: ProvisionInput,
  opts: { sendInvite: boolean; emailKind: "approval" | "claim" },
) {
  const email = input.contactEmail.toLowerCase();
  const [owner] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let ownerId = owner?.id;
  let createdPlaceholder = false;
  if (!ownerId) {
    const [placeholder] = await db
      .insert(users)
      .values({ email, name: input.name, role: "consumer", onboardingComplete: false })
      .returning();
    ownerId = placeholder.id;
    createdPlaceholder = true;
  }

  const [business] = await db
    .insert(businesses)
    .values({
      ownerId,
      name: input.name,
      slug: generateSlug(input.name),
      description: input.description ?? undefined,
      category: input.category,
      contactEmail: email,
      instagramHandle: input.instagramHandle ?? undefined,
      website: input.website ?? undefined,
      city: input.city,
      address: input.address ?? undefined,
      postcode: input.postcode ?? undefined,
      status: "active",
      approvedAt: new Date(),
    })
    .returning();

  // Approval always emails (same as before). Claim invites only go to accounts
  // that still need a password — existing signed-up owners already have access.
  const needsPassword = createdPlaceholder || !owner?.passwordHash;
  const shouldEmail =
    opts.sendInvite && (opts.emailKind === "approval" || needsPassword);
  let inviteSent = false;

  if (shouldEmail) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({
      userId: ownerId,
      tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const setupUrl = `${clientBaseUrl()}/reset-password?token=${rawToken}`;
    if (opts.emailKind === "approval") {
      void sendApplicationApprovedEmail(email, business.name, setupUrl);
    } else {
      await sendBusinessClaimInviteEmail(email, business.name, setupUrl);
    }
    await db
      .update(businesses)
      .set({ claimInviteSentAt: new Date() })
      .where(eq(businesses.id, business.id));
    inviteSent = true;
  }

  return { business, inviteSent, ownerId };
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

      const { business } = await provisionClaimableBusiness(
        ctx.db,
        {
          name: app.name,
          contactEmail: app.contactEmail,
          category: app.category,
          city: app.city,
          address: app.address ?? undefined,
          postcode: app.postcode ?? undefined,
          instagramHandle: app.instagramHandle ?? undefined,
          website: app.website ?? undefined,
          description: app.description ?? undefined,
        },
        { sendInvite: true, emailKind: "approval" },
      );

      await ctx.db
        .update(businessApplications)
        .set({ status: "approved", reviewedAt: new Date() })
        .where(eq(businessApplications.id, input.applicationId));

      return business;
    }),

  // Bulk-create claimable business profiles from a list (CSV upload).
  importBusinesses: adminProcedure
    .input(z.object({
      rows: z.array(importRowSchema).min(1).max(500),
      sendInviteEmails: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const created: { id: string; name: string; slug: string; contactEmail: string; inviteSent: boolean }[] = [];
      const skipped: { name: string; contactEmail: string; reason: string }[] = [];
      let unclaimedOwnerId: string | null = null;

      for (const row of input.rows) {
        const hasEmail = Boolean(row.contactEmail?.trim());
        const email = hasEmail
          ? row.contactEmail!.toLowerCase()
          : UNCLAIMED_OWNER_EMAIL;

        // Skip duplicates: same name + postcode when seeded without email,
        // otherwise same email + name.
        const [existing] = await ctx.db
          .select({ id: businesses.id })
          .from(businesses)
          .where(
            hasEmail
              ? and(
                  eq(businesses.contactEmail, email),
                  sql`lower(${businesses.name}) = ${row.name.toLowerCase()}`,
                )
              : and(
                  sql`lower(${businesses.name}) = ${row.name.toLowerCase()}`,
                  row.postcode
                    ? sql`lower(coalesce(${businesses.postcode}, '')) = ${row.postcode.toLowerCase()}`
                    : sql`true`,
                ),
          )
          .limit(1);

        if (existing) {
          skipped.push({
            name: row.name,
            contactEmail: email,
            reason: "Already exists",
          });
          continue;
        }

        try {
          if (!hasEmail) {
            if (!unclaimedOwnerId) unclaimedOwnerId = await getUnclaimedOwnerId(ctx.db);
            const [business] = await ctx.db
              .insert(businesses)
              .values({
                ownerId: unclaimedOwnerId,
                name: row.name,
                slug: generateSlug(row.name),
                description: row.description ?? undefined,
                category: row.category,
                contactEmail: email,
                website: row.website ?? undefined,
                instagramHandle: row.instagramHandle ?? undefined,
                city: row.city,
                address: row.address ?? undefined,
                postcode: row.postcode ?? undefined,
                status: "active",
                approvedAt: new Date(),
              })
              .returning();
            created.push({
              id: business.id,
              name: business.name,
              slug: business.slug,
              contactEmail: business.contactEmail,
              inviteSent: false,
            });
            continue;
          }

          const { business, inviteSent } = await provisionClaimableBusiness(
            ctx.db,
            { ...row, contactEmail: email },
            { sendInvite: input.sendInviteEmails, emailKind: "claim" },
          );
          created.push({
            id: business.id,
            name: business.name,
            slug: business.slug,
            contactEmail: business.contactEmail,
            inviteSent,
          });
        } catch (err) {
          skipped.push({
            name: row.name,
            contactEmail: email,
            reason: err instanceof Error ? err.message : "Failed to create",
          });
        }
      }

      return {
        createdCount: created.length,
        skippedCount: skipped.length,
        created,
        skipped,
      };
    }),

  // How many seeded profiles are still waiting for a claim invite (and how many
  // have already been sent one). Drives the "send next batch" admin button.
  claimInviteStats: adminProcedure.query(async ({ ctx }) => {
    // Pending = active profile with a real contact email that has not been invited yet.
    // Ownership may still be the shared unclaimed placeholder — sendClaimInvites
    // attaches the contact as owner before emailing.
    const pendingWhere = and(
      eq(businesses.status, "active"),
      isNull(businesses.claimInviteSentAt),
      sql`lower(${businesses.contactEmail}) <> ${UNCLAIMED_OWNER_EMAIL}`,
    );
    const [{ pending }] = await ctx.db
      .select({ pending: count() })
      .from(businesses)
      .where(pendingWhere);
    const [{ invited }] = await ctx.db
      .select({ invited: count() })
      .from(businesses)
      .where(isNotNull(businesses.claimInviteSentAt));
    return { pending, invited };
  }),

  // Send claim invites to seeded profiles. Attaches each contactEmail as owner
  // (passwordless user) before emailing a set-password link for THAT user.
  // Pass businessIds to target specific rows (e.g. test profiles); otherwise
  // sends the next `limit` by createdAt.
  sendClaimInvites: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(200).default(50),
      businessIds: z.array(z.string().uuid()).max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const baseWhere = and(
        eq(businesses.status, "active"),
        isNull(businesses.claimInviteSentAt),
        sql`lower(${businesses.contactEmail}) <> ${UNCLAIMED_OWNER_EMAIL}`,
        input.businessIds?.length ? inArray(businesses.id, input.businessIds) : undefined,
      );

      const candidates = await ctx.db
        .select({
          id: businesses.id,
          name: businesses.name,
          slug: businesses.slug,
          contactEmail: businesses.contactEmail,
          ownerId: businesses.ownerId,
        })
        .from(businesses)
        .where(baseWhere)
        .orderBy(asc(businesses.createdAt))
        .limit(input.businessIds?.length ? input.businessIds.length : input.limit);

      const sent: { name: string; contactEmail: string; slug: string }[] = [];
      const skipped: { name: string; contactEmail: string; reason: string }[] = [];
      const failed: { name: string; contactEmail: string; reason: string }[] = [];

      for (const b of candidates) {
        try {
          const { ownerId, needsPassword } = await attachContactOwner(ctx.db, b);
          if (needsPassword) {
            await issueClaimInvite(ctx.db, {
              ownerId,
              contactEmail: b.contactEmail.toLowerCase(),
              businessName: b.name,
            });
            await ctx.db
              .update(businesses)
              .set({ claimInviteSentAt: new Date() })
              .where(eq(businesses.id, b.id));
            sent.push({ name: b.name, contactEmail: b.contactEmail, slug: b.slug });
          } else {
            // Contact already has an account/password — ownership transferred; no email.
            await ctx.db
              .update(businesses)
              .set({ claimInviteSentAt: new Date() })
              .where(eq(businesses.id, b.id));
            skipped.push({
              name: b.name,
              contactEmail: b.contactEmail,
              reason: "Owner already has a password — ownership transferred, no email sent",
            });
          }
        } catch (err) {
          failed.push({
            name: b.name,
            contactEmail: b.contactEmail,
            reason: err instanceof Error ? err.message : "Failed to send",
          });
        }
      }

      const [{ remaining }] = await ctx.db
        .select({ remaining: count() })
        .from(businesses)
        .where(and(
          eq(businesses.status, "active"),
          isNull(businesses.claimInviteSentAt),
          sql`lower(${businesses.contactEmail}) <> ${UNCLAIMED_OWNER_EMAIL}`,
        ));

      return {
        sentCount: sent.length,
        skippedCount: skipped.length,
        failedCount: failed.length,
        remaining,
        sent,
        skipped,
        failed,
      };
    }),

  // Reject application
  rejectApplication: adminProcedure
    .input(z.object({ applicationId: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [app] = await ctx.db
                .select()
                .from(businessApplications)
                .where(eq(businessApplications.id, input.applicationId))
                .limit(1);
      
            if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      
            await ctx.db
        .update(businessApplications)
        .set({
          status: "rejected",
          reviewedAt: new Date(),
          rejectionReason: input.reason ?? null,
        })
        .where(eq(businessApplications.id, input.applicationId));

      void sendApplicationRejectedEmail(app.contactEmail, app.name, input.reason);
      
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

  // List all reservations
  listReservations: adminProcedure
    .input(z.object({
      status: z.enum(["active", "fulfilled", "cancelled", "expired"]).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = input.status ? [eq(reservations.status, input.status)] : [];
      return ctx.db
        .select({
          id: reservations.id,
          referenceCode: reservations.referenceCode,
          status: reservations.status,
          createdAt: reservations.createdAt,
          fulfilledAt: reservations.fulfilledAt,
          dropTitle: drops.title,
          price: drops.price,
          userEmail: users.email,
          userName: users.name,
          businessName: businesses.name,
        })
        .from(reservations)
        .innerJoin(drops, eq(reservations.dropId, drops.id))
        .innerJoin(users, eq(reservations.userId, users.id))
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(reservations.createdAt))
        .limit(input.limit);
    }),

  // List all drops with moderation info
  listDrops: adminProcedure
    .input(z.object({
      status: z.enum(["draft", "active", "cancelled", "sold_out", "expired"]).optional(),
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
