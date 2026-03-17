export type Lang = "pt" | "es" | "en";
export type CartItem = { id: number; name: string; priceBrl: number; qty: number; note?: string };

export const T = {
  pt: {
    items: "itens", unavailable: "Indisponível", addToCart: "Adicionar",
    cart: "Meu Pedido", total: "Total", sendWA: "Enviar pedido pelo WhatsApp",
    payment: "Pagar online:", close: "Fechar", search: "Buscar",
    chefRecommends: "Mais Pedidos", vegetarian: "Vegetariano", spicy: "Picante",
    containsGluten: "Contém Glúten", containsLactose: "Contém Lactose",
    note: "Observação (opcional)", translating: "Traduzindo...",
  },
  es: {
    items: "ítems", unavailable: "No disponible", addToCart: "Agregar",
    cart: "Mi Pedido", total: "Total", sendWA: "Enviar pedido por WhatsApp",
    payment: "Pagar en línea:", close: "Cerrar", search: "Buscar",
    chefRecommends: "Más Pedidos", vegetarian: "Vegetariano", spicy: "Picante",
    containsGluten: "Contiene Gluten", containsLactose: "Contiene Lactosa",
    note: "Observación (opcional)", translating: "Traduciendo...",
  },
  en: {
    items: "items", unavailable: "Unavailable", addToCart: "Add",
    cart: "My Order", total: "Total", sendWA: "Send order via WhatsApp",
    payment: "Pay online:", close: "Close", search: "Search",
    chefRecommends: "Most Ordered", vegetarian: "Vegetarian", spicy: "Spicy",
    containsGluten: "Contains Gluten", containsLactose: "Contains Lactose",
    note: "Note (optional)", translating: "Translating...",
  },
};

export function getName(item: any, l: Lang, ov?: Record<string, string>) {
  if (ov && ov[`name_${item.id}`]) return ov[`name_${item.id}`];
  return (l === "es" && item.nameEs) ? item.nameEs : (l === "en" && item.nameEn) ? item.nameEn : item.namePt ?? "";
}
export function getDesc(item: any, l: Lang, ov?: Record<string, string>) {
  if (ov && ov[`desc_${item.id}`]) return ov[`desc_${item.id}`];
  return (l === "es" && item.descriptionEs) ? item.descriptionEs : (l === "en" && item.descriptionEn) ? item.descriptionEn : item.descriptionPt ?? "";
}
export function getCatName(c: any, l: Lang, ov?: Record<string, string>) {
  if (ov && ov[`cat_${c.id}`]) return ov[`cat_${c.id}`];
  return (l === "es" && c.nameEs) ? c.nameEs : (l === "en" && c.nameEn) ? c.nameEn : c.namePt ?? "";
}
export function resolveColor(theme?: string | null): string {
  if (!theme) return "#e85d04";
  if (theme.startsWith("#") || theme.startsWith("rgb")) return theme;
  const map: Record<string, string> = { orange: "#f97316", green: "#16a34a", blue: "#2563eb", purple: "#7c3aed", red: "#dc2626", teal: "#0d9488" };
  return map[theme] ?? "#e85d04";
}
export function checkIsOpen(businessHours: any): boolean | null {
  if (!businessHours) return null;
  try {
    const hours = typeof businessHours === "string" ? JSON.parse(businessHours) : businessHours;
    const now = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = dayNames[now.getDay()];
    const todayHours = hours[today];
    if (!todayHours || !todayHours.enabled) return false;
    const [openH, openM] = todayHours.open.split(":").map(Number);
    const [closeH, closeM] = todayHours.close.split(":").map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  } catch { return null; }
}

export interface TemplateProps {
  company: any;
  lang: Lang;
  translationOverrides: Record<string, string>;
  isTranslating: boolean;
  handleSetLang: (l: Lang) => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (item: any) => void;
  removeFromCart: (id: number) => void;
  updateQty: (id: number, delta: number) => void;
  cartCount: number;
  cartTotal: number;
  sendOrder: () => void;
  search: string;
  setSearch: (v: string) => void;
  filteredItems: any[];
  catsWithItems: any[];
  chefItems: any[];
  primary: string;
  fmtAllCurrencies: (p: any) => { brl: string; usd: string; eur: string } | "";
  isOpen: boolean | null;
  carouselImages: string[];
}
