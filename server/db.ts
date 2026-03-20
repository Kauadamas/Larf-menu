import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Category,
  Company,
  CompanyMember,
  InsertCategory,
  InsertCompany,
  InsertCompanyMember,
  InsertMenuItem,
  InsertReview,
  InsertUser,
  MenuItem,
  Review,
  categories,
  companies,
  companyMembers,
  menuItems,
  passwordResetTokens,
  reviews,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "superadmin";
    updateSet.role = "superadmin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  // Só retorna usuários ativos (exclui pending e rejected)
  const allUsers = await db.select().from(users)
    .where(eq((users as any).status, "active"))
    .orderBy(asc(users.name));
  const usersWithCompanies = await Promise.all(
    allUsers.map(async (u) => {
      const memberships = await db!
        .select({ companyId: companyMembers.companyId, companyName: companies.name })
        .from(companyMembers)
        .innerJoin(companies, eq(companyMembers.companyId, companies.id))
        .where(eq(companyMembers.userId, u.id));
      const { passwordHash, emailVerifyToken, emailVerifyExpiresAt, ...safeUser } = u as any;
      return { ...safeUser, companies: memberships };
    })
  );
  return usersWithCompanies;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function updateUserRole(id: number, role: "user" | "admin" | "superadmin") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// ─── Companies ────────────────────────────────────────────────────────────────
export async function getAllCompanies(): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(asc(companies.name));
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0];
}

export async function getCompanyBySlug(slug: string): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(
    and(eq(companies.slug, slug), eq(companies.active, true))
  ).limit(1);
  return result[0];
}
export async function getCompanyBySubdomain(subdomain: string): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const byDomain = await db.select().from(companies).where(
    and(eq(companies.customDomain, subdomain), eq(companies.active, true))
  ).limit(1);
  if (byDomain[0]) return byDomain[0];
  const bySlug = await db.select().from(companies).where(
    and(eq(companies.slug, subdomain), eq(companies.active, true))
  ).limit(1);
  return bySlug[0];
}

export async function createCompany(data: InsertCompany): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(companies).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function updateCompany(id: number, data: Partial<InsertCompany>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Filter out undefined values to avoid MySQL rejecting undefined params
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<InsertCompany>;
  if (Object.keys(cleanData).length === 0) return;
  await db.update(companies).set(cleanData).where(eq(companies.id, id));
}

export async function deleteCompany(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(companies).where(eq(companies.id, id));
}

// ─── Company Members ──────────────────────────────────────────────────────────
export async function getCompanyMember(userId: number, companyId: number): Promise<CompanyMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId)))
    .limit(1);
  return result[0];
}

export async function getUserCompanies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ company: companies, member: companyMembers })
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(eq(companyMembers.userId, userId));
}

export async function getCompanyMembers(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ user: users, member: companyMembers })
    .from(companyMembers)
    .innerJoin(users, eq(companyMembers.userId, users.id))
    .where(eq(companyMembers.companyId, companyId))
    .orderBy(asc(users.name));
}

export async function addCompanyMember(data: InsertCompanyMember): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(companyMembers).values(data);
}

export async function updateCompanyMemberRole(userId: number, companyId: number, role: "owner" | "manager") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(companyMembers).set({ role }).where(
    and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId))
  );
}

export async function removeCompanyMember(userId: number, companyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(companyMembers).where(
    and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId))
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategoriesByCompany(companyId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(categories)
    .where(eq(categories.companyId, companyId))
    .orderBy(asc(categories.sortOrder), asc(categories.namePt));
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete menu items first to avoid FK constraint errors
  await db.delete(menuItems).where(eq(menuItems.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Menu Items ───────────────────────────────────────────────────────────────
export async function getMenuItemsByCompany(companyId: number): Promise<MenuItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.companyId, companyId))
    .orderBy(asc(menuItems.categoryId), asc(menuItems.sortOrder), asc(menuItems.namePt));
}

export async function getMenuItemById(id: number): Promise<MenuItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return result[0];
}

export async function createMenuItem(data: InsertMenuItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(menuItems).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(menuItems).set(data).where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

export async function getPublicMenuItems(companyId: number): Promise<MenuItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.companyId, companyId), eq(menuItems.available, true)))
    .orderBy(asc(menuItems.categoryId), asc(menuItems.sortOrder), asc(menuItems.namePt));
}

export async function getPublicCategories(companyId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.companyId, companyId), eq(categories.active, true)))
    .orderBy(asc(categories.sortOrder), asc(categories.namePt));
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export async function getReviewsByCompany(companyId: number): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.companyId, companyId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reviews).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function getReviewById(id: number): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result[0];
}

export async function deleteReview(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(reviews).where(eq(reviews.id, id));
}

// ─── User management ─────────────────────────────────────────────────────────
export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function setUserPassword(id: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function getUserByEmailWithPassword(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUserManually(data: { name: string; email: string; role: "user" | "admin" | "superadmin" }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Generate a unique openId for manually created users
  const openId = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    role: data.role,
    loginMethod: "manual",
    lastSignedIn: new Date(),
  });
  return Number((result[0] as { insertId: number }).insertId);
}

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Invalidate previous tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ token: passwordResetTokens, user: users })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return result[0];
}

export async function markTokenUsed(token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
}

export async function registerUser(data: { name: string; email: string; passwordHash: string }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const openId = `reg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "password",
    role: "user",
    status: "pending",
    lastSignedIn: new Date(),
  } as any);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq((users as any).status, "pending"));
}

export async function updateUserStatus(id: number, status: "active" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ status } as any).where(eq(users.id, id));
}

// ─── Email Verification ───────────────────────────────────────────────────────
export async function setEmailVerifyToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ emailVerifyToken: token, emailVerifyExpiresAt: expiresAt } as any).where(eq(users.id, userId));
}

export async function getUserByEmailVerifyToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq((users as any).emailVerifyToken, token)).limit(1);
  return result[0];
}

export async function markEmailVerified(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({
    emailVerifiedAt: new Date(),
    emailVerifyToken: null,
    emailVerifyExpiresAt: null,
    status: "active",
  } as any).where(eq(users.id, userId));
}
