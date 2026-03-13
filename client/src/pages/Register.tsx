import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [, navigate] = useLocation();

  // Dados do usuário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Dados do restaurante
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => toast.error(err.message || "Erro ao criar conta"),
  });

  // Gerar slug automático a partir do nome do restaurante
  const handleRestaurantNameChange = (val: string) => {
    setRestaurantName(val);
    if (!slugTouched) {
      setRestaurantSlug(
        val.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugTouched(true);
    setRestaurantSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  const slugValid = /^[a-z0-9-]{2,}$/.test(restaurantSlug);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    if (!slugValid) { toast.error("Slug do restaurante inválido."); return; }
    registerMutation.mutate({ name, email, password, restaurantName, restaurantSlug });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="w-full max-w-sm px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-4 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro enviado!</h1>
          <p className="text-gray-500 text-sm mb-2">
            Sua solicitação foi recebida. Um administrador irá revisar e aprovar sua conta em breve.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Após a aprovação, você receberá um e-mail e poderá acessar o painel com seu restaurante <strong>{restaurantName}</strong> já configurado.
          </p>
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate("/login")}>
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 py-8">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4 shadow-lg">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Larf Menu</h1>
          <p className="text-sm text-gray-500 mt-1">Crie sua conta e seu restaurante</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Solicitar acesso</CardTitle>
            <CardDescription>
              Preencha os dados abaixo. Sua conta será ativada após aprovação do administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Seção: Seus dados */}
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">Seus dados</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required disabled={registerMutation.isPending} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={registerMutation.isPending} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                        value={password} onChange={e => setPassword(e.target.value)} required disabled={registerMutation.isPending} className="pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <div className="relative">
                      <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="Repita a senha"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                        disabled={registerMutation.isPending}
                        className={`pr-10 ${!passwordsMatch ? "border-red-400 focus-visible:ring-red-400" : ""}`} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!passwordsMatch && <p className="text-xs text-red-500">As senhas não coincidem.</p>}
                  </div>
                </div>
              </div>

              {/* Seção: Restaurante */}
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">Seu restaurante</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="restaurantName">Nome do restaurante</Label>
                    <Input id="restaurantName" placeholder="Ex: Pizzaria do João"
                      value={restaurantName} onChange={e => handleRestaurantNameChange(e.target.value)}
                      required disabled={registerMutation.isPending} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="slug">
                      Endereço do cardápio
                      <span className="text-xs text-muted-foreground ml-1 font-normal">(slug)</span>
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">larfmenu.com.br/menu/</span>
                      <Input id="slug" placeholder="pizzaria-joao"
                        value={restaurantSlug} onChange={e => handleSlugChange(e.target.value)}
                        required disabled={registerMutation.isPending}
                        className={!slugValid && restaurantSlug ? "border-red-400 focus-visible:ring-red-400" : ""} />
                    </div>
                    {restaurantSlug && !slugValid && (
                      <p className="text-xs text-red-500">Use apenas letras minúsculas, números e hífens.</p>
                    )}
                    {restaurantSlug && slugValid && (
                      <p className="text-xs text-green-600">✓ larfmenu.com.br/menu/{restaurantSlug}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={registerMutation.isPending || !name || !email || !password || !confirmPassword || !passwordsMatch || !restaurantName || !slugValid}>
                {registerMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                  : "Solicitar acesso"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem uma conta?{" "}
          <button onClick={() => navigate("/login")} className="text-orange-600 hover:underline font-medium">Entrar</button>
        </p>
        <p className="text-center text-xs text-gray-400 mt-3">
          © {new Date().getFullYear()} Larf Menu · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
