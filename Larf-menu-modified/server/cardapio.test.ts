import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAllCompanies: vi.fn().mockResolvedValue([
    { id: 1, name: "Restaurante Teste", slug: "restaurante-teste", active: true },
  ]),
  getCompanyBySubdomain: vi.fn().mockResolvedValue({
    id: 1,
    name: "Restaurante Teste",
    slug: "restaurante-teste",
    active: true,
    customDomain: "restaurante-teste",
  }),
  getCompanyBySlug: vi.fn().mockResolvedValue({
    id: 1,
    name: "Restaurante Teste",
    slug: "restaurante-teste",
    active: true,
    description: "Teste",
    address: null,
    phone: null,
    customDomain: null,
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getCompanyById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Restaurante Teste",
    slug: "restaurante-teste",
    active: true,
  }),
  createCompany: vi.fn().mockResolvedValue(42),
  updateCompany: vi.fn().mockResolvedValue(undefined),
  deleteCompany: vi.fn().mockResolvedValue(undefined),
  getUserCompanies: vi.fn().mockResolvedValue([]),
  getCompanyMember: vi.fn().mockResolvedValue({ id: 1, companyId: 1, userId: 1, role: "owner" }),
  addCompanyMember: vi.fn().mockResolvedValue(undefined),
  removeCompanyMember: vi.fn().mockResolvedValue(undefined),
  getCategoriesByCompany: vi.fn().mockResolvedValue([
    { id: 1, companyId: 1, namePt: "Pratos Principais", nameEs: "Platos", nameEn: "Main Courses", sortOrder: 1, active: true },
  ]),
  getPublicCategories: vi.fn().mockResolvedValue([
    { id: 1, companyId: 1, namePt: "Pratos Principais", nameEs: "Platos", nameEn: "Main Courses", sortOrder: 1, active: true },
  ]),
  getCategoryById: vi.fn().mockResolvedValue({ id: 1, companyId: 1, namePt: "Pratos Principais" }),
  createCategory: vi.fn().mockResolvedValue(10),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getMenuItemsByCompany: vi.fn().mockResolvedValue([
    {
      id: 1,
      companyId: 1,
      categoryId: 1,
      namePt: "Frango Grelhado",
      nameEs: "Pollo",
      nameEn: "Grilled Chicken",
      descriptionPt: "Delicioso",
      descriptionEs: null,
      descriptionEn: null,
      priceBrl: "35.90",
      imageUrl: null,
      imageKey: null,
      available: true,
      sortOrder: 1,
    },
  ]),
  getPublicMenuItems: vi.fn().mockResolvedValue([
    {
      id: 1,
      companyId: 1,
      categoryId: 1,
      namePt: "Frango Grelhado",
      priceBrl: "35.90",
      available: true,
    },
  ]),
  getMenuItemById: vi.fn().mockResolvedValue({
    id: 1,
    companyId: 1,
    categoryId: 1,
    namePt: "Frango Grelhado",
    priceBrl: "35.90",
    available: true,
  }),
  createMenuItem: vi.fn().mockResolvedValue(20),
  updateMenuItem: vi.fn().mockResolvedValue(undefined),
  deleteMenuItem: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "Test User", email: "test@example.com", role: "superadmin", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), openId: "test-user" },
  ]),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test User", email: "test@example.com", role: "superadmin" }),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getCompanyMembers: vi.fn().mockResolvedValue([]),
  updateCompanyMemberRole: vi.fn().mockResolvedValue(undefined),
  getReviewsByCompany: vi.fn().mockResolvedValue([
    { id: 1, companyId: 1, type: "review", rating: 5, name: "João", message: "Ótimo!", createdAt: new Date() },
  ]),
  createReview: vi.fn().mockResolvedValue(99),
  deleteReview: vi.fn().mockResolvedValue(undefined),
}));

// Mock fetch for translation API
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    responseStatus: 200,
    responseData: { translatedText: "Translated text" },
  }),
}) as unknown as typeof fetch;

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeCtx(role: "user" | "admin" | "superadmin" = "superadmin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user when authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result?.email).toBe("test@example.com");
  });
});

describe("currency", () => {
  it("getRates returns BRL, USD, EUR", async () => {
    // Override fetch mock to return exchange rate data for this test
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: { USD: 0.19, EUR: 0.18, BRL: 1 },
      }),
    });
    const caller = appRouter.createCaller(makePublicCtx());
    const rates = await caller.currency.getRates();
    expect(rates).toHaveProperty("BRL", 1);
    expect(rates).toHaveProperty("USD");
    expect(rates).toHaveProperty("EUR");
    expect(typeof rates.USD).toBe("number");
    expect(typeof rates.EUR).toBe("number");
  });
});

describe("companies", () => {
  it("list returns companies for superadmin", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.companies.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Restaurante Teste");
  });

  it("list throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.companies.list()).rejects.toThrow();
  });

  it("getBySlug returns company for public access", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.companies.getBySlug({ slug: "restaurante-teste" });
    expect(result?.slug).toBe("restaurante-teste");
  });

  it("getBySubdomain returns company for public access", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.companies.getBySubdomain({ subdomain: "restaurante-teste" });
    expect(result?.customDomain).toBe("restaurante-teste");
    expect(result?.slug).toBe("restaurante-teste");
  });

  it("getBySubdomain returns null/undefined for unknown subdomain", async () => {
    const { getCompanyBySubdomain } = await import("./db");
    (getCompanyBySubdomain as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.companies.getBySubdomain({ subdomain: "unknown-subdomain" });
    expect(result == null).toBe(true); // accepts both null and undefined
  });

  it("create returns new company id for superadmin", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.companies.create({
      name: "Novo Restaurante",
      slug: "novo-restaurante",
    });
    expect(result.id).toBe(42);
  });
});

describe("categories", () => {
  it("list returns categories for authenticated user with access", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.categories.list({ companyId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].namePt).toBe("Pratos Principais");
  });

  it("publicList returns active categories without auth", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.categories.publicList({ companyId: 1 });
    expect(result).toHaveLength(1);
  });

  it("create returns new category id", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.categories.create({
      companyId: 1,
      namePt: "Bebidas",
      nameEs: "Bebidas",
      nameEn: "Drinks",
    });
    expect(result.id).toBe(10);
  });
});

describe("menuItems", () => {
  it("list returns items for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.menuItems.list({ companyId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].namePt).toBe("Frango Grelhado");
  });

  it("publicList returns available items without auth", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.menuItems.publicList({ companyId: 1 });
    expect(result).toHaveLength(1);
  });

  it("create returns new item id", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.menuItems.create({
      companyId: 1,
      categoryId: 1,
      namePt: "Picanha",
      priceBrl: "89.90",
    });
    expect(result.id).toBe(20);
  });

  it("toggleAvailability updates item", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.menuItems.toggleAvailability({
      id: 1,
      companyId: 1,
      available: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("users", () => {
  it("list returns all users for superadmin", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.users.list();
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("superadmin");
  });

  it("list throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("updateRole succeeds for superadmin", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.users.updateRole({ id: 2, role: "admin" });
    expect(result.success).toBe(true);
  });
});

describe("reviews", () => {
  it("list returns reviews for authenticated user with access", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.reviews.list({ companyId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Ótimo!");
  });

  it("submit is public and creates review", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.reviews.submit({ companyId: 1, type: "review", rating: 4, name: "Maria", message: "Muito bom!" });
    expect(result.id).toBe(99);
  });

  it("submit validates empty message", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.reviews.submit({ companyId: 1, message: "" })).rejects.toThrow();
  });

  it("delete succeeds for superadmin", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.reviews.delete({ id: 1, companyId: 1 });
    expect(result.success).toBe(true);
  });
});

describe("translation", () => {
  it("translate returns ES and EN for a given PT text", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.translation.translate({ text: "Frango Grelhado", targets: ["es", "en"] });
    expect(result).toHaveProperty("es");
    expect(result).toHaveProperty("en");
    expect(typeof result["es"]).toBe("string");
    expect(typeof result["en"]).toBe("string");
  });

  it("translate throws for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.translation.translate({ text: "Frango", targets: ["es"] })).rejects.toThrow();
  });

  it("translate rejects empty text", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.translation.translate({ text: "", targets: ["es"] })).rejects.toThrow();
  });

  it("translateBatch translates multiple fields at once", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.translation.translateBatch({
      fields: [
        { key: "name", text: "Frango Grelhado" },
        { key: "description", text: "Prato delicioso" },
      ],
      targets: ["es", "en"],
    });
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("description");
    expect(result["name"]).toHaveProperty("es");
    expect(result["name"]).toHaveProperty("en");
    expect(result["description"]).toHaveProperty("es");
  });
});

describe("import.confirm", () => {
  it("creates categories and items from confirmed payload", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.import.confirm({
      companyId: 1,
      categories: [
        {
          namePt: "Entradas",
          nameEs: "Entradas",
          nameEn: "Starters",
          items: [
            { namePt: "Pão de Alho", nameEs: "Pan de Ajo", nameEn: "Garlic Bread", priceBrl: "12.00" },
            { namePt: "Caldo Verde", priceBrl: "18.00" },
          ],
        },
        {
          namePt: "Bebidas",
          items: [
            { namePt: "Suco de Laranja", priceBrl: "8.00" },
          ],
        },
      ],
    });
    expect(result.totalCategories).toBe(2);
    expect(result.totalItems).toBe(3);
  });

  it("confirm throws FORBIDDEN for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.import.confirm({
        companyId: 1,
        categories: [],
      })
    ).rejects.toThrow();
  });

  it("confirm with empty categories returns zeros", async () => {
    const caller = appRouter.createCaller(makeCtx("superadmin"));
    const result = await caller.import.confirm({ companyId: 1, categories: [] });
    expect(result.totalCategories).toBe(0);
    expect(result.totalItems).toBe(0);
  });
});
