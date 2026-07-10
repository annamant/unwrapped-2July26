import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./trpc";
import { appRouter } from "./router";
import { getUserFromRequest, generateReferenceCode } from "./auth/oauth";
import { db } from "./db";
import { pushSubscriptions, reservations, drops } from "./db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { refundPaymentIntent } from "./payments/stripe";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// CLIENT_URL may hold one or more comma-separated origins (e.g. the apex
// domain and its www subdomain). Falls back to localhost for local dev.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
          // Allow same-origin/non-browser requests (no Origin header) through.
      if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
      } else {
              callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
}));
app.use(cookieParser());

// ─── Stripe webhook (raw body required for signature verification; must be
//     mounted BEFORE express.json) ──────────────────────────────────────────────
//
// Safety net for the payment flow: if a customer pays but never completes the
// reservation call (closed tab, crash, network drop), `payment_intent.succeeded`
// still fires here. After a grace period for the normal client flow to finish,
// we either create the missing reservation from the PaymentIntent metadata or,
// if the drop can no longer honour it, refund automatically.
//
// Setup: create a webhook endpoint in the Stripe dashboard pointing at
// https://<api-domain>/api/stripe/webhook with event `payment_intent.succeeded`,
// then set STRIPE_WEBHOOK_SECRET in Railway.

function verifyStripeSignature(rawBody: Buffer, sigHeader: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(sigHeader.split(",").map(kv => kv.split("=") as [string, string]));
    const timestamp = parts["t"];
    const v1 = parts["v1"];
    if (!timestamp || !v1) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false; // 5 min tolerance
    const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function reconcileOrphanedPayment(pi: { id: string; metadata?: Record<string, string> }) {
  // Already reserved through the normal flow? Nothing to do.
  const [existing] = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(eq(reservations.stripePaymentIntentId, pi.id))
    .limit(1);
  if (existing) return;

  const dropId = pi.metadata?.dropId;
  const userId = pi.metadata?.userId;
  if (!dropId || !userId) {
    console.error(`[stripe-webhook] orphaned payment ${pi.id} has no metadata — refund manually`);
    return;
  }

  // Try to honour the payment: atomically take a unit if one is left.
  const [updated] = await db
    .update(drops)
    .set({
      availableQuantity: sql`${drops.availableQuantity} - 1`,
      status: sql`CASE WHEN ${drops.availableQuantity} - 1 <= 0 THEN 'sold_out'::drop_status ELSE ${drops.status} END`,
    })
    .where(and(eq(drops.id, dropId), gt(drops.availableQuantity, 0), eq(drops.status, "active")))
    .returning();

  if (!updated) {
    console.log(`[stripe-webhook] drop unavailable for orphaned payment ${pi.id} — refunding`);
    await refundPaymentIntent(pi.id);
    return;
  }

  try {
    await db.insert(reservations).values({
      dropId,
      userId,
      stripePaymentIntentId: pi.id,
      qrCodeHash: crypto.randomBytes(32).toString("hex"),
      referenceCode: generateReferenceCode(),
      status: "active",
      payoutStatus: "pending",
    });
    console.log(`[stripe-webhook] recovered orphaned payment ${pi.id} into a reservation`);
  } catch (err: any) {
    // Unique-constraint race: normal flow won after our check — release the unit.
    await db
      .update(drops)
      .set({
        availableQuantity: sql`${drops.availableQuantity} + 1`,
        status: sql`CASE WHEN ${drops.status} = 'sold_out'::drop_status THEN 'active'::drop_status ELSE ${drops.status} END`,
      })
      .where(eq(drops.id, dropId));
    if (err?.code !== "23505") throw err;
  }
}

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — event ignored");
    return res.status(501).json({ error: "Webhook not configured" });
  }
  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string" || !verifyStripeSignature(req.body as Buffer, sig, secret)) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event: any;
  try {
    event = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // Acknowledge immediately; reconcile after a grace period so the normal
  // client-side reservation flow (which usually completes in seconds) wins.
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data?.object;
    setTimeout(() => {
      reconcileOrphanedPayment(pi).catch(err =>
        console.error(`[stripe-webhook] reconcile failed for ${pi?.id}:`, err)
      );
    }, 90 * 1000);
  }

  return res.json({ received: true });
});

app.use(express.json());

// ─── Auth routes (not tRPC — sign-out handled via tRPC mutation) ─────────────

// ─── Push notification subscription ──────────────────────────────────────────

app.post("/api/push/subscribe", async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

           const { endpoint, p256dh, auth } = req.body;
    if (!endpoint || !p256dh || !auth) return res.status(400).json({ error: "Missing fields" });

           try {
                 await db
                   .insert(pushSubscriptions)
                   .values({ userId: user.id, endpoint, p256dh, auth })
                   .onConflictDoNothing(); // endpoint is unique — ignore duplicates
      return res.json({ ok: true });
           } catch (err) {
                 console.error("Push subscribe error:", err);
                 return res.status(500).json({ error: "Failed" });
           }
});

app.post("/api/push/unsubscribe", async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

           const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

           await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));
    return res.json({ ok: true });
});

// ─── Image upload ─────────────────────────────────────────────────────────────

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
          if (file.mimetype.startsWith("image/")) cb(null, true);
          else cb(new Error("Only image files are allowed"));
    },
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
    }

           // Storage is not configured yet. Fail loudly rather than returning a fake
           // URL that renders as a broken image. To enable, add @aws-sdk/client-s3 and
           // upload to S3/Cloudflare R2 here, returning the public URL:
           //   const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
           //   const key = `uploads/${Date.now()}-${req.file.originalname}`;
           //   await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));
           //   return res.json({ url: `${process.env.R2_PUBLIC_URL}/${key}` });
           return res.status(501).json({
                 error: "Image uploads aren't configured. Paste an image URL instead, or configure R2/S3 storage.",
           });
});

// ─── tRPC ─────────────────────────────────────────────────────────────────────

app.use(
    "/api/trpc",
    createExpressMiddleware({
          router: appRouter,
          createContext,
          onError: ({ path, error }) => {
                  if (error.code !== "UNAUTHORIZED") {
                            console.error(`tRPC error on ${path}:`, error.message);
                  }
          },
    }),
  );

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ ok: true }));

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Unwrapped server running on port ${PORT}`);
});
