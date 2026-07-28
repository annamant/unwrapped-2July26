import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { shopRecommendations } from "../db/schema";

const attempts = new Map<string, number[]>();

function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many recommendations. Try again in a few minutes.",
    });
  }
  list.push(now);
  attempts.set(key, list);
  if (attempts.size > 10_000) attempts.clear();
}

export const recommendationsRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        businessName: z.string().min(1).max(120),
        neighbourhood: z.string().min(1).max(80),
        category: z.string().max(80).optional(),
        businessInstagram: z.string().max(80).optional(),
        businessWebsite: z.string().max(200).optional(),
        businessAddress: z.string().max(200).optional(),
        note: z.string().max(800).optional(),
        recommenderName: z.string().max(100).optional(),
        recommenderEmail: z.union([z.string().email(), z.literal("")]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      rateLimit(`recommend-ip:${ctx.req.ip ?? "unknown"}`, 8, 15 * 60 * 1000);

      const email = input.recommenderEmail?.trim().toLowerCase();
      const [row] = await ctx.db
        .insert(shopRecommendations)
        .values({
          businessName: input.businessName.trim(),
          neighbourhood: input.neighbourhood.trim(),
          category: input.category,
          businessInstagram: input.businessInstagram?.trim() || null,
          businessWebsite: input.businessWebsite?.trim() || null,
          businessAddress: input.businessAddress?.trim() || null,
          note: input.note?.trim() || null,
          recommenderName: input.recommenderName?.trim() || null,
          recommenderEmail: email || null,
          status: "pending",
        })
        .returning({ id: shopRecommendations.id });

      return { id: row.id };
    }),
});
