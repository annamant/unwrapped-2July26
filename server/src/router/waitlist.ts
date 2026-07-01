import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { waitlist, drops, businesses } from "../db/schema";
import { TRPCError } from "@trpc/server";

export const waitlistRouter = router({

  // Join the waitlist for a sold-out drop
  join: protectedProcedure
    .input(z.object({ dropId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [drop] = await ctx.db
        .select({ id: drops.id, businessId: drops.businessId, status: drops.status })
        .from(drops)
        .where(eq(drops.id, input.dropId))
        .limit(1);

      if (!drop) throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });

      if (drop.status === "cancelled" || drop.status === "expired") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Drop is no longer available" });
      }

      await ctx.db
        .insert(waitlist)
        .values({
          dropId: input.dropId,
          userId: ctx.user.id,
          businessId: drop.businessId,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  // Leave the waitlist for a drop
  leave: protectedProcedure
    .input(z.object({ dropId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(waitlist)
        .where(and(eq(waitlist.dropId, input.dropId), eq(waitlist.userId, ctx.user.id)));
      return { success: true };
    }),

  // Check if user is on waitlist for a drop
  status: protectedProcedure
    .input(z.object({ dropId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .select({ id: waitlist.id })
        .from(waitlist)
        .where(and(eq(waitlist.dropId, input.dropId), eq(waitlist.userId, ctx.user.id)))
        .limit(1);
      return { onWaitlist: !!entry };
    }),

  // Get user's full waitlist
  myWaitlist: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: waitlist.id,
        joinedAt: waitlist.createdAt,
        drop: {
          id: drops.id,
          title: drops.title,
          imageUrl: drops.imageUrl,
          status: drops.status,
          collectionStart: drops.collectionStart,
        },
        business: { name: businesses.name, slug: businesses.slug },
      })
      .from(waitlist)
      .innerJoin(drops, eq(waitlist.dropId, drops.id))
      .innerJoin(businesses, eq(waitlist.businessId, businesses.id))
      .where(eq(waitlist.userId, ctx.user.id));
  }),
});
