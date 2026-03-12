import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

import { ChefHat, Globe, LayoutDashboard, RefreshCw, Smartphone, Store } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl text-foreground">CardápioDigital</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Olá, {user?.name?.split(" ")[0]}
                </span>
                <Button onClick={() => navigate("/admin")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Painel Admin
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href="/login">Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />
            Cardápio trilíngue para turistas
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            Cardápio Digital
            <span className="text-primary block">para Restaurantes</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Plataforma completa para restaurantes que atendem turistas. Cardápio em Português, Espanhol e Inglês, com preços em Real, Dólar e Euro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate("/admin")}>
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Acessar Painel
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href="/login">Começar agora</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <h2 className="text-2xl font-bold text-center text-foreground mb-12">
            Tudo que seu restaurante precisa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Trilíngue",
                desc: "Cardápio em Português, Espanhol e Inglês. Turistas leem no seu idioma.",
              },
              {
                icon: RefreshCw,
                title: "Multi-moeda",
                desc: "Preços convertidos automaticamente em Real, Dólar e Euro com taxas em tempo real.",
              },
              {
                icon: Smartphone,
                title: "Mobile-first",
                desc: "Interface otimizada para smartphones. Turistas acessam direto no celular.",
              },
              {
                icon: Store,
                title: "Multi-tenant",
                desc: "Gerencie múltiplos restaurantes em uma única plataforma. Dados isolados por empresa.",
              },
              {
                icon: LayoutDashboard,
                title: "Painel completo",
                desc: "Gerencie categorias, pratos, fotos e preços com facilidade.",
              },
              {
                icon: ChefHat,
                title: "Disponibilidade",
                desc: "Ative ou desative pratos temporariamente sem precisar excluir.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">CardápioDigital</span>
          </div>
          <p>Plataforma multi-tenant para restaurantes voltados a turistas</p>
        </div>
      </footer>
    </div>
  );
}
