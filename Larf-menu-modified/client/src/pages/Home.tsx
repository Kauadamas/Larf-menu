// client/src/pages/Home.tsx
// Substitui o Home.tsx atual — landing page de vendas do Larf
// Stack: React 19 + wouter + lucide-react + Tailwind CSS 4

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  ChefHat,
  QrCode,
  Globe,
  BarChart3,
  Zap,
  Shield,
  Check,
  Menu,
  X,
  ArrowRight,
  Star,
  FileText,
  Users,
  Palette,
} from "lucide-react";

// ─── Dados ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    slug: "basic",
    name: "Básico",
    price: 79,
    desc: "Para quem está começando e precisa do essencial funcionando.",
    featured: false,
    cta: "Começar grátis",
    features: [
      "Cardápio digital com QR Code",
      "Até 2 usuários",
      "Gestão de pedidos (mesa + balcão)",
      "5 templates de cardápio",
      "Relatórios básicos",
      "Suporte por e-mail",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    price: 179,
    desc: "Para restaurantes em crescimento que precisam de controle total.",
    featured: true,
    cta: "Começar grátis",
    badge: "Mais popular",
    features: [
      "Tudo do Básico",
      "Usuários ilimitados",
      "Importação de cardápio com IA",
      "Subdomínio próprio (seurest.larfmenu.com.br)",
      "Tradução automática PT/ES/EN",
      "Financeiro + DRE",
      "Suporte prioritário via chat",
    ],
  },
  {
    slug: "network",
    name: "Rede",
    price: 349,
    desc: "Para redes, franquias e dark kitchens com múltiplas unidades.",
    featured: false,
    cta: "Falar com vendas",
    features: [
      "Tudo do Pro",
      "Até 5 unidades incluídas",
      "Painel consolidado de rede",
      "API aberta + webhooks",
      "Gerente de conta dedicado",
      "SLA 99,9% garantido",
    ],
  },
];

const FEATURES = [
  {
    icon: QrCode,
    title: "Cardápio com QR Code",
    desc: "Seus clientes acessam o cardápio pelo celular sem instalar nada. Atualização em tempo real.",
  },
  {
    icon: Globe,
    title: "Trilíngue automático",
    desc: "Tradução PT/ES/EN automática — perfeito para regiões turísticas e clientes estrangeiros.",
  },
  {
    icon: Zap,
    title: "Importação com IA",
    desc: "Envie uma foto ou PDF do seu cardápio físico. A IA cria todos os itens em segundos.",
  },
  {
    icon: Palette,
    title: "5 templates",
    desc: "Classic, Dark, Minimal, Magazine e Street Food. Personalize cores e logotipo.",
  },
  {
    icon: Users,
    title: "Multi-usuário",
    desc: "Garçom, caixa, gerente e administrador com permissões isoladas por empresa.",
  },
  {
    icon: BarChart3,
    title: "Subdomínio próprio",
    desc: "Cada restaurante acessa pelo slug dele: seurestaurante.larfmenu.com.br",
  },
];

const STEPS = [
  { n: "01", title: "Crie sua conta", desc: "Cadastro por e-mail, sem cartão. Ativação automática em segundos." },
  { n: "02", title: "Monte seu cardápio", desc: "Importe do PDF ou cadastre manualmente. Fotos, preços e descrições em minutos." },
  { n: "03", title: "Compartilhe o QR Code", desc: "Cole nas mesas ou envie no WhatsApp. Seus clientes pedem direto no celular." },
  { n: "04", title: "Venda e cresça", desc: "Acompanhe tudo pelo painel. Ajuste preços e cardápio quando quiser." },
];

const FAQS = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. O trial de 14 dias é completamente gratuito e sem necessidade de cartão. Só pedimos seus dados de cobrança quando você decidir assinar.",
  },
  {
    q: "Posso pagar com boleto ou PIX?",
    a: "Sim! Aceitamos boleto bancário, PIX e cartão de crédito. O PIX recorrente já está disponível — você autoriza uma vez e esquece.",
  },
  {
    q: "Como funciona a tradução automática?",
    a: "Ao cadastrar um item no painel, clique em 'Traduzir'. O sistema usa múltiplas APIs com fallback automático para gerar versões em espanhol e inglês instantaneamente.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa e sem burocracia. Cancele pelo painel com um clique. Seus dados ficam disponíveis por 90 dias após o cancelamento para exportação.",
  },
  {
    q: "O Larf está em conformidade com a LGPD?",
    a: "Sim. Tratamos os dados como controladores/operadores, seguindo integralmente a Lei Geral de Proteção de Dados. Consulte nossa Política de Privacidade completa.",
  },
];

// ─── Componentes ──────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-muted/30 transition-colors"
      >
        <span className="font-medium text-foreground">{q}</span>
        <span className="text-primary shrink-0 text-xl transition-transform" style={{ transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: typeof PLANS[0] }) {
  const [, navigate] = useLocation();
  return (
    <div
      className={`relative rounded-2xl border p-8 flex flex-col transition-all hover:-translate-y-1 ${
        plan.featured
          ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
          {plan.badge}
        </div>
      )}
      <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${plan.featured ? "opacity-70" : "text-muted-foreground"}`}>
        {plan.name}
      </div>
      <div className="flex items-end gap-1 mb-2">
        <span className="text-2xl font-semibold">R$</span>
        <span className="text-6xl font-black leading-none tracking-tight">{plan.price}</span>
        <span className={`text-base mb-2 ${plan.featured ? "opacity-70" : "text-muted-foreground"}`}>/mês</span>
      </div>
      <p className={`text-sm mb-6 ${plan.featured ? "opacity-75" : "text-muted-foreground"}`}>{plan.desc}</p>
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-sm items-start">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? "opacity-80" : "text-primary"}`} />
            <span className={plan.featured ? "opacity-90" : "text-foreground"}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate(plan.slug === "network" ? "/contact" : "/register")}
        className={`w-full py-3 rounded-xl font-bold text-base transition-all hover:opacity-90 hover:-translate-y-0.5 ${
          plan.featured
            ? "bg-background text-primary"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const observerTargets = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => {
              (e.target as HTMLElement).style.opacity = "1";
              (e.target as HTMLElement).style.transform = "translateY(0)";
            }, i * 80);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-black text-xl">
            <ChefHat className="w-6 h-6 text-primary" />
            <span>Larf<span className="text-primary">.</span></span>
          </a>
          <ul className="hidden md:flex gap-8">
            {[["#features", "Funcionalidades"], ["#pricing", "Preços"], ["#faq", "FAQ"], ["/lgpd", "LGPD"]].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/admin")}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Painel Admin
              </button>
            ) : (
              <>
                <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Entrar
                </a>
                <a
                  href="/register"
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Começar grátis
                </a>
              </>
            )}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-4 flex flex-col gap-4">
            {[["#features", "Funcionalidades"], ["#pricing", "Preços"], ["#faq", "FAQ"], ["/lgpd", "LGPD"], ["/login", "Entrar"]].map(
              ([href, label]) => (
                <a key={href} href={href} className="text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                  {label}
                </a>
              )
            )}
            <a
              href="/register"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold text-center"
              onClick={() => setMobileOpen(false)}
            >
              Começar grátis
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        {/* Glow de fundo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklch, var(--color-primary) 15%, transparent), transparent)",
          }}
        />
        <div data-reveal>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Agora com PIX recorrente via Asaas
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.0] tracking-tight max-w-4xl mx-auto mb-6">
            Cardápio digital que
            <br />
            <span className="text-primary">realmente vende</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 font-light leading-relaxed">
            QR Code, tradução automática e importação com IA — tudo pronto em uma tarde. Sem taxa de setup, sem fidelidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/25"
            >
              Testar grátis por 14 dias
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-border px-8 py-4 rounded-xl font-medium text-base hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              Ver funcionalidades
            </a>
          </div>
        </div>

        {/* Stats */}
        <div data-reveal className="flex flex-wrap justify-center gap-12 mt-20">
          {[
            ["500+", "restaurantes ativos"],
            ["R$ 0", "taxa de setup"],
            ["14 dias", "trial sem cartão"],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-black text-foreground tracking-tight">{num}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Funcionalidades</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Tudo que você precisa,<br />sem o que não precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-md font-light">
              Desenvolvido para o mercado brasileiro: boleto, PIX, tradução trilíngue e cardápio adaptado ao seu negócio.
            </p>
          </div>
          <div
            data-reveal
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-border rounded-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border"
            style={{ gridAutoRows: "1fr" }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`p-8 hover:bg-muted/30 transition-colors ${
                  i > 0 && i % 3 !== 0 ? "" : ""
                } ${i >= 3 ? "border-t border-border" : ""}`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Como funciona</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Pronto em menos<br />de uma tarde
            </h2>
          </div>
          <div data-reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div
                  className="text-7xl font-black leading-none mb-4 tracking-tighter"
                  style={{ color: "color-mix(in oklch, var(--color-primary) 12%, transparent)" }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-lg mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Preços</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Simples, justo e transparente
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto font-light">
              Sem taxa de setup, sem fidelidade. Cancele quando quiser — aceita boleto, PIX ou cartão.
            </p>
          </div>
          <div data-reveal className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((p) => (
              <PlanCard key={p.slug} plan={p} />
            ))}
          </div>
          <p data-reveal className="text-center text-sm text-muted-foreground mt-8">
            Todos os planos incluem 14 dias grátis. Pagamento via PIX, boleto ou cartão de crédito.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <div data-reveal className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">FAQ</div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Perguntas frequentes
            </h2>
          </div>
          <div data-reveal className="flex flex-col gap-2">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="py-20 px-6 bg-primary text-primary-foreground text-center">
        <div data-reveal className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Seu restaurante merece<br />tecnologia de verdade
          </h2>
          <p className="text-lg opacity-75 mb-8">14 dias grátis, sem cartão, sem fidelidade.</p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-background text-primary px-8 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
          >
            Criar minha conta grátis
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-background border-t border-border px-6 pt-14 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-black text-xl mb-3">
                <ChefHat className="w-5 h-5 text-primary" />
                <span>Larf<span className="text-primary">.</span></span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                Cardápio digital para restaurantes brasileiros. Simples e sem burocracia.
              </p>
            </div>
            {[
              {
                label: "Produto",
                links: [["#features", "Funcionalidades"], ["#pricing", "Preços"], ["/changelog", "Novidades"]],
              },
              {
                label: "Empresa",
                links: [["/about", "Sobre"], ["/blog", "Blog"], ["/contact", "Contato"]],
              },
              {
                label: "Legal",
                links: [["/lgpd", "Política de Privacidade"], ["/termos", "Termos de Uso"], ["/lgpd#cookies", "Cookies"]],
              },
            ].map((col) => (
              <div key={col.label}>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{col.label}</div>
                <ul className="flex flex-col gap-2">
                  {col.links.map(([href, label]) => (
                    <li key={href}>
                      <a href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-muted-foreground">© 2025 Larf Tecnologia LTDA — CNPJ 00.000.000/0001-00</span>
            <span className="text-xs text-muted-foreground">Feito com ☕ no Brasil 🇧🇷</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
