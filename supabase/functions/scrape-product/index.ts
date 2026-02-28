import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
}

interface ProductData {
  name?: string
  manufacturer?: string
  model?: string
  caliber?: string
  price?: number
  description?: string
  image_urls?: string[]
  [key: string]: string | number | string[] | undefined
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A valid URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the page
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL (status ${response.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    if (!doc) {
      return new Response(
        JSON.stringify({ error: 'Could not parse page content' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const product: ProductData = {}
    const imageUrls: string[] = []

    // ── Strategy 1: JSON-LD structured data ──
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]')
    for (const script of jsonLdScripts) {
      try {
        const raw = JSON.parse(script.textContent || '')
        const items = Array.isArray(raw) ? raw : [raw]
        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
            product.name = product.name || item.name
            product.description = product.description || item.description
            product.manufacturer = product.manufacturer || item.brand?.name || item.manufacturer?.name
            if (item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image]
              imgs.forEach((img: string | { url?: string }) => {
                const u = typeof img === 'string' ? img : img?.url
                if (u) imageUrls.push(u)
              })
            }
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
              const p = parseFloat(offer?.price)
              if (!isNaN(p)) product.price = p
            }
            // Look for additional properties
            if (item.sku) product.sku = item.sku
            if (item.gtin12) product.upc = item.gtin12
          }
        }
      } catch { /* skip malformed JSON-LD */ }
    }

    // ── Strategy 2: Open Graph meta tags ──
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
    const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
    const ogPrice = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content')

    if (!product.name && ogTitle) product.name = ogTitle
    if (!product.description && ogDesc) product.description = ogDesc
    if (ogImage && !imageUrls.includes(ogImage)) imageUrls.push(ogImage)
    if (!product.price && ogPrice) {
      const p = parseFloat(ogPrice)
      if (!isNaN(p)) product.price = p
    }

    // ── Strategy 3: Standard meta tags and title ──
    if (!product.name) {
      product.name = doc.querySelector('meta[name="title"]')?.getAttribute('content')
        || doc.querySelector('title')?.textContent?.trim()
        || undefined
    }
    if (!product.description) {
      product.description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || undefined
    }

    // ── Strategy 4: Price from page content ──
    if (!product.price) {
      // Match common price patterns: $XX.XX, $X,XXX.XX
      const priceMatch = html.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/)?.[1]
      if (priceMatch) {
        const p = parseFloat(priceMatch.replace(/,/g, ''))
        if (!isNaN(p) && p > 0 && p < 100000) product.price = p
      }
    }

    // ── Strategy 5: Parse product name into manufacturer + model ──
    if (product.name && !product.model) {
      // Clean name: remove "- Site Name" suffixes
      const cleaned = product.name
        .replace(/\s*[-|–—]\s*(?:Brownells|Palmetto State Armory|PSA|Primary Arms|OpticsPlanet|Cabela's|Bass Pro|Midway|MidwayUSA|Sportsman's|Cheaper Than Dirt|Natchez|Grabagun|Academy|Buds Gun Shop|GunBroker).*$/i, '')
        .trim()

      if (!product.manufacturer) {
        // Common firearms manufacturers to detect
        const mfgPatterns = [
          'Smith & Wesson', 'S&W', 'Glock', 'Sig Sauer', 'SIG', 'Ruger',
          'Springfield', 'Beretta', 'Browning', 'Colt', 'Remington', 'Mossberg',
          'Winchester', 'Savage', 'Benelli', 'CZ', 'Walther', 'Kimber', 'FN',
          'Taurus', 'Henry', 'Marlin', 'Tikka', 'Bergara', 'Howa', 'Daniel Defense',
          'Aero Precision', 'Palmetto State', 'BCM', 'Geissele', 'Magpul',
          'Vortex', 'Leupold', 'Aimpoint', 'Trijicon', 'Holosun', 'EOTech',
          'SilencerCo', 'Dead Air', 'SureFire', 'Thunder Beast', 'Yankee Hill',
          'Hornady', 'Federal', 'Winchester', 'Remington', 'Speer', 'PMC',
          'Fiocchi', 'Sellier & Bellot', 'Magtech', 'Aguila', 'CCI',
        ]
        for (const mfg of mfgPatterns) {
          if (cleaned.toLowerCase().startsWith(mfg.toLowerCase())) {
            product.manufacturer = mfg
            product.model = cleaned.slice(mfg.length).trim().replace(/^[-–—]\s*/, '')
            break
          }
        }
      }

      if (!product.model) {
        const parts = cleaned.split(/\s+/)
        if (parts.length >= 2) {
          product.manufacturer = product.manufacturer || parts[0]
          product.model = parts.slice(1).join(' ')
        }
      }
    }

    // ── Strategy 6: Caliber extraction ──
    const caliberPatterns = [
      /\b(6\.5\s*(?:Creedmoor|CM|Grendel|PRC))\b/i,
      /\b(\.300\s*(?:BLK|Blackout|Win(?:chester)?\s*Mag(?:num)?))\b/i,
      /\b(\.338\s*Lapua(?:\s*Mag(?:num)?)?)\b/i,
      /\b(\.(?:22|17)\s*(?:LR|WMR|HMR|Hornet))\b/i,
      /\b(\.(?:223|224|243|25-06|270|30-06|30-30|300|308|338|350|375|44|357|380|38|40|45|50)\s*(?:Rem(?:ington)?|Win(?:chester)?|S&W|ACP|Auto|Special|Magnum|Mag|Legend|Beowulf)?)\b/i,
      /\b((?:5\.56|7\.62|5\.7|4\.6|6\.8|6\.5|7|8|10|12|20)\s*(?:x\d+)?(?:mm)?(?:\s*NATO)?)\b/i,
      /\b(9\s*mm(?:\s*(?:Luger|Parabellum|NATO))?)\b/i,
      /\b((?:10|12|16|20|28|410)\s*(?:ga(?:uge)?))\b/i,
    ]
    const searchText = `${product.name || ''} ${product.description || ''}`
    for (const pattern of caliberPatterns) {
      const match = searchText.match(pattern)
      if (match) {
        product.caliber = match[1].trim()
        break
      }
    }

    // ── Collect product images from page ──
    if (imageUrls.length === 0) {
      const mainImg = doc.querySelector('.product-image img, .product-photo img, [data-main-image] img, .gallery img, .product img')
      if (mainImg) {
        const src = mainImg.getAttribute('src') || mainImg.getAttribute('data-src')
        if (src) imageUrls.push(src)
      }
    }

    // Resolve relative URLs
    product.image_urls = imageUrls
      .filter(Boolean)
      .map(u => {
        try {
          return new URL(u, parsedUrl.origin).toString()
        } catch {
          return u
        }
      })
      .slice(0, 5) // Limit to 5 images

    return new Response(
      JSON.stringify({ data: product }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
