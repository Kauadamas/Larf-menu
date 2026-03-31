import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  ChefHat,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  review: { label: "Avaliação", color: "bg-yellow-100 text-yellow-700" },
  suggestion: { label: "Sugestão", color: "bg-blue-100 text-blue-700" },
  complaint: { label: "Reclamação", color: "bg-red-100 text-red-700" },
};

export default function AdminReviews() {
  const { user, isAuthenticated, logout } = useAuth();
  const params = useParams<{ companyId: string }>();
  const companyId = parseInt(params.companyId ?? "0");
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId }, { enabled: !!companyId && isAuthenticated });
  const { data: reviews, isLoading } = trpc.reviews.list.useQuery({ companyId }, { enabled: !!companyId && isAuthenticated });

  const deleteMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => { utils.reviews.list.invalidate(); toast.success("Avaliação removida."); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) { window.location.replace("/login"); return null; }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-20 hidden md:flex">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-lg">CardápioDigital</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"><LayoutGrid className="h-4 w-4" />Visão Geral</button>
          <button onClick={() => navigate("/admin/companies")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"><Building2 className="h-4 w-4" />Empresas</button>
          {(user?.role === "superadmin" || user?.role === "admin") && (
            <button onClick={() => navigate("/admin/users")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"><Users className="h-4 w-4" />Usuários</button>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6" />
            Avaliações e Feedbacks
          </h1>
          <p className="text-sm text-muted-foreground">{company?.name}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => {
              const typeInfo = TYPE_LABELS[review.type] ?? TYPE_LABELS.review;
              return (
                <Card key={review.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          {review.rating && (
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className="h-3.5 w-3.5" fill={s<=review.rating!?"#f59e0b":"none"} stroke={s<=review.rating!?"#f59e0b":"#d1d5db"} />
                              ))}
                            </div>
                          )}
                          {review.name && <span className="text-xs font-medium text-foreground">{review.name}</span>}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{review.message}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {company?.whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                            onClick={() => {
                              const msg = encodeURIComponent(`Resposta à avaliação de ${review.name ?? "cliente"}:\n\n"${review.message}"\n\nOlá! Obrigado pelo seu feedback.`);
                              window.open(`https://wa.me/${company.whatsapp}?text=${msg}`, "_blank");
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Excluir esta avaliação?")) deleteMutation.mutate({ id: review.id, companyId }); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação recebida ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">As avaliações dos clientes aparecerão aqui.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
