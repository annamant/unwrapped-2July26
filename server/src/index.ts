import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./trpc";
import { appRouter } from "./router";
import { getUserFromRequest } from "./auth/oauth";
import { db } from "./db";
import { pushSubscriptions } from "./db/schema";
import { eq } from "drizzle-orm";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
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

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
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

  // In production: upload to S3 / Cloudflare R2 and return the public URL.
  // For now: return a placeholder URL. Replace this block with your storage provider.
  try {
    // Example with Cloudflare R2 (add @aws-sdk/client-s3 as dependency):
    // const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    // const s3 = new S3Client({ ... });
    // const key = `uploads/${Date.now()}-${req.file.originalname}`;
    // await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));
    // const url = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Placeholder:
    const url = `https://placeholder.unwrapped.shop/uploads/${Date.now()}-${req.file.originalname}`;
    return res.json({ url });
  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
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
