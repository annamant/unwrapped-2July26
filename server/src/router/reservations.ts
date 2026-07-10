import { z } from "zod";
import { and, eq, desc, inArray, sql, gt } from "drizzle-orm";
import { router, protectedProcedure, businessOwnerProcedure } from "../trpc";
import { reservations, drops, businesses, locations, users } from "../db/schema";
import { TRPCError } from "@trpc/server";
import { generateReferenceCode } from "../auth/oauth";
import { stripeEnabled, createPaymentIntent, retrievePaymentIntent, refundPaymentIntent } from "../payments/stripe";
import { sendReservationConfirmationEmail } from "../notifications/dispatch";
import crypto from "crypto";

function generateQRHash(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const reservationsRouter = router({

  // Step 1 (paid drops): create a Stripe PaymentIntent, return its client secret
  createPaymentIntent: protectedProcedure
    .input(z.object({ dropId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [drop] = await ctx.db
        .select()
        .from(drops)
        .where(eq(drops.id, input.dropId))
        .limit(1);

      if (!drop) throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });
      if (drop.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Drop is not available" });
      if (drop.availableQuantity <= 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Just missed it — this drop is sold out" });
      }
      if (drop.price <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This drop is free — reserve it directly" });
      }
      if (!stripeEnabled()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payments are not configured yet. Try again later." });
      }

      const pi = await createPaymentIntent({
        amountPence: drop.price,
        dropId: drop.id,
        userId: ctx.user.id,
      });
      return { clientSecret: pi.client_secret, paymentIntentId: pi.id, amount: drop.price };
    }),

  // Step 2: create the reservation. Free drops skip payment; paid drops
  // require a succeeded PaymentIntent that matches this drop/user/amount.
  create: protectedProcedure
    .input(z.object({
      dropId: z.string().uuid(),
      stripePaymentIntentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [drop] = await ctx.db
        .select()
        .from(drops)
        .where(eq(drops.id, input.dropId))
        .limit(1);

      if (!drop) throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });
      if (drop.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Drop is not available" });
      if (drop.availableQuantity <= 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Just missed it — this drop is sold out" });
      }

      // ── Payment verification ──────────────────────────────────────────────
      if (drop.price > 0) {
        if (!input.stripePaymentIntentId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment required for this drop" });
        }
        if (!stripeEnabled()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payments are not configured yet." });
        }

        // Reject reuse of the same PaymentIntent
        const [existing] = await ctx.db
          .select({ id: reservations.id })
          .from(reservations)
          .where(eq(reservations.stripePaymentIntentId, input.stripePaymentIntentId))
          .limit(1);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "This payment was already used" });

        const pi = await retrievePaymentIntent(input.stripePaymentIntentId);
        if (
          !pi ||
          pi.status !== "succeeded" ||
          pi.amount !== drop.price ||
          pi.currency !== "gbp" ||
          pi.metadata?.dropId !== drop.id ||
          pi.metadata?.userId !== ctx.user.id
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment could not be verified" });
        }
      }

      // ── Decrement availability atomically ───────────────────────────────
      const [updated] = await ctx.db
        .update(drops)
        .set({
          availableQuantity: sql`${drops.availableQuantity} - 1`,
          status: sql`CASE WHEN ${drops.availableQuantity} - 1 <= 0 THEN 'sold_out'::drop_status ELSE ${drops.status} END`,
        })
        .where(and(eq(drops.id, input.dropId), gt(drops.availableQuantity, 0)))
        .returning();

      if (!updated) {
        // Sold out between payment and reservation — refund automatically
        if (drop.price > 0 && input.stripePaymentIntentId) {
          await refundPaymentIntent(input.stripePaymentIntentId);
          throw new TRPCError({
            code: "CONFLICT",
            message: "Just missed it — someone took the last one. Your payment has been refunded.",
          });
        }
        throw new TRPCError({ code: "CONFLICT", message: "Just missed it — someone reserved the last one" });
      }

      // Create reservation. stripePaymentIntentId has a unique DB constraint —
      // this is the real defence against a duplicate request (retry, double
      // click, two tabs) redeeming the same payment into two reservations;
      // the "existing" check above is just a fast path.
      try {
        const [reservation] = await ctx.db
          .insert(reservations)
          .values({
            dropId: input.dropId,
            userId: ctx.user.id,
            stripePaymentIntentId: input.stripePaymentIntentId ?? null,
            qrCodeHash: generateQRHash(),
            referenceCode: generateReferenceCode(),
            status: "active",
            payoutStatus: "pending",
          })
          .returning();

        // Confirmation email — fire-and-forget, must never block the ticket
        void (async () => {
          const [info] = await ctx.db
            .select({
              businessName: businesses.name,
              address: locations.address,
              email: users.email,
            })
            .from(drops)
            .innerJoin(businesses, eq(drops.businessId, businesses.id))
            .innerJoin(locations, eq(drops.locationId, locations.id))
            .innerJoin(users, eq(users.id, reservation.userId))
            .where(eq(drops.id, reservation.dropId))
            .limit(1);
          if (info?.email) {
            await sendReservationConfirmationEmail({
              to: info.email,
              dropTitle: drop.title,
              businessName: info.businessName,
              address: info.address,
              collectionStart: new Date(drop.collectionStart),
              collectionEnd: new Date(drop.collectionEnd),
              pricePence: drop.price,
              referenceCode: reservation.referenceCode,
              reservationId: reservation.id,
            });
          }
        })().catch(err => console.error("[reservations] confirmation email failed:", err));

        return reservation;
      } catch (err: any) {
        if (err?.code === "23505" && err?.constraint === "reservations_stripe_payment_intent_unique") {
          // Lost the race to another request using the same payment — release
          // the unit we just decremented and refund this duplicate attempt.
          await ctx.db
            .update(drops)
            .set({
              availableQuantity: sql`${drops.availableQuantity} + 1`,
              status: sql`CASE WHEN ${drops.status} = 'sold_out'::drop_status THEN 'active'::drop_status ELSE ${drops.status} END`,
            })
            .where(eq(drops.id, input.dropId));

          if (drop.price > 0 && input.stripePaymentIntentId) {
            await refundPaymentIntent(input.stripePaymentIntentId);
          }
          throw new TRPCError({ code: "CONFLICT", message: "This payment was already used" });
        }
        throw err;
      }
    }),

  // Get a single reservation (consumer viewing their ticket)
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          reservation: reservations,
          drop: drops,
          business: { id: businesses.id, name: businesses.name, slug: businesses.slug },
          location: { address: locations.address, latitude: locations.latitude, longitude: locations.longitude },
        })
        .from(reservations)
        .innerJoin(drops, eq(reservations.dropId, drops.id))
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .innerJoin(locations, eq(drops.locationId, locations.id))
        .where(and(eq(reservations.id, input.id), eq(reservations.userId, ctx.user.id)))
        .limit(1);

      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
      return result;
    }),

  // List current user's reservations
  myReservations: protectedProcedure
    .input(z.object({ status: z.enum(["active", "past"]).default("active") }))
    .query(async ({ ctx, input }) => {
      const statusFilter = input.status === "active"
        ? ["active" as const]
        : ["fulfilled" as const, "cancelled" as const, "expired" as const];

      return ctx.db
        .select({
          reservation: reservations,
          drop: { id: drops.id, title: drops.title, imageUrl: drops.imageUrl, collectionStart: drops.collectionStart, collectionEnd: drops.collectionEnd, price: drops.price },
          business: { id: businesses.id, name: businesses.name, slug: businesses.slug },
          location: { address: locations.address },
        })
        .from(reservations)
        .innerJoin(drops, eq(reservations.dropId, drops.id))
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .innerJoin(locations, eq(drops.locationId, locations.id))
        .where(and(
          eq(reservations.userId, ctx.user.id),
          inArray(reservations.status, statusFilter),
        ))
        .orderBy(desc(reservations.createdAt));
    }),

  // Cancel a reservation (consumer, >24h before collection)
  cancel: protectedProcedure
    .input(z.object({ reservationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [res] = await ctx.db
        .select({ reservation: reservations, drop: drops })
        .from(reservations)
        .innerJoin(drops, eq(reservations.dropId, drops.id))
        .where(and(eq(reservations.id, input.reservationId), eq(reservations.userId, ctx.user.id)))
        .limit(1);

      if (!res) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
      if (res.reservation.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reservation is not active" });
      }

      const now = new Date();
      const twentyFourHoursBeforeWindow = new Date(res.drop.collectionStart.getTime() - 24 * 60 * 60 * 1000);

      if (now >= twentyFourHoursBeforeWindow) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot cancel within 24 hours of collection. Contact anna@shopunwrapped.com for help.",
        });
      }

      // Cancel and release inventory
      await ctx.db
        .update(reservations)
        .set({ status: "cancelled", cancelledAt: now })
        .where(eq(reservations.id, input.reservationId));

      await ctx.db
        .update(drops)
        .set({
          availableQuantity: sql`${drops.availableQuantity} + 1`,
          status: sql`CASE WHEN ${drops.status} = 'sold_out'::drop_status THEN 'active'::drop_status ELSE ${drops.status} END`,
        })
        .where(eq(drops.id, res.drop.id));

      // Refund the payment (item price; adjust if you retain a fee)
      if (res.reservation.stripePaymentIntentId && stripeEnabled()) {
        await refundPaymentIntent(res.reservation.stripePaymentIntentId);
      }

      // In production: trigger Stripe refund (item price only, fee retained)
      return { success: true };
    }),

  // Business: scan QR code or enter reference code to check in
  scanCheckin: businessOwnerProcedure
    .input(z.object({
      referenceCode: z.string().optional(),
      qrCodeHash: z.string().optional(),
      forceAccept: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.referenceCode && !input.qrCodeHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide a reference code or QR hash" });
      }

      // Find reservation
      const conditions = input.referenceCode
        ? eq(reservations.referenceCode, input.referenceCode.toUpperCase())
        : eq(reservations.qrCodeHash, input.qrCodeHash!);

      const [result] = await ctx.db
        .select({
          reservation: reservations,
          drop: drops,
          business: { id: businesses.id },
        })
        .from(reservations)
        .innerJoin(drops, eq(reservations.dropId, drops.id))
        .innerJoin(businesses, eq(drops.businessId, businesses.id))
        .where(conditions)
        .limit(1);

      if (!result) {
        return { success: false, error: "invalid", message: "Invalid code — this code does not exist." };
      }

      // Verify business ownership
      if (result.business.id !== ctx.business.id) {
        return { success: false, error: "invalid", message: "Invalid code" };
      }

      if (result.reservation.status === "fulfilled") {
        return {
          success: false,
          error: "already_redeemed",
          message: `Already redeemed at ${result.reservation.fulfilledAt?.toLocaleString()}`,
        };
      }

      if (result.reservation.status !== "active") {
        return { success: false, error: "invalid", message: "Code is no longer valid" };
      }

      // Check collection window
      const now = new Date();
      const outsideWindow = now < result.drop.collectionStart || now > result.drop.collectionEnd;

      if (outsideWindow && !input.forceAccept) {
        return {
          success: false,
          error: "outside_window",
          message: `Outside collection window (${result.drop.collectionStart.toLocaleTimeString()} – ${result.drop.collectionEnd.toLocaleTimeString()})`,
          dropTitle: result.drop.title,
          referenceCode: result.reservation.referenceCode,
        };
      }

      // Mark as fulfilled
      await ctx.db
        .update(reservations)
        .set({ status: "fulfilled", fulfilledAt: now, payoutStatus: "released", payoutReleasedAt: now })
        .where(eq(reservations.id, result.reservation.id));

      return {
        success: true,
        dropTitle: result.drop.title,
        referenceCode: result.reservation.referenceCode,
        message: "Reservation confirmed. Payout queued — arrives within 2 business days.",
      };
    }),

  // Business: list reservations for a drop
  forDrop: businessOwnerProcedure
    .input(z.object({ dropId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const [drop] = await ctx.db
        .select()
        .from(drops)
        .where(and(eq(drops.id, input.dropId), eq(drops.businessId, ctx.business.id)))
        .limit(1);

      if (!drop) throw new TRPCError({ code: "FORBIDDEN", message: "Drop not found" });

      return ctx.db
        .select({
          id: reservations.id,
          referenceCode: reservations.referenceCode,
          status: reservations.status,
          createdAt: reservations.createdAt,
          fulfilledAt: reservations.fulfilledAt,
        })
        .from(reservations)
        .where(eq(reservations.dropId, input.dropId))
        .orderBy(desc(reservations.createdAt));
    }),
});
