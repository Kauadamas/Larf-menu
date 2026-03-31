import { Request, Response, NextFunction } from "express";
import { getCompanyBySubdomain, getCompanyBySlug } from "../db";

/**
 * OpenGraph Meta Tags Injector
 * 
 * Este middleware detecta quando um link é compartilhado (por bots como WhatsApp, 
 * Facebook, Twitter) e injeta meta tags dinâmicas baseadas no restaurante.
 * 
 * Como funciona:
 * 1. Detecta se é um bot (WhatsApp, Facebook, Twitter, etc) pelo User-Agent
 * 2. Identifica qual restaurante está sendo visualizado (por subdomain ou slug)
 * 3. Busca os dados do restaurante no banco de dados
 * 4. Injeta meta tags Open Graph no HTML
 */

// Lista de User-Agents de bots que compartilham links (extraem preview)
const BOT_USER_AGENTS = [
  "facebookexternalhit", // Facebook
  "whatsapp", // WhatsApp Web
  "twitterbot", // Twitter
  "linkedinbot", // LinkedIn
  "telegrambot", // Telegram
  "slurp", // Yahoo
  "bingbot", // Bing
  "googlebot", // Google
  "yandexbot", // Yandex
  "slotovod", // Slack (sometimes)
  "curl", // Development/testing
];

function isBotUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

/**
 * Identifica o restaurante pela subdomain
 * Exemplo: restaurant-name.larfmenu.com.br -> restaurant-name
 */
function getSubdomainSlug(hostname: string): string | null {
  const parts = hostname.split(".");
  
  // Se tem mais de 2 partes e não é localhost
  if (parts.length > 2 && hostname !== "localhost") {
    return parts[0];
  }
  
  return null;
}

/**
 * Busca o restaurante baseado no hostname/subdomain
 */
async function getRestaurantByHostname(hostname: string) {
  const slug = getSubdomainSlug(hostname);
  
  if (slug) {
    // Tenta buscar por subdomain (slug do restaurante)
    return await getCompanyBySubdomain(slug);
  }
  
  return null;
}

/**
 * Cria as meta tags Open Graph baseadas nos dados do restaurante
 */
function createOpenGraphMetaTags(
  restaurantName: string,
  restaurantDescription?: string,
  restaurantImage?: string,
  restaurantUrl?: string
): string {
  // Sanitizar valores para evitar XSS
  const escapeAttr = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const title = `${escapeAttr(restaurantName)} - Cardápio Digital`;
  const description =
    restaurantDescription ||
    "Cardápio digital com preços em Real, Dólar e Euro. Trilíngue.";
  const image = restaurantImage || "/og-image-default.png";
  const url = restaurantUrl || "";

  return `
    <!-- Open Graph Meta Tags para Preview em Redes Sociais -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:image" content="${escapeAttr(image)}" />
    ${url ? `<meta property="og:url" content="${escapeAttr(url)}" />` : ""}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(image)}" />
    
    <!-- Outros meta tags -->
    <meta name="title" content="${escapeAttr(title)}" />
    <meta name="description" content="${escapeAttr(description)}" />
  `;
}

/**
 * Middleware Express para injetar meta tags dinâmicas
 */
export async function ogMetaTagsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const hostname = req.hostname;

    // Se não for um bot, passa adiante (SPA normal)
    if (!isBotUserAgent(userAgent)) {
      return next();
    }

    // Tenta identificar o restaurante
    const restaurant = await getRestaurantByHostname(hostname);

    if (restaurant) {
      // Armazena os dados no res.locals para uso posterior
      res.locals.ogData = {
        name: restaurant.name,
        description: restaurant.description,
        image: restaurant.logo_url || restaurant.image_url,
        url: `https://${hostname}`,
        isBot: true,
      };
    } else {
      res.locals.ogData = { isBot: true };
    }

    next();
  } catch (error) {
    // Se ocorrer erro, apenas continua sem injetar OG tags
    console.error("[OG Meta Tags] Error:", error);
    next();
  }
}

/**
 * Middleware para injetar as meta tags no HTML antes de servir
 * Deve ser usado APÓS o HTML ser carregado, mas ANTES de ser enviado ao cliente
 */
export function injectOpenGraphTags(html: string, ogData?: any): string {
  if (!ogData?.name) {
    // Se não tem dados do restaurante, retorna HTML normal
    return html;
  }

  const ogMetaTags = createOpenGraphMetaTags(
    ogData.name,
    ogData.description,
    ogData.image,
    ogData.url
  );

  // Injeta as meta tags dentro da tag <head>
  return html.replace("</head>", `${ogMetaTags}\n  </head>`);
}

/**
 * Helper para extrair slug da URL (se estiver usando rota com slug)
 * Exemplo: /restaurante/meu-cardapio -> meu-cardapio
 */
export function getSlugFromUrl(url: string): string | null {
  const match = url.match(/^\/([^/]+)(?:\/|$)/);
  return match ? match[1] : null;
}
