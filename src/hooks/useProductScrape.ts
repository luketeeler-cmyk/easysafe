import { useState, useCallback } from 'react';
import {
  scrapeProduct,
  type ScrapedProduct,
} from '../services/scrapeService';

/* ------------------------------------------------------------------ */
/*  Product Scraping Hook                                               */
/* ------------------------------------------------------------------ */

interface UseProductScrapeReturn {
  scrape: (url: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  data: ScrapedProduct | null;
}

/**
 * Wraps `scrapeService.scrapeProduct` in React state so components can
 * trigger a scrape and reactively display the result / loading / error.
 */
export function useProductScrape(): UseProductScrapeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScrapedProduct | null>(null);

  const scrape = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: scrapeError } = await scrapeProduct(url);

      if (scrapeError) {
        setError(
          scrapeError instanceof Error
            ? scrapeError.message
            : String(scrapeError),
        );
        return;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { scrape, loading, error, data };
}
