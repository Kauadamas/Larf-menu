import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  ChefHat,
  Edit2,
  GripVertical,
  Languages,
  LayoutGrid,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

interface CategoryForm {
  namePt: string;
  nameEs: string;
  nameEn: string;
  sortOrder: number;
}

const emptyForm: CategoryForm = { namePt: "", nameEs: "", nameEn: "", sortOrder: 0 };

export default function AdminCategories() {
  const { user, isAuthenticated, logout } = useAuth();
  const params = useParams<{ companyId: string }>();
  const companyId = parseInt(params.companyId ?? "0");
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId }, { enabled: !!companyId && isAuthenticated });
  const { data: categories, isLoading } = trpc.categories.list.useQuery(
    { companyId },
    { enabled: !!companyId && isAuthenticated }
  );

  const translateMutation = trpc.translation.translate.useMutation({
    onSuccess: (data) => {
      setForm((f) => ({
        ...f,
        nameEs: data["es"] ?? f.nameEs,
        nameEn: data["en"] ?? f.nameEn,
      }));
      toast.success("Tradução aplicada!");
    },
    onError: (e) => toast.error(`Erro na tradução: ${e.message}`),
  });

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setOpen(false);
      setForm(emptyForm);
      toast.success("Categoria criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success("Categoria atualizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("Categoria removida.");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.categories.update.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, sortOrder: (categories?.length ?? 0) + 1 });
    setOpen(true);
  }

  function openEdit(c: NonNullable<typeof categories>[number]) {
    setEditId(c.id);
    setForm({
      namePt: c.namePt,
      nameEs: c.nameEs ?? "",
      nameEn: c.nameEn ?? "",
      sortOrder: c.sortOrder,
    });
    setOpen(true);
  }

  function handleTranslate() {
    if (!form.namePt.trim()) {
      toast.error("Digite o nome em Português antes de traduzir.");
      return;
    }
    translateMutation.mutate({ text: form.namePt, targets: ["es", "en"] });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, companyId, ...form });
    } else {
      createMutation.mutate({ companyId, ...form });
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/companies/${companyId}/items`)}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Ver Cardápio
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  {/* PT field + translate button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="namePt">
                        Nome em Português <span className="text-destructive">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        onClick={handleTranslate}
                        disabled={translateMutation.isPending || !form.namePt.trim()}
                        title="Traduzir automaticamente para Espanhol e Inglês"
                      >
                        <Languages className="h-3.5 w-3.5" />
                        {translateMutation.isPending ? "Traduzindo..." : "Traduzir ES + EN"}
                      </Button>
                    </div>
                    <Input
                      id="namePt"
                      value={form.namePt}
                      onChange={(e) => setForm((f) => ({ ...f, namePt: e.target.value }))}
                      required
                      placeholder="Ex: Pratos Principais"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite em português e clique em "Traduzir ES + EN" para preencher automaticamente.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="nameEs">
                      Nombre en Español{" "}
                      <span className="text-xs text-muted-foreground">(preenchido automaticamente)</span>
                    </Label>
                    <Input
                      id="nameEs"
                      value={form.nameEs}
                      onChange={(e) => setForm((f) => ({ ...f, nameEs: e.target.value }))}
                      placeholder="Ex: Platos Principales"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nameEn">
                      Name in English{" "}
                      <span className="text-xs text-muted-foreground">(auto-filled)</span>
                    </Label>
                    <Input
                      id="nameEn"
                      value={form.nameEn}
                      onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                      placeholder="Ex: Main Courses"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
                      }
                      min={0}
                    />
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
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editId ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((cat) => (
              <Card key={cat.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{cat.namePt}</span>
                        {cat.nameEs && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            ES: {cat.nameEs}
                          </span>
                        )}
                        {cat.nameEn && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            EN: {cat.nameEn}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ordem: {cat.sortOrder}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={cat.active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: cat.id, companyId, active: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Excluir categoria "${cat.namePt}"?`)) {
                            deleteMutation.mutate({ id: cat.id, companyId });
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
              <LayoutGrid className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie até 22 categorias para organizar seu cardápio.
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira categoria
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
