import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  ChefHat,
  Edit2,
  ImagePlus,
  Languages,
  LayoutGrid,
  LogOut,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

interface ItemForm {
  categoryId: string;
  namePt: string;
  nameEs: string;
  nameEn: string;
  descriptionPt: string;
  descriptionEs: string;
  descriptionEn: string;
  priceBrl: string;
  priceWhatsapp: boolean;
  sortOrder: number;
  imageUrl: string;
  imageKey: string;
  imageUrls: string[];   // carrossel
  isVegetarian: boolean;
  containsGluten: boolean;
  containsLactose: boolean;
  isSpicy: boolean;
  chefRecommended: boolean;
}

const emptyForm: ItemForm = {
  categoryId: "",
  namePt: "",
  nameEs: "",
  nameEn: "",
  descriptionPt: "",
  descriptionEs: "",
  descriptionEn: "",
  priceBrl: "",
  priceWhatsapp: false,
  sortOrder: 0,
  imageUrl: "",
  imageKey: "",
  imageUrls: [],
  isVegetarian: false,
  containsGluten: false,
  containsLactose: false,
  isSpicy: false,
  chefRecommended: false,
};

export default function AdminMenuItems() {
  const { user, isAuthenticated, logout } = useAuth();
  const params = useParams<{ companyId: string }>();
  const companyId = parseInt(params.companyId ?? "0");
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: company } = trpc.companies.getById.useQuery(
    { id: companyId },
    { enabled: !!companyId && isAuthenticated }
  );
  const { data: categories } = trpc.categories.list.useQuery(
    { companyId },
    { enabled: !!companyId && isAuthenticated }
  );
  const { data: items, isLoading } = trpc.menuItems.list.useQuery(
    { companyId },
    { enabled: !!companyId && isAuthenticated }
  );

  const uploadImageMutation = trpc.menuItems.uploadImage.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({ ...f, imageUrl: data.url, imageKey: data.key }));
      setPreviewUrl(data.url);
      setUploadingImage(false);
      toast.success("Foto enviada!");
    },
    onError: (e) => {
      setUploadingImage(false);
      toast.error("Erro ao enviar foto: " + e.message);
    },
  });

  const createMutation = trpc.menuItems.create.useMutation({
    onSuccess: () => {
      utils.menuItems.list.invalidate();
      setOpen(false);
      setForm(emptyForm);
      setPreviewUrl("");
      toast.success("Item criado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.menuItems.update.useMutation({
    onSuccess: () => {
      utils.menuItems.list.invalidate();
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      setPreviewUrl("");
      toast.success("Item atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.menuItems.delete.useMutation({
    onSuccess: () => {
      utils.menuItems.list.invalidate();
      toast.success("Item removido.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.menuItems.toggleAvailability.useMutation({
    onSuccess: () => utils.menuItems.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const removeImageMutation = trpc.menuItems.removeImage.useMutation({
    onSuccess: () => {
      utils.menuItems.list.invalidate({ companyId });
      toast.success("Imagem removida!");
    },
    onError: (e) => toast.error(e.message),
  });

  const translateAllMutation = trpc.menuItems.translateAll.useMutation({
    onSuccess: (data: { translated: number }) => {
      toast.success(`${data.translated} item(s) traduzido(s) com sucesso!`);
      utils.menuItems.list.invalidate({ companyId });
      utils.categories.list.invalidate({ companyId });
    },
    onError: (e: { message: string }) => toast.error(`Erro ao traduzir: ${e.message}`),
  });

  const translateBatchMutation = trpc.translation.translateBatch.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({
        ...f,
        nameEs: data["name"]?.["es"] ?? f.nameEs,
        nameEn: data["name"]?.["en"] ?? f.nameEn,
        descriptionEs: data["description"]?.["es"] ?? f.descriptionEs,
        descriptionEn: data["description"]?.["en"] ?? f.descriptionEn,
      }));
      toast.success("Tradução aplicada!");
    },
    onError: (e) => toast.error(`Erro na tradução: ${e.message}`),
  });

  function handleTranslate() {
    if (!form.namePt.trim()) {
      toast.error("Digite o nome em Português antes de traduzir.");
      return;
    }
    const fields: { key: string; text: string }[] = [
      { key: "name", text: form.namePt },
    ];
    if (form.descriptionPt.trim()) {
      fields.push({ key: "description", text: form.descriptionPt });
    }
    translateBatchMutation.mutate({ fields, targets: ["es", "en"] });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto muito grande. Máximo 5MB.");
      return;
    }
    setUploadingImage(true);
    // Redimensionar para max 600px e comprimir para caber no banco
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      const base64 = dataUrl.split(",")[1];
      uploadImageMutation.mutate({
        companyId,
        fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
        contentType: "image/jpeg",
        base64,
      });
    };
    img.src = objectUrl;
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, sortOrder: (items?.length ?? 0) + 1 });
    setPreviewUrl("");
    setOpen(true);
  }

  function openEdit(item: NonNullable<typeof items>[number]) {
    setEditId(item.id);
    setForm({
      categoryId: String(item.categoryId),
      namePt: item.namePt,
      nameEs: item.nameEs ?? "",
      nameEn: item.nameEn ?? "",
      descriptionPt: item.descriptionPt ?? "",
      descriptionEs: item.descriptionEs ?? "",
      descriptionEn: item.descriptionEn ?? "",
      priceBrl: item.priceBrl,
      sortOrder: item.sortOrder,
      imageUrl: item.imageUrl ?? "",
      imageKey: item.imageKey ?? "",
      imageUrls: (() => { try { return JSON.parse((item as any).imageUrls ?? "[]"); } catch { return []; } })(),
      priceWhatsapp: (item as any).priceWhatsapp ?? false,
      isVegetarian: item.isVegetarian ?? false,
      containsGluten: item.containsGluten ?? false,
      containsLactose: item.containsLactose ?? false,
      isSpicy: item.isSpicy ?? false,
      chefRecommended: item.chefRecommended ?? false,
    });
    setPreviewUrl(item.imageUrl ?? "");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: parseInt(form.categoryId),
      companyId,
      imageUrls: JSON.stringify(form.imageUrls),
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const filteredItems =
    filterCategory === "all"
      ? items
      : items?.filter((i) => String(i.categoryId) === filterCategory);

  function getCategoryName(catId: number) {
    return categories?.find((c) => c.id === catId)?.namePt ?? "—";
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
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            Visão Geral
          </button>
          {(user?.role === "superadmin" || user?.role === "admin") && (
            <button
              onClick={() => navigate("/admin/companies")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Empresas
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cardápio</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/companies/${companyId}/categories`)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Categorias
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={translateAllMutation.isPending}
              onClick={() => translateAllMutation.mutate({ companyId })}
            >
              <Languages className="h-4 w-4 mr-2" />
              {translateAllMutation.isPending ? "Traduzindo..." : "Traduzir Cardápio"}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Filter by category */}
        {categories && categories.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={filterCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory("all")}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={filterCategory === String(cat.id) ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(String(cat.id))}
              >
                {cat.namePt}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`border-border overflow-hidden ${!item.available ? "opacity-60" : ""}`}
              >
                {item.imageUrl ? (
                  <div className="aspect-video bg-muted overflow-hidden relative group">
                    <img
                      src={item.imageUrl}
                      alt={item.namePt}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        if (confirm(`Remover imagem de "${item.namePt}"?`)) {
                          removeImageMutation.mutate({ id: item.id, companyId });
                        }
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.namePt}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryName(item.categoryId)}</p>
                    </div>
                    <span className="font-bold text-primary whitespace-nowrap">
                      R$ {Number(item.priceBrl).toFixed(2)}
                    </span>
                  </div>
                  {item.descriptionPt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {item.descriptionPt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.available}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: item.id, companyId, available: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.available ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Excluir "${item.namePt}"?`)) {
                            deleteMutation.mutate({ id: item.id, companyId });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum item no cardápio.</p>
              {!categories?.length && (
                <p className="text-sm text-muted-foreground mt-1">
                  Crie categorias primeiro antes de adicionar itens.
                </p>
              )}
              <Button className="mt-4" onClick={openCreate} disabled={!categories?.length}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Item Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Item" : "Novo Item do Cardápio"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              {/* Image upload */}
              <div>
                <Label>Foto do Prato</Label>
                <div
                  className="mt-1.5 border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <ImagePlus className="h-8 w-8 text-white" />
                        <span className="text-white text-sm ml-2">Trocar foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-8 w-8 mb-2" />
                      <p className="text-sm">Clique para enviar foto</p>
                      <p className="text-xs">JPG, PNG ou WebP — máx. 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadingImage}
                />
                 {uploadingImage && (
                  <p className="text-xs text-muted-foreground mt-1">Enviando foto...</p>
                )}
                {previewUrl && (
                  <button
                    type="button"
                    className="mt-1.5 text-xs text-destructive hover:underline flex items-center gap-1"
                    onClick={() => {
                      setPreviewUrl("");
                      setForm((f) => ({ ...f, imageUrl: "", imageKey: "" }));
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover foto
                  </button>
                )}
              </div>

              {/* Carrossel de fotos adicionais */}
              <div>
                <Label className="text-sm font-medium">Fotos adicionais (carrossel)</Label>
                <p className="text-xs text-muted-foreground mb-2">Adicione até 4 fotos extras que aparecem no preview do item.</p>
                <div className="flex flex-wrap gap-2">
                  {form.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      <img src={url} alt={`foto ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-border" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >✕</button>
                    </div>
                  ))}
                  {form.imageUrls.length < 4 && (
                    <label className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                      <span className="text-xl text-muted-foreground">+</span>
                      <span className="text-xs text-muted-foreground">foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const base64 = (reader.result as string).split(",")[1]!;
                            uploadImageMutation.mutate(
                              { companyId, fileName: file.name, contentType: file.type, base64 },
                              { onSuccess: (data) => setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, data.url] })) }
                            );
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              {/* Category */}
              <div>
                <Label>Categoria *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                  required
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.namePt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Names */}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Nomes e Descrições</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={handleTranslate}
                  disabled={translateBatchMutation.isPending || !form.namePt.trim()}
                  title="Traduzir nome e descrição automaticamente para Espanhol e Inglês"
                >
                  <Languages className="h-3.5 w-3.5" />
                  {translateBatchMutation.isPending ? "Traduzindo..." : "Traduzir ES + EN"}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="namePt">Nome PT *</Label>
                  <Input
                    id="namePt"
                    value={form.namePt}
                    onChange={(e) => setForm((f) => ({ ...f, namePt: e.target.value }))}
                    required
                    placeholder="Frango Grelhado"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="nameEs">Nombre ES</Label>
                  <Input
                    id="nameEs"
                    value={form.nameEs}
                    onChange={(e) => setForm((f) => ({ ...f, nameEs: e.target.value }))}
                    placeholder="Pollo a la Parrilla"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="nameEn">Name EN</Label>
                  <Input
                    id="nameEn"
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="Grilled Chicken"
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="descPt">Descrição PT</Label>
                  <Textarea
                    id="descPt"
                    value={form.descriptionPt}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionPt: e.target.value }))}
                    placeholder="Descrição em português..."
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="descEs">Descripción ES</Label>
                  <Textarea
                    id="descEs"
                    value={form.descriptionEs}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionEs: e.target.value }))}
                    placeholder="Descripción en español..."
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="descEn">Description EN</Label>
                  <Textarea
                    id="descEn"
                    value={form.descriptionEn}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                    placeholder="Description in English..."
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>
              </div>

              {/* Price & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">Preço em R$ (BRL) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.priceBrl}
                    onChange={(e) => setForm((f) => ({ ...f, priceBrl: e.target.value }))}
                    disabled={form.priceWhatsapp}
                    placeholder={form.priceWhatsapp ? "Sob consulta" : "0.00"}
                    className="mt-1.5"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="priceWhatsapp"
                      checked={form.priceWhatsapp}
                      onChange={(e) => setForm((f) => ({ ...f, priceWhatsapp: e.target.checked, priceBrl: e.target.checked ? "0" : f.priceBrl }))}
                      className="rounded"
                    />
                    <label htmlFor="priceWhatsapp" className="text-xs text-muted-foreground cursor-pointer">
                      Preço sob consulta via WhatsApp
                    </label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Ordem</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                    min={0}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Dietary restrictions & Chef recommended */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Restrições Alimentares e Destaques</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥗</span>
                      <span className="text-sm">Vegetariano</span>
                    </div>
                    <Switch
                      checked={form.isVegetarian}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, isVegetarian: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌾</span>
                      <span className="text-sm">Contém Glúten</span>
                    </div>
                    <Switch
                      checked={form.containsGluten}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, containsGluten: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥛</span>
                      <span className="text-sm">Contém Lactose</span>
                    </div>
                    <Switch
                      checked={form.containsLactose}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, containsLactose: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌶️</span>
                      <span className="text-sm">Picante</span>
                    </div>
                    <Switch
                      checked={form.isSpicy}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, isSpicy: v }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👨‍🍳</span>
                    <div>
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Recomendado pelo Chef</span>
                      <p className="text-xs text-muted-foreground">Aparece no topo do cardápio</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.chefRecommended}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, chefRecommended: v }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    createMutation.isPending || updateMutation.isPending || uploadingImage
                  }
                >
                  {editId ? "Salvar" : "Criar Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
