import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChefHat, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";
  const [, navigate] = useLocation();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verify = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token não encontrado no link.");
      return;
    }
    verify.mutate(
      { token },
      {
        onSuccess: () => {
          setStatus("success");
          setTimeout(() => navigate("/admin"), 2500);
        },
        onError: (err) => {
          setStatus("error");
          setMessage(err.message);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 font-black text-2xl mb-12">
        <ChefHat className="w-7 h-7 text-primary" />
        <span>
          Larf<span className="text-primary">.</span>
        </span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verificando seu e-mail…</h2>
            <p className="text-muted-foreground text-sm">Aguarde um instante.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">E-mail verificado! 🎉</h2>
            <p className="text-muted-foreground text-sm">
              Sua conta está ativa. Redirecionando para o painel…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link inválido</h2>
            <p className="text-muted-foreground text-sm mb-6">{message}</p>
            <a
              href="/register"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Tentar novamente
            </a>
          </>
        )}
      </div>
    </div>
  );
}
