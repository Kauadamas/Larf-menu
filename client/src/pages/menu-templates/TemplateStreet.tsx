import { useState, useRef, useEffect } from "react";
import { ChefHat, MapPin, MessageCircle, Instagram, Facebook, Globe, Phone, Star, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { TemplateProps, getName, getDesc, getCatName, T } from "./types";
import { DietaryBadges, CartDrawer, CartFAB } from "./SharedComponents";

export default function TemplateStreet(props: TemplateProps) {
  const { company, lang, translationOverrides, isTranslating, handleSetLang,
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, cartCount, cartTotal,
    sendOrder, search, setSearch, filteredItems,
    catsWithItems, chefItems, primary, fmtAllCurrencies, isOpen, carouselImages, cartEnabled = true } = props;

  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = T[lang];

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    timerRef.current = setInterval(() => setHeroIdx(i => (i + 1) % carouselImages.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [carouselImages.length]);

  const bg = "#fffbf0";
  const border = "#fde68a";
  const muted = "#92400e";
  const textColor = "#1c1917";
  const surface = "#ffffff";
  const accent2 = "#fef3c7";

  const allCats = chefItems.length > 0
    ? [{ id: -1, namePt: t.chefRecommends, nameEs: "Más Pedidos", nameEn: "Most Ordered" }, ...catsWithItems]
    : catsWithItems;
  const currentCatId = activeCat ?? (allCats[0]?.id ?? null);
  const currentItems = currentCatId === -1 ? chefItems : (catsWithItems.find((c: any) => c.id === currentCatId)?.items ?? []);
  const displayItems = search ? filteredItems : currentItems;

  return (
    <div style={{ backgroundColor: bg, color: textColor, minHeight: "100vh" }}>
      {/* Colorful header */}
      <div className="relative px-4 pt-5 pb-6" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: "white", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: "white", transform: "translate(-30%, 30%)" }} />

        {/* Top row */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex gap-1">
            {(["pt", "es", "en"] as const).map(l => (
              <button key={l} onClick={() => handleSetLang(l)}
                className="px-2 py-0.5 rounded-full text-xs font-bold transition-all"
                style={{ backgroundColor: lang === l ? "white" : "rgba(255,255,255,0.2)", color: lang === l ? primary : "white" }}>
                {l.toUpperCase()}
              </button>
            ))}
            {isTranslating && <span className="text-xs px-2 py-0.5 rounded-full text-white/70">...</span>}
          </div>
          <button onClick={() => setSearchOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <Search className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Company info */}
        <div className="flex items-center gap-3 relative z-10">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0" style={{ border: "3px solid rgba(255,255,255,0.5)" }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <ChefHat className="h-8 w-8 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-xl text-white leading-tight">{company.name}</h1>
            {company.description && <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{translationOverrides["company_desc"] || company.description}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {isOpen !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: isOpen ? "#dcfce7" : "#fee2e2", color: isOpen ? "#16a34a" : "#dc2626" }}>
                  {isOpen ? (lang === "en" ? "Open" : lang === "es" ? "Abierto" : "Aberto") : (lang === "en" ? "Closed" : lang === "es" ? "Cerrado" : "Fechado")}
                </span>
              )}
              {company.address && <span className="text-xs text-white/70 flex items-center gap-1"><MapPin className="h-3 w-3" />{company.address}</span>}
            </div>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex gap-2 mt-3 relative z-10">
          {company.whatsapp && <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}><MessageCircle className="h-3.5 w-3.5 text-white" /></a>}
          {company.instagram && <a href={company.instagram} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}><Instagram className="h-3.5 w-3.5 text-white" /></a>}
          {company.facebook && <a href={company.facebook} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}><Facebook className="h-3.5 w-3.5 text-white" /></a>}
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}><Globe className="h-3.5 w-3.5 text-white" /></a>}
          {company.phone && <a href={`tel:${company.phone}`} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}><Phone className="h-3.5 w-3.5 text-white" /></a>}
          {(company as any).googleReviewsUrl && <a href={(company as any).googleReviewsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: primary }}><Star className="h-3 w-3" />Google</a>}
        </div>
      </div>

      {/* Category chips */}
      {!search && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide" style={{ backgroundColor: accent2, borderBottom: `2px solid ${border}` }}>
          {allCats.map((cat: any) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{
                backgroundColor: currentCatId === cat.id ? primary : surface,
                color: currentCatId === cat.id ? "white" : muted,
                border: `2px solid ${currentCatId === cat.id ? primary : border}`,
              }}>
              {getCatName(cat, lang, translationOverrides)}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="px-4 py-4 pb-32 space-y-3">
        {displayItems.map((item: any) => {
          const name = getName(item, lang, translationOverrides);
          const desc = getDesc(item, lang, translationOverrides);
          const prices = fmtAllCurrencies(item.priceBrl);
          return (
            <div key={item.id} className="flex gap-3 p-3 rounded-3xl shadow-sm"
              style={{ backgroundColor: surface, border: `2px solid ${border}`, opacity: item.available ? 1 : 0.6 }}>
              {item.imageUrl && <img src={item.imageUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-bold text-sm line-clamp-2 flex-1" style={{ color: textColor }}>{name}</p>
                  {!item.available && <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold bg-red-50 text-red-500">{t.unavailable}</span>}
                </div>
                {desc && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: muted }}>{desc}</p>}
                <DietaryBadges item={item} t={t} muted={muted} />
                <div className="flex items-end justify-between mt-1.5">
                  {prices ? (
                    <div>
                      <p className="font-black text-base" style={{ color: primary }}>{prices.brl}</p>
                      <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
                    </div>
                  ) : <span />}
                  {item.available && cartEnabled && (
                    <button onClick={() => addToCart(item)} className="px-3 py-1.5 rounded-2xl text-xs font-black text-white shadow-sm" style={{ backgroundColor: primary }}>{t.addToCart}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: bg }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `2px solid ${border}` }}>
            <Search className="h-5 w-5 flex-shrink-0" style={{ color: muted }} />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.search} className="flex-1 bg-transparent outline-none text-sm font-medium" style={{ color: textColor }} />
            <button onClick={() => { setSearch(""); setSearchOpen(false); }}><X className="h-5 w-5" style={{ color: muted }} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {filteredItems.map((item: any) => {
              const name = getName(item, lang, translationOverrides);
              const prices = fmtAllCurrencies(item.priceBrl);
              return (
                <div key={item.id} className="flex gap-3 p-3 rounded-3xl" style={{ backgroundColor: surface, border: `2px solid ${border}` }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: textColor }}>{name}</h3>
                    {prices && (
                      <div>
                        <p className="text-sm font-black mt-0.5" style={{ color: primary }}>{prices.brl}</p>
                        <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
                      </div>
                    )}
                  </div>
                  {item.available && cartEnabled && (
                    <button onClick={() => { addToCart(item); setSearchOpen(false); }}
                      className="px-3 py-1.5 rounded-2xl text-xs font-black text-white self-center"
                      style={{ backgroundColor: primary }}>+</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart FAB */}
      <CartFAB cartCount={cartCount} primary={primary} onClick={() => setCartOpen(true)} cartEnabled={cartEnabled} />

      {/* Cart Drawer */}
      <CartDrawer
        cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen}
        removeFromCart={removeFromCart} updateQty={updateQty}
        cartTotal={cartTotal} sendOrder={sendOrder}
        company={company} primary={primary}
        bg={bg} surface={surface} border={border} textColor={textColor} muted={muted}
        t={t} lang={lang}
      />
    </div>
  );
}
