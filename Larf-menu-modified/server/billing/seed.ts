import { getDb } from "../db";
import { plans } from "../../drizzle/schema";

const SEED_PLANS = [
  {
    slug: "basic",
    name: "Básico",
    priceMonthly: 7900,
    trialDays: 14,
    maxUsers: 2,
    maxUnits: 1,
    features: JSON.stringify([
      "Cardápio digital com QR Code",
      "Até 2 usuários",
      "Gestão de pedidos (mesa e balcão)",
      "5 templates de cardápio",
      "Relatórios básicos",
      "Suporte por e-mail",
    ]),
    active: true,
  },
  {
    slug: "pro",
    name: "Pro",
    priceMonthly: 17900,
    trialDays: 14,
    maxUsers: null,
    maxUnits: 1,
    features: JSON.stringify([
      "Tudo do Básico",
      "Usuários ilimitados",
      "Importação de cardápio com IA",
      "Subdomínio próprio (seurest.larfmenu.com.br)",
      "Tradução automática PT/ES/EN",
      "Financeiro + DRE",
      "Suporte prioritário via chat",
    ]),
    active: true,
  },
  {
    slug: "network",
    name: "Rede",
    priceMonthly: 34900,
    trialDays: 14,
    maxUsers: null,
    maxUnits: 5,
    features: JSON.stringify([
      "Tudo do Pro",
      "Até 5 unidades incluídas",
      "Painel consolidado de rede",
      "API aberta + webhooks",
      "Gerente de conta dedicado",
      "SLA 99,9% garantido",
    ]),
    active: true,
  },
];

async function seed() {
  const db = await getDb();
  if (!db) { console.error("DB não disponível"); process.exit(1); }
  for (const plan of SEED_PLANS) {
    await (db as any)
      .insert(plans)
      .values(plan)
      .onDuplicateKeyUpdate({ set: { priceMonthly: plan.priceMonthly, features: plan.features, active: plan.active } });
    console.log(`✅ Plano "${plan.name}" inserido`);
  }
  console.log("Seed concluído.");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
