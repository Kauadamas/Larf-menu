// client/src/pages/Lgpd.tsx
// Página estática LGPD + Termos de Uso — integrada ao projeto Larf
// Adicionar no App.tsx:
//   import Lgpd from "./pages/Lgpd";
//   <Route path="/lgpd" component={Lgpd} />
//   <Route path="/termos" component={Lgpd} />

import { useState, useEffect } from "react";
import { ChefHat, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const SECTIONS = [
  { id: "privacidade", label: "1. Política de Privacidade" },
  { id: "dados", label: "2. Dados coletados" },
  { id: "finalidade", label: "3. Finalidade do uso" },
  { id: "compartilhamento", label: "4. Compartilhamento" },
  { id: "retencao", label: "5. Retenção de dados" },
  { id: "direitos", label: "6. Seus direitos (LGPD)" },
  { id: "cookies", label: "7. Cookies" },
  { id: "seguranca", label: "8. Segurança" },
  { id: "termos", label: "9. Termos de Uso" },
  { id: "planos", label: "10. Planos e pagamento" },
  { id: "cancelamento", label: "11. Cancelamento" },
  { id: "responsabilidades", label: "12. Responsabilidades" },
  { id: "dpo", label: "13. DPO / Contato" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-14 scroll-mt-24">
      <h2 className="text-xl font-bold border-b border-border pb-3 mb-5 text-foreground tracking-tight">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/6 border border-primary/15 rounded-xl px-5 py-4 text-foreground text-sm">
      {children}
    </div>
  );
}

export default function Lgpd() {
  const [, navigate] = useLocation();
  const [activeId, setActiveId] = useState("privacidade");

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[id]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    els.forEach((el) => SECTIONS.some((s) => s.id === el.id) && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-black text-lg"
          >
            <ChefHat className="w-5 h-5 text-primary" />
            <span>Larf<span className="text-primary">.</span></span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-14 flex gap-12">
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Neste documento
          </div>
          <ul className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block text-[13px] px-3 py-1.5 rounded-lg transition-all border-l-2 ${
                    activeId === s.id
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-12 pb-10 border-b border-border">
            <div className="inline-block bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              LGPD Compliant
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3">
              Política de Privacidade<br />& Termos de Uso
            </h1>
            <p className="text-muted-foreground">Documentos legais do Larf — leia antes de usar nossa plataforma.</p>
            <p className="text-xs text-muted-foreground mt-3">
              Última atualização: <strong>Janeiro de 2025</strong> · Versão 2.1
            </p>
          </div>

          {/* ── POLÍTICA DE PRIVACIDADE ── */}
          <Section id="privacidade" title="1. Política de Privacidade">
            <p>
              A <strong>Larf Tecnologia LTDA</strong> ("Larf", "nós") respeita a privacidade dos seus usuários
              e está comprometida com a proteção dos dados pessoais em conformidade com a{" "}
              <strong>Lei nº 13.709/2018 (LGPD)</strong> e demais normas aplicáveis.
            </p>
            <Highlight>
              <strong>Papel no tratamento:</strong> O Larf atua como <strong>Operador</strong> dos dados dos
              clientes dos seus restaurantes e como <strong>Controlador</strong> dos dados dos usuários que
              contratam nossa plataforma diretamente.
            </Highlight>
          </Section>

          <Section id="dados" title="2. Dados coletados">
            <p><strong className="text-foreground">2.1 Usuários da plataforma (restaurantes)</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cadastro: nome completo, e-mail, telefone, CPF/CNPJ, endereço</li>
              <li>Financeiro: dados bancários para repasse, histórico de assinatura</li>
              <li>Uso: logs de acesso, IP, dispositivo, funcionalidades utilizadas</li>
            </ul>
            <p><strong className="text-foreground">2.2 Clientes dos restaurantes (usuários finais)</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome, e-mail e telefone (quando informados no pedido)</li>
              <li>Histórico de pedidos (se registrado)</li>
              <li>Dados de pagamento processados exclusivamente pela Asaas — não armazenamos número de cartão</li>
            </ul>
            <p><strong className="text-foreground">2.3 Dados coletados automaticamente</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cookies de sessão e analytics (Google Analytics 4 anonimizado)</li>
              <li>User-Agent, resolução de tela, tempo de navegação</li>
            </ul>
          </Section>

          <Section id="finalidade" title="3. Finalidade do uso dos dados">
            <p>Tratamos seus dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prestação dos serviços contratados e suporte ao cliente</li>
              <li>Processamento de pagamentos e emissão de notas fiscais (NF-e/NFS-e)</li>
              <li>Envio de comunicações transacionais (confirmações, alertas do sistema)</li>
              <li>Melhoria contínua da plataforma por dados agregados e anonimizados</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Prevenção a fraudes e segurança da plataforma</li>
            </ul>
            <p className="font-medium text-foreground">
              Não vendemos, alugamos nem cedemos dados pessoais para fins de publicidade de terceiros.
            </p>
          </Section>

          <Section id="compartilhamento" title="4. Compartilhamento de dados">
            <p>Os dados poderão ser compartilhados apenas com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Asaas Pagamentos S.A.</strong> — processamento de cobranças, PIX e boletos</li>
              <li><strong className="text-foreground">Backblaze R2 / Cloudflare</strong> — armazenamento de imagens e arquivos</li>
              <li><strong className="text-foreground">Railway</strong> — infraestrutura de hospedagem</li>
              <li><strong className="text-foreground">Resend</strong> — envio de e-mails transacionais</li>
              <li><strong className="text-foreground">Autoridades públicas</strong> — quando exigido por lei ou decisão judicial</li>
            </ul>
            <p>Todos os parceiros possuem contratos de processamento de dados (DPA) alinhados à LGPD.</p>
          </Section>

          <Section id="retencao" title="5. Retenção de dados">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Conta ativa:</strong> dados mantidos durante toda a vigência do contrato</li>
              <li><strong className="text-foreground">Após cancelamento:</strong> dados disponíveis por 90 dias; excluídos após esse prazo</li>
              <li><strong className="text-foreground">Dados fiscais (NF-e):</strong> mantidos por 5 anos conforme exigência legal</li>
              <li><strong className="text-foreground">Logs de segurança:</strong> mantidos por 6 meses</li>
            </ul>
          </Section>

          <Section id="direitos" title="6. Seus direitos (LGPD — Art. 18)">
            <p>Como titular de dados pessoais, você tem os seguintes direitos garantidos pela LGPD:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {[
                ["Confirmação e acesso", "Confirmar se tratamos seus dados e acessar uma cópia deles."],
                ["Correção", "Corrigir dados incompletos, inexatos ou desatualizados."],
                ["Anonimização / Exclusão", "Solicitar anonimização de dados desnecessários ou sua exclusão."],
                ["Portabilidade", "Receber seus dados em formato estruturado e interoperável."],
                ["Revogação", "Retirar consentimento a qualquer momento."],
                ["Oposição", "Opor-se ao tratamento realizado com base em legítimo interesse."],
              ].map(([title, desc]) => (
                <div key={title} className="bg-muted/40 border border-border rounded-xl p-4">
                  <div className="font-semibold text-foreground text-sm mb-1">✦ {title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Para exercer qualquer direito, contate:{" "}
              <a href="mailto:privacidade@larfmenu.com.br" className="text-primary hover:underline">
                privacidade@larfmenu.com.br
              </a>
              . Respondemos em até 15 dias úteis.
            </p>
          </Section>

          <Section id="cookies" title="7. Política de Cookies">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Cookies essenciais:</strong> autenticação de sessão e preferências básicas (não podem ser desativados)</li>
              <li><strong className="text-foreground">Cookies de analytics:</strong> Google Analytics com IP anonimizado (opt-out disponível)</li>
              <li><strong className="text-foreground">Cookies de performance:</strong> medição de velocidade e diagnóstico de erros</li>
            </ul>
            <p>Você pode gerenciar cookies pelo banner de consentimento exibido no primeiro acesso.</p>
          </Section>

          <Section id="seguranca" title="8. Segurança da informação">
            <ul className="list-disc pl-5 space-y-1">
              <li>Tráfego protegido por TLS 1.3 (HTTPS obrigatório)</li>
              <li>Dados em repouso criptografados (AES-256)</li>
              <li>Autenticação com suporte a 2FA</li>
              <li>Backups diários com retenção de 30 dias</li>
              <li>Acesso à produção restrito por VPN e princípio do mínimo privilégio</li>
            </ul>
            <p>
              Em caso de incidente de segurança, notificaremos a ANPD e os titulares afetados no prazo de 72 horas,
              conforme a LGPD.
            </p>
          </Section>

          <hr className="border-border my-10" />

          {/* ── TERMOS DE USO ── */}
          <Section id="termos" title="9. Termos de Uso">
            <p>
              Ao criar uma conta no Larf, você concorda com estes Termos de Uso. O Larf é uma plataforma SaaS de
              gestão para restaurantes operada pela <strong>Larf Tecnologia LTDA</strong>, CNPJ
              00.000.000/0001-00.
            </p>
          </Section>

          <Section id="planos" title="10. Planos e pagamento">
            <p><strong className="text-foreground">10.1 Planos disponíveis</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Básico — R$ 79/mês:</strong> cardápio digital, até 2 usuários, pedidos básicos</li>
              <li><strong className="text-foreground">Pro — R$ 179/mês:</strong> tudo do Básico + importação IA, subdomínio, financeiro, usuários ilimitados</li>
              <li><strong className="text-foreground">Rede — R$ 349/mês:</strong> tudo do Pro + múltiplas unidades, API, gerente dedicado</li>
            </ul>
            <p><strong className="text-foreground">10.2 Trial e cobrança</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Trial gratuito de 14 dias sem necessidade de cartão de crédito</li>
              <li>Pagamentos via PIX, boleto bancário ou cartão de crédito (processados pela Asaas)</li>
              <li>Cobranças mensais, com vencimento na data de início da assinatura</li>
              <li>Reajuste anual limitado ao IPCA, com aviso prévio de 30 dias</li>
            </ul>
          </Section>

          <Section id="cancelamento" title="11. Cancelamento e rescisão">
            <ul className="list-disc pl-5 space-y-1">
              <li>Cancelamento disponível a qualquer momento pelo painel, sem multa</li>
              <li>Período pago já em curso não é reembolsado, exceto em caso de falha grave do serviço</li>
              <li>Após cancelamento, dados exportáveis por 90 dias; após esse prazo, são excluídos permanentemente</li>
              <li>O Larf pode rescindir o contrato imediatamente em caso de uso abusivo ou atividade ilegal</li>
            </ul>
          </Section>

          <Section id="responsabilidades" title="12. Responsabilidades e limitações">
            <p><strong className="text-foreground">12.1 Responsabilidades do usuário</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manter confidencialidade das credenciais de acesso</li>
              <li>Garantir a veracidade dos dados cadastrados (CNPJ, dados fiscais)</li>
              <li>Usar a plataforma em conformidade com a legislação vigente</li>
              <li>Obter consentimento dos clientes finais conforme exigido pela LGPD</li>
            </ul>
            <p><strong className="text-foreground">12.2 Limitação de responsabilidade</strong></p>
            <p>
              O Larf não se responsabiliza por danos indiretos causados por falhas de conexão, força maior ou uso
              inadequado da plataforma. Nossa responsabilidade máxima é limitada ao valor pago nos últimos 3 meses
              de assinatura.
            </p>
            <p>
              O Larf busca manter disponibilidade de 99,5% ao mês. O plano Rede garante SLA de 99,9%.
            </p>
          </Section>

          <Section id="dpo" title="13. DPO / Contato">
            <p>Para questões relacionadas à privacidade, proteção de dados ou exercício de direitos LGPD:</p>
            <div className="bg-card border border-border rounded-xl p-6 mt-4">
              <div className="font-bold text-foreground text-base mb-1">Encarregado de Dados (DPO)</div>
              <div className="text-sm text-muted-foreground mb-4">
                Responsável pelo tratamento de dados pessoais na Larf Tecnologia LTDA
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <a href="mailto:privacidade@larfmenu.com.br" className="text-primary hover:underline">
                  📧 privacidade@larfmenu.com.br
                </a>
                <a href="mailto:dpo@larfmenu.com.br" className="text-primary hover:underline">
                  📋 dpo@larfmenu.com.br (canal ANPD)
                </a>
                <span className="text-muted-foreground">📍 São Paulo / SP</span>
                <span className="text-muted-foreground">⏱ Prazo de resposta: até 15 dias úteis</span>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Para reclamações não resolvidas, você pode contatar a{" "}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ANPD — Autoridade Nacional de Proteção de Dados
              </a>
              .
            </p>
            <p className="text-sm">
              Foro competente: Comarca de São Paulo/SP, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </Section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        © 2025 Larf Tecnologia LTDA · CNPJ 00.000.000/0001-00 · Todos os direitos reservados
      </footer>
    </div>
  );
}
