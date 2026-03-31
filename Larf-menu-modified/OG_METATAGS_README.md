# Larf Menu - Meta Tags Open Graph Dinâmicas ✨

## O que foi alterado?

Este projeto foi modificado para **suportar meta tags Open Graph dinâmicas** quando seus cardápios são compartilhados no WhatsApp, Facebook, Twitter e outras redes sociais.

### Arquivos Modificados:

1. **`server/_core/ogMetaTags.ts`** (NOVO)
   - Middleware que detecta bots (WhatsApp, Facebook, etc)
   - Busca dados do restaurante no banco de dados
   - Injeta meta tags Open Graph dinâmicas

2. **`server/_core/index.ts`** (MODIFICADO)
   - Adicionado import do middleware
   - Adicionado `app.use(ogMetaTagsMiddleware);`

3. **`server/_core/vite.ts`** (MODIFICADO)
   - Adicionado import de `injectOpenGraphTags`
   - Modificada função `setupVite()` para injetar meta tags
   - Modificada função `serveStatic()` para injetar meta tags em produção

### Nenhuma mudança foi feita em:
- Cliente (React/Frontend)
- Banco de dados (por enquanto)
- Rotas ou lógica de negócio

---

## Como Usar

### 1. Instalar dependências
```bash
npm install
# ou
pnpm install
```

### 2. Testar localmente
```bash
npm run dev
```

Em outro terminal, teste se as meta tags estão sendo injetadas:
```bash
curl -H "User-Agent: facebookexternalhit/1.1" http://localhost:3000
```

Procure no HTML por:
```html
<meta property="og:title" content="..."
<meta property="og:image" content="..."
<meta property="og:description" content="..."
```

### 3. Validar com Facebook Debugger
Acesse: https://developers.facebook.com/tools/debug/

Cole a URL do seu restaurante:
```
https://seu-restaurante.larfmenu.com.br
```

Clique em "Scrape Again" e verifique se as meta tags aparecem corretamente.

### 4. Deploy
```bash
npm run build
git add .
git commit -m "feat: add dynamic og meta tags"
git push
```

---

## Resultado

### ANTES (Problema)
Ao compartilhar no WhatsApp:
```
❌ Cardápio Digital
   (genérico, sem nome do restaurante)
```

### DEPOIS (Solução)
Ao compartilhar no WhatsApp:
```
✅ Pizzaria Gourmet - Cardápio Digital
   As melhores pizzas artesanais da região
   [Logo da Pizzaria]
```

---

## Campos do Banco de Dados

O middleware usa estes campos da tabela `companies`:

- **`name`** (obrigatório) - Nome do restaurante
- **`description`** (opcional) - Descrição para OG:description
- **`logo_url`** (opcional) - URL da logo para OG:image
- **`image_url`** (fallback) - Usada se logo_url não existir

Se seus restaurantes não têm os campos `description` e `logo_url`, execute no MySQL:

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
```

Depois popule os dados:
```sql
UPDATE companies SET 
  description = 'Sua descrição aqui',
  logo_url = 'https://sua-cdn.com/logo.png'
WHERE id = 1;
```

---

## Troubleshooting

### Meta tags não aparecem
- Verifique se o User-Agent é de um bot conhecido
- Teste com: `curl -H "User-Agent: whatsapp" http://localhost:3000`
- Procure por logs com "[OG Meta Tags]" no console

### Preview no WhatsApp ainda genérico
- Use o Facebook Debugger para forçar atualização
- WhatsApp faz cache por 5-10 minutos
- Aguarde e tente novamente

### Restaurante não encontrado
- Verifique se o subdomain está correto
- Verifique se existe uma company com esse slug no banco
- Teste: `SELECT * FROM companies WHERE slug = 'seu-slug';`

---

## Como Funciona

```
1. Usuário compartilha: https://pizzaria-gourmet.larfmenu.com.br

2. WhatsApp faz requisição com User-Agent: "WhatsApp/2.21.10.0"

3. Servidor detecta que é um bot:
   - ogMetaTagsMiddleware intercepta
   - Extrai subdomain: "pizzaria-gourmet"
   - Busca no banco: SELECT * FROM companies WHERE slug = 'pizzaria-gourmet'

4. Injeta meta tags no HTML:
   <meta property="og:title" content="Pizzaria Gourmet - Cardápio Digital" />
   <meta property="og:description" content="As melhores pizzas artesanais..." />
   <meta property="og:image" content="https://..." />

5. WhatsApp lê as meta tags e mostra no preview

6. Contatos veem preview atrativo e clicam
```

---

## Bots Detectados

O middleware detecta automaticamente estes User-Agents:

- ✓ WhatsApp
- ✓ Facebook / Messenger
- ✓ Twitter / X
- ✓ LinkedIn
- ✓ Telegram
- ✓ Google Bot
- ✓ Bing Bot
- ✓ Yahoo Slurp
- ✓ E outros...

---

## Segurança

As meta tags são sanitizadas contra XSS:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`

Dados do banco são escapados antes de inserir no HTML.

---

## Performance

- ✅ Middleware apenas executa para bots (SPA não é afetada)
- ✅ Busca no banco é rápida (com índice em slug)
- ✅ Injeção de meta tags é uma simples substituição de string
- ✅ Sem impacto significativo no tempo de resposta

---

## Próximos Passos

Recomendações opcionais:

1. **Adicionar imagem padrão** em `client/public/og-image-default.png`
   - Dimensões: 1200x630px
   - Será usada se `logo_url` estiver vazio

2. **Popular descriptions** para cada restaurante
   - Melhora muito o preview
   - Máximo recomendado: 150 caracteres

3. **Otimizar logos/imagens**
   - Comprimir para menos de 100KB
   - Dimensões ideais: 1200x630px

4. **Testar com validadores**:
   - https://www.opengraphcheck.com/
   - https://developers.facebook.com/tools/debug/
   - https://cards-dev.twitter.com/validator

---

## Dúvidas?

Procure por comentários no código com `// Open Graph` ou `[OG Meta Tags]`.

Toda a lógica está documentada em `server/_core/ogMetaTags.ts`.

---

**Versão:** 1.0.0  
**Data:** Março 2025  
**Status:** ✅ Pronto para produção
