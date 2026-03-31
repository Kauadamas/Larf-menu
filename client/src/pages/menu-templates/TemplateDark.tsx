import { useState, useRef, useEffect } from "react";
import { ChefHat, MapPin, MessageCircle, Instagram, Facebook, Globe, Phone, Star, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { TemplateProps, getName, getDesc, getCatName, T } from "./types";
import { DietaryBadges, CartDrawer, CartFAB } from "./SharedComponents";

function BannerCarousel({ images, primary }: { images: string[]; primary: string }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % images.length), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length]);
  if (images.length === 0) return null;
  return (
    <div className="relative overflow-hidden w-full h-full">
      {images.map((url, i) => (
        <img key={i} src={url} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: i === idx ? 1 : 0 }} />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(15,15,25,0.95))" }} />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40"><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40"><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
        </>
      )}
    </div>
  );
}

export default function TemplateDark(props: TemplateProps) {
  const { company, lang, translationOverrides, isTranslating, handleSetLang,
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, cartCount, cartTotal,
    sendOrder, search, setSearch, filteredItems,
    catsWithItems, chefItems, primary, fmtAllCurrencies, isOpen, carouselImages, cartEnabled = true } = props;

  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const t = T[lang];
  const bg = "#0f0f19";
  const surface = "#1a1a2e";
  const surface2 = "#16213e";
  const border = "#2a2a4a";
  const muted = "#8888aa";
  const textColor = "#e8e8f8";

  const allCats = chefItems.length > 0
    ? [{ id: -1, namePt: t.chefRecommends, nameEs: "Más Pedidos", nameEn: "Most Ordered" }, ...catsWithItems]
    : catsWithItems;
  const currentCat = activeCat ?? (allCats[0]?.id ?? null);
  const currentItems = currentCat === -1 ? chefItems : (catsWithItems.find((c: any) => c.id === currentCat)?.items ?? []);

  return (
    <div style={{ backgroundColor: bg, color: textColor, minHeight: "100vh" }}>
      {/* Header */}
      <div className="relative" style={{ height: 220 }}>
        {carouselImages.length > 0 ? (
          <BannerCarousel images={carouselImages} primary={primary} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}33 0%, #0f0f19 100%)` }} />
        )}
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <div className="flex gap-1">
            {(["pt", "es", "en"] as const).map(l => (
              <button key={l} onClick={() => handleSetLang(l)}
                className="px-2 py-0.5 rounded text-xs font-bold transition-all"
                style={{ backgroundColor: lang === l ? primary : "rgba(255,255,255,0.1)", color: lang === l ? "white" : muted }}>
                {l.toUpperCase()}
              </button>
            ))}
            {isTranslating && <span className="text-xs px-2 py-0.5 rounded" style={{ color: muted }}>{t.translating}</span>}
          </div>
          <button onClick={() => setSearchOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <Search className="h-4 w-4 text-white" />
          </button>
        </div>
        {/* Company info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-3">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-lg" style={{ border: `2px solid ${primary}` }} />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + "33", border: `2px solid ${primary}` }}>
              <ChefHat className="h-7 w-7" style={{ color: primary }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white truncate">{company.name}</h1>
              {isOpen !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{ backgroundColor: isOpen ? "#16a34a33" : "#dc262633", color: isOpen ? "#4ade80" : "#f87171" }}>
                  {isOpen ? (lang === "en" ? "Open" : lang === "es" ? "Abierto" : "Aberto") : (lang === "en" ? "Closed" : lang === "es" ? "Cerrado" : "Fechado")}
                </span>
              )}
            </div>
            {company.description && <p className="text-xs truncate" style={{ color: muted }}>{translationOverrides["company_desc"] || company.description}</p>}
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide" style={{ borderBottom: `1px solid ${border}` }}>
        {company.whatsapp && <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: surface }}><MessageCircle className="h-3.5 w-3.5" style={{ color: muted }} /></a>}
        {company.instagram && <a href={company.instagram} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: surface }}><Instagram className="h-3.5 w-3.5" style={{ color: muted }} /></a>}
        {company.facebook && <a href={company.facebook} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: surface }}><Facebook className="h-3.5 w-3.5" style={{ color: muted }} /></a>}
        {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: surface }}><Globe className="h-3.5 w-3.5" style={{ color: muted }} /></a>}
        {company.phone && <a href={`tel:${company.phone}`} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: surface }}><Phone className="h-3.5 w-3.5" style={{ color: muted }} /></a>}
        {company.address && <p className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: muted }}><MapPin className="h-3 w-3" />{company.address}</p>}
        {(company as any).googleReviewsUrl && <a href={(company as any).googleReviewsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0" style={{ backgroundColor: primary + "22", color: primary }}><Star className="h-3 w-3" />Google</a>}
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex" style={{ minHeight: "calc(100vh - 280px)" }}>
        {/* Sidebar categories */}
        <div className="w-28 flex-shrink-0 sticky top-0 h-screen overflow-y-auto py-4 scrollbar-hide" style={{ backgroundColor: surface2, borderRight: `1px solid ${border}` }}>
          {allCats.map((cat: any) => {
            const active = currentCat === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                className="w-full text-left px-3 py-3 text-xs font-medium transition-all"
                style={{
                  backgroundColor: active ? primary + "22" : "transparent",
                  color: active ? primary : muted,
                  borderLeft: active ? `3px solid ${primary}` : "3px solid transparent",
                }}>
                {getCatName(cat, lang, translationOverrides)}
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div className="flex-1 px-4 py-4 pb-32">
          <h2 className="font-bold text-base mb-4" style={{ color: textColor }}>
            {getCatName(allCats.find((c: any) => c.id === currentCat) ?? {}, lang, translationOverrides)}
          </h2>
          <div className="space-y-3">
            {currentItems.map((item: any) => {
              const name = getName(item, lang, translationOverrides);
              const desc = getDesc(item, lang, translationOverrides);
              const prices = fmtAllCurrencies(item.priceBrl);
              return (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl transition-all hover:brightness-110"
                  style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-2" style={{ color: textColor }}>{name}</h3>
                      {!item.available && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ backgroundColor: "#dc262622", color: "#f87171" }}>{t.unavailable}</span>
                      )}
                    </div>
                    {desc && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: muted }}>{desc}</p>}
                    <DietaryBadges item={item} t={t} muted={muted} />
                    <div className="flex items-center justify-between mt-2">
                      {prices ? (
                        <div>
                          <p className="font-bold text-sm" style={{ color: primary }}>{prices.brl}</p>
                          <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
                        </div>
                      ) : <span />}
                      {item.available && cartEnabled && (
                        <button onClick={() => addToCart(item)}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                          style={{ backgroundColor: primary, color: "white" }}>
                          {t.addToCart}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: bg }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${border}` }}>
            <Search className="h-5 w-5 flex-shrink-0" style={{ color: muted }} />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.search} className="flex-1 bg-transparent outline-none text-sm" style={{ color: textColor }} />
            <button onClick={() => { setSearch(""); setSearchOpen(false); }}><X className="h-5 w-5" style={{ color: muted }} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {filteredItems.map((item: any) => {
              const name = getName(item, lang, translationOverrides);
              const prices = fmtAllCurrencies(item.priceBrl);
              return (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: textColor }}>{name}</h3>
                    {prices && (
                      <div>
                        <p className="text-xs font-bold mt-0.5" style={{ color: primary }}>{prices.brl}</p>
                        <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
                      </div>
                    )}
                  </div>
                  {item.available && cartEnabled && <button onClick={() => { addToCart(item); setSearchOpen(false); }} className="px-3 py-1 rounded-lg text-xs font-bold self-center" style={{ backgroundColor: primary, color: "white" }}>{t.addToCart}</button>}
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
