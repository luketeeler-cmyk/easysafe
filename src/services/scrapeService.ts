import { supabase } from '../config/supabase';

/* ------------------------------------------------------------------ */
/*  Product Scraping Service                                           */
/* ------------------------------------------------------------------ */

export interface ScrapedProduct {
  name?: string;
  manufacturer?: string;
  model?: string;
  caliber?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  barrelLength?: string;
  capacity?: string;
  [key: string]: unknown;
}

/* ---- Caliber patterns -------------------------------------------- */

const CALIBER_PATTERNS = [
  /\b(9\s*mm)\b/i,
  /\b(\.22\s*LR)\b/i,
  /\b(\.22\s*WMR)\b/i,
  /\b(\.380\s*ACP)\b/i,
  /\b(\.38\s*Special)\b/i,
  /\b(\.357\s*(?:Mag(?:num)?))\b/i,
  /\b(10\s*mm(?:\s*Auto)?)\b/i,
  /\b(\.40\s*S&W)\b/i,
  /\b(\.44\s*(?:Mag(?:num)?))\b/i,
  /\b(\.45\s*ACP)\b/i,
  /\b(\.45\s*Colt)\b/i,
  /\b(5\.56(?:\s*(?:x45|NATO))?)\b/i,
  /\b(\.223\s*(?:Rem(?:ington)?))\b/i,
  /\b(\.243\s*(?:Win(?:chester)?))\b/i,
  /\b(6\.5\s*(?:Creedmoor|CM|Grendel|PRC))\b/i,
  /\b(\.270\s*(?:Win(?:chester)?))\b/i,
  /\b(7\.62\s*(?:x39|x51|NATO))\b/i,
  /\b(\.308\s*(?:Win(?:chester)?))\b/i,
  /\b(\.30-06(?:\s*Springfield)?)\b/i,
  /\b(\.300\s*(?:Win(?:chester)?(?:\s*Mag(?:num)?)?|BLK|Blackout|PRC|WSM))\b/i,
  /\b(\.338\s*(?:Lapua(?:\s*Mag(?:num)?)?|Win(?:\s*Mag)?))\b/i,
  /\b(\.50\s*BMG)\b/i,
  /\b(12\s*(?:ga(?:uge)?))\b/i,
  /\b(20\s*(?:ga(?:uge)?))\b/i,
  /\b(\.410(?:\s*bore)?)\b/i,
];

/* ---- Client-side HTML parser ------------------------------------- */

function parseHtmlForProduct(html: string): ScrapedProduct {
  const result: ScrapedProduct = {};

  /* Extract title */
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);

  result.name = ogTitleMatch?.[1] ?? h1Match?.[1] ?? titleMatch?.[1] ?? undefined;
  if (result.name) result.name = result.name.trim();

  /* Extract price — look for common patterns */
  const pricePatterns = [
    /<[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /<[^>]*itemprop="price"[^>]*content="([\d.]+)"/i,
    /\"price\"\s*:\s*\"?([\d.]+)\"?/i,
    /\$\s*([\d,]+\.\d{2})\b/,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > 0 && val < 100000) {
        result.price = val;
        break;
      }
    }
  }

  /* Extract caliber */
  const textContent = html.replace(/<[^>]+>/g, ' ');
  for (const pattern of CALIBER_PATTERNS) {
    const match = textContent.match(pattern);
    if (match) {
      result.caliber = match[1].trim();
      break;
    }
  }

  /* Extract barrel length */
  const barrelMatch = textContent.match(/barrel\s*(?:length)?\s*[:\-]?\s*([\d.]+)\s*(?:"|in(?:ch(?:es)?)?|")/i);
  if (barrelMatch) {
    result.barrelLength = barrelMatch[1] + '"';
  }

  /* Extract capacity */
  const capMatch = textContent.match(/(?:capacity|round)\s*[:\-]?\s*(\d+)\s*(?:\+\s*\d+\s*)?(?:round|rd)/i)
    ?? textContent.match(/(\d+)\s*(?:\+\s*\d+\s*)?(?:round|rd)\s*(?:capacity|magazine)/i);
  if (capMatch) {
    result.capacity = capMatch[1];
  }

  /* Extract OG description */
  const descMatch = html.match(/<meta[^>]*(?:property="og:description"|name="description")[^>]*content="([^"]+)"/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  /* Extract OG image */
  const imgMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  if (imgMatch) {
    result.imageUrl = imgMatch[1];
  }

  return result;
}

/* ---- Client-side fetch via CORS proxy ----------------------------- */

async function scrapeViaProxy(url: string): Promise<ScrapedProduct> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  const response = await fetch(proxyUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }

  const html = await response.text();
  return parseHtmlForProduct(html);
}

/* ---- Main export -------------------------------------------------- */

/**
 * Attempt to scrape product data from a URL.
 * Tries Supabase Edge Function first, falls back to client-side CORS proxy.
 */
export async function scrapeProduct(
  url: string,
): Promise<{ data: ScrapedProduct | null; error: unknown }> {
  /* Try Supabase Edge Function first */
  try {
    const { data, error } = await supabase.functions.invoke('scrape-product', {
      body: { url },
    });

    if (!error && data && (data as ScrapedProduct).name) {
      return { data: data as ScrapedProduct, error: null };
    }
  } catch {
    /* Edge function not available — fall through to proxy */
  }

  /* Fallback: client-side CORS proxy */
  try {
    const data = await scrapeViaProxy(url);

    if (!data.name && !data.price && !data.caliber) {
      return { data: null, error: new Error("Couldn't read that URL — please fill in manually") };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: new Error("Couldn't read that URL — please fill in manually"),
    };
  }
}
