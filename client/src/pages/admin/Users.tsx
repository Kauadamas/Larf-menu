import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Shield,
  Trash2,
  User,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  superadmin: {
    label: "Super Admin",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <Crown className="h-3 w-3" />,
  },
  admin: {
    label: "Admin",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <Shield className="h-3 w-3" />,
  },
  user: {
    label: "Usuário",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <User className="h-3 w-3" />,
  },
};

export default function AdminUsers() {
  const { user: me, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editUser, setEditUser] = useState<{ id: number; name: string | null; role: string } | null>(null);
  const [newRole, setNewRole] = useState<"user" | "admin" | "superadmin">("user");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin" | "superadmin">("user");
  const [passwordUser, setPasswordUser] = useState<{ id: number; name: string | null } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const utils = trpc.useUtils();
  const { data: usersList, isLoading } = trpc.users.list.useQuery(undefined, {
    enabled: isAuthenticated && (me?.role === "superadmin" || me?.role === "admin"),
  });

  const { data: pendingList } = trpc.users.pending.useQuery(undefined, {
    enabled: isAuthenticated && (me?.role === "superadmin" || me?.role === "admin"),
  });

  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      utils.users.pending.invalidate();
      toast.success("Usuário aprovado!");
    },
  });

  const rejectMutation = trpc.users.reject.useMutation({
    onSuccess: () => {
      utils.users.pending.invalidate();
      toast.success("Usuário recusado.");
    },
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setEditUser(null);
      toast.success("Papel atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("Usuário excluído.");
    },
    onError: (e) => toast.error(e.message),
  });

  const setPasswordMutation = trpc.auth.setPassword.useMutation({
    onSuccess: () => {
      setPasswordUser(null);
      setNewPassword("");
      toast.success("Senha definida com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewUserRole("user");
      toast.success("Usuário criado! Um e-mail com link de acesso foi enviado.");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || (me?.role !== "superadmin" && me?.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Empresas
          </button>
          <button
            onClick={() => navigate("/admin/users")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Users className="h-4 w-4" />
            Usuários
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
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gestão de Usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Controle os papéis e permissões de cada usuário na plataforma.
            </p>
          </div>
          {me?.role === "superadmin" && (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo usuário
            </Button>
          )}
        </div>

        {/* Hierarchy explanation */}
        <Card className="mb-6 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Hierarquia de Papéis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <Crown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">Super Admin</p>
                  <p className="text-xs text-red-600/80 mt-0.5">
                    Acesso total: gerencia empresas, usuários e todos os cardápios.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-700 text-sm">Admin</p>
                  <p className="text-xs text-orange-600/80 mt-0.5">
                    Gerencia empresas e cardápios, mas não altera papéis de usuários.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <UserCog className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Usuário / Manager</p>
                  <p className="text-xs text-gray-600/80 mt-0.5">
                    Acessa apenas as empresas às quais foi vinculado como membro.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usuários aguardando aprovação */}
        {pendingList && pendingList.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-700 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Solicitações de acesso pendentes ({pendingList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-200">
                      <th className="text-left px-4 py-3 font-medium text-orange-700">Nome</th>
                      <th className="text-left px-4 py-3 font-medium text-orange-700">E-mail</th>
                      <th className="text-left px-4 py-3 font-medium text-orange-700">Cadastrado em</th>
                      <th className="text-right px-4 py-3 font-medium text-orange-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((u: any) => (
                      <tr key={u.id} className="border-b border-orange-100 last:border-0">
                        <td className="px-4 py-3 font-medium">{u.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate({ id: u.id })}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-3 text-xs"
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate({ id: u.id })}
                            >
                              Recusar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando usuários...</div>
        ) : (
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-mail</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Restaurante(s)</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Papel</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Último acesso</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList?.map((u) => {
                      const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.user;
                      const isMe = u.id === me?.id;
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {u.name ?? "—"}
                                  {isMe && (
                                    <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                          <td className="px-4 py-3">
                            {u.companies && u.companies.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.companies.map((c) => (
                                  <span key={c.companyId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                    {c.companyName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleInfo.color}`}
                            >
                              {roleInfo.icon}
                              {roleInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(u.lastSignedIn).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isMe && me?.role === "superadmin" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPasswordUser({ id: u.id, name: u.name });
                                      setNewPassword("");
                                    }}
                                  >
                                    Senha
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditUser({ id: u.id, name: u.name, role: u.role });
                                      setNewRole(u.role as "user" | "admin" | "superadmin");
                                    }}
                                  >
                                    <UserCog className="h-4 w-4 mr-1" />
                                    Papel
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      if (confirm(`Excluir ${u.name ?? u.email ?? "este usuário"}? Esta ação não pode ser desfeita.`)) {
                                        deleteMutation.mutate({ id: u.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!usersList?.length && (
                  <div className="text-center py-10 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit role dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar papel de {editUser?.name ?? "usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as "user" | "admin" | "superadmin")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={updateRoleMutation.isPending}
                onClick={() => {
                  if (editUser) updateRoleMutation.mutate({ id: editUser.id, role: newRole });
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set password dialog */}
      <Dialog open={!!passwordUser} onOpenChange={(o) => { if (!o) { setPasswordUser(null); setNewPassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Definir senha de {passwordUser?.name ?? "usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nova senha</Label>
              <Input
                className="mt-1.5"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPasswordUser(null)}>Cancelar</Button>
              <Button
                className="flex-1"
                disabled={newPassword.length < 6 || setPasswordMutation.isPending}
                onClick={() => {
                  if (passwordUser) setPasswordMutation.mutate({ userId: passwordUser.id, password: newPassword });
                }}
              >
                {setPasswordMutation.isPending ? "Salvando..." : "Definir senha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setNewName(""); setNewEmail(""); setNewUserRole("user"); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar novo usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <p className="font-semibold mb-1">Atenção</p>
              <p>O usuário criado aqui poderá fazer login com o e-mail cadastrado. Após o login, vincule-o a uma empresa na seção "Membros da Empresa".</p>
            </div>
            <div>
              <Label>Nome completo</Label>
              <Input className="mt-1.5" value={newName} onChange={e => setNewName(e.target.value)} placeholder="João da Silva" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input className="mt-1.5" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="joao@email.com" />
            </div>
            <div>
              <Label>Papel na plataforma</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "user" | "admin" | "superadmin")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário (acessa apenas empresas vinculadas)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button
                className="flex-1"
                disabled={!newName || !newEmail || createMutation.isPending}
                onClick={() => createMutation.mutate({ name: newName, email: newEmail, role: newUserRole, origin: window.location.origin })}
              >
                {createMutation.isPending ? "Criando..." : "Criar usuário"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
