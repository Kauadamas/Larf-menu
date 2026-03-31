import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Globe,
  LayoutGrid,
  LogOut,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface CompanyForm {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  customDomain: string;
}

const emptyForm: CompanyForm = {
  name: "",
  slug: "",
  description: "",
  address: "",
  phone: "",
  customDomain: "",
};

export default function AdminCompanies() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: companies, isLoading } = trpc.companies.list.useQuery();

  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      utils.companies.myCompanies.invalidate();
      setOpen(false);
      setForm(emptyForm);
      toast.success("Restaurante criado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      utils.companies.myCompanies.invalidate();
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success("Restaurante atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      utils.companies.myCompanies.invalidate();
      toast.success("Restaurante removido.");
    },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: NonNullable<typeof companies>[number]) {
    setEditId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      address: c.address ?? "",
      phone: c.phone ?? "",
      customDomain: c.customDomain ?? "",
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  function slugify(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

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
          <button
            onClick={() => navigate("/admin/companies")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Building2 className="h-4 w-4" />
            Empresas
          </button>
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
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Restaurantes</h1>
            <p className="text-sm text-muted-foreground">Gerencie todos os restaurantes da plataforma</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Restaurante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "Editar Restaurante" : "Novo Restaurante"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nome do Restaurante *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({
                          ...f,
                          name,
                          slug: editId ? f.slug : slugify(name),
                        }));
                      }}
                      required
                      placeholder="Ex: Restaurante do João"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">/menu/</span>
                      <Input
                        id="slug"
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        required
                        pattern="[a-z0-9-]+"
                        placeholder="restaurante-do-joao"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apenas letras minúsculas, números e hífens
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Breve descrição do restaurante"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customDomain">Domínio Customizado</Label>
                    <Input
                      id="customDomain"
                      value={form.customDomain}
                      onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
                      placeholder="cardapio.empresa.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Rua, número, cidade"
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editId ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <Card key={company.id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(company)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Excluir "${company.name}"?`)) {
                            deleteMutation.mutate({ id: company.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{company.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">/menu/{company.slug}</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {company.customDomain && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {company.customDomain}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => navigate(`/admin/companies/${company.id}/categories`)}
                    >
                      <LayoutGrid className="h-3 w-3 mr-1" />
                      Categorias
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => navigate(`/admin/companies/${company.id}/items`)}
                    >
                      <ChefHat className="h-3 w-3 mr-1" />
                      Cardápio
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => window.open(`/menu/${company.slug}`, "_blank")}
                  >
                    Ver cardápio público →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum restaurante cadastrado ainda.</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro restaurante
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
