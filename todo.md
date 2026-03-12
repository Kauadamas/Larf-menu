# Cardápio Digital Multi-tenant - TODO

## Fase 1: Schema e estrutura base
- [x] Schema do banco de dados (empresas, categorias, itens, usuários por empresa)
- [x] Migração do banco de dados

## Fase 2: Backend (tRPC routers)
- [x] Router de empresas (CRUD multi-tenant)
- [x] Router de categorias (CRUD com ordenação)
- [x] Router de itens do cardápio (CRUD com disponibilidade)
- [x] Upload de fotos via S3
- [x] Conversão de moedas (BRL/USD/EUR) com taxas em tempo real
- [x] Controle de acesso por empresa (usuário só vê sua empresa)

## Fase 3: Painel administrativo
- [x] Layout do painel com sidebar (DashboardLayout)
- [x] Página de gestão de empresas (super admin)
- [x] Página de gestão de categorias (22 categorias, ordenação)
- [x] Página de gestão de itens (preço, foto, descrição PT/ES/EN, ativar/desativar)
- [x] Upload e preview de fotos dos pratos
- [x] Configurações da empresa (nome, logo, domínio customizado)

## Fase 4: Interface pública do cardápio
- [x] Página pública do cardápio (por slug/domínio da empresa)
- [x] Seletor de idioma (PT/ES/EN) visível e acessível
- [x] Seletor de moeda (BRL/USD/EUR) com conversão em tempo real
- [x] Listagem de categorias com filtro
- [x] Cards de itens com foto, descrição e preço convertido
- [x] Design mobile-first responsivo para turistas
- [x] Indicador de item indisponível

## Fase 5: Testes e entrega
- [x] Testes vitest para routers principais (15 testes passando)
- [x] Checkpoint final
- [x] Entrega ao usuário

## Fase 6: Novos requisitos (imagem)
- [x] Schema DB: expandir companies com redes sociais, WhatsApp, tema de cores, delivery, pagamentos
- [x] Schema DB: tabela de avaliações/feedbacks
- [x] Painel de usuários com hierarquia (superadmin > admin > manager)
- [x] Gestão de membros por empresa (convidar, remover, alterar papel)
- [x] Personalização de cores: 5 temas predefinidos por empresa
- [x] Dados completos da empresa: logo, nome, release, site, endereço, Facebook, Instagram, WhatsApp
- [x] Upload de logo da empresa via S3
- [x] Carrinho de compras na interface pública
- [x] Integração do carrinho com WhatsApp (envio do pedido via link)
- [x] Sistema de delivery ativável/desativável pelo gestor
- [x] Formulário de avaliação/sugestão/crítica
- [x] Link de avaliação via WhatsApp
- [x] Integração de pagamentos: links externos (Mercado Pago, PagSeguro, Pic Pay)
- [x] Testes vitest para novos routers (22 testes passando)

## Fase 7: Tradução automática
- [x] Router tRPC de tradução (MyMemory API, PT→ES e PT→EN)
- [x] Botão "Traduzir" no formulário de Categorias
- [x] Botão "Traduzir" no formulário de Itens do cardápio (nome + descrição)
- [x] Testes vitest para o router de tradução (26 testes passando)

## Fase 8: Correção e importação inteligente
- [x] Corrigir erro de UPDATE na tabela companies (filtrar campos undefined)
- [x] Importação inteligente de cardápio via PDF/imagem com IA (LLM vision)
- [x] Tela de revisão antes de confirmar importação (editar, remover, traduzir)
- [x] Testes vitest para o router de importação (29 testes passando)

## Fase 9: Correção rate limit tradução
- [x] Corrigir HTTP 429 na API MyMemory (delay + retry + processamento sequencial)

## Fase 10: Redesign visual do cardápio público
- [x] Header do restaurante: logo grande, nome, badge "Aberto/Fechado", redes sociais
- [x] Barra de categorias horizontal sticky com scroll e ícones
- [x] Campo de busca de produtos
- [x] Grid de cards 3 colunas (desktop) / 1 coluna (mobile) com foto à esquerda
- [x] Card: foto quadrada, nome, descrição truncada, preço em destaque colorido
- [x] Seletor de idioma e moeda no header (visível e acessível)
- [x] Modo escuro / claro
- [x] Títulos de seção com ícone de categoria
- [x] Layout geral limpo, fundo branco/cinza claro, tipografia profissional

## Fase 11: Correção definitiva da tradução
- [x] Migrar para múltiplas APIs de tradução com fallback automático (MyMemory → Lingva → LLM interno)
- [x] Cache de traduções no servidor (não traduz o mesmo texto duas vezes)
- [x] Delay inteligente e fila de requisições para evitar 429

## Fase 12: Melhorias visuais e funcionais
- [x] Seletor de cor RGB completo no painel (substituir os 5 temas fixos)
- [x] Campo de link Google Reviews no painel de configurações da empresa
- [x] Exibir link Google Reviews no cardápio público
- [x] Cardápio sem fotos: ícone neutro por item (sem imagem padrão repetida)
- [x] Busca de pratos: botão no header que abre modal flutuante
- [x] Remover badge "Aberto" fixo do header
- [x] Carrinho WhatsApp: botão flutuante verde fixo no canto inferior direito
- [x] Formulário de avaliação: botão flutuante amarelo fixo no canto inferior direito

## Fase 13: Melhorias e correções (lote grande)

### Bugs críticos
- [x] Corrigir erro UPDATE companies (campos undefined - bug reapareceu)
- [x] Corrigir erro DELETE categoria (falha quando há itens vinculados - cascade manual)
- [x] Corrigir bug: link Facebook/Instagram some ao editar outro campo (useEffect com initializedRef)

### Sistema de usuários por empresa (staff isolado)
- [x] Staff por empresa: cada restaurante gerencia seus próprios usuários (dono + staff)
- [x] Acesso isolado: empresário vê apenas sua empresa ao fazer login
- [x] Painel de staff dentro de cada empresa (add/remover por email)

### Novas funcionalidades no cardápio
- [x] Restrições alimentares por item: vegetariano, glúten, lactose, picante
- [x] Pratos recomendados pelo chef: toggle por item, aparece no topo do menu
- [x] Carrossel de até 4 imagens no topo do cardápio público
- [x] Upload de imagens do carrossel no painel de configurações

### Interface pública
- [x] Seleção automática de idioma pelo idioma do celular/navegador
- [x] Exibir 3 moedas simultâneas (BRL em destaque, USD e EUR menores)
- [x] Seção "Recomendados pelo Chef" no topo do cardápio
- [x] Badges de restrição alimentar nos cards dos pratos

### Painel admin
- [x] Botão "Traduzir todo o cardápio" na página de itens (já existia)
- [x] Campos de restrição alimentar no formulário de item
- [x] Toggle "Recomendado pelo Chef" no formulário de item

## Fase 14: Correções e melhorias (lote)

### Layout do cardápio público
- [x] Carrossel de imagens deve ficar DENTRO da área laranja do header (como Thiosti)
- [x] Badges de restrição dietética: adicionar texto junto ao ícone (ex: "Vegetariano")
- [x] Trocar "Recomendações do Chef" por "Mais Pedidos" (mesmo comportamento, novo nome)
- [x] Padronizar botões Mercado Pago e WhatsApp no carrinho (mesmo tamanho)
- [x] Melhorar mensagem WhatsApp: formato profissional com emojis, nome do restaurante, itens, total

### Gestão da plataforma (admin global)
- [x] Adicionar botão de cadastrar novo usuário na página Gestão de Usuários
- [x] Adicionar botão de excluir usuário na página Gestão de Usuários

### Sistema de membros por empresa
- [x] Implementar convite por e-mail: enviar link de convite para o membro acessar a empresa

## Fase 15: Melhorias de layout e novas funcionalidades

- [x] Header estilo banner panorâmico fixo (como Peregrinos): foto em faixa, logo sobreposta abaixo
- [x] Remover emoji/ícone do botão Mercado Pago (sem emojis padrão)
- [x] Opção de ocultar espaço de foto quando item não tem imagem
- [x] Campo de observação no pedido (ex: "sem cebola") antes de enviar pelo WhatsApp
- [x] Botão imprimir cardápio: completo, por categoria, categoria por página
- [x] Campo de domínio personalizado nas configurações da empresa
- [x] Horário de funcionamento por dia da semana nas configurações
- [x] Corrigir gestão de usuários da plataforma (cadastrar e excluir usuários globais)

## Fase 16: Domínio larfmenu.com.br e tradução completa

- [x] Botão "Traduzir Cardápio" na página pública do menu (tradução em lote de todos os itens)
- [x] Documentar configuração DNS para larfmenu.com.br com subdomínios por empresa

## Fase 17: Correções visuais e impressão no admin

- [x] Corrigir layout do carrinho: botão menos cobrindo o valor do preço
- [x] Remover botão "Lua" (dark mode toggle) do header do cardápio público
- [x] Limitar caracteres dos cards de itens (nome e descrição com truncamento)
- [x] Tradução completa do site ao mudar idioma (nome, descrição, categoria)
- [x] Mover botão de impressão para o painel admin (configurações da empresa)
- [x] Impressão com opção de idioma (PT/ES/EN) e moeda (BRL/USD/EUR)

## Fase 18: Correção de tradução com HTML e Google Tradutor

- [x] Corrigir tradução que retornava HTML com tags (ex: <g id="Italic">Feijoada</g>)
- [x] Adicionar função stripHtml() para limpar tags HTML em todas as APIs de tradução
- [x] Adicionar Google Tradutor como primeiro provider (mais confiável)
- [x] Ordem de providers: Google → MyMemory → Lingva → LLM (fallback)

## Fase 19: Melhorias no admin e front-end

- [x] Botão "Traduzir Cardápio" na página de itens do admin (traduzir tudo em lote)
- [x] Remover botão de avaliação do cardápio público
- [x] Manter ícone de carrinho de compras (já era o ícone correto - SVG de carrinho)

## Fase 20: Botão excluir imagem nos cards

- [x] Adicionar endpoint removeImage no servidor
- [x] Botão de excluir imagem visível nos cards de itens do admin (aparece ao passar o mouse)

## Fase 23: Correções no cardápio público

- [x] Remover botão "Translate menu" quando idioma selecionado é ES ou EN
- [x] Remover cores e ícones das tags dietéticas - texto simples separado por ·
- [x] Alinhar botão Search (removido ml-auto)
- [x] Traduzir descrição do restaurante ao mudar idioma

## Fase 24: 5 Templates de Cardápio

- [x] Adicionar campo `menuTemplate` na tabela companies no schema
- [x] Migrar banco com pnpm db:push
- [x] Implementar Template 1: Classic (atual, banner hero + grid 2 colunas)
- [x] Implementar Template 2: Modern Dark (fundo escuro, sidebar, cards premium)
- [x] Implementar Template 3: Minimal (lista simples, sem banner, clean)
- [x] Implementar Template 4: Magazine (banner fullscreen, cards com foto de fundo)
- [x] Implementar Template 5: Street Food (cores vibrantes, cards arredondados)
- [x] Sistema de roteamento de template no PublicMenu
- [x] Seletor de template no CompanySettings com miniaturas visuais

## Fase 25: Paridade de funcionalidades em todos os templates

- [x] TemplateDark: moedas múltiplas, tradução, carrinho, busca, restrições, chef items
- [x] TemplateMinimal: moedas múltiplas, tradução, carrinho, busca, restrições, chef items
- [x] TemplateMagazine: moedas múltiplas, tradução, carrinho, busca, restrições, chef items
- [x] TemplateStreet: moedas múltiplas, tradução, carrinho, busca, restrições, chef items

## Fase 26: Identidade visual Larf (remover Manus)

- [ ] Atualizar VITE_APP_TITLE e VITE_APP_LOGO (requer painel Manus - manual)
- [x] Corrigir favicon (logo Larf) e título da aba do navegador ("Cardápio Digital")

## Fase 27: Subdomínio por restaurante

- [x] Campo customDomain já existia na tabela companies (campo reutilizado para subdomínio)
- [x] Detecção de subdomínio no frontend (ex: thiosti.larfmenu.com.br → busca empresa com customDomain=thiosti)
- [x] Roteamento automático para o cardápio correto pelo subdomínio (SubdomainRouter component)
- [x] Campo de subdomínio no painel admin com URL gerada visível (CompanySettings atualizado)
- [x] Procedimento getBySubdomain adicionado no backend (tRPC public procedure)
- [x] 31 testes passando (2 novos testes para getBySubdomain)

## Fase 28: Login próprio (e-mail + senha) — sem Manus/Meta

- [x] Campo passwordHash adicionado na tabela users e banco migrado
- [x] Procedimentos loginWithPassword e setPassword adicionados no backend
- [x] Tela de login /login criada com identidade Larf Menu (sem referências ao Manus)
- [x] Todos os redirecionamentos de "Entrar com Manus" substituídos por /login
- [x] Botão "Senha" adicionado no painel de Usuários para superadmin definir senha de qualquer usuário
- [x] 31 testes passando, 0 erros TypeScript

## Fase 29: Coluna de restaurante na Gestão de Usuários

- [x] Backend: retornar empresas vinculadas a cada usuário na listagem de usuários
- [x] Frontend: exibir coluna "Restaurante(s)" na tabela de Gestão de Usuários

## Fase 30: Recuperação de senha e e-mail de boas-vindas

- [x] Tabela de tokens de redefinição de senha no banco
- [x] Endpoint requestPasswordReset: gera token e envia e-mail
- [x] Endpoint resetPassword: valida token e atualiza senha
- [x] Tela /reset-password?token=xxx para redefinir senha
- [x] Link "Esqueci minha senha" na tela de login com modal
- [x] E-mail automático de boas-vindas ao criar novo usuário (com link para definir senha)
- [x] Helper Resend com templates HTML da Larf (sem referências ao Manus)
- [x] 31 testes passando, 0 erros TypeScript
