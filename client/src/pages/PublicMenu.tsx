import { useState, useEffect, useRef, useMemo } from "react";
import TemplateDark from "./menu-templates/TemplateDark";
import TemplateMinimal from "./menu-templates/TemplateMinimal";
import TemplateMagazine from "./menu-templates/TemplateMagazine";
import TemplateStreet from "./menu-templates/TemplateStreet";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft, ChevronRight, MapPin, MessageCircle, Instagram, Facebook, Globe,
  Phone, Star, X, ChefHat, Search, UtensilsCrossed, 
} from "lucide-react";

type Lang = "pt" | "es" | "en";
type CartItem = { id: number; name: string; priceBrl: number; qty: number; note?: string };

function detectLang(): Lang {
  const l = (navigator.language || "pt").toLowerCase();
  if (l.startsWith("es")) return "es";
  if (l.startsWith("en")) return "en";
  return "pt";
}

const T = {
  pt: {
    items: "itens", unavailable: "Indisponível", addToCart: "Adicionar",
    cart: "Meu Pedido", total: "Total", sendWA: "Enviar pedido pelo WhatsApp",
    payment: "Pagar online:", close: "Fechar", search: "Buscar",
    chefRecommends: "Mais Pedidos", rating: "Avaliação", name: "Nome",
    message: "Mensagem", type: "Tipo", review: "Avaliação", suggestion: "Sugestão",
    complaint: "Reclamação", sendFeedback: "Enviar", sendWAFeedback: "Enviar pelo WhatsApp",
    thanks: "Obrigado pelo seu feedback!", googleReview: "Avaliar no Google",
    vegetarian: "Vegetariano", spicy: "Picante", containsGluten: "Contém Glúten",
    containsLactose: "Contém Lactose", note: "Observação (opcional)",
    translateMenu: "Traduzir cardápio", translating: "Traduzindo...",
  },
  es: {
    items: "ítems", unavailable: "No disponible", addToCart: "Agregar",
    cart: "Mi Pedido", total: "Total", sendWA: "Enviar pedido por WhatsApp",
    payment: "Pagar en línea:", close: "Cerrar", search: "Buscar",
    chefRecommends: "Más Pedidos", rating: "Calificación", name: "Nombre",
    message: "Mensaje", type: "Tipo", review: "Reseña", suggestion: "Sugerencia",
    complaint: "Queja", sendFeedback: "Enviar", sendWAFeedback: "Enviar por WhatsApp",
    thanks: "¡Gracias por tu opinión!", googleReview: "Reseñar en Google",
    vegetarian: "Vegetariano", spicy: "Picante", containsGluten: "Contiene Gluten",
    containsLactose: "Contiene Lactosa", note: "Observación (opcional)",
    translateMenu: "Traducir menú", translating: "Traduciendo...",
  },
  en: {
    items: "items", unavailable: "Unavailable", addToCart: "Add",
    cart: "My Order", total: "Total", sendWA: "Send order via WhatsApp",
    payment: "Pay online:", close: "Close", search: "Search",
    chefRecommends: "Most Ordered", rating: "Rating", name: "Name",
    message: "Message", type: "Type", review: "Review", suggestion: "Suggestion",
    complaint: "Complaint", sendFeedback: "Send", sendWAFeedback: "Send via WhatsApp",
    thanks: "Thank you for your feedback!", googleReview: "Review on Google",
    vegetarian: "Vegetarian", spicy: "Spicy", containsGluten: "Contains Gluten",
    containsLactose: "Contains Lactose", note: "Note (optional)",
    translateMenu: "Translate menu", translating: "Translating...",
  },
};

function getName(item: any, l: Lang, ov?: Record<string, string>) {
  if (ov && ov[`name_${item.id}`]) return ov[`name_${item.id}`];
  return (l === "es" && item.nameEs) ? item.nameEs : (l === "en" && item.nameEn) ? item.nameEn : item.namePt ?? "";
}
function getDesc(item: any, l: Lang, ov?: Record<string, string>) {
  if (ov && ov[`desc_${item.id}`]) return ov[`desc_${item.id}`];
  return (l === "es" && item.descriptionEs) ? item.descriptionEs : (l === "en" && item.descriptionEn) ? item.descriptionEn : item.descriptionPt ?? "";
}
function getCatName(c: any, l: Lang, ov?: Record<string, string>) {
  if (ov && ov[`cat_${c.id}`]) return ov[`cat_${c.id}`];
  return (l === "es" && c.nameEs) ? c.nameEs : (l === "en" && c.nameEn) ? c.nameEn : c.namePt ?? "";
}

function resolveColor(theme?: string | null): string {
  if (!theme) return "#e85d04";
  if (theme.startsWith("#") || theme.startsWith("rgb")) return theme;
  const map: Record<string, string> = { orange: "#f97316", green: "#16a34a", blue: "#2563eb", purple: "#7c3aed", red: "#dc2626", teal: "#0d9488" };
  return map[theme] ?? "#e85d04";
}

function checkIsOpen(businessHours: any): boolean | null {
  if (!businessHours) return null;
  try {
    const hours = typeof businessHours === "string" ? JSON.parse(businessHours) : businessHours;
    const now = new Date();
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const todayKey = dayKeys[now.getDay()];
    const todayHours = hours[todayKey];
    if (!todayHours) return null;
    if (todayHours.closed) return false;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    // Suporte a múltiplos intervalos
    if (Array.isArray(todayHours.intervals)) {
      return todayHours.intervals.some((iv: { open: string; close: string }) => {
        const [oh, om] = iv.open.split(":").map(Number);
        const [ch, cm] = iv.close.split(":").map(Number);
        const openMin = oh * 60 + om;
        // 00:00 como fechamento = meia-noite = fim do dia (1440 min)
        const closeMin = (ch === 0 && cm === 0) ? 24 * 60 : ch * 60 + cm;
        // Suporte a horários que cruzam meia-noite (ex: 22:00 – 02:00)
        if (closeMin < openMin) {
          return nowMinutes >= openMin || nowMinutes < closeMin;
        }
        return nowMinutes >= openMin && nowMinutes < closeMin;
      });
    }
    // Formato legado
    const isEnabled = todayHours.enabled !== undefined ? todayHours.enabled : !todayHours.closed;
    if (!isEnabled) return false;
    if (todayHours.open && todayHours.close) {
      const [oh, om] = todayHours.open.split(":").map(Number);
      const [ch, cm] = todayHours.close.split(":").map(Number);
      const openMin = oh * 60 + om;
      const closeMin = (ch === 0 && cm === 0) ? 24 * 60 : ch * 60 + cm;
      if (closeMin < openMin) return nowMinutes >= openMin || nowMinutes < closeMin;
      return nowMinutes >= openMin && nowMinutes < closeMin;
    }
    return null;
  } catch { return null; }
}

// Formata horários para exibição no cardápio público
function formatBusinessHours(businessHours: any): Array<{ day: string; text: string; closed: boolean }> | null {
  if (!businessHours) return null;
  try {
    const hours = typeof businessHours === "string" ? JSON.parse(businessHours) : businessHours;
    const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const dayLabels: Record<string, string> = {
      mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom",
    };
    return dayKeys.map((key) => {
      const d = hours[key];
      if (!d) return { day: dayLabels[key]!, text: "Fechado", closed: true };
      if (d.closed) return { day: dayLabels[key]!, text: "Fechado", closed: true };
      // múltiplos intervalos
      if (Array.isArray(d.intervals) && d.intervals.length > 0) {
        const text = d.intervals.map((iv: { open: string; close: string }) => `${iv.open}–${iv.close}`).join(" / ");
        return { day: dayLabels[key]!, text, closed: false };
      }
      // legado
      if (d.open && d.close) return { day: dayLabels[key]!, text: `${d.open}–${d.close}`, closed: false };
      return { day: dayLabels[key]!, text: "Fechado", closed: true };
    });
  } catch { return null; }
}

// ─── Banner Carousel Component ────────────────────────────────────────────────
function BannerCarousel({ images, primary }: { images: string[]; primary: string }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % images.length), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length]);

  if (images.length === 0) return null;

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <div className="relative overflow-hidden w-full" style={{ height: 200 }}>
      {images.map((url, i) => (
        <img key={i} src={url} alt={`Banner ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }} />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-12"
        style={{ background: `linear-gradient(to bottom, transparent, ${primary})` }} />
      {images.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <ChevronLeft className="h-3.5 w-3.5 text-white" />
          </button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <ChevronRight className="h-3.5 w-3.5 text-white" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{ width: i === idx ? 18 : 6, height: 6, backgroundColor: i === idx ? "white" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Dietary Badge ────────────────────────────────────────────────────────────
function DietaryBadges({ item, t, muted }: { item: any; t: typeof T["pt"]; muted: string }) {
  const labels: string[] = [];
  if (item.isVegetarian) labels.push(t.vegetarian);
  if (item.isSpicy) labels.push(t.spicy);
  if (item.containsGluten) labels.push(t.containsGluten);
  if (item.containsLactose) labels.push(t.containsLactose);
  if (labels.length === 0) return null;
  return (
    <p className="text-xs mt-0.5" style={{ color: muted }}>
      {labels.join(" · ")}
    </p>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, lang, primary, surface, border, text, muted, fmtAllCurrencies, onAdd, t, isChefRecommended, overrides, cartEnabled, companyWhatsapp }: {
  item: any; lang: Lang; primary: string; surface: string; border: string;
  text: string; muted: string;
  fmtAllCurrencies: (p: any) => { brl: string; usd: string; eur: string } | "";
  onAdd: () => void; t: typeof T["pt"]; isChefRecommended?: boolean;
  overrides?: Record<string, string>;
  cartEnabled?: boolean;
  companyWhatsapp?: string;
}) {
  const name = getName(item, lang, overrides);
  const desc = getDesc(item, lang, overrides);
  const prices = fmtAllCurrencies(item.priceBrl);

  return (
    <div className="flex gap-3 p-3 rounded-2xl transition-shadow hover:shadow-md"
      style={{
        backgroundColor: surface,
        border: `1px solid ${isChefRecommended ? "#f59e0b" : border}`,
        boxShadow: isChefRecommended ? "0 0 0 1px #f59e0b20" : undefined,
      }}>
      {item.imageUrl && (
        <div className="flex-shrink-0 w-[72px] h-[72px]">
          <img src={item.imageUrl} alt={name} className="w-full h-full rounded-xl object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: text }}>{name}</h3>
              {isChefRecommended && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: "#d97706" }}>
                  Mais pedido
                </span>
              )}
            </div>
            {!item.available && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 flex-shrink-0 font-medium">
                {t.unavailable}
              </span>
            )}
          </div>
          {desc && <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: muted }}>{desc}</p>}
          <DietaryBadges item={item} t={t} muted={muted} />
        </div>
        <div className="flex items-end justify-between mt-2">
          {item.priceWhatsapp ? (
            <div>
              <a
                href={`https://wa.me/${(companyWhatsapp ?? "").replace(/\D/g, "")}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                style={{ backgroundColor: "#25d36620", color: "#128c7e" }}>
                <MessageCircle className="h-3 w-3" />
                {lang === "en" ? "Ask on WhatsApp" : lang === "es" ? "Consultar por WhatsApp" : "Sob consulta"}
              </a>
            </div>
          ) : prices ? (
            <div>
              <p className="font-bold text-sm" style={{ color: primary }}>{prices.brl}</p>
              <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
            </div>
          ) : (
            <span />
          )}
          {item.available && cartEnabled !== false && !item.priceWhatsapp && (
            <button onClick={onAdd}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: primary }}>+</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BusinessHoursBar Component ───────────────────────────────────────────────
function BusinessHoursBar({ businessHours, isOpen, lang, surface, border, textColor, muted, primary }: {
  businessHours: any;
  isOpen: boolean | null;
  lang: string;
  surface: string;
  border: string;
  textColor: string;
  muted: string;
  primary: string;
}) {
  const [open, setOpen] = useState(false);
  const hoursData = formatBusinessHours(businessHours);
  if (!hoursData) return null;

  const dayOfWeek = new Date().getDay(); // 0=Dom, 1=Seg...
  const keyOrder = ["mon","tue","wed","thu","fri","sat","sun"];
  const todayKey = ["sun","mon","tue","wed","thu","fri","sat"][dayOfWeek];
  const todayIdx = keyOrder.indexOf(todayKey!);
  const today = hoursData[todayIdx >= 0 ? todayIdx : 0];

  return (
    <div style={{ backgroundColor: surface, borderBottom: `1px solid ${border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium" style={{ color: textColor }}>
            {today?.closed
              ? (lang === "en" ? "Closed today" : lang === "es" ? "Cerrado hoy" : "Fechado hoje")
              : (lang === "en" ? `Today: ${today?.text}` : lang === "es" ? `Hoy: ${today?.text}` : `Hoje: ${today?.text}`)}
          </span>
          {isOpen !== null && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: isOpen ? "#dcfce7" : "#fee2e2", color: isOpen ? "#16a34a" : "#dc2626" }}>
              {isOpen ? (lang === "en" ? "Open" : lang === "es" ? "Abierto" : "Aberto") : (lang === "en" ? "Closed" : lang === "es" ? "Cerrado" : "Fechado")}
            </span>
          )}
        </div>
        <svg className="w-3.5 h-3.5 flex-shrink-0 transition-transform" style={{ color: muted, transform: open ? "rotate(180deg)" : "none" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-1">
          {hoursData.map((d) => (
            <div key={d.day} className="flex items-center justify-between py-0.5">
              <span className="text-xs font-semibold w-8" style={{ color: muted }}>{d.day}</span>
              <span className="text-xs flex-1 text-right" style={{ color: d.closed ? "#dc2626" : textColor }}>
                {d.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PublicMenu() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const [lang, setLang] = useState<Lang>(detectLang);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  // dark mode removed
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rvType, setRvType] = useState<"review" | "suggestion" | "complaint">("review");
  const [rvName, setRvName] = useState("");
  const [rvMsg, setRvMsg] = useState("");
  const [rvRating, setRvRating] = useState(5);
  const [rvSent, setRvSent] = useState(false);
  const [translationOverrides, setTranslationOverrides] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const catBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});

  const { data: company, isLoading } = trpc.companies.getBySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: categories = [] } = trpc.categories.publicList.useQuery({ companyId: company?.id ?? 0 }, { enabled: !!company?.id });
  const { data: menuItems = [] } = trpc.menuItems.publicList.useQuery({ companyId: company?.id ?? 0 }, { enabled: !!company?.id });
  const { data: rates = { BRL: 1, USD: 0.19, EUR: 0.18 } } = trpc.currency.getRates.useQuery({ companyId: company?.id });
  const submitReview = trpc.reviews.submit.useMutation();
  const translatePublic = trpc.translation.translatePublic.useMutation();

  const primary = resolveColor(company?.colorTheme);
  const t = T[lang];
  const isOpen = checkIsOpen((company as any)?.businessHours);
  const cartEnabled = (company as any)?.cartEnabled !== false; // default true

  const carouselImages = useMemo<string[]>(() => {
    try {
      const imgs = JSON.parse((company as any)?.carouselImages ?? "[]");
      return Array.isArray(imgs) ? imgs : [];
    } catch { return []; }
  }, [company]);

  const r = rates as Record<string, number> & { manual?: boolean };
  const fmtAllCurrencies = (brl: string | number | null | undefined) => {
    if (!brl) return "";
    const n = parseFloat(String(brl));
    let usd: string, eur: string;
    if (r.manual) {
      // Taxa manual: usdRate = "quanto vale 1 USD em BRL", ex: 5.80
      // Então: USD = BRL / usdRate
      usd = (n / (r["USD"] ?? 5.5)).toFixed(2);
      eur = (n / (r["EUR"] ?? 6.0)).toFixed(2);
    } else {
      // Taxa automática: API retorna "1 BRL = X USD"
      usd = (n * (r["USD"] ?? 0.19)).toFixed(2);
      eur = (n * (r["EUR"] ?? 0.18)).toFixed(2);
    }
    return { brl: `R$ ${n.toFixed(2)}`, usd: `$ ${usd}`, eur: `€ ${eur}` };
  };

  const filteredItems = useMemo(() => {
    if (!search) return menuItems;
    const q = search.toLowerCase();
    return menuItems.filter((i: any) => getName(i, lang).toLowerCase().includes(q) || getDesc(i, lang).toLowerCase().includes(q));
  }, [menuItems, search, lang]);

  const catsWithItems = useMemo(() =>
    categories.filter((c: any) => c.active).map((c: any) => ({
      ...c,
      items: filteredItems.filter((i: any) => i.categoryId === c.id),
    })).filter((c: any) => c.items.length > 0),
    [categories, filteredItems]
  );

  const chefItems = useMemo(() =>
    menuItems.filter((i: any) => i.chefRecommended && i.available),
    [menuItems]
  );

  // Scroll spy
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const id = parseInt(e.target.getAttribute("data-cat-id") ?? "0");
          if (id) setActiveCat(id);
        }
      }
    }, { rootMargin: "-25% 0px -65% 0px" });
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [catsWithItems]);

  const scrollToCat = (id: number) => {
    setActiveCat(id);
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    const btn = catBarRef.current?.querySelector(`[data-btn="${id}"]`) as HTMLElement;
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const addToCart = (item: any) => {
    const price = parseFloat(String(item.priceBrl ?? "0"));
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: getName(item, lang), priceBrl: price, qty: 1 }];
    });
  };
  const changeQty = (id: number, d: number) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c));
  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.id !== id));
  const updateNote = (id: number, note: string) => setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c));
  const cartTotal = cart.reduce((s, c) => s + c.priceBrl * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const sendOrder = () => {
    if (!company?.whatsapp) return;
    const separator = "────────────────────";
    const lines = cart.map((c, i) => {
      const noteLine = c.note ? `\n   _Obs: ${c.note}_` : "";
      return `${i + 1}. ${c.qty}x *${c.name}* — R$ ${(c.priceBrl * c.qty).toFixed(2)}${noteLine}`;
    });
    const subtotal = cartTotal;
    const deliveryFee = company.deliveryEnabled ? parseFloat(company.deliveryFee ?? "0") : 0;
    const total = subtotal + deliveryFee;
    const deliveryLine = company.deliveryEnabled ? `\n*Taxa de entrega:* R$ ${deliveryFee.toFixed(2)}` : "";
    const msg = [
      `*NOVO PEDIDO — ${company.name}*`,
      separator,
      `*ITENS DO PEDIDO:*`,
      lines.join("\n"),
      separator,
      `*Subtotal:* R$ ${subtotal.toFixed(2)}${deliveryLine}`,
      `*TOTAL: R$ ${total.toFixed(2)}*`,
    ].join("\n");
    window.open(`https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendReviewWA = () => {
    if (!company?.whatsapp) return;
    const lbl = rvType === "review" ? "Avaliação" : rvType === "suggestion" ? "Sugestão" : "Reclamação";
    const msg = `${lbl}\n${rvName ? `Nome: ${rvName}\n` : ""}${rvType === "review" ? `Nota: ${rvRating}/5\n` : ""}Mensagem: ${rvMsg}`;
    window.open(`https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const submitRv = async () => {
    if (!company?.id || !rvMsg) return;
    await submitReview.mutateAsync({ companyId: company.id, type: rvType, name: rvName, rating: rvRating, message: rvMsg });
    setRvSent(true);
  };

  // Translate all menu items on-the-fly
  const handleTranslateAll = async () => {
    if (lang === "pt" || isTranslating) return;
    setIsTranslating(true);
    try {
      const fields: { key: string; text: string }[] = [];
      for (const item of menuItems) {
        const hasName = lang === "es" ? !!item.nameEs : !!item.nameEn;
        const hasDesc = lang === "es" ? !!item.descriptionEs : !!item.descriptionEn;
        if (!hasName && item.namePt) fields.push({ key: `name_${item.id}`, text: item.namePt });
        if (!hasDesc && item.descriptionPt) fields.push({ key: `desc_${item.id}`, text: item.descriptionPt });
      }
      for (const cat of categories) {
        const hasName = lang === "es" ? !!cat.nameEs : !!cat.nameEn;
        if (!hasName && cat.namePt) fields.push({ key: `cat_${cat.id}`, text: cat.namePt });
      }
      // Translate company description
      if (company?.description && !translationOverrides["company_desc"]) {
        fields.push({ key: "company_desc", text: company.description });
      }
      if (fields.length === 0) { setIsTranslating(false); return; }
      const chunkSize = 50;
      const allResults: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += chunkSize) {
        const chunk = fields.slice(i, i + chunkSize);
        const res = await translatePublic.mutateAsync({ fields: chunk, target: lang as "es" | "en" });
        Object.assign(allResults, res);
      }
      setTranslationOverrides(prev => ({ ...prev, ...allResults }));
    } catch (e) {
      console.error("Translation error", e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSetLang = async (l: Lang) => {
    setLang(l);
    if (l === "pt") {
      setTranslationOverrides({});
      return;
    }
    // Auto-translate items that don't have a saved translation
    setIsTranslating(true);
    try {
      const fields: { key: string; text: string }[] = [];
      for (const item of menuItems) {
        const hasName = l === "es" ? !!item.nameEs : !!item.nameEn;
        const hasDesc = l === "es" ? !!item.descriptionEs : !!item.descriptionEn;
        if (!hasName && item.namePt) fields.push({ key: `name_${item.id}`, text: item.namePt });
        if (!hasDesc && item.descriptionPt) fields.push({ key: `desc_${item.id}`, text: item.descriptionPt });
      }
      for (const cat of categories) {
        const hasName = l === "es" ? !!cat.nameEs : !!cat.nameEn;
        if (!hasName && cat.namePt) fields.push({ key: `cat_${cat.id}`, text: cat.namePt });
      }
      // Translate company description
      if (company?.description) {
        fields.push({ key: "company_desc", text: company.description });
      }
      if (fields.length > 0) {
        const chunkSize = 50;
        const allResults: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += chunkSize) {
          const chunk = fields.slice(i, i + chunkSize);
          const res = await translatePublic.mutateAsync({ fields: chunk, target: l as "es" | "en" });
          Object.assign(allResults, res);
        }
        setTranslationOverrides(allResults);
      }
    } catch (e) {
      console.error("Auto-translation error", e);
    } finally {
      setIsTranslating(false);
    }
  };

  // ─── Colors (light mode only) ──────────────────────────────────────────────
  const bg = "#f8fafc";
  const surface = "#ffffff";
  const border = "#e2e8f0";
  const muted = "#64748b";
  const text = "#0f172a";

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 animate-spin mx-auto mb-3" style={{ borderTopColor: primary }} />
        <p className="text-sm" style={{ color: muted }}>Carregando...</p>
      </div>
    </div>
  );

  // Build shared props for all templates
  const templateProps = {
    company, lang, translationOverrides, isTranslating, handleSetLang,
    cart, cartOpen, setCartOpen, addToCart,
    removeFromCart: removeItem,
    updateQty: changeQty,
    cartCount, cartTotal, sendOrder,
    search, setSearch: (v: string) => { setSearch(v); if (!v) setSearchOpen(false); },
    filteredItems, catsWithItems, chefItems, primary, fmtAllCurrencies, isOpen, carouselImages,
    cartEnabled,
  };

  if (!company) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
      <div className="text-center">
        <UtensilsCrossed className="h-14 w-14 mx-auto mb-3" style={{ color: muted }} />
        <h1 className="text-xl font-bold" style={{ color: text }}>Cardápio não encontrado</h1>
      </div>
    </div>
  );

  // Template routing
  const menuTemplate = (company as any).menuTemplate ?? "classic";
  if (menuTemplate === "dark") return <TemplateDark {...templateProps} />;
  if (menuTemplate === "minimal") return <TemplateMinimal {...templateProps} />;
  if (menuTemplate === "magazine") return <TemplateMagazine {...templateProps} />;
  if (menuTemplate === "street") return <TemplateStreet {...templateProps} />;

  return (
    <div style={{ backgroundColor: bg, color: text, minHeight: "100vh" }}>

      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <div className="relative">
        {carouselImages.length > 0 ? (
          <BannerCarousel images={carouselImages} primary={primary} />
        ) : (
          <div className="w-full" style={{ height: 120, background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)` }} />
        )}

        <div style={{ backgroundColor: primary }}>
          {/* Language + translate + dark mode controls */}
          <div className="flex items-center justify-between px-4 pt-2.5 pb-0 gap-2 flex-wrap">
            <div className="flex gap-1">
              {([
                {
                  code: "pt" as Lang, label: "PT",
                  flag: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="w-4 h-3 rounded-sm flex-shrink-0">
                      <rect width="8" height="14" fill="#009c3b"/>
                      <rect x="8" width="12" height="14" fill="#FEDD00"/>
                      <circle cx="8" cy="7" r="3.5" fill="#002776"/>
                      <path d="M4.5 7a3.5 3.5 0 0 0 3.5 3.5" stroke="white" strokeWidth="0.5" fill="none"/>
                      <ellipse cx="8" cy="7" rx="3.5" ry="2.2" fill="none" stroke="white" strokeWidth="0.4"/>
                    </svg>
                  ),
                },
                {
                  code: "es" as Lang, label: "ES",
                  flag: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="w-4 h-3 rounded-sm flex-shrink-0">
                      <rect width="20" height="14" fill="#c60b1e"/>
                      <rect y="3.5" width="20" height="7" fill="#ffc400"/>
                    </svg>
                  ),
                },
                {
                  code: "en" as Lang, label: "EN",
                  flag: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="w-4 h-3 rounded-sm flex-shrink-0">
                      <rect width="20" height="14" fill="#012169"/>
                      <path d="M0,0 L20,14 M20,0 L0,14" stroke="white" strokeWidth="2.8"/>
                      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#C8102E" strokeWidth="1.8"/>
                      <path d="M10,0 V14 M0,7 H20" stroke="white" strokeWidth="4.5"/>
                      <path d="M10,0 V14 M0,7 H20" stroke="#C8102E" strokeWidth="2.8"/>
                    </svg>
                  ),
                },
              ]).map(l => (
                <button key={l.code} onClick={() => handleSetLang(l.code)}
                  className="px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: lang === l.code ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.2)", color: lang === l.code ? primary : "white" }}>
                  {l.flag}
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
            {isTranslating && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />{t.translating}
              </span>
            )}

          </div>

          {/* Restaurant info row */}
          <div className="px-4 pt-3 pb-5 flex gap-4 items-center">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-xl"
                style={{ border: "3px solid rgba(255,255,255,0.5)", marginTop: -40 }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.3)", marginTop: -40 }}>
                <ChefHat className="h-9 w-9 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white font-bold text-xl leading-tight">{company.name}</h1>
                {isOpen !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: isOpen ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)", color: isOpen ? "#bbf7d0" : "#fecaca" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: isOpen ? "#4ade80" : "#f87171" }} />
                    {isOpen ? (lang === "en" ? "Open now" : lang === "es" ? "Abierto ahora" : "Aberto agora") : (lang === "en" ? "Closed" : lang === "es" ? "Cerrado" : "Fechado")}
                  </span>
                )}
              </div>
              {company.description && <p className="text-white/70 text-xs mt-1 line-clamp-2">{translationOverrides["company_desc"] || company.description}</p>}
              {company.address && (
                <p className="text-white/60 text-xs mt-1.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />{company.address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {company.whatsapp && (
                  <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <MessageCircle className="h-3.5 w-3.5 text-white" />
                  </a>
                )}
                {company.instagram && (
                  <a href={company.instagram} target="_blank" rel="noreferrer"
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Instagram className="h-3.5 w-3.5 text-white" />
                  </a>
                )}
                {company.facebook && (
                  <a href={company.facebook} target="_blank" rel="noreferrer"
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Facebook className="h-3.5 w-3.5 text-white" />
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer"
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Globe className="h-3.5 w-3.5 text-white" />
                  </a>
                )}
                {company.phone && (
                  <a href={`tel:${company.phone}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Phone className="h-3.5 w-3.5 text-white" />
                  </a>
                )}
                {(company as any).googleReviewsUrl && (
                  <a href={(company as any).googleReviewsUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "rgba(255,255,255,0.92)", color: primary }}>
                    <Star className="h-3 w-3" />Google
                  </a>
                )}
                <button onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  <Search className="h-3.5 w-3.5" />
                  {t.search}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HORÁRIOS DE FUNCIONAMENTO ────────────────────────────────────── */}
      <BusinessHoursBar
        businessHours={(company as any)?.businessHours}
        isOpen={isOpen}
        lang={lang}
        surface={surface}
        border={border}
        textColor={text}
        muted={muted}
        primary={primary}
      />

      {/* ── CATEGORY BAR ─────────────────────────────────────────────────── */}
      <div ref={catBarRef}
        className="sticky top-0 z-30 overflow-x-auto flex gap-2 px-4 py-3 scrollbar-hide"
        style={{ backgroundColor: surface, borderBottom: `1px solid ${border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        {catsWithItems.map((cat: any) => (
          <button key={cat.id} data-btn={cat.id}
            onClick={() => scrollToCat(cat.id)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: activeCat === cat.id ? primary : "transparent",
              color: activeCat === cat.id ? "white" : muted,
              border: `1.5px solid ${activeCat === cat.id ? primary : border}`,
            }}>
            {getCatName(cat, lang, translationOverrides)}
          </button>
        ))}
      </div>

      {/* ── MENU CONTENT ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-32">

        {/* Most Ordered Section */}
        {chefItems.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: "#f59e0b" }} />
              <h2 className="font-bold text-base" style={{ color: text }}>
                {t.chefRecommends}
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: border }} />
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
                {chefItems.length} {t.items}
              </span>
            </div>
            <div className="space-y-3">
              {chefItems.map((item: any) => (
                <ItemCard key={item.id} item={item} lang={lang} primary={primary}
                  surface={surface} border={border} text={text} muted={muted}
                  fmtAllCurrencies={fmtAllCurrencies} onAdd={() => addToCart(item)} t={t}
                  isChefRecommended overrides={translationOverrides} cartEnabled={cartEnabled}
                  companyWhatsapp={company.whatsapp ?? ""} />
              ))}
            </div>
          </section>
        )}

        {catsWithItems.length === 0 && (
          <div className="text-center py-16">
            <ChefHat className="h-12 w-12 mx-auto mb-3" style={{ color: muted }} />
            <p style={{ color: muted }}>Nenhum item disponível.</p>
          </div>
        )}

        {catsWithItems.map((cat: any) => (
          <section key={cat.id}
            ref={el => { sectionRefs.current[cat.id] = el; }}
            data-cat-id={cat.id}
            className="mb-10">
            <div className="flex items-center gap-3 mb-4 sticky top-[57px] z-20 py-2"
              style={{ backgroundColor: bg }}>
              <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: primary }} />
              <h2 className="font-bold text-base" style={{ color: text }}>{getCatName(cat, lang, translationOverrides)}</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: border }} />
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: primary + "18", color: primary }}>
                {cat.items.length} {t.items}
              </span>
            </div>
            <div className="space-y-3">
              {cat.items.map((item: any) => (
                <ItemCard key={item.id} item={item} lang={lang} primary={primary}
                  surface={surface} border={border} text={text} muted={muted}
                  fmtAllCurrencies={fmtAllCurrencies} onAdd={() => addToCart(item)} t={t}
                  overrides={translationOverrides} cartEnabled={cartEnabled}
                  companyWhatsapp={company.whatsapp ?? ""} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── FLOATING BUTTONS ─────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3 z-40">
        {/* Cart button — only shown when cartEnabled */}
        {cartEnabled && (
        <button onClick={() => setCartOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 relative"
          style={{ backgroundColor: primary }}>
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        )}
      </div>

      {/* ── SEARCH MODAL ─────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
              style={{ backgroundColor: surface }}>
              <Search className="h-5 w-5 flex-shrink-0" style={{ color: muted }} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t.search + "..."}
                className="flex-1 outline-none text-sm bg-transparent"
                style={{ color: text }} />
              <button onClick={() => { setSearch(""); setSearchOpen(false); }}>
                <X className="h-5 w-5" style={{ color: muted }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CART MODAL ───────────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setCartOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: surface }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ backgroundColor: surface, borderBottom: `1px solid ${border}` }}>
              <h3 className="font-bold text-lg" style={{ color: text }}>{t.cart}</h3>
              <button onClick={() => setCartOpen(false)}><X className="h-5 w-5" style={{ color: muted }} /></button>
            </div>
            {cart.length === 0 ? (
              <div className="p-10 text-center">
                <p style={{ color: muted }}>Seu pedido está vazio.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {cart.map(c => (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2" style={{ color: text }}>{c.name}</p>
                      </div>
                      <button onClick={() => removeItem(c.id)} className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#ef4444" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: primary }}>R$ {(c.priceBrl * c.qty).toFixed(2)}</p>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => changeQty(c.id, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base"
                          style={{ backgroundColor: "#f1f5f9", color: text }}>−</button>
                        <span className="w-7 text-center font-bold text-sm" style={{ color: text }}>{c.qty}</span>
                        <button onClick={() => changeQty(c.id, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-base"
                          style={{ backgroundColor: primary }}>+</button>
                      </div>
                    </div>
                    <input
                      value={c.note ?? ""}
                      onChange={e => updateNote(c.id, e.target.value)}
                      placeholder={t.note}
                      className="w-full text-xs px-3 py-1.5 rounded-lg outline-none"
                      style={{ backgroundColor: bg, color: text, border: `1px solid ${border}` }}
                    />
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2" style={{ color: text }}>
                  <span>{t.total}</span>
                  <span style={{ color: primary }}>R$ {cartTotal.toFixed(2)}</span>
                </div>
                {(company.paymentMercadoPago || company.paymentPagSeguro || company.paymentPicPay) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold" style={{ color: muted }}>{t.payment}</p>
                    <div className="flex flex-col gap-2">
                      {company.paymentMercadoPago && (
                        <a href={company.paymentMercadoPago} target="_blank" rel="noreferrer"
                          className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center text-sm"
                          style={{ backgroundColor: "#009ee3" }}>Mercado Pago</a>
                      )}
                      {company.paymentPagSeguro && (
                        <a href={company.paymentPagSeguro} target="_blank" rel="noreferrer"
                          className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center text-sm"
                          style={{ backgroundColor: "#00b1eb" }}>PagSeguro</a>
                      )}
                      {company.paymentPicPay && (
                        <a href={company.paymentPicPay} target="_blank" rel="noreferrer"
                          className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center text-sm"
                          style={{ backgroundColor: "#21c25e" }}>PicPay</a>
                      )}
                    </div>
                  </div>
                )}
                <button onClick={sendOrder}
                  className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25d366" }}>
                  <MessageCircle className="h-5 w-5" />
                  {t.sendWA}
                </button>
              </div>
            )}
          </div>
        </div>
      )}



    </div>
  );
}
