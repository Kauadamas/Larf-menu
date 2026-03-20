import { TRPCError } from "@trpc/server";
import { billingRouter } from "./billing/router";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  addCompanyMember,
  createCategory,
  createCompany,
  createMenuItem,
  createReview,
  deleteCategory,
  deleteCompany,
  deleteMenuItem,
  deleteReview,
  getAllCompanies,
  getAllUsers,
  getCategoriesByCompany,
  getCategoryById,
  getCompanyById,
  getCompanyBySlug,
  getCompanyBySubdomain,
  getCompanyMember,
  getCompanyMembers,
  getMenuItemById,
  getMenuItemsByCompany,
  getPublicCategories,
  getPublicMenuItems,
  getReviewsByCompany,
  createUserManually,
  createPasswordResetToken,
  getPasswordResetToken,
  markTokenUsed,
  deleteUser,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserById,
  getUserCompanies,
  getPendingUsers,
  registerUser,
  updateUserStatus,
  removeCompanyMember,
  setUserPassword,
  updateCategory,
  updateCompany,
  updateCompanyMemberRole,
  updateMenuItem,
  updateUserRole,
  setEmailVerifyToken,
  getUserByEmailVerifyToken,
  markEmailVerified,
} from "./db";
import { sendPasswordResetEmail, sendWelcomeEmail, sendApprovalEmail, sendVerificationEmail } from "./_core/email";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";

function randomSuffix() {
  return crypto.randomBytes(8).toString("hex");
}

// ─── In-memory rate limiter ────────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= maxRequests) return false; // blocked
  entry.count++;
  return true;
}
// Clean up stale entries every 5 min to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitStore) {
    if (now > v.resetAt) rateLimitStore.delete(k);
  }
}, 5 * 60 * 1000);

// ─── ALLOWED ORIGINS for password reset links ─────────────────────────────────
const ALLOWED_RESET_ORIGINS = new Set([
  "https://larfmenu.com.br",
  "https://app.larfmenu.com.br",
  "http://localhost:3000",
  "http://localhost:5173",
]);

// ─── Sanitize HTML to prevent XSS in print template ──────────────────────────
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Validate image content-type ─────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB server-side hard cap

function validateImageUpload(contentType: string, base64: string) {
  if (!ALLOWED_IMAGE_TYPES.has(contentType.toLowerCase())) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP." });
  }
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo muito grande. Máximo 8MB." });
  }
}

const superadminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Superadmin required" });
  }
  return next({ ctx });
});

async function assertCompanyAccess(userId: number, companyId: number, role?: string) {
  if (role === "superadmin") return; // only superadmin has unrestricted access
  const member = await getCompanyMember(userId, companyId);
  if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "No access to this company" });
}

// ─── Currency (cached) ────────────────────────────────────────────────────────
let ratesCache: { rates: Record<string, number>; fetchedAt: number } | null = null;

async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && now - ratesCache.fetchedAt < 10 * 60 * 1000) return ratesCache.rates;
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/BRL");
    if (!res.ok) throw new Error("Exchange API error");
    const data = (await res.json()) as { rates: Record<string, number> };
    ratesCache = { rates: data.rates, fetchedAt: now };
    return data.rates;
  } catch {
    return { USD: 0.19, EUR: 0.18, BRL: 1 };
  }
}

// ─── Translation (multi-provider with cache + LLM fallback) ──────────────────
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In-memory cache: key = "text|lang", value = translated string
const translationCache = new Map<string, string>();

// Strip HTML tags from translation results (some APIs return HTML like <g id="Italic">text</g>)
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

// Corrige resultado de APIs que retornam tudo em lowercase
// Capitaliza a primeira letra de cada frase
function fixCapitalization(original: string, translated: string): string {
  // Se o original começa com maiúscula e o traduzido não, corrige
  if (original.length > 0 && translated.length > 0) {
    const firstChar = translated.charAt(0);
    if (firstChar === firstChar.toLowerCase() && original.charAt(0) === original.charAt(0).toUpperCase()) {
      return firstChar.toUpperCase() + translated.slice(1);
    }
  }
  return translated;
}

async function translateViaGoogle(text: string, targetLang: string): Promise<string> {
  const encoded = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${targetLang}&dt=t&q=${encoded}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  const rawText = await res.text();
  // Detect HTML response (rate limit / block page)
  if (rawText.trimStart().startsWith("<")) throw new Error("Google: blocked (HTML response)");
  let data: any[][];
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Google: invalid JSON response");
  }
  // Response is nested arrays: [[['translated','original',...],...],...]  
  const translated = (data[0] as any[][])
    .map((chunk: any[]) => chunk[0] ?? "")
    .join("");
  if (!translated) throw new Error("Google: empty translation");
  return stripHtml(translated);
}

async function translateViaMyMemory(text: string, targetLang: string): Promise<string> {
  const encoded = encodeURIComponent(text);
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=pt|${targetLang}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { responseStatus: number; responseData: { translatedText: string } };
  if (data.responseStatus === 429) throw new Error("RATE_LIMIT");
  if (data.responseStatus !== 200) throw new Error(`API status ${data.responseStatus}`);
  return stripHtml(data.responseData.translatedText);
}

async function translateViaLingva(text: string, targetLang: string): Promise<string> {
  const encoded = encodeURIComponent(text);
  const url = `https://lingva.ml/api/v1/pt/${targetLang}/${encoded}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Lingva HTTP ${res.status}`);
  const data = (await res.json()) as { translation: string };
  if (!data.translation) throw new Error("Lingva: empty translation");
  return stripHtml(data.translation);
}

async function translateViaGoogle2(text: string, targetLang: string): Promise<string> {
  // Segundo endpoint do Google Translate (client=dict-chrome-ex)
  const encoded = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=pt&tl=${targetLang}&dt=t&q=${encoded}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google2 HTTP ${res.status}`);
  const rawText = await res.text();
  if (rawText.trimStart().startsWith("<")) throw new Error("Google2: blocked");
  const data = JSON.parse(rawText);
  const translated = (data[0] as any[][]).map((c: any[]) => c[0] ?? "").join("");
  if (!translated) throw new Error("Google2: empty");
  return stripHtml(translated);
}

async function translateViaArgos(text: string, targetLang: string): Promise<string> {
  // LibreTranslate instância pública
  const res = await fetch("https://translate.terraprint.co/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "pt", target: targetLang, format: "text" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Argos HTTP ${res.status}`);
  const data = (await res.json()) as { translatedText?: string };
  if (!data.translatedText) throw new Error("Argos: empty");
  return stripHtml(data.translatedText);
}

async function translateViaLLM(text: string, targetLang: string): Promise<string> {
  const langName = targetLang === "es" ? "Spanish" : "English";
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `You are a professional restaurant menu translator. Translate the following Brazilian Portuguese text to ${langName}. Return ONLY the translated text, nothing else.` },
      { role: "user", content: text },
    ],
  });
  const content = response?.choices?.[0]?.message?.content;
  const translated = typeof content === "string" ? content.trim() : "";
  if (!translated) throw new Error("LLM: empty response");
  return translated;
}

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;
  const cacheKey = `${text}|${targetLang}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  const providers = [
    { name: "Google",    fn: () => translateViaGoogle(text, targetLang) },
    { name: "Google2",   fn: () => translateViaGoogle2(text, targetLang) },
    { name: "MyMemory",  fn: () => translateViaMyMemory(text, targetLang) },
    { name: "Lingva",    fn: () => translateViaLingva(text, targetLang) },
    { name: "ArgosLingva", fn: () => translateViaArgos(text, targetLang) },
  ];

  let lastError: Error = new Error("All providers failed");
  for (const provider of providers) {
    try {
      const raw = await provider.fn();
      const result = fixCapitalization(text, raw);
      translationCache.set(cacheKey, result);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Small pause before trying next provider
      await sleep(400);
    }
  }
  throw new Error(`Tradução falhou: ${lastError.message}`);
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  billing: billingRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // ─── Login próprio (e-mail + senha) ──────────────────────────────────────
    loginWithPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 10 tentativas por IP por 15 minutos
        const ip = (ctx.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ?? ctx.req.socket.remoteAddress ?? "unknown";
        if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Aguarde 15 minutos." });
        }
        const user = await getUserByEmailWithPassword(input.email.toLowerCase().trim());
        if (!user || !user.passwordHash) {
          // Timing attack: always run bcrypt even if user not found
          await bcrypt.compare(input.password, "$2b$10$invalidhashinvalidhashinvalidhashxx");
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos" });
        }
        // Verificar status da conta
        if ((user as any).status === "pending") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sua conta está aguardando aprovação do administrador." });
        }
        if ((user as any).status === "rejected") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sua conta foi recusada. Entre em contato com o administrador." });
        }
        // Create session token using existing SDK
        const token = await sdk.signSession(
          { openId: user.openId, appId: "larf", name: user.name ?? user.email ?? "" },
          { expiresInMs: 365 * 24 * 60 * 60 * 1000 }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          httpOnly: true,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        // Return user info and their companies
        const companies = await getUserCompanies(user.id);
        return { user, companies };
      }),
    // ─── Registro público (conta fica pendente até aprovação) ────────────────
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Nome muito curto"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        restaurantName: z.string().min(2, "Nome do restaurante muito curto"),
        restaurantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug inválido — use apenas letras minúsculas, números e hífens"),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email.toLowerCase().trim());
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado." });
        }
        const existingSlug = await getCompanyBySlug(input.restaurantSlug);
        if (existingSlug) {
          throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso. Escolha outro." });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const userId = await registerUser({
          name: input.name,
          email: input.email.toLowerCase().trim(),
          passwordHash,
        });
        const companyId = await createCompany({
          name: input.restaurantName,
          slug: input.restaurantSlug,
          active: false,
        });
        await addCompanyMember({ companyId, userId, role: "owner" });

        // Gera token de verificação de e-mail (auto-ativação, sem aprovação manual)
        const verifyToken = `ev_${crypto.randomBytes(32).toString("hex")}`;
        const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await setEmailVerifyToken(userId, verifyToken, verifyExpiresAt);

        const origin = (ctx.req.headers.origin as string | undefined) ?? "https://app.larfmenu.com.br";
        const verifyUrl = `${origin}/verify-email?token=${verifyToken}`;

        try {
          await sendVerificationEmail({
            to: input.email.toLowerCase().trim(),
            name: input.name,
            verifyUrl,
          });
        } catch (err) {
          console.warn("[Register] Failed to send verification email:", err);
        }

        return { success: true, message: "Verifique seu e-mail para ativar sua conta." };
      }),

    // ─── Verificar e-mail (auto-ativação) ────────────────────────────────────
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmailVerifyToken(input.token);
        if (!user) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido ou expirado." });
        }
        if ((user as any).emailVerifiedAt) {
          return { success: true, alreadyVerified: true };
        }
        if ((user as any).emailVerifyExpiresAt && new Date() > (user as any).emailVerifyExpiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Link expirado. Solicite um novo cadastro." });
        }
        await markEmailVerified(user.id);
        // Ativa empresa do usuário
        try {
          const memberships = await getUserCompanies(user.id);
          for (const m of memberships) {
            await updateCompany(m.company.id, { active: true });
          }
        } catch (err) {
          console.warn("[VerifyEmail] Failed to activate companies:", err);
        }
        // Auto-login
        const token2 = await sdk.signSession(
          { openId: user.openId, appId: "larf", name: user.name ?? (user as any).email ?? "" },
          { expiresInMs: 365 * 24 * 60 * 60 * 1000 }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token2, {
          ...cookieOptions,
          httpOnly: true,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return { success: true, alreadyVerified: false };
      }),
    // ─── Definir/alterar senha de usuário (superadmin) ─────────────────────
    setPassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        password: z.string().min(6, "Mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const hash = await bcrypt.hash(input.password, 10);
        await setUserPassword(input.userId, hash);
        return { success: true };
      }),
    // ─── Solicitar redefinição de senha ──────────────────────────────────────
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
        origin: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 5 requests per IP per hour
        const ip = (ctx.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ?? ctx.req.socket.remoteAddress ?? "unknown";
        if (!rateLimit(`pwreset:${ip}`, 5, 60 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Aguarde 1 hora." });
        }
        // Whitelist origin to prevent phishing via crafted reset links
        const allowedOrigin = ALLOWED_RESET_ORIGINS.has(input.origin)
          ? input.origin
          : "https://app.larfmenu.com.br";
        const user = await getUserByEmail(input.email.toLowerCase().trim());
        // Always return success to avoid user enumeration
        if (!user || !user.email) return { success: true };
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await createPasswordResetToken(user.id, token, expiresAt);
        const resetUrl = `${allowedOrigin}/reset-password?token=${token}`;
        await sendPasswordResetEmail({ to: user.email, name: user.name ?? user.email, resetUrl });
        return { success: true };
      }),
    // ─── Redefinir senha com token ────────────────────────────────────────────
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        password: z.string().min(6, "Mínimo 6 caracteres"),
      }))
      .mutation(async ({ input }) => {
        const record = await getPasswordResetToken(input.token);
        if (!record) throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido ou expirado" });
        if (record.token.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Este link já foi utilizado" });
        if (new Date() > record.token.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Link expirado. Solicite um novo." });
        const hash = await bcrypt.hash(input.password, 10);
        await setUserPassword(record.user.id, hash);
        await markTokenUsed(input.token);
        return { success: true };
      }),
  }),
  // ─── Translation ───────────────────────────────────────────────────────────────
  translation: router({
    // Public: translate a batch of texts on-the-fly (for public menu page)
    translatePublic: publicProcedure
      .input(z.object({
        fields: z.array(z.object({
          key: z.string().max(100),
          text: z.string().min(1).max(1000),
        })).max(50), // reduced from 200 to 50
        target: z.enum(["es", "en"]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 5 translation requests per IP per minute
        const ip = (ctx.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ?? ctx.req.socket.remoteAddress ?? "unknown";
        if (!rateLimit(`translate:${ip}`, 5, 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas requisições de tradução." });
        }
        const results: Record<string, string> = {};
        for (const field of input.fields) {
          results[field.key] = await translateText(field.text, input.target);
          await sleep(150);
        }
        return results;
      }),

    translate: protectedProcedure
      .input(z.object({
        text: z.string().min(1).max(2000),
        targets: z.array(z.enum(["es", "en"])).min(1),
      }))
      .mutation(async ({ input }) => {
        const results: Record<string, string> = {};
        await Promise.all(
          input.targets.map(async (lang) => {
            results[lang] = await translateText(input.text, lang);
          })
        );
        return results;
      }),

    translateBatch: protectedProcedure
      .input(z.object({
        fields: z.array(z.object({
          key: z.string(),
          text: z.string().min(1).max(2000),
        })),
        targets: z.array(z.enum(["es", "en"])).min(1),
      }))
      .mutation(async ({ input }) => {
        const results: Record<string, Record<string, string>> = {};

        // Process sequentially; cache avoids re-translating identical strings
        for (const field of input.fields) {
          results[field.key] = {};
          for (const lang of input.targets) {
            results[field.key][lang] = await translateText(field.text, lang);
            await sleep(200); // small pause between requests
          }
        }

        return results;
      }),
  }),

  // ─── Currency ───────────────────────────────────────────────────────────────
  currency: router({
    getRates: publicProcedure
      .input(z.object({ companyId: z.number().optional() }))
      .query(async ({ input }) => {
        // Se companyId fornecido, verificar taxas manuais
        if (input.companyId) {
          const company = await getCompanyById(input.companyId);
          const usdManual = company?.usdRate ? parseFloat(String(company.usdRate)) : null;
          const eurManual = company?.eurRate ? parseFloat(String(company.eurRate)) : null;
          if (usdManual || eurManual) {
            const auto = await getExchangeRates();
            // auto API returns "1 BRL = X USD/EUR" (multiplier)
            // manual rates are "1 USD/EUR = X BRL" (divisor)
            // Normalize: convert auto to "BRL per unit" so the client always divides
            const autoUsdPerBrl = (auto["USD"] && auto["USD"] > 0) ? 1 / auto["USD"] : 5.5;
            const autoEurPerBrl = (auto["EUR"] && auto["EUR"] > 0) ? 1 / auto["EUR"] : 6.0;
            return {
              USD: usdManual ?? autoUsdPerBrl,
              EUR: eurManual ?? autoEurPerBrl,
              BRL: 1,
              manual: true,
              fetchedAt: Date.now(),
            };
          }
        }
        const rates = await getExchangeRates();
        return {
          USD: rates["USD"] ?? 0.19,
          EUR: rates["EUR"] ?? 0.18,
          BRL: 1,
          manual: false,
          fetchedAt: ratesCache?.fetchedAt ?? Date.now(),
        };
      }),
  }),

  // ─── Users (admin panel) ───────────────────────────────────────────────────
  users: router({
    list: superadminProcedure.query(async () => {
      return getAllUsers();
    }),

    updateRole: superadminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin", "superadmin"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.id, input.role);
        return { success: true };
      }),

    getById: superadminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getUserById(input.id);
      }),

    pending: superadminProcedure.query(async () => {
      const pending = await getPendingUsers();
      // Incluir restaurantes de cada usuário pendente
      const result = await Promise.all(pending.map(async (u) => {
        const memberships = await getUserCompanies(u.id);
        return { ...u, companies: memberships.map(m => m.company) };
      }));
      return result;
    }),

    approve: superadminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateUserStatus(input.id, "active");
        // Ativar restaurantes do usuário
        try {
          const memberships = await getUserCompanies(input.id);
          for (const m of memberships) {
            await updateCompany(m.company.id, { active: true });
          }
        } catch (err) {
          console.warn("[Approve] Failed to activate companies:", err);
        }
        // Enviar e-mail de aprovação
        try {
          const user = await getUserById(input.id);
          if (user?.email) {
            await sendApprovalEmail({ to: user.email, name: user.name ?? "Usuário" });
          }
        } catch (err) {
          console.warn("[Approval email] Failed:", err);
        }
        return { success: true };
      }),

    reject: superadminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateUserStatus(input.id, "rejected");
        return { success: true };
      }),

    delete: superadminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.id === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode excluir sua própria conta." });
        await deleteUser(input.id);
        return { success: true };
      }),

    create: superadminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["user", "admin", "superadmin"]).default("user"),
        origin: z.string().url().optional(),
        companyName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createUserManually({ name: input.name, email: input.email, role: input.role });
        // Send welcome e-mail with set-password link if origin is provided
        if (input.origin) {
          try {
            const token = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await createPasswordResetToken(id, token, expiresAt);
            const setPasswordUrl = `${input.origin}/reset-password?token=${token}`;
            await sendWelcomeEmail({ to: input.email, name: input.name, setPasswordUrl, companyName: input.companyName });
          } catch (err) {
            console.warn("[Welcome email] Failed to send:", err);
          }
        }
        return { id };
      }),
  }),

  // ─── Companies ─────────────────────────────────────────────────────────────
  companies: router({
    list: superadminProcedure.query(async () => getAllCompanies()),

    myCompanies: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "superadmin" || ctx.user.role === "admin") return getAllCompanies();
      const result = await getUserCompanies(ctx.user.id);
      return result.map((r) => r.company);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.id, ctx.user.role);
        return getCompanyById(input.id);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => getCompanyBySlug(input.slug)),
    getBySubdomain: publicProcedure
      .input(z.object({ subdomain: z.string() }))
      .query(async ({ input }) => {
        if (!input.subdomain) return null;
        return getCompanyBySubdomain(input.subdomain);
      }),
    create: superadminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        whatsapp: z.string().optional(),
        customDomain: z.string().optional(),
        colorTheme: z.string().max(30).optional(),
        googleReviewsUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCompany({ ...input, active: true, deliveryEnabled: false });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        whatsapp: z.string().optional(),
        customDomain: z.string().optional(),
        logoUrl: z.string().optional(),
        logoKey: z.string().optional(),
        colorTheme: z.string().max(30).optional(),
        googleReviewsUrl: z.string().optional(),
        carouselImages: z.string().optional(), // JSON array of URLs
        businessHours: z.string().optional(), // JSON object with hours per day
        deliveryEnabled: z.boolean().optional(),
        deliveryFee: z.string().optional(),
        deliveryMinOrder: z.string().optional(),
        paymentMercadoPago: z.string().optional(),
        paymentPagSeguro: z.string().optional(),
        paymentPicPay: z.string().optional(),
        active: z.boolean().optional(),
        menuTemplate: z.string().optional(),
        usdRate: z.string().optional(),
        eurRate: z.string().optional(),
        cartEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.id, ctx.user.role);
        const { id, ...rawData } = input;
        // Filter undefined AND empty strings for nullable URL fields to avoid MySQL errors
        const nullableFields = ["facebook","instagram","website","whatsapp","customDomain","googleReviewsUrl","deliveryFee","deliveryMinOrder","paymentMercadoPago","paymentPagSeguro","paymentPicPay","address","phone","description","carouselImages","usdRate","eurRate"];
        const data = Object.fromEntries(
          Object.entries(rawData).map(([k, v]) => [
            k,
            nullableFields.includes(k) && v === "" ? null : v,
          ])
        ) as typeof rawData;
        await updateCompany(id, data);
        return { success: true };
      }),

    delete: superadminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCompany(input.id);
        return { success: true };
      }),

    uploadLogo: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        fileName: z.string().max(255),
        contentType: z.string(),
        base64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        validateImageUpload(input.contentType, input.base64);
        const safeExt: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
        const ext = safeExt[input.contentType.toLowerCase()] ?? "jpg";
        const key = `logos/${input.companyId}/${randomSuffix()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.contentType);
        await updateCompany(input.companyId, { logoUrl: url, logoKey: key });
        return { url, key };
      }),

    uploadCarousel: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        fileName: z.string().max(255),
        contentType: z.string(),
        base64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        validateImageUpload(input.contentType, input.base64);
        const safeExt: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
        const ext = safeExt[input.contentType.toLowerCase()] ?? "jpg";
        const key = `carousel/${input.companyId}/${randomSuffix()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),

    // ── Members ──
    getMembers: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        return getCompanyMembers(input.companyId);
      }),

    addMember: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        userId: z.number(),
        role: z.enum(["owner", "manager"]).default("manager"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        await addCompanyMember(input);
        return { success: true };
      }),

    findUserByEmail: protectedProcedure
      .input(z.object({ companyId: z.number(), email: z.string().email() }))
      .query(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const user = await getUserByEmail(input.email);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email };
      }),

    updateMemberRole: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        userId: z.number(),
        role: z.enum(["owner", "manager"]),
      }))
      .mutation(async ({ input }) => {
        await updateCompanyMemberRole(input.userId, input.companyId, input.role);
        return { success: true };
      }),

    removeMember: protectedProcedure
      .input(z.object({ companyId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        await removeCompanyMember(input.userId, input.companyId);
        return { success: true };
      }),

    createAndAddMember: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["owner", "manager"]).default("manager"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        // Check if user already exists with this email
        let existingUser = await getUserByEmail(input.email);
        let userId: number;
        if (existingUser) {
          userId = existingUser.id;
        } else {
          userId = await createUserManually({ name: input.name, email: input.email, role: "user" });
        }
        await addCompanyMember({ companyId: input.companyId, userId, role: input.role });
        return { success: true, created: !existingUser };
      }),
  }),

  // ─── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        return getCategoriesByCompany(input.companyId);
      }),

    publicList: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => getPublicCategories(input.companyId)),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        namePt: z.string().min(1),
        nameEs: z.string().optional(),
        nameEn: z.string().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const id = await createCategory({ ...input, active: true });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyId: z.number(),
        namePt: z.string().min(1).optional(),
        nameEs: z.string().optional(),
        nameEn: z.string().optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const cat = await getCategoryById(input.id);
        if (!cat || cat.companyId !== input.companyId) throw new TRPCError({ code: "NOT_FOUND" });
        const { id, companyId, ...data } = input;
        await updateCategory(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const cat = await getCategoryById(input.id);
        if (!cat || cat.companyId !== input.companyId) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ─── Menu Items ────────────────────────────────────────────────────────────
  menuItems: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        return getMenuItemsByCompany(input.companyId);
      }),

    publicList: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => getPublicMenuItems(input.companyId)),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        categoryId: z.number(),
        namePt: z.string().min(1),
        nameEs: z.string().optional(),
        nameEn: z.string().optional(),
        descriptionPt: z.string().optional(),
        descriptionEs: z.string().optional(),
        descriptionEn: z.string().optional(),
        priceBrl: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        imageUrls: z.string().optional(),       // JSON array de URLs para carrossel
        priceWhatsapp: z.boolean().default(false),
        sortOrder: z.number().default(0),
        isVegetarian: z.boolean().default(false),
        containsGluten: z.boolean().default(false),
        containsLactose: z.boolean().default(false),
        isSpicy: z.boolean().default(false),
        chefRecommended: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const id = await createMenuItem({ ...input, available: true });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyId: z.number(),
        categoryId: z.number().optional(),
        namePt: z.string().min(1).optional(),
        nameEs: z.string().optional(),
        nameEn: z.string().optional(),
        descriptionPt: z.string().optional(),
        descriptionEs: z.string().optional(),
        descriptionEn: z.string().optional(),
        priceBrl: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        imageUrls: z.string().optional(),
        priceWhatsapp: z.boolean().optional(),
        available: z.boolean().optional(),
        sortOrder: z.number().optional(),
        isVegetarian: z.boolean().optional(),
        containsGluten: z.boolean().optional(),
        containsLactose: z.boolean().optional(),
        isSpicy: z.boolean().optional(),
        chefRecommended: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const item = await getMenuItemById(input.id);
        if (!item || item.companyId !== input.companyId) throw new TRPCError({ code: "NOT_FOUND" });
        const { id, companyId, ...data } = input;
        await updateMenuItem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const item = await getMenuItemById(input.id);
        if (!item || item.companyId !== input.companyId) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteMenuItem(input.id);
        return { success: true };
      }),

    toggleAvailability: protectedProcedure
      .input(z.object({ id: z.number(), companyId: z.number(), available: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const item = await getMenuItemById(input.id);
        if (!item || item.companyId !== input.companyId) throw new TRPCError({ code: "NOT_FOUND" });
        await updateMenuItem(input.id, { available: input.available });
        return { success: true };
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        fileName: z.string().max(255),
        contentType: z.string(),
        base64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        validateImageUpload(input.contentType, input.base64);
        const safeExt: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
        const ext = safeExt[input.contentType.toLowerCase()] ?? "jpg";
        const key = `menu-images/${input.companyId}/${randomSuffix()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),

    removeImage: protectedProcedure
      .input(z.object({ id: z.number(), companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const item = await getMenuItemById(input.id);
        if (!item || item.companyId !== input.companyId) throw new TRPCError({ code: "NOT_FOUND" });
        await updateMenuItem(input.id, { imageUrl: null, imageKey: null });
        return { success: true };
      }),
    translateAll: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        const items = await getMenuItemsByCompany(input.companyId);
        const cats = await getCategoriesByCompany(input.companyId);
        let translated = 0;

        for (const cat of cats) {
          const needEs = !cat.nameEs;
          const needEn = !cat.nameEn;
          if (!needEs && !needEn) continue;
          const updates: Record<string, string> = {};
          if (needEs) updates.nameEs = await translateText(cat.namePt, "es");
          if (needEn) updates.nameEn = await translateText(cat.namePt, "en");
          await updateCategory(cat.id, updates);
          translated++;
          await sleep(200);
        }

        for (const item of items) {
          const updates: Record<string, string> = {};
          if (!item.nameEs) { updates.nameEs = await translateText(item.namePt, "es"); await sleep(200); }
          if (!item.nameEn) { updates.nameEn = await translateText(item.namePt, "en"); await sleep(200); }
          if (item.descriptionPt && !item.descriptionEs) { updates.descriptionEs = await translateText(item.descriptionPt, "es"); await sleep(200); }
          if (item.descriptionPt && !item.descriptionEn) { updates.descriptionEn = await translateText(item.descriptionPt, "en"); await sleep(200); }
          if (Object.keys(updates).length > 0) {
            await updateMenuItem(item.id, updates);
            translated++;
          }
        }

        return { translated };
      }),
  }),

  // ─── Reviews ───────────────────────────────────────────────────────────────
  reviews: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        return getReviewsByCompany(input.companyId);
      }),

    submit: publicProcedure
      .input(z.object({
        companyId: z.number(),
        type: z.enum(["review", "suggestion", "complaint"]).default("review"),
        rating: z.number().min(1).max(5).optional(),
        name: z.string().optional(),
        message: z.string().min(1).max(1000),
      }))
      .mutation(async ({ input }) => {
        const id = await createReview(input);
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);
        await deleteReview(input.id);
        return { success: true };
      }),
  }),

  // ─── Smart Import (AI) ─────────────────────────────────────────────────────
  import: router({
    /**
     * Receives a base64-encoded PDF or image, sends it to the LLM vision model,
     * and returns a structured preview of categories + items extracted.
     * The user reviews the result before confirming the actual import.
     */
    analyze: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        fileName: z.string(),
        contentType: z.string(), // image/* or application/pdf
        base64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);

        // Upload the file to S3 so the LLM can access it via URL
        const ext = input.fileName.split(".").pop() ?? "pdf";
        const key = `imports/${input.companyId}/${randomSuffix()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url: fileUrl } = await storagePut(key, buffer, input.contentType);

        const isPdf = input.contentType === "application/pdf";
        const { invokeLLM } = await import("./_core/llm");

        const systemPrompt = `You are a restaurant menu extraction assistant.
Analyze the provided menu document and extract ALL items into a structured JSON.
Return ONLY valid JSON, no markdown, no explanation.

JSON format:
{
  "categories": [
    {
      "namePt": "string (in Portuguese)",
      "items": [
        {
          "namePt": "string",
          "descriptionPt": "string or null",
          "priceBrl": "string (numeric, e.g. '29.90') or null"
        }
      ]
    }
  ]
}

Rules:
- Extract ALL categories and ALL items visible in the menu
- Keep names in the original language of the document; if not Portuguese, translate to Portuguese
- For prices, extract numeric value only (no currency symbols)
- If a price is not visible, use null
- If a description is not visible, use null
- Group items under their correct category`;

        const userContent = isPdf
          ? [
              { type: "text" as const, text: "Extract all menu items from this PDF menu document." },
              { type: "file_url" as const, file_url: { url: fileUrl, mime_type: "application/pdf" as const } },
            ]
          : [
              { type: "text" as const, text: "Extract all menu items from this menu image." },
              { type: "image_url" as const, image_url: { url: fileUrl } },
            ];

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "menu_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        namePt: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              namePt: { type: "string" },
                              descriptionPt: { type: ["string", "null"] },
                              priceBrl: { type: ["string", "null"] },
                            },
                            required: ["namePt", "descriptionPt", "priceBrl"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["namePt", "items"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["categories"],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as {
          categories: Array<{
            namePt: string;
            items: Array<{ namePt: string; descriptionPt: string | null; priceBrl: string | null }>;
          }>;
        };

        return {
          fileUrl,
          fileKey: key,
          categories: parsed.categories ?? [],
        };
      }),

    /**
     * Confirms the import: creates categories and items in the database.
     */
    confirm: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        categories: z.array(z.object({
          namePt: z.string().min(1),
          nameEs: z.string().optional(),
          nameEn: z.string().optional(),
          items: z.array(z.object({
            namePt: z.string().min(1),
            nameEs: z.string().optional(),
            nameEn: z.string().optional(),
            descriptionPt: z.string().optional(),
            descriptionEs: z.string().optional(),
            descriptionEn: z.string().optional(),
            priceBrl: z.string().default("0.00"),
          })),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertCompanyAccess(ctx.user.id, input.companyId, ctx.user.role);

        let totalCategories = 0;
        let totalItems = 0;

        for (let catIndex = 0; catIndex < input.categories.length; catIndex++) {
          const cat = input.categories[catIndex]!;
          const categoryId = await createCategory({
            companyId: input.companyId,
            namePt: cat.namePt,
            nameEs: cat.nameEs ?? null,
            nameEn: cat.nameEn ?? null,
            sortOrder: catIndex + 1,
            active: true,
          });
          totalCategories++;

          for (let itemIndex = 0; itemIndex < cat.items.length; itemIndex++) {
            const item = cat.items[itemIndex]!;
            await createMenuItem({
              companyId: input.companyId,
              categoryId,
              namePt: item.namePt,
              nameEs: item.nameEs ?? null,
              nameEn: item.nameEn ?? null,
              descriptionPt: item.descriptionPt ?? null,
              descriptionEs: item.descriptionEs ?? null,
              descriptionEn: item.descriptionEn ?? null,
              priceBrl: item.priceBrl || "0.00",
              sortOrder: itemIndex + 1,
              available: true,
            });
            totalItems++;
          }
        }

        return { totalCategories, totalItems };
      }),
  }),
});

export type AppRouter = typeof appRouter;
