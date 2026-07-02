import { Request } from "express";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

// ─── Generate a unique reference code for reservations ───────────────────────

export function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "UW-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Get current user from session cookie ────────────────────────────────────

export async function getUserFromRequest(req: Request) {
  const token = req.cookies?.session_token;
  if (!token) return null;

  const [session] = await db
    .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session || session.expiresAt < new Date()) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
}
