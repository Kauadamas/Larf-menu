import { useState, useRef, useEffect } from "react";
import { ChefHat, MapPin, MessageCircle, Instagram, Facebook, Globe, Phone, Star, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { TemplateProps, getName, getDesc, getCatName, T } from "./types";
import { DietaryBadges, CartDrawer, CartFAB } from "./SharedComponents";

export default function TemplateMagazine(props: TemplateProps) {
  const { company, lang, translationOverrides, isTranslating, handleSetLang,
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, cartCount, cartTotal,
    sendOrder, search, setSearch, filteredItems,
    catsWithItems, chefItems, primary, fmtAllCurrencies, isOpen, carouselImages, cartEnabled = true } = props;

  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = T[lang];

  const heroImages = carouselImages.length > 0 ? carouselImages : [];
  useEffect(() => {
    if (heroImages.length <= 1) return;
    timerRef.current = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroImages.length]);

  const bg = "#fafaf8";
  const border = "#e8e4dc";
  const muted = "#9c8f7e";
  const textColor = "#1a1614";
  const surface = "#ffffff";

  const allCats = catsWithItems;
  const currentCatId = activeCat ?? (allCats[0]?.id ?? null);
  const currentCat = allCats.find((c: any) => c.id === currentCatId);
  const displayItems = search ? filteredItems : (currentCat?.items ?? []);

  return (
    <div style={{ backgroundColor: bg, color: textColor, minHeight: "100vh" }}>
      {/* Hero fullscreen */}
      <div className="relative" style={{ height: "55vw", maxHeight: 340, minHeight: 200 }}>
        {heroImages.length > 0 ? (
          <>
            {heroImages.map((url, i) => (
              <img key={i} src={url} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: i === heroIdx ? 1 : 0 }} />
            ))}
            {heroImages.length > 1 && (
              <>
                <button onClick={() => setHeroIdx(i => (i - 1 + heroImages.length) % heroImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"><ChevronLeft className="h-4 w-4" style={{ color: textColor }} /></button>
                <button onClick={() => setHeroIdx(i => (i + 1) % heroImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"><ChevronRight className="h-4 w-4" style={{ color: textColor }} /></button>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}22 0%, ${primary}08 100%)` }}>
            <ChefHat className="h-20 w-20" style={{ color: primary + "44" }} />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(250,250,248,1) 100%)" }} />
        {/* Lang + search */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button onClick={() => setSearch(search ? "" : " ")} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/90 shadow"><Search className="h-4 w-4" style={{ color: textColor }} /></button>
          <div className="flex gap-1 bg-white/90 rounded-full px-2 py-1 shadow">
            {(["pt", "es", "en"] as const).map(l => (
              <button key={l} onClick={() => handleSetLang(l)}
                className="px-1.5 py-0.5 rounded-full text-xs font-bold transition-all"
                style={{ backgroundColor: lang === l ? primary : "transparent", color: lang === l ? "white" : muted }}>
                {l.toUpperCase()}
              </button>
            ))}
            {isTranslating && <span className="text-xs" style={{ color: muted }}>...</span>}
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="px-5 pb-4 -mt-2">
        <div className="flex items-end gap-3 mb-3">
          {company.logoUrl && (
            <img src={company.logoUrl} alt={company.name} className="w-14 h-14 rounded-xl object-cover shadow-md flex-shrink-0" style={{ border: `3px solid ${surface}`, marginTop: -28 }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-xl" style={{ color: textColor }}>{company.name}</h1>
              {isOpen !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: isOpen ? "#dcfce7" : "#fee2e2", color: isOpen ? "#16a34a" : "#dc2626" }}>
                  {isOpen ? (lang === "en" ? "Open" : lang === "es" ? "Abierto" : "Aberto") : (lang === "en" ? "Closed" : lang === "es" ? "Cerrado" : "Fechado")}
                </span>
              )}
            </div>
          </div>
        </div>
        {company.description && <p className="text-sm mb-3 leading-relaxed" style={{ color: muted }}>{translationOverrides["company_desc"] || company.description}</p>}
        {/* Social */}
        <div className="flex flex-wrap gap-2 text-xs mb-4" style={{ color: muted }}>
          {company.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.address}</span>}
          {company.whatsapp && <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />WhatsApp</a>}
          {company.instagram && <a href={company.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Instagram className="h-3 w-3" />Instagram</a>}
          {company.facebook && <a href={company.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Facebook className="h-3 w-3" />Facebook</a>}
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Globe className="h-3 w-3" />Site</a>}
          {company.phone && <a href={`tel:${company.phone}`} className="flex items-center gap-1"><Phone className="h-3 w-3" />{company.phone}</a>}
          {(company as any).googleReviewsUrl && <a href={(company as any).googleReviewsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: primary }}><Star className="h-3 w-3" />Google</a>}
        </div>
      </div>

      {/* Search bar */}
      {search !== undefined && (
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
            <Search className="h-4 w-4" style={{ color: muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} className="flex-1 bg-transparent outline-none text-sm" style={{ color: textColor }} />
            {search && <button onClick={() => setSearch("")}><X className="h-4 w-4" style={{ color: muted }} /></button>}
          </div>
        </div>
      )}

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-3" style={{ borderBottom: `1px solid ${border}` }}>
          {allCats.map((cat: any) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className="flex-shrink-0 px-4 py-2 text-sm font-semibold transition-all"
              style={{
                color: currentCatId === cat.id ? primary : muted,
                borderBottom: currentCatId === cat.id ? `2px solid ${primary}` : "2px solid transparent",
              }}>
              {getCatName(cat, lang, translationOverrides)}
            </button>
          ))}
        </div>
      )}

      {/* Items grid - magazine style */}
      <div className="px-4 py-5 pb-32">
        {/* Most ordered row */}
        {chefItems.length > 0 && !search && !activeCat && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>{t.chefRecommends}</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {chefItems.map((item: any) => {
                const name = getName(item, lang, translationOverrides);
                const prices = fmtAllCurrencies(item.priceBrl);
                return (
                  <div key={item.id} className="flex-shrink-0 w-36 rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center" style={{ backgroundColor: primary + "11" }}>
                        <ChefHat className="h-8 w-8" style={{ color: primary + "44" }} />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: textColor }}>{name}</p>
                      {prices && (
                        <div>
                          <p className="text-xs font-bold" style={{ color: primary }}>{prices.brl}</p>
                          <p className="text-xs" style={{ color: muted }}>{prices.usd}</p>
                        </div>
                      )}
                      {item.available && cartEnabled && <button onClick={() => addToCart(item)} className="mt-1.5 w-full py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: primary }}>{t.addToCart}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main items */}
        <div className="grid grid-cols-2 gap-3">
          {displayItems.map((item: any) => {
            const name = getName(item, lang, translationOverrides);
            const desc = getDesc(item, lang, translationOverrides);
            const prices = fmtAllCurrencies(item.priceBrl);
            return (
              <div key={item.id} className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: surface, border: `1px solid ${border}`, opacity: item.available ? 1 : 0.6 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 flex items-center justify-center" style={{ backgroundColor: primary + "0d" }}>
                    <ChefHat className="h-10 w-10" style={{ color: primary + "33" }} />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-bold text-sm line-clamp-2 flex-1" style={{ color: textColor }}>{name}</h3>
                    {!item.available && <span className="text-xs px-1 py-0.5 rounded flex-shrink-0 bg-red-50 text-red-500">{t.unavailable}</span>}
                  </div>
                  {desc && <p className="text-xs line-clamp-2 mb-1" style={{ color: muted }}>{desc}</p>}
                  <DietaryBadges item={item} t={t} muted={muted} />
                  <div className="flex items-end justify-between mt-2">
                    {prices ? (
                      <div>
                        <p className="font-bold text-sm" style={{ color: primary }}>{prices.brl}</p>
                        <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
                      </div>
                    ) : <span />}
                    {item.available && cartEnabled && (
                      <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: primary }}>+</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
