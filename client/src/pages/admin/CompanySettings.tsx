import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  ChefHat,
  Facebook,
  Globe,
  ImagePlus,
  Images,
  Instagram,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Save,
  Settings,
  Star,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

// Preset palette for quick selection
const PRESET_COLORS = [
  "#e85d04", "#dc2626", "#16a34a", "#1d4ed8", "#7c3aed",
  "#db2777", "#0891b2", "#d97706", "#059669", "#4f46e5",
  "#be123c", "#0f766e", "#b45309", "#6d28d9", "#0369a1",
];

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta",
  fri: "Sexta", sat: "Sábado", sun: "Domingo",
};
const ALL_DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Cada dia agora suporta múltiplos intervalos de horário
type DayInterval = { open: string; close: string };
type DayHours = { closed: boolean; intervals: DayInterval[] };

const DEFAULT_HOURS = Object.fromEntries(
  ALL_DAYS.map(d => [d, { closed: false, intervals: [{ open: "08:00", close: "22:00" }] }])
) as Record<DayKey, DayHours>;

// Compatibilidade com formato antigo { open, close, closed }
function parseBH(raw: any): Record<DayKey, DayHours> {
  const result = { ...DEFAULT_HOURS };
  if (!raw || typeof raw !== "object") return result;
  for (const day of ALL_DAYS) {
    const v = raw[day];
    if (!v) continue;
    if (Array.isArray(v.intervals)) {
      result[day] = { closed: !!v.closed, intervals: v.intervals };
    } else if (v.open !== undefined) {
      // formato legado
      result[day] = { closed: !!v.closed, intervals: [{ open: v.open ?? "08:00", close: v.close ?? "22:00" }] };
    }
  }
  return result;
}

interface SettingsForm {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  colorTheme: string;
  googleReviewsUrl: string;
  customDomain: string;
  usdRate: string;
  eurRate: string;
  deliveryEnabled: boolean;
  deliveryFee: string;
  deliveryMinOrder: string;
  paymentMercadoPago: string;
  paymentPagSeguro: string;
  paymentPicPay: string;
  cartEnabled: boolean;
}

export default function CompanySettings() {
  const { user, isAuthenticated, logout } = useAuth();
  const params = useParams<{ companyId: string }>();
  const companyId = parseInt(params.companyId ?? "0");
  const [, navigate] = useLocation();
  // Track if form has been initialized to avoid overwriting user edits
  const initializedRef = useRef(false);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    slug: "",
    description: "",
    address: "",
    phone: "",
    website: "",
    facebook: "",
    instagram: "",
    whatsapp: "",
    colorTheme: "#e85d04",
    googleReviewsUrl: "",
    customDomain: "",
    usdRate: "",
    eurRate: "",
    deliveryEnabled: false,
    deliveryFee: "",
    deliveryMinOrder: "",
    paymentMercadoPago: "",
    paymentPagSeguro: "",
    paymentPicPay: "",
    cartEnabled: true,
  });
  const [businessHours, setBusinessHours] = useState<Record<DayKey, DayHours>>(DEFAULT_HOURS);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [uploadingCarousel, setUploadingCarousel] = useState(false);
  const [menuTemplate, setMenuTemplate] = useState("classic");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);

  // Print state
  const [printLang, setPrintLang] = useState<"pt" | "es" | "en">("pt");
  const [printCurrency, setPrintCurrency] = useState<"BRL" | "USD" | "EUR">("BRL");
  const [printMode, setPrintMode] = useState<"all" | "category" | "category-page">("all");
  const [printCatId, setPrintCatId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: company, isLoading } = trpc.companies.getById.useQuery(
    { id: companyId },
    { enabled: !!companyId && isAuthenticated }
  );
  const { data: printCategories = [] } = trpc.categories.list.useQuery(
    { companyId },
    { enabled: !!companyId && isAuthenticated }
  );
  const { data: printItems = [] } = trpc.menuItems.list.useQuery(
    { companyId },
    { enabled: !!companyId && isAuthenticated }
  );
  const { data: printRates = { BRL: 1, USD: 0.19, EUR: 0.18 } } = trpc.currency.getRates.useQuery({ companyId });

  // Initialize form ONCE when company data loads — prevents overwriting user edits
  useEffect(() => {
    if (company && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        name: company.name ?? "",
        slug: company.slug ?? "",
        description: company.description ?? "",
        address: company.address ?? "",
        phone: company.phone ?? "",
        website: company.website ?? "",
        facebook: company.facebook ?? "",
        instagram: company.instagram ?? "",
        whatsapp: company.whatsapp ?? "",
        colorTheme: company.colorTheme ?? "#e85d04",
        googleReviewsUrl: (company as any).googleReviewsUrl ?? "",
        customDomain: (company as any).customDomain ?? "",
        usdRate: (company as any).usdRate ?? "",
        eurRate: (company as any).eurRate ?? "",
        deliveryEnabled: company.deliveryEnabled ?? false,
        deliveryFee: company.deliveryFee ?? "",
        deliveryMinOrder: company.deliveryMinOrder ?? "",
        paymentMercadoPago: company.paymentMercadoPago ?? "",
        paymentPagSeguro: company.paymentPagSeguro ?? "",
        paymentPicPay: company.paymentPicPay ?? "",
        cartEnabled: (company as any).cartEnabled ?? true,
      });
      // Parse business hours
      try {
        const bh = JSON.parse((company as any).businessHours ?? "{}");
        if (bh && typeof bh === "object") setBusinessHours(parseBH(bh));
      } catch { setBusinessHours(DEFAULT_HOURS); }
      setMenuTemplate((company as any).menuTemplate ?? "classic");
      setLogoPreview(company.logoUrl ?? "");
      // Parse carousel images from JSON
      try {
        const imgs = JSON.parse((company as any).carouselImages ?? "[]");
        setCarouselImages(Array.isArray(imgs) ? imgs : []);
      } catch {
        setCarouselImages([]);
      }
    }
  }, [company]);

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      utils.companies.getById.invalidate({ id: companyId });
      toast.success("Configurações salvas!");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogoMutation = trpc.companies.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoPreview(data.url);
      setUploadingLogo(false);
      utils.companies.getById.invalidate({ id: companyId });
      toast.success("Logo enviada!");
    },
    onError: (e) => {
      setUploadingLogo(false);
      toast.error("Erro ao enviar logo: " + e.message);
    },
  });

  const uploadCarouselMutation = trpc.companies.uploadCarousel.useMutation({
    onSuccess: (data) => {
      setCarouselImages((prev) => {
        const next = [...prev, data.url].slice(0, 4);
        updateMutation.mutate({ id: companyId, carouselImages: JSON.stringify(next) });
        return next;
      });
      setUploadingCarousel(false);
      toast.success("Imagem adicionada ao carrossel!");
    },
    onError: (e) => {
      setUploadingCarousel(false);
      toast.error("Erro ao enviar imagem: " + e.message);
    },
  });

  // Redimensiona e comprime imagem antes de enviar
  function resizeImage(file: File, maxPx: number, quality: number): Promise<{ base64: string; contentType: string; fileName: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          base64: dataUrl.split(",")[1],
          contentType: "image/jpeg",
          fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
        });
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo muito grande. Máximo 5MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const { base64, contentType, fileName } = await resizeImage(file, 400, 0.85);
      uploadLogoMutation.mutate({ companyId, fileName, contentType, base64 });
    } catch {
      toast.error("Erro ao processar imagem.");
      setUploadingLogo(false);
    }
  }

  async function handleCarouselChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (carouselImages.length >= 4) {
      toast.error("Máximo de 4 imagens no carrossel.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    setUploadingCarousel(true);
    try {
      const { base64, contentType, fileName } = await resizeImage(file, 800, 0.80);
      uploadCarouselMutation.mutate({ companyId, fileName, contentType, base64 });
    } catch {
      toast.error("Erro ao processar imagem.");
      setUploadingCarousel(false);
    }
    e.target.value = "";
  }

  function removeCarouselImage(index: number) {
    const next = carouselImages.filter((_, i) => i !== index);
    setCarouselImages(next);
    updateMutation.mutate({ id: companyId, carouselImages: JSON.stringify(next) });
    toast.success("Imagem removida.");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      id: companyId,
      ...form,
      carouselImages: JSON.stringify(carouselImages),
      businessHours: JSON.stringify(businessHours),
      menuTemplate,
    });
  }

  // Derive a light background from the chosen color for preview
  const previewBg = form.colorTheme + "18";

  // Print function
  function handlePrint() {
    // Sanitize all dynamic strings inserted into the HTML template
    const esc = (s: any) => String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const r = printRates as Record<string, number>;
    const fmtPrice = (brl: string | number | null | undefined): string => {
      if (!brl) return "";
      const n = parseFloat(String(brl));
      if (printCurrency === "BRL") return `R$ ${n.toFixed(2)}`;
      const isManual = (printRates as any).manual;
      if (printCurrency === "USD") return isManual ? `$ ${(n / (r["USD"] ?? 5.5)).toFixed(2)}` : `$ ${(n * (r["USD"] ?? 0.19)).toFixed(2)}`;
      return isManual ? `€ ${(n / (r["EUR"] ?? 6.0)).toFixed(2)}` : `€ ${(n * (r["EUR"] ?? 0.18)).toFixed(2)}`;
    };
    const getName = (item: any) => {
      if (printLang === "es" && item.nameEs) return item.nameEs;
      if (printLang === "en" && item.nameEn) return item.nameEn;
      return item.namePt ?? "";
    };
    const getDesc = (item: any) => {
      if (printLang === "es" && item.descriptionEs) return item.descriptionEs;
      if (printLang === "en" && item.descriptionEn) return item.descriptionEn;
      return item.descriptionPt ?? "";
    };
    const getCatName = (cat: any) => {
      if (printLang === "es" && cat.nameEs) return cat.nameEs;
      if (printLang === "en" && cat.nameEn) return cat.nameEn;
      return cat.namePt ?? "";
    };
    const activeCats = (printCategories as any[]).filter((c: any) => c.active);
    const catsWithItems = activeCats.map((c: any) => ({
      ...c,
      items: (printItems as any[]).filter((i: any) => i.categoryId === c.id && i.available),
    })).filter((c: any) => c.items.length > 0);
    const selectedCats = printMode === "category" && printCatId
      ? catsWithItems.filter((c: any) => c.id === printCatId)
      : catsWithItems;
    const langLabel = printLang === "pt" ? "Cardápio" : printLang === "es" ? "Menú" : "Menu";
    const currencyLabel = printCurrency === "BRL" ? "Preços em Real (BRL)" : printCurrency === "USD" ? "Prices in Dollar (USD)" : "Preise in Euro (EUR)";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(company?.name ?? langLabel)}</title>
    <style>
      @media print { body { margin: 0; } }
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1 { font-size: 22px; margin-bottom: 2px; color: ${form.colorTheme}; }
      .subtitle { color: #666; margin-bottom: 4px; font-size: 13px; }
      .currency-info { color: #888; font-size: 11px; margin-bottom: 20px; }
      .cat-block { ${printMode === "category-page" ? "page-break-before: always;" : "margin-bottom: 28px;"} }
      .cat-block:first-child { page-break-before: avoid; }
      h2 { font-size: 15px; border-bottom: 2px solid ${form.colorTheme}; padding-bottom: 4px; margin-bottom: 10px; color: ${form.colorTheme}; }
      .item { display: flex; justify-content: space-between; align-items: flex-start; padding: 7px 0; border-bottom: 1px solid #eee; gap: 12px; }
      .item-name { font-weight: 600; font-size: 13px; }
      .item-desc { font-size: 11px; color: #666; margin-top: 2px; }
      .item-price { font-weight: bold; color: ${form.colorTheme}; white-space: nowrap; font-size: 14px; }
    </style></head><body>
    <h1>${esc(company?.name)}</h1>
    ${company?.address ? `<div class="subtitle">${esc(company.address)}</div>` : ""}
    <div class="currency-info">${esc(currencyLabel)}</div>
    ${selectedCats.map((c: any) => `<div class="cat-block"><h2>${esc(getCatName(c))}</h2>${c.items.map((i: any) => `<div class="item"><div><div class="item-name">${esc(getName(i))}</div><div class="item-desc">${esc(getDesc(i))}</div></div><div class="item-price">${esc(fmtPrice(i.priceBrl))}</div></div>`).join("")}</div>`).join("")}
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  if (!isAuthenticated) { window.location.replace("/login"); return null; }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-20 hidden md:flex">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-lg">CardápioDigital</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <LayoutGrid className="h-4 w-4" />Visão Geral
          </button>
          <button onClick={() => navigate("/admin/companies")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <Building2 className="h-4 w-4" />Empresas
          </button>
          {(user?.role === "superadmin" || user?.role === "admin") && (
            <button onClick={() => navigate("/admin/users")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Users className="h-4 w-4" />Usuários
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />Configurações da Empresa
          </h1>
          <p className="text-sm text-muted-foreground">{company?.name}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Logo */}
            <Card>
              <CardHeader><CardTitle className="text-base">Logomarca</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                      <ImagePlus className="h-4 w-4 mr-2" />
                      {uploadingLogo ? "Enviando..." : "Enviar logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG — máx. 2MB</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </CardContent>
            </Card>

            {/* Carousel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Images className="h-4 w-4" />Carrossel de Imagens
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione até 4 fotos que serão exibidas no topo do cardápio público (banner rotativo).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {carouselImages.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                      <img src={url} alt={`Carrossel ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeCarouselImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                  {carouselImages.length < 4 && (
                    <button
                      type="button"
                      onClick={() => carouselInputRef.current?.click()}
                      disabled={uploadingCarousel}
                      className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">{uploadingCarousel ? "Enviando..." : "Adicionar"}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={carouselInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCarouselChange}
                />
                <p className="text-xs text-muted-foreground">
                  {carouselImages.length}/4 imagens • Recomendado: 1200×600px, JPG ou PNG
                </p>
              </CardContent>
            </Card>

            {/* Basic info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Informações do Restaurante</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Restaurante *</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Slug (URL) *</Label>
                    <div className="flex items-center mt-1.5">
                      <span className="px-3 py-2 bg-muted border border-r-0 border-border rounded-l-md text-xs text-muted-foreground">/menu/</span>
                      <Input
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                        required className="rounded-l-none" placeholder="meu-restaurante"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Release / Sobre o Restaurante</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Conte a história do restaurante..." rows={3} className="mt-1.5 resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Endereço</Label>
                    <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Rua, número, bairro, cidade" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(11) 9999-9999" className="mt-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social media */}
            <Card>
              <CardHeader><CardTitle className="text-base">Redes Sociais e Contato</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Site</Label>
                    <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://seusite.com.br" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-green-600" />WhatsApp (apenas números)</Label>
                    <Input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value.replace(/\D/g, "") }))} placeholder="5511999999999" className="mt-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">Ex: 5511999999999 (código do país + DDD + número)</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Facebook className="h-3.5 w-3.5 text-blue-600" />Facebook</Label>
                    <Input value={form.facebook} onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))} placeholder="https://facebook.com/seurestaurante" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 text-pink-600" />Instagram</Label>
                    <Input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="https://instagram.com/seurestaurante" className="mt-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />Avaliação Google
                </CardTitle>
                <p className="text-sm text-muted-foreground">Cole o link da sua página de avaliações no Google. Será exibido no cardápio público.</p>
              </CardHeader>
              <CardContent>
                <Label>Link do Google Reviews</Label>
                <Input
                  value={form.googleReviewsUrl}
                  onChange={(e) => setForm((f) => ({ ...f, googleReviewsUrl: e.target.value }))}
                  placeholder="https://g.page/r/seu-restaurante/review"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para obter o link: pesquise seu restaurante no Google Maps → clique em "Avaliações" → "Escrever uma avaliação" → copie o link.
                </p>
              </CardContent>
            </Card>

            {/* Color theme — RGB picker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cor do Tema</CardTitle>
                <p className="text-sm text-muted-foreground">Escolha uma cor predefinida ou use o seletor para qualquer cor RGB.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset swatches */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cores rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, colorTheme: color }))}
                        className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: form.colorTheme === color ? "#000" : "transparent",
                          boxShadow: form.colorTheme === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom RGB picker */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cor personalizada (qualquer cor RGB):</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.colorTheme.startsWith("#") ? form.colorTheme : "#e85d04"}
                      onChange={(e) => setForm((f) => ({ ...f, colorTheme: e.target.value }))}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                    />
                    <Input
                      value={form.colorTheme}
                      onChange={(e) => setForm((f) => ({ ...f, colorTheme: e.target.value }))}
                      placeholder="#e85d04"
                      className="w-36 font-mono text-sm"
                      maxLength={7}
                    />
                    <span className="text-xs text-muted-foreground">Código hexadecimal</span>
                  </div>
                </div>

                {/* Live preview */}
                <div className="mt-2 p-4 rounded-xl border border-border" style={{ backgroundColor: previewBg }}>
                  <p className="text-xs text-muted-foreground mb-3">Pré-visualização do cardápio:</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: form.colorTheme + "30" }}>
                      <ChefHat className="h-5 w-5" style={{ color: form.colorTheme }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: form.colorTheme }}>
                        {form.name || "Nome do Restaurante"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Entradas", "Pratos", "Bebidas", "Sobremesas"].map((cat) => (
                      <span key={cat} className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: form.colorTheme, color: "white" }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-10 rounded-lg border-2 flex items-center px-3" style={{ borderColor: form.colorTheme + "60" }}>
                      <span className="text-xs text-muted-foreground">Buscar pratos...</span>
                    </div>
                    <div className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: form.colorTheme }}>
                      Ver Cardápio
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Botão de Carrinho</CardTitle>
                <p className="text-sm text-muted-foreground">Ative ou desative o botão de carrinho no cardápio público. Quando desativado, clientes apenas visualizam o cardápio sem poder montar pedidos.</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Carrinho habilitado</p>
                    <p className="text-xs text-muted-foreground">Exibe o botão flutuante de carrinho no cardápio</p>
                  </div>
                  <Switch checked={form.cartEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, cartEnabled: v }))} />
                </div>
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery</CardTitle>
                <p className="text-sm text-muted-foreground">Ative o delivery e configure as opções.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Delivery ativo</p>
                    <p className="text-xs text-muted-foreground">Exibe opção de delivery no cardápio público</p>
                  </div>
                  <Switch checked={form.deliveryEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, deliveryEnabled: v }))} />
                </div>
                {form.deliveryEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <Label>Taxa de entrega (R$)</Label>
                      <Input type="number" step="0.01" min="0" value={form.deliveryFee} onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))} placeholder="0.00" className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Pedido mínimo (R$)</Label>
                      <Input type="number" step="0.01" min="0" value={form.deliveryMinOrder} onChange={(e) => setForm((f) => ({ ...f, deliveryMinOrder: e.target.value }))} placeholder="0.00" className="mt-1.5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Horário de Funcionamento</CardTitle>
                <p className="text-sm text-muted-foreground">Configure os horários por dia. Você pode adicionar múltiplos intervalos (ex: 06h–12h e 14h–22h).</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {ALL_DAYS.map((day) => {
                  const dh = businessHours[day];
                  return (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium text-muted-foreground">{DAY_LABELS[day]}</div>
                        <Switch
                          checked={!dh.closed}
                          onCheckedChange={(v) =>
                            setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !v } }))
                          }
                        />
                        {dh.closed && <span className="text-sm text-muted-foreground italic">Fechado</span>}
                        {!dh.closed && (
                          <button
                            type="button"
                            onClick={() =>
                              setBusinessHours(prev => ({
                                ...prev,
                                [day]: { ...prev[day], intervals: [...prev[day].intervals, { open: "08:00", close: "22:00" }] },
                              }))
                            }
                            className="ml-auto text-xs text-primary hover:underline"
                          >
                            + intervalo
                          </button>
                        )}
                      </div>
                      {!dh.closed && dh.intervals.map((interval, idx) => (
                        <div key={idx} className="flex items-center gap-2 ml-24">
                          <Input
                            type="time"
                            value={interval.open}
                            onChange={(e) =>
                              setBusinessHours(prev => {
                                const intervals = [...prev[day].intervals];
                                intervals[idx] = { ...intervals[idx], open: e.target.value };
                                return { ...prev, [day]: { ...prev[day], intervals } };
                              })
                            }
                            className="w-28 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={interval.close}
                            onChange={(e) =>
                              setBusinessHours(prev => {
                                const intervals = [...prev[day].intervals];
                                intervals[idx] = { ...intervals[idx], close: e.target.value };
                                return { ...prev, [day]: { ...prev[day], intervals } };
                              })
                            }
                            className="w-28 text-sm"
                          />
                          {dh.intervals.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setBusinessHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day], intervals: prev[day].intervals.filter((_, i) => i !== idx) },
                                }))
                              }
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Subdomain larfmenu */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />Subdomínio Larf Menu
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure o subdomínio para que o cardápio fique acessível em <strong>seurestaurante.larfmenu.com.br</strong>.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subdomínio</Label>
                  <div className="flex items-center mt-1.5">
                    <Input
                      value={form.customDomain}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setForm((f) => ({ ...f, customDomain: val }));
                      }}
                      placeholder="seurestaurante"
                      className="rounded-r-none font-mono text-sm border-r-0 flex-1"
                    />
                    <span className="px-3 py-2 bg-muted border border-input rounded-r-md text-sm text-muted-foreground font-mono whitespace-nowrap">.larfmenu.com.br</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use apenas letras minúsculas, números e hífens. Exemplo: <code className="bg-muted px-1 rounded">thiosti</code> → <strong>thiosti.larfmenu.com.br</strong>
                  </p>
                </div>
                {form.customDomain && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-green-800">✅ URL do cardápio via subdomínio:</p>
                    <a
                      href={`https://${form.customDomain}.larfmenu.com.br`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-green-700 hover:underline break-all block"
                    >
                      https://{form.customDomain}.larfmenu.com.br
                    </a>
                    <p className="text-xs text-green-600 mt-1">
                      ⚠️ Salve as configurações para ativar o subdomínio. O DNS wildcard <code className="bg-green-100 px-1 rounded">*.larfmenu.com.br</code> já está configurado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exchange Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>💱</span> Cotação de Moedas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure manualmente a cotação do Dólar e Euro em relação ao Real. Se deixar em branco, a cotação será obtida automaticamente.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dólar (US$) — valor em R$</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 5.80"
                        value={form.usdRate}
                        onChange={(e) => setForm((f) => ({ ...f, usdRate: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">1 USD = R$ {form.usdRate || "automático"}</p>
                  </div>
                  <div>
                    <Label>Euro (€) — valor em R$</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 6.20"
                        value={form.eurRate}
                        onChange={(e) => setForm((f) => ({ ...f, eurRate: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">1 EUR = R$ {form.eurRate || "automático"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formas de Pagamento</CardTitle>
                <p className="text-sm text-muted-foreground">Cole os links de pagamento das plataformas.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mercado Pago (link de cobrança)</Label>
                  <Input value={form.paymentMercadoPago} onChange={(e) => setForm((f) => ({ ...f, paymentMercadoPago: e.target.value }))} placeholder="https://mpago.la/..." className="mt-1.5" />
                </div>
                <div>
                  <Label>PagSeguro (link de cobrança)</Label>
                  <Input value={form.paymentPagSeguro} onChange={(e) => setForm((f) => ({ ...f, paymentPagSeguro: e.target.value }))} placeholder="https://pagseguro.uol.com.br/..." className="mt-1.5" />
                </div>
                <div>
                  <Label>Pic Pay (link de cobrança)</Label>
                  <Input value={form.paymentPicPay} onChange={(e) => setForm((f) => ({ ...f, paymentPicPay: e.target.value }))} placeholder="https://picpay.me/..." className="mt-1.5" />
                </div>
              </CardContent>
            </Card>

            {/* Print Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Printer className="h-4 w-4" />Imprimir Cardápio
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gere uma versão imprimível do cardápio com opções de idioma e moeda.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Idioma</Label>
                    <select
                      value={printLang}
                      onChange={(e) => setPrintLang(e.target.value as "pt" | "es" | "en")}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="pt">Português (PT)</option>
                      <option value="es">Español (ES)</option>
                      <option value="en">English (EN)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Moeda</Label>
                    <select
                      value={printCurrency}
                      onChange={(e) => setPrintCurrency(e.target.value as "BRL" | "USD" | "EUR")}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="BRL">Real (R$)</option>
                      <option value="USD">Dólar (US$)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Formato</Label>
                  <div className="mt-1.5 space-y-2">
                    {(["all", "category", "category-page"] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPrintMode(mode)}
                        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-left transition-all border"
                        style={{
                          backgroundColor: printMode === mode ? form.colorTheme + "15" : "transparent",
                          color: printMode === mode ? form.colorTheme : undefined,
                          borderColor: printMode === mode ? form.colorTheme : undefined,
                        }}
                      >
                        {mode === "all" ? "Cardápio completo" : mode === "category" ? "Apenas uma categoria" : "Uma categoria por página"}
                      </button>
                    ))}
                  </div>
                </div>
                {printMode === "category" && (
                  <div>
                    <Label>Selecionar categoria</Label>
                    <select
                      value={printCatId ?? ""}
                      onChange={(e) => setPrintCatId(Number(e.target.value) || null)}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecione...</option>
                      {(printCategories as any[]).filter((c: any) => c.active).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {printLang === "es" && c.nameEs ? c.nameEs : printLang === "en" && c.nameEn ? c.nameEn : c.namePt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button type="button" onClick={handlePrint} className="w-full" style={{ backgroundColor: form.colorTheme }}>
                  <Printer className="h-4 w-4 mr-2" />
                  Gerar Impressão
                </Button>
              </CardContent>
            </Card>

            {/* Template selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Aparência do Cardápio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Escolha o layout visual do seu cardápio público.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    { id: "classic", label: "Classic", desc: "Banner + tabs + grid 2 colunas", colors: ["#f8fafc", "#e85d04", "#0f172a"] },
                    { id: "dark", label: "Modern Dark", desc: "Fundo escuro + sidebar + cards premium", colors: ["#0f0f19", "#7c3aed", "#e8e8f8"] },
                    { id: "minimal", label: "Minimal", desc: "Lista simples, clean, sem banner", colors: ["#ffffff", "#111827", "#9ca3af"] },
                    { id: "magazine", label: "Magazine", desc: "Cards grandes com foto de fundo", colors: ["#1a1a1a", "#f59e0b", "#ffffff"] },
                    { id: "street", label: "Street Food", desc: "Cores vibrantes, visual animado", colors: ["#fef3c7", "#dc2626", "#1f2937"] },
                  ] as const).map(tpl => (
                    <button key={tpl.id} type="button" onClick={() => setMenuTemplate(tpl.id)}
                      className="relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                      style={{
                        borderColor: menuTemplate === tpl.id ? form.colorTheme : "#e2e8f0",
                        backgroundColor: menuTemplate === tpl.id ? form.colorTheme + "10" : "#f8fafc",
                      }}>
                      <div className="flex gap-1 mb-2">
                        {tpl.colors.map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <p className="font-semibold text-sm">{tpl.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.desc}</p>
                      {menuTemplate === tpl.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: form.colorTheme }}>✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pb-8">
              <Button type="submit" size="lg" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
