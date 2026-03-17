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
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  ChefHat,
  Crown,
  LayoutGrid,
  LogOut,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

const MEMBER_ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  owner: { label: "Proprietário", color: "bg-amber-100 text-amber-700", icon: <Crown className="h-3 w-3" /> },
  manager: { label: "Gerente", color: "bg-blue-100 text-blue-700", icon: <Shield className="h-3 w-3" /> },
};

export default function CompanyMembers() {
  const { user, isAuthenticated, logout } = useAuth();
  const params = useParams<{ companyId: string }>();
  const companyId = parseInt(params.companyId ?? "0");
  const [, navigate] = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  const [emailSearch, setEmailSearch] = useState("");
  const [searchEmail, setSearchEmail] = useState(""); // committed search
  const [selectedRole, setSelectedRole] = useState<"owner" | "manager">("manager");
  const [newMemberName, setNewMemberName] = useState("");

  const utils = trpc.useUtils();
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId }, { enabled: !!companyId && isAuthenticated });
  const { data: members, isLoading } = trpc.companies.getMembers.useQuery({ companyId }, { enabled: !!companyId && isAuthenticated });

  // Search user by email (only fires when searchEmail is set)
  const { data: foundUser, isFetching: searching } = trpc.companies.findUserByEmail.useQuery(
    { companyId, email: searchEmail },
    { enabled: !!searchEmail && searchEmail.includes("@"), retry: false }
  );

  const createAndAddMutation = trpc.companies.createAndAddMember.useMutation({
    onSuccess: (data) => {
      utils.companies.getMembers.invalidate();
      setAddOpen(false);
      setEmailSearch("");
      setSearchEmail("");
      setNewMemberName("");
      if (data.created) {
        toast.success("Usuário criado e adicionado à empresa!");
      } else {
        toast.success("Membro adicionado!");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const addMutation = trpc.companies.addMember.useMutation({
    onSuccess: () => {
      utils.companies.getMembers.invalidate();
      setAddOpen(false);
      setEmailSearch("");
      setSearchEmail("");
      toast.success("Membro adicionado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRoleMutation = trpc.companies.updateMemberRole.useMutation({
    onSuccess: () => { utils.companies.getMembers.invalidate(); toast.success("Papel atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.companies.removeMember.useMutation({
    onSuccess: () => { utils.companies.getMembers.invalidate(); toast.success("Membro removido."); },
    onError: (e) => toast.error(e.message),
  });

  const memberUserIds = new Set(members?.map((m) => m.user.id));
  const isAlreadyMember = foundUser && memberUserIds.has(foundUser.id);
  const userNotFound = !!searchEmail && !searching && !foundUser;

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" />
              Membros da Empresa
            </h1>
            <p className="text-sm text-muted-foreground">{company?.name}</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar membro
          </Button>
        </div>

        {/* Info box */}
          <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <p className="font-semibold mb-1">Como funciona o acesso por empresa</p>
          <p>Cada membro adicionado aqui pode acessar <strong>somente</strong> este cardápio. Busque pelo e-mail — se o usuário ainda não estiver cadastrado, você pode criá-lo diretamente.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : members && members.length > 0 ? (
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-mail</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Papel na empresa</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(({ user: u, member }) => {
                      const roleInfo = MEMBER_ROLE_LABELS[member.role] ?? MEMBER_ROLE_LABELS.manager;
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">{(u.name ?? u.email ?? "?")[0].toUpperCase()}</span>
                              </div>
                              <span className="font-medium text-foreground">{u.name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Select
                              value={member.role}
                              onValueChange={(v) => updateRoleMutation.mutate({ companyId, userId: u.id, role: v as "owner" | "manager" })}
                            >
                              <SelectTrigger className="w-36 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Proprietário</SelectItem>
                                <SelectItem value="manager">Gerente</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm(`Remover ${u.name ?? "este usuário"} da empresa?`)) removeMutation.mutate({ companyId, userId: u.id }); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum membro vinculado.</p>
              <Button className="mt-4" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />Adicionar primeiro membro
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setEmailSearch(""); setSearchEmail(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar membro</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Buscar por e-mail</Label>
              <p className="text-xs text-muted-foreground mb-2">O usuário precisa ter feito login na plataforma pelo menos uma vez.</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") setSearchEmail(emailSearch); }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSearchEmail(emailSearch)}
                  disabled={!emailSearch.includes("@")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search result */}
            {searchEmail && (
              <div className="rounded-xl border border-border p-3">
                {searching ? (
                  <p className="text-sm text-muted-foreground text-center">Buscando...</p>
                ) : foundUser ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{(foundUser.name ?? foundUser.email ?? "?")[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{foundUser.name ?? "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                    </div>
                    {isAlreadyMember && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Já é membro</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-700 font-medium">Usuário não encontrado. Preencha o nome para criar um novo acesso:</p>
                    <div>
                      <Label className="text-xs">Nome completo</Label>
                      <Input
                        className="mt-1"
                        placeholder="Nome do funcionário"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {foundUser && !isAlreadyMember && (
              <div>
                <Label>Papel</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "owner" | "manager")}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancelar</Button>
              {foundUser && !isAlreadyMember ? (
                <Button
                  className="flex-1"
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate({ companyId, userId: foundUser.id, role: selectedRole })}
                >
                  {addMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              ) : userNotFound ? (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!newMemberName || createAndAddMutation.isPending}
                  onClick={() => createAndAddMutation.mutate({ companyId, name: newMemberName, email: searchEmail, role: selectedRole })}
                >
                  {createAndAddMutation.isPending ? "Criando..." : "Criar e adicionar"}
                </Button>
              ) : (
                <Button className="flex-1" disabled>Adicionar</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
