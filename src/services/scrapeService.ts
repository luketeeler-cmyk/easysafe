import { supabase } from '../config/supabase';

/* ------------------------------------------------------------------ */
/*  Product Scraping Service (Edge Function)                           */
/* ------------------------------------------------------------------ */

export interface ScrapedProduct {
  name?: string;
  manufacturer?: string;
  model?: string;
  caliber?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

/**
 * Invoke the `scrape-product` Supabase Edge Function to extract
 * structured product data from a retailer URL.
 */
export async function scrapeProduct(
  url: string,
): Promise<{ data: ScrapedProduct | null; error: unknown }> {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-product', {
      body: { url },
    });

    if (error) return { data: null, error };

    return { data: data as ScrapedProduct, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
