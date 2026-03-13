import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
  status: mysqlEnum("status", ["pending", "active", "rejected"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Companies (Tenants) ─────────────────────────────────────────────────────
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  // About the restaurant
  description: text("description"),
  logoUrl: text("logoUrl"),
  logoKey: text("logoKey"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  instagram: varchar("instagram", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  // Customization
  colorTheme: varchar("colorTheme", { length: 30 }).default("#f97316").notNull(),
  menuTemplate: varchar("menuTemplate", { length: 20 }).default("classic").notNull(),
  customDomain: varchar("customDomain", { length: 255 }),
  googleReviewsUrl: varchar("googleReviewsUrl", { length: 500 }),
  // Carousel images (up to 4, stored as JSON array of URLs)
  carouselImages: text("carouselImages"),  // JSON: ["url1","url2","url3","url4"]
  // Delivery & payments
  deliveryEnabled: boolean("deliveryEnabled").default(false).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }),
  deliveryMinOrder: decimal("deliveryMinOrder", { precision: 10, scale: 2 }),
  paymentMercadoPago: varchar("paymentMercadoPago", { length: 500 }),
  paymentPagSeguro: varchar("paymentPagSeguro", { length: 500 }),
  paymentPicPay: varchar("paymentPicPay", { length: 500 }),
  // Exchange rates (manual override, null = use automatic API)
  usdRate: decimal("usdRate", { precision: 10, scale: 4 }),
  eurRate: decimal("eurRate", { precision: 10, scale: 4 }),
  // Business hours (JSON: {mon:{open:"08:00",close:"22:00",closed:false},...})
  businessHours: text("businessHours"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ─── Company Members ──────────────────────────────────────────────────────────
export const companyMembers = mysqlTable("company_members", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["owner", "manager"]).default("manager").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = typeof companyMembers.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  namePt: varchar("namePt", { length: 255 }).notNull(),
  nameEs: varchar("nameEs", { length: 255 }),
  nameEn: varchar("nameEn", { length: 255 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
  namePt: varchar("namePt", { length: 255 }).notNull(),
  nameEs: varchar("nameEs", { length: 255 }),
  nameEn: varchar("nameEn", { length: 255 }),
  descriptionPt: text("descriptionPt"),
  descriptionEs: text("descriptionEs"),
  descriptionEn: text("descriptionEn"),
  priceBrl: decimal("priceBrl", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  available: boolean("available").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  // Dietary restrictions
  isVegetarian: boolean("isVegetarian").default(false).notNull(),
  containsGluten: boolean("containsGluten").default(false).notNull(),
  containsLactose: boolean("containsLactose").default(false).notNull(),
  isSpicy: boolean("isSpicy").default(false).notNull(),
  // Chef's recommendation
  chefRecommended: boolean("chefRecommended").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

// ─── Reviews / Feedback ───────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["review", "suggestion", "complaint"]).default("review").notNull(),
  rating: int("rating"),
  name: varchar("name", { length: 255 }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
