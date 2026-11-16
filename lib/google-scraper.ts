import { GoogleReview, Shop } from "@/types/shop";

export interface ScraperResult {
  success: boolean;
  reviews: GoogleReview[];
  error?: string;
  provider?: "outscraper" | "serpapi";
}

/**
 * Extract data_id or CID from a Google Maps URL
 */
export function extractGoogleMapsDataId(url: string): string | null {
  if (!url) return null;
  // Look for !1s(0x...:0x...)
  const match = url.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (match) return match[1];

  // Look for data=...!1s...
  const cidMatch = url.match(/cid=([0-9]+)/);
  if (cidMatch) return cidMatch[1];

  return null;
}

/**
 * Fetch reviews via Outscraper API
 * https://outscraper.com/
 */
async function fetchViaOutscraper(
  shop: Shop,
  apiKey: string
): Promise<GoogleReview[]> {
  const targetUrl = shop.googleReviewUrl;
  const endpoints = [
    `https://api.outscraper.cloud/google-maps-reviews?query=${encodeURIComponent(
      targetUrl
    )}&reviewsLimit=50&async=false`,
    `https://api.app.outscraper.com/maps/reviews-v3?query=${encodeURIComponent(
      targetUrl
    )}&reviewsLimit=50&async=false&apiKey=${encodeURIComponent(apiKey)}`,
  ];

  let rawReviews: any[] = [];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "X-API-KEY": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const reviews =
          json.data?.[0]?.reviews_data ||
          json.reviews_data ||
          json.data ||
          [];
        if (Array.isArray(reviews)) {
          rawReviews = reviews;
          break;
        }
      } else {
        const errText = await res.text();
        lastError = new Error(`Outscraper error (${res.status}): ${errText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (rawReviews.length === 0 && lastError) {
    throw lastError;
  }

  return rawReviews.map((r: any) => ({
    id: `rev_out_${r.review_id || Math.random().toString(36).substring(2)}`,
    businessId: shop.id,
    businessSlug: shop.slug,
    googleReviewId: String(r.review_id || `${Date.now()}_${Math.random()}`),
    stars: Number(r.review_rating || r.rating || 5),
    text: String(r.review_text || r.text || r.snippet || ""),
    authorName: String(r.author_title || r.author_name || r.name || "Google Reviewer"),
    authorPhotoUrl: r.author_image || r.author_photo_url || undefined,
    postedAt: r.review_datetime_utc
      ? new Date(r.review_datetime_utc).toISOString()
      : r.review_timestamp
      ? new Date(r.review_timestamp * 1000).toISOString()
      : new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));
}

/**
 * Fetch reviews via SerpApi Google Maps Reviews API
 * https://serpapi.com/google-maps-reviews-api
 */
async function fetchViaSerpApi(
  shop: Shop,
  apiKey: string
): Promise<GoogleReview[]> {
  const dataId = extractGoogleMapsDataId(shop.googleReviewUrl);
  let endpoint = `https://serpapi.com/search.json?engine=google_maps_reviews&sort_by=newest&api_key=${encodeURIComponent(
    apiKey
  )}`;

  if (dataId) {
    endpoint += `&data_id=${encodeURIComponent(dataId)}`;
  } else {
    endpoint += `&q=${encodeURIComponent(shop.name + " " + shop.location)}`;
  }

  const res = await fetch(endpoint);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SerpApi error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawReviews = (data.reviews as Array<any>) || [];

  return rawReviews.map((r: any) => ({
    id: `rev_serp_${r.review_id || Math.random().toString(36).substring(2)}`,
    businessId: shop.id,
    businessSlug: shop.slug,
    googleReviewId: String(r.review_id || `${Date.now()}_${Math.random()}`),
    stars: Number(r.rating || 5),
    text: String(r.snippet || r.text || ""),
    authorName: String(r.user?.name || "Google Reviewer"),
    authorPhotoUrl: r.user?.thumbnail ? String(r.user.thumbnail) : undefined,
    postedAt: r.iso_date || r.iso_date_of_last_edit
      ? new Date(r.iso_date || r.iso_date_of_last_edit).toISOString()
      : new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));
}

/**
 * Main scraper fetch dispatcher
 */
export async function scrapePublicGoogleReviews(
  shop: Shop
): Promise<ScraperResult> {
  const outscraperKey = process.env.OUTSCRAPER_API_KEY;
  const serpapiKey = process.env.SERPAPI_API_KEY;

  if (outscraperKey && outscraperKey.trim().length > 3) {
    try {
      const reviews = await fetchViaOutscraper(shop, outscraperKey.trim());
      return { success: true, reviews, provider: "outscraper" };
    } catch (err: any) {
      console.error("Outscraper error:", err);
      return { success: false, reviews: [], error: err?.message };
    }
  }

  if (serpapiKey && serpapiKey.trim().length > 3) {
    try {
      const reviews = await fetchViaSerpApi(shop, serpapiKey.trim());
      return { success: true, reviews, provider: "serpapi" };
    } catch (err: any) {
      console.error("SerpApi error:", err);
      return { success: false, reviews: [], error: err?.message };
    }
  }

  return {
    success: false,
    reviews: [],
    error: "No Google Maps scraper API key configured (OUTSCRAPER_API_KEY or SERPAPI_API_KEY).",
  };
}
