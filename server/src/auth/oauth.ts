import { Request, Response } from "express";
import { db } from "../db";
import { users, sessions, businesses } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const MANUS_APP_ID = process.env.MANUS_APP_ID!;
const MANUS_APP_SECRET = process.env.MANUS_APP_SECRET!;
const BASE_URL = process.env.BASE_URL || "https://unwrapped.shop";
const SESSION_DURATION_DAYS = 90;

// ─── Generate a secure session token ─────────────────────────────────────────

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// ─── Generate a unique reference code for reservations ───────────────────────

export function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "UW-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Exchange Manus OAuth code for user info ──────────────────────────────────

async function exchangeCodeForUser(code: string, state: string): Promise<{
  id: string;
  email?: string;
  name?: string;
  phone?: string;
} | null> {
  try {
    const response = await fetch("https://manus.im/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: MANUS_APP_ID,
        appSecret: MANUS_APP_SECRET,
        code,
        redirectUri: `${BASE_URL}/api/oauth/callback`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Manus token exchange failed:", err);
      return null;
    }

    const data = await response.json();
    return data.user ?? null;
  } catch (err) {
    console.error("OAuth exchange error:", err);
    return null;
  }
}

// ─── OAuth Callback Handler ───────────────────────────────────────────────────

export async function oauthCallbackHandler(req: Request, res: Response) {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    return res.status(400).json({ error: "code and state are required" });
  }

  // Decode return path from state (base64 encoded)
  let returnPath = "/";
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    if (decoded.startsWith("/")) returnPath = decoded;
  } catch {}

  // Exchange code for user info
  const manusUser = await exchangeCodeForUser(code, state);
  if (!manusUser) {
    return res.redirect(`/signin?error=oauth_failed`);
  }

  // Find or create user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.manusId, manusUser.id))
    .limit(1);

  const isNewUser = !user;

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        manusId: manusUser.id,
        email: manusUser.email,
        name: manusUser.name,
        phone: manusUser.phone,
        role: "consumer",
        onboardingComplete: false,
      })
      .returning();
  } else {
    // Update any changed profile info
    [user] = await db
      .update(users)
      .set({
        email: manusUser.email ?? user.email,
        name: manusUser.name ?? user.name,
      })
      .where(eq(users.id, user.id))
      .returning();
  }

  // Create session
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.insert(sessions).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // Set secure HTTP-only cookie
  res.cookie("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  // Route based on user state
  if (isNewUser || !user.onboardingComplete) {
    return res.redirect("/onboarding");
  }

  // Check if they have a business (for return path to dashboard)
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerId, user.id))
    .limit(1);

  if (returnPath.startsWith("/dashboard") && business) {
    return res.redirect(returnPath);
  }

  if (returnPath.startsWith("/business") && business) {
    return res.redirect("/dashboard");
  }

  return res.redirect(returnPath === "/" ? "/" : returnPath);
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

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOutHandler(req: Request, res: Response) {
  const token = req.cookies?.session_token;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  res.clearCookie("session_token");
  res.json({ success: true });
}

// ─── Build the Manus OAuth login URL ─────────────────────────────────────────

export function getLoginUrl(returnPath = "/"): string {
  const state = Buffer.from(returnPath).toString("base64");
  const redirectUri = encodeURIComponent(`${BASE_URL}/api/oauth/callback`);
  return `https://manus.im/app-auth?appId=${MANUS_APP_ID}&redirectUri=${redirectUri}&state=${state}&type=signIn`;
}
