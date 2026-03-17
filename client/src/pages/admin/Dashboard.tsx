import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

import {
  Bot,
  Building2,
  ChefHat,
  LayoutGrid,
  LogOut,
  Plus,
  Settings,
  Star,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const COLOR_DOT: Record<string, string> = {
  orange: "#e85d04",
  green: "#2d6a4f",
  blue: "#1d4ed8",
  purple: "#7c3aed",
  red: "#dc2626",
};

export default function AdminDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: companies, isLoading: loadingCompanies } = trpc.companies.myCompanies.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ChefHat className="h-10 w-10 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-20 hidden md:flex">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-lg">CardápioDigital</span>
          </div>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Painel Administrativo</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            Visão Geral
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => navigate("/admin/companies")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Empresas
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => navigate("/admin/users")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Users className="h-4 w-4" />
              Usuários
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          </div>
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

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="font-bold">CardápioDigital</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin
              ? "Você tem acesso a todos os restaurantes da plataforma."
              : "Gerencie o cardápio do seu restaurante."}
          </p>
        </div>

        {/* Companies grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isSuperAdmin ? "Todos os Restaurantes" : "Meus Restaurantes"}
          </h2>
          {isSuperAdmin && (
            <Button size="sm" onClick={() => navigate("/admin/companies")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Restaurante
            </Button>
          )}
        </div>

        {loadingCompanies ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => {
              const themeColor = COLOR_DOT[company.colorTheme ?? "orange"] ?? "#e85d04";
              return (
                <Card
                  key={company.id}
                  className="hover:shadow-md transition-shadow border-border overflow-hidden"
                >
                  {/* Color stripe */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: themeColor }} />
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: themeColor + "20" }}>
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt={company.name} className="w-10 h-10 object-cover" />
                        ) : (
                          <UtensilsCrossed className="h-5 w-5" style={{ color: themeColor }} />
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          company.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {company.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <CardTitle className="text-base mt-2">{company.name}</CardTitle>
                    <CardDescription className="text-xs">/menu/{company.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {/* Row 1: categories + items */}
                    <div className="flex gap-2">
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
                        style={{ backgroundColor: themeColor, borderColor: themeColor }}
                        onClick={() => navigate(`/admin/companies/${company.id}/items`)}
                      >
                        <ChefHat className="h-3 w-3 mr-1" />
                        Cardápio
                      </Button>
                    </div>
                    {/* Row 2: import button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-dashed"
                      onClick={() => navigate(`/admin/companies/${company.id}/import`)}
                    >
                      <Bot className="h-3 w-3 mr-1" />
                      Importar Cardápio com IA
                    </Button>
                    {/* Row 3: settings + members + reviews */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/admin/companies/${company.id}/settings`)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Config.
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => navigate(`/admin/companies/${company.id}/members`)}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Membros
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/admin/companies/${company.id}/reviews`)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Reviews
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
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum restaurante cadastrado</p>
              {isSuperAdmin && (
                <Button className="mt-4" onClick={() => navigate("/admin/companies")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeiro restaurante
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
