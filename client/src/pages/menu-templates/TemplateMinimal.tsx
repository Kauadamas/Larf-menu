import { TemplateProps, getName, getDesc, getCatName, T } from "./types";
import { ChefHat, MapPin, MessageCircle, Instagram, Facebook, Globe, Phone, Star, X, Search } from "lucide-react";
import { DietaryBadges, CartDrawer, CartFAB } from "./SharedComponents";

export default function TemplateMinimal(props: TemplateProps) {
  const { company, lang, translationOverrides, isTranslating, handleSetLang,
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, cartCount, cartTotal,
    sendOrder, search, setSearch, filteredItems,
    catsWithItems, chefItems, primary, fmtAllCurrencies, isOpen } = props;

  const t = T[lang];
  const bg = "#ffffff";
  const border = "#e5e7eb";
  const muted = "#9ca3af";
  const textColor = "#111827";
  const subtle = "#f9fafb";
  const surface = "#f3f4f6";

  const renderItem = (item: any) => {
    const name = getName(item, lang, translationOverrides);
    const desc = getDesc(item, lang, translationOverrides);
    const prices = fmtAllCurrencies(item.priceBrl);
    return (
      <div key={item.id} className="flex items-start justify-between py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-start gap-2">
            <p className="font-semibold text-sm line-clamp-2 flex-1" style={{ color: textColor }}>{name}</p>
            {!item.available && (
              <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium bg-red-50 text-red-500">{t.unavailable}</span>
            )}
          </div>
          {desc && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: muted }}>{desc}</p>}
          <DietaryBadges item={item} t={t} muted={muted} />
          {prices && (
            <div className="mt-1">
              <p className="text-sm font-bold" style={{ color: primary }}>{prices.brl}</p>
              <p className="text-xs" style={{ color: muted }}>{prices.usd} · {prices.eur}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.imageUrl && <img src={item.imageUrl} alt={name} className="w-14 h-14 rounded-lg object-cover" />}
          {item.available && (
            <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: primary }}>+</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: bg, color: textColor, minHeight: "100vh" }}>
      {/* Minimal header */}
      <div className="max-w-xl mx-auto px-5 pt-8 pb-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: primary + "18" }}>
                <ChefHat className="h-6 w-6" style={{ color: primary }} />
              </div>
            )}
            <div>
              <h1 className="font-bold text-xl" style={{ color: textColor }}>{company.name}</h1>
              {isOpen !== null && (
                <span className="text-xs font-medium" style={{ color: isOpen ? "#16a34a" : "#dc2626" }}>
                  {isOpen ? (lang === "en" ? "Open now" : lang === "es" ? "Abierto ahora" : "Aberto agora") : (lang === "en" ? "Closed" : lang === "es" ? "Cerrado" : "Fechado")}
                </span>
              )}
            </div>
          </div>
          {/* Lang selector */}
          <div className="flex gap-1">
            {(["pt", "es", "en"] as const).map(l => (
              <button key={l} onClick={() => handleSetLang(l)}
                className="px-2 py-0.5 rounded text-xs font-bold transition-all"
                style={{ backgroundColor: lang === l ? textColor : "transparent", color: lang === l ? bg : muted, border: `1px solid ${lang === l ? textColor : border}` }}>
                {l.toUpperCase()}
              </button>
            ))}
            {isTranslating && <span className="text-xs" style={{ color: muted }}>...</span>}
          </div>
        </div>

        {company.description && (
          <p className="text-sm mb-4 leading-relaxed" style={{ color: muted }}>
            {translationOverrides["company_desc"] || company.description}
          </p>
        )}

        {/* Info row */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs" style={{ color: muted }}>
          {company.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.address}</span>}
          {company.phone && <a href={`tel:${company.phone}`} className="flex items-center gap-1"><Phone className="h-3 w-3" />{company.phone}</a>}
          {company.whatsapp && <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />WhatsApp</a>}
          {company.instagram && <a href={company.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Instagram className="h-3 w-3" />Instagram</a>}
          {company.facebook && <a href={company.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Facebook className="h-3 w-3" />Facebook</a>}
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Globe className="h-3 w-3" />Site</a>}
          {(company as any).googleReviewsUrl && <a href={(company as any).googleReviewsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: primary }}><Star className="h-3 w-3" />Google</a>}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6" style={{ backgroundColor: subtle, border: `1px solid ${border}` }}>
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.search} className="flex-1 bg-transparent outline-none text-sm" style={{ color: textColor }} />
          {search && <button onClick={() => setSearch("")}><X className="h-4 w-4" style={{ color: muted }} /></button>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${border}` }} />

      {/* Menu content */}
      <div className="max-w-xl mx-auto px-5 pb-32">
        {/* Most Ordered */}
        {chefItems.length > 0 && !search && (
          <div className="pt-6 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>{t.chefRecommends}</h2>
            {chefItems.map(renderItem)}
          </div>
        )}

        {/* Categories */}
        {(search ? [{ id: -1, namePt: t.search, items: filteredItems }] : catsWithItems).map((cat: any) => (
          <div key={cat.id} className="pt-6">
            {!search && <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>{getCatName(cat, lang, translationOverrides)}</h2>}
            {cat.items.map(renderItem)}
          </div>
        ))}
      </div>

      {/* Cart FAB */}
      <CartFAB cartCount={cartCount} primary={primary} onClick={() => setCartOpen(true)} />

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
