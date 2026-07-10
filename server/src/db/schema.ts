import {
  pgTable, text, integer, boolean, timestamp, doublePrecision, jsonb, pgEnum, uuid, varchar, uniqueIndex
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["consumer", "admin"]);
export const businessStatusEnum = pgEnum("business_status", ["pending", "active", "suspended"]);
export const dropFormatEnum = pgEnum("drop_format", ["limited_item", "clearance_discount", "bundle", "service_window"]);
export const dropStatusEnum = pgEnum("drop_status", ["draft", "active", "sold_out", "cancelled", "expired"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["active", "fulfilled", "cancelled", "expired"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "released"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  name: text("name"),
  phone: text("phone"),
  role: userRoleEnum("role").default("consumer").notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  interestCategories: text("interest_categories").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Password reset tokens ────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").unique().notNull(), // sha256 of raw token — raw value only ever lives in the email link
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Location Zones (consumer notification zones) ─────────────────────────────

export const locationZones = pgTable("location_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(), // "Home", "Work", etc.
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radiusKm: doublePrecision("radius_km").default(2).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notification Preferences ─────────────────────────────────────────────────

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  enabledCategories: text("enabled_categories").array().default([]).notNull(),
  quietHoursStart: integer("quiet_hours_start").default(22).notNull(), // hour in 24h
  quietHoursEnd: integer("quiet_hours_end").default(8).notNull(),
  quietHoursEnabled: boolean("quiet_hours_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Businesses ───────────────────────────────────────────────────────────────

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  instagramHandle: text("instagram_handle"),
  website: text("website"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  city: text("city"),
  address: text("address"),
  postcode: text("postcode"),
  contactEmail: text("contact_email").notNull(),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false).notNull(),
  status: businessStatusEnum("status").default("pending").notNull(),
  rejectedAt: timestamp("rejected_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Business Applications ────────────────────────────────────────────────────

export const businessApplications = pgTable("business_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactEmail: text("contact_email").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  postcode: text("postcode"),
  instagramHandle: text("instagram_handle"),
  website: text("website"),
  category: text("category").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Staff Roles ──────────────────────────────────────────────────────────────

export const staffRoles = pgTable("staff_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // admin, manager, staff
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Locations (sub-entities of businesses) ───────────────────────────────────

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").default("Main Location").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Drops ────────────────────────────────────────────────────────────────────

export const drops = pgTable("drops", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  locationId: uuid("location_id").references(() => locations.id).notNull(),
  format: dropFormatEnum("format").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: integer("price").notNull(), // in pence
  originalPrice: integer("original_price"), // for clearance/discount drops
  totalQuantity: integer("total_quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  collectionStart: timestamp("collection_start").notNull(),
  collectionEnd: timestamp("collection_end").notNull(),
  status: dropStatusEnum("status").default("active").notNull(),
  featured: boolean("featured").default(false).notNull(),
  earlyAccessSentAt: timestamp("early_access_sent_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: text("cancelled_by"), // "business" or "admin"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Reservations ─────────────────────────────────────────────────────────────

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  dropId: uuid("drop_id").references(() => drops.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  qrCodeHash: text("qr_code_hash").unique().notNull(),
  referenceCode: varchar("reference_code", { length: 10 }).unique().notNull(),
  status: reservationStatusEnum("status").default("active").notNull(),
  payoutStatus: payoutStatusEnum("payout_status").default("pending").notNull(),
  payoutReleasedAt: timestamp("payout_released_at"),
  fulfilledAt: timestamp("fulfilled_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  // Postgres treats NULLs as distinct, so free (null) reservations are unaffected —
  // this only blocks the same Stripe payment from being redeemed into two reservations.
  uniqueIndex("reservations_stripe_payment_intent_unique").on(t.stripePaymentIntentId),
]);

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  dropId: uuid("drop_id").references(() => drops.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("waitlist_drop_user_unique").on(t.dropId, t.userId),
]);

// ─── Follows ──────────────────────────────────────────────────────────────────

export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("follows_user_business_unique").on(t.userId, t.businessId),
]);

// ─── Notification Mutes ───────────────────────────────────────────────────────

export const notificationMutes = pgTable("notification_mutes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Push Subscriptions (web push VAPID) ─────────────────────────────────────

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").unique().notNull(),
  p256dh: text("p256dh").notNull(),   // public key
  auth: text("auth").notNull(),         // auth secret
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  reservations: many(reservations),
  waitlist: many(waitlist),
  follows: many(follows),
  locationZones: many(locationZones),
  notificationPreferences: one(notificationPreferences),
  notificationMutes: many(notificationMutes),
  sessions: many(sessions),
  businesses: many(businesses, { relationName: "ownedBusinesses" }),
}));

export const businessesRelations = relations(businesses, ({ many, one }) => ({
  owner: one(users, { fields: [businesses.ownerId], references: [users.id], relationName: "ownedBusinesses" }),
  locations: many(locations),
  drops: many(drops),
  followers: many(follows),
  staffRoles: many(staffRoles),
}));

export const dropsRelations = relations(drops, ({ one, many }) => ({
  business: one(businesses, { fields: [drops.businessId], references: [businesses.id] }),
  location: one(locations, { fields: [drops.locationId], references: [locations.id] }),
  reservations: many(reservations),
  waitlist: many(waitlist),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  drop: one(drops, { fields: [reservations.dropId], references: [drops.id] }),
  user: one(users, { fields: [reservations.userId], references: [users.id] }),
}));
