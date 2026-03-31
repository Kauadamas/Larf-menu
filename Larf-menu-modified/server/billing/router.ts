import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  plans as plansTable,
  subscriptions as subsTable,
  invoices as invoicesTable,
} from "../../drizzle/schema";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { upsertAsaasCustomer, createAsaasSubscription, cancelAsaasSubscription } from "./asaas";

export const billingRouter = router({
  // ─── Planos públicos ────────────────────────────────────────────────────────
  plans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(plansTable).where(eq(plansTable.active, true));
    return rows.map((p) => ({
      ...p,
      features: JSON.parse(p.features) as string[],
    }));
  }),

  // ─── Minha assinatura ───────────────────────────────────────────────────────
  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(subsTable)
      .where(eq(subsTable.userId, ctx.user.id))
      .limit(1);
    if (rows.length === 0) return null;
    const sub = rows[0]!;
    const planRows = await db.select().from(plansTable).where(eq(plansTable.id, sub.planId));
    return { ...sub, plan: planRows[0] ?? null };
  }),

  // ─── Iniciar checkout ───────────────────────────────────────────────────────
  checkout: protectedProcedure
    .input(z.object({
      planSlug: z.string(),
      billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
      cpfCnpj: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível." });

      const existing = await db
        .select()
        .from(subsTable)
        .where(eq(subsTable.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0 && ["trialing", "active"].includes(existing[0]!.status)) {
        throw new TRPCError({ code: "CONFLICT", message: "Você já possui uma assinatura ativa." });
      }

      const planRows = await db.select().from(plansTable).where(eq(plansTable.slug, input.planSlug));
      if (planRows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado." });
      const plan = planRows[0]!;

      const customer = await upsertAsaasCustomer({
        id: ctx.user.id,
        name: ctx.user.name,
        email: (ctx.user as any).email ?? null,
        cpfCnpj: input.cpfCnpj,
        phone: input.phone,
      });

      const trialEndsAt = new Date(Date.now() + plan.trialDays * 86400000);
      const nextDueDate = trialEndsAt.toISOString().split("T")[0]!;

      const asaasSub = await createAsaasSubscription({
        customerId: customer.id,
        billingType: input.billingType,
        valueReais: plan.priceMonthly / 100,
        nextDueDate,
        description: `Larf ${plan.name}`,
        externalRef: plan.slug,
      });

      await db.insert(subsTable).values({
        userId: ctx.user.id,
        planId: plan.id,
        asaasCustomerId: customer.id,
        asaasSubId: asaasSub.id,
        status: "trialing",
        trialEndsAt,
      } as any);

      return { trialEndsAt: nextDueDate, asaasSubId: asaasSub.id };
    }),

  // ─── Cancelar ───────────────────────────────────────────────────────────────
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(subsTable).where(eq(subsTable.userId, ctx.user.id)).limit(1);
    if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma assinatura encontrada." });
    const sub = rows[0]!;
    if (sub.asaasSubId) await cancelAsaasSubscription(sub.asaasSubId);
    await db.update(subsTable).set({ status: "cancelled", cancelledAt: new Date() } as any).where(eq(subsTable.id, sub.id));
    return { cancelled: true };
  }),
});
