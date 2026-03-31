import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { TemplateProps, CartItem, Lang, getName, getDesc, T } from "./types";

// ─── Dietary Badges ──────────────────────────────────────────────────────────
export function DietaryBadges({ item, t, muted }: { item: any; t: typeof T["pt"]; muted: string }) {
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

// ─── Item Card (shared, full-featured) ───────────────────────────────────────
export function SharedItemCard({
  item, lang, primary, surface, border, textColor, muted,
  fmtAllCurrencies, onAdd, t, isChefRecommended, overrides,
  imageRight = false,
}: {
  item: any;
  lang: Lang;
  primary: string;
  surface: string;
  border: string;
  textColor: string;
  muted: string;
  fmtAllCurrencies: TemplateProps["fmtAllCurrencies"];
  onAdd: () => void;
  t: typeof T["pt"];
  isChefRecommended?: boolean;
  overrides?: Record<string, string>;
  imageRight?: boolean;
}) {
  const name = getName(item, lang, overrides);
  const desc = getDesc(item, lang, overrides);
  const prices = fmtAllCurrencies(item.priceBrl);
  const isWhatsappPrice = !!(item as any).priceWhatsapp;

  // Monta lista de imagens para o carrossel
  const extraImages: string[] = (() => {
    try { return JSON.parse((item as any).imageUrls ?? "[]"); } catch { return []; }
  })();
  const allImages = [
    ...(item.imageUrl ? [item.imageUrl] : []),
    ...extraImages.filter((u: string) => u && u !== item.imageUrl),
  ];

  const [imgIdx, setImgIdx] = useState(0);

  const imageEl = allImages.length > 0 ? (
    <div className="flex-shrink-0 w-[72px] h-[72px] relative">
      <img
        src={allImages[imgIdx]}
        alt={name}
        className="w-full h-full rounded-xl object-cover"
      />
      {allImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + allImages.length) % allImages.length); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-white text-xs"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % allImages.length); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-white text-xs"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >›</button>
          {/* dots */}
          <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5">
            {allImages.map((_, i) => (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  ) : null;

  return (
    <div
      className={`flex gap-3 p-3 rounded-2xl transition-shadow hover:shadow-md ${imageRight ? "flex-row-reverse" : ""}`}
      style={{
        backgroundColor: surface,
        border: `1px solid ${isChefRecommended ? "#f59e0b" : border}`,
        boxShadow: isChefRecommended ? "0 0 0 1px #f59e0b20" : undefined,
      }}
    >
      {imageEl}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: textColor }}>{name}</h3>
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
          {isWhatsappPrice ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ backgroundColor: "#25d36618", border: "1px solid #25d36640" }}>
              <MessageCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#25d366" }} />
              <span className="text-xs font-semibold" style={{ color: "#25d366" }}>
                {(t as any).priceWhatsapp ?? "Sob consulta"}
              </span>
            </div>
          ) : prices ? (
            <div>
              <p className="font-bold text-sm" style={{ color: primary }}>{prices.brl}</p>
              <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
            </div>
          ) : <span />}
          {item.available && !isWhatsappPrice && (
            <button
              onClick={onAdd}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: primary }}
            >+</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer (shared, full-featured) ─────────────────────────────────────
export function CartDrawer({
  cart, cartOpen, setCartOpen, removeFromCart, updateQty, cartTotal,
  sendOrder, company, primary, bg, surface, border, textColor, muted, t, lang,
}: {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  removeFromCart: (id: number) => void;
  updateQty: (id: number, delta: number) => void;
  cartTotal: number;
  sendOrder: () => void;
  company: any;
  primary: string;
  bg: string;
  surface: string;
  border: string;
  textColor: string;
  muted: string;
  t: typeof T["pt"];
  lang: Lang;
}) {
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: bg }}>
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <h2 className="font-bold text-lg" style={{ color: textColor }}>{t.cart}</h2>
        <button onClick={() => setCartOpen(false)}>
          <X className="h-5 w-5" style={{ color: muted }} />
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: muted }}>Seu pedido está vazio.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {cart.map(c => (
            <div key={c.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2" style={{ color: textColor }}>{c.name}</p>
                </div>
                <button onClick={() => removeFromCart(c.id)} className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#ef4444" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: primary }}>R$ {(c.priceBrl * c.qty).toFixed(2)}</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(c.id, -1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base"
                    style={{ backgroundColor: surface, color: textColor, border: `1px solid ${border}` }}
                  >−</button>
                  <span className="w-7 text-center font-bold text-sm" style={{ color: textColor }}>{c.qty}</span>
                  <button
                    onClick={() => updateQty(c.id, 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-base"
                    style={{ backgroundColor: primary }}
                  >+</button>
                </div>
              </div>
              <input
                value={notes[c.id] ?? c.note ?? ""}
                onChange={e => {
                  setNotes(prev => ({ ...prev, [c.id]: e.target.value }));
                  // propagate note to cart via updateQty trick — we use a side-channel via data attribute
                  // The parent manages cart state; we store note in local state and pass via sendOrder
                  // For simplicity, we update via a custom event
                  const ev = new CustomEvent("cart-note", { detail: { id: c.id, note: e.target.value } });
                  window.dispatchEvent(ev);
                }}
                placeholder={t.note}
                className="w-full text-xs px-3 py-1.5 rounded-lg outline-none"
                style={{ backgroundColor: bg, color: textColor, border: `1px solid ${border}` }}
              />
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="px-4 py-4" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex justify-between font-bold text-lg mb-4" style={{ color: textColor }}>
            <span>{t.total}</span>
            <span style={{ color: primary }}>R$ {cartTotal.toFixed(2)}</span>
          </div>

          {(company.paymentMercadoPago || company.paymentPagSeguro || company.paymentPicPay) && (
            <div className="space-y-2 mb-3">
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

          <button
            onClick={sendOrder}
            className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25d366" }}
          >
            <MessageCircle className="h-5 w-5" />
            {t.sendWA}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Cart FAB (floating action button) ───────────────────────────────────────
export function CartFAB({ cartCount, primary, onClick, cartEnabled = true }: { cartCount: number; primary: string; onClick: () => void; cartEnabled?: boolean }) {
  if (!cartEnabled) return null;
  return (
    <div className="fixed bottom-6 right-4 z-40">
      <button
        onClick={onClick}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative"
        style={{ backgroundColor: primary }}
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
