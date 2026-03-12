import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Detecta se o usuário está acessando via subdomínio de larfmenu.com.br
 * e redireciona automaticamente para o cardápio correto.
 *
 * Exemplos:
 *   thiosti.larfmenu.com.br  → /menu/thiosti-slug
 *   meurestaurante.larfmenu.com.br → /menu/meurestaurante-slug
 *
 * O campo `customDomain` na tabela companies armazena o subdomínio (ex: "thiosti").
 */

function detectSubdomain(): string | null {
  const hostname = window.location.hostname;
  // Domínios conhecidos que NÃO são subdomínios de restaurante
  const rootDomains = [
    "larfmenu.com.br",
    "digicardapp-m5ghaqwp.manus.space",
    "localhost",
    "127.0.0.1",
  ];

  // Verificar se é um subdomínio de larfmenu.com.br
  if (hostname.endsWith(".larfmenu.com.br")) {
    const subdomain = hostname.replace(".larfmenu.com.br", "");
    // Ignorar subdomínios de sistema (www, app, admin, etc.)
    const systemSubdomains = ["www", "app", "admin", "api", "mail", "smtp", "ftp"];
    if (!systemSubdomains.includes(subdomain) && subdomain.length > 0) {
      return subdomain;
    }
  }

  // Verificar se é um subdomínio de manus.space (ambiente de desenvolvimento)
  if (hostname.endsWith(".manus.space") || hostname.endsWith(".manus.computer")) {
    // Não é subdomínio de restaurante, é ambiente de desenvolvimento
    return null;
  }

  return null;
}

interface SubdomainRedirectProps {
  subdomain: string;
}

function SubdomainRedirect({ subdomain }: SubdomainRedirectProps) {
  const [, setLocation] = useLocation();
  const { data: company, isLoading } = trpc.companies.getBySubdomain.useQuery(
    { subdomain },
    { enabled: !!subdomain }
  );

  useEffect(() => {
    if (!isLoading && company?.slug) {
      // Redirecionar para o cardápio da empresa encontrada
      setLocation(`/menu/${company.slug}`);
    }
  }, [company, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cardápio não encontrado</h1>
          <p className="text-gray-500 text-sm">
            O subdomínio <strong>{subdomain}.larfmenu.com.br</strong> não está configurado para nenhum restaurante.
          </p>
          <p className="text-gray-400 text-xs mt-4">
            Se você é o proprietário, acesse o painel administrativo e configure o subdomínio nas configurações da empresa.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Componente que envolve a aplicação e detecta subdomínios de restaurante.
 * Se um subdomínio válido for detectado, renderiza o redirecionador.
 * Caso contrário, renderiza os filhos normalmente.
 */
export function SubdomainRouter({ children }: { children: React.ReactNode }) {
  const subdomain = detectSubdomain();

  if (subdomain) {
    return <SubdomainRedirect subdomain={subdomain} />;
  }

  return <>{children}</>;
}

export { detectSubdomain };
