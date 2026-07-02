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

export function getSessionToken(req: Request): string | null {
  // Prefer Authorization header (works cross-origin where third-party
  // cookies are blocked), fall back to the session cookie.
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.session_token ?? null;
}

export async function getUserFromRequest(req: Request) {
  const token = getSessionToken(req);
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
