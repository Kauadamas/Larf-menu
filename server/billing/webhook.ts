import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { subscriptions as subsTable, invoices as invTable } from "../../drizzle/schema";

export const billingWebhook = express.Router();

billingWebhook.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const token = req.headers["asaas-access-token"];
    if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let event: {
      event: string;
      payment?: { id: string; customer: string; value: number; billingType: string; dueDate: string };
      subscription?: { id: string };
    };

    try {
      event = JSON.parse((req.body as Buffer).toString());
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB unavailable" });

    try {
      switch (event.event) {
        case "PAYMENT_RECEIVED":
        case "PAYMENT_CONFIRMED": {
          const p = event.payment!;
          const subRows = await db
            .select()
            .from(subsTable)
            .where(eq(subsTable.asaasCustomerId, p.customer))
            .limit(1);
          if (subRows.length === 0) break;
          const sub = subRows[0]!;

          const existing = await db
            .select()
            .from(invTable)
            .where(eq(invTable.asaasPaymentId, p.id))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(invTable).values({
              subscriptionId: sub.id,
              asaasPaymentId: p.id,
              amount: Math.round(p.value * 100),
              status: "paid",
              dueDate: new Date(p.dueDate),
              paidAt: new Date(),
              paymentMethod: p.billingType,
            } as any);
          } else {
            await db
              .update(invTable)
              .set({ status: "paid", paidAt: new Date(), paymentMethod: p.billingType } as any)
              .where(eq(invTable.id, existing[0]!.id));
          }

          await db
            .update(subsTable)
            .set({ status: "active", currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } as any)
            .where(eq(subsTable.id, sub.id));
          break;
        }

        case "PAYMENT_OVERDUE": {
          const p = event.payment!;
          const invRows = await db.select().from(invTable).where(eq(invTable.asaasPaymentId, p.id)).limit(1);
          if (invRows.length > 0) {
            await db.update(invTable).set({ status: "overdue" } as any).where(eq(invTable.id, invRows[0]!.id));
          }
          const subRows = await db.select().from(subsTable).where(eq(subsTable.asaasCustomerId, p.customer)).limit(1);
          if (subRows.length > 0) {
            await db.update(subsTable).set({ status: "past_due" } as any).where(eq(subsTable.id, subRows[0]!.id));
          }
          break;
        }

        case "SUBSCRIPTION_DELETED": {
          const s = event.subscription!;
          await db
            .update(subsTable)
            .set({ status: "cancelled", cancelledAt: new Date() } as any)
            .where(eq(subsTable.asaasSubId, s.id));
          break;
        }
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("[Asaas Webhook]", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);
