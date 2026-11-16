import { Shop, GoogleReview } from "@/types/shop";
import { isGoogleSyncEnabled, getGoogleOAuthCredentials } from "./google-config";
import {
  getShopBySlug,
  updateBusinessGoogleSync,
  saveGoogleReviews,
  getGoogleReviews,
} from "./supabase";

function parseGoogleStarRating(starRating: string | number): number {
  if (typeof starRating === "number") return Math.min(5, Math.max(1, starRating));
  switch (starRating?.toUpperCase()) {
    case "FIVE":
      return 5;
    case "FOUR":
      return 4;
    case "THREE":
      return 3;
    case "TWO":
      return 2;
    case "ONE":
      return 1;
    default:
      return 5;
  }
}

/**
 * Refresh Google OAuth access token if expired
 */
async function refreshGoogleAccessToken(shop: Shop): Promise<string | null> {
  if (!shop.googleRefreshToken) return shop.googleAccessToken || null;

  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  if (!clientId || !clientSecret) return shop.googleAccessToken || null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: shop.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Token refresh error from Google:", errText);
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.access_token;
    const expiresIn = Number(data.expires_in || 3600);
    const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    await updateBusinessGoogleSync(shop.slug, {
      googleAccessToken: newAccessToken,
      googleTokenExpiry: newExpiry,
    });

    return newAccessToken;
  } catch (err) {
    console.error("Failed to refresh Google token:", err);
    return null;
  }
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  lastSyncedAt?: string;
  error?: string;
  isApiFlagEnabled: boolean;
}

import { scrapePublicGoogleReviews } from "./google-scraper";

/**
 * Sync Google reviews for a specific business
 */
export async function syncBusinessGoogleReviews(slug: string): Promise<SyncResult> {
  const shop = await getShopBySlug(slug);
  if (!shop) {
    return {
      success: false,
      syncedCount: 0,
      error: `Business '${slug}' not found.`,
      isApiFlagEnabled: isGoogleSyncEnabled(),
    };
  }

  if (!shop.googleConnected) {
    return {
      success: false,
      syncedCount: 0,
      error: "Google Business Profile is not connected for this business.",
      isApiFlagEnabled: isGoogleSyncEnabled(),
    };
  }

  // Update status to syncing
  await updateBusinessGoogleSync(slug, {
    googleSyncStatus: "syncing",
    googleLastError: null,
  });

  // 1. Try public Google Maps Scraper (Outscraper / SerpApi) if configured
  const scraperKey = process.env.OUTSCRAPER_API_KEY || process.env.SERPAPI_API_KEY;
  if (scraperKey) {
    const scraperRes = await scrapePublicGoogleReviews(shop);
    if (scraperRes.success && scraperRes.reviews.length > 0) {
      await saveGoogleReviews(scraperRes.reviews);
      const syncedAt = new Date().toISOString();
      await updateBusinessGoogleSync(slug, {
        googleLastSyncedAt: syncedAt,
        googleSyncStatus: "success",
        googleLastError: null,
      });
      return {
        success: true,
        syncedCount: scraperRes.reviews.length,
        lastSyncedAt: syncedAt,
        isApiFlagEnabled: false,
      };
    } else if (scraperRes.error) {
      console.warn("Public reviews scraper notice:", scraperRes.error);
    }
  }

  const apiEnabled = isGoogleSyncEnabled();

  // 2. If live Google API access is not approved yet, keep the live sync behind the config flag
  if (!apiEnabled) {
    const existingReviews = await getGoogleReviews(slug);

    const syncedAt = new Date().toISOString();
    await updateBusinessGoogleSync(slug, {
      googleLastSyncedAt: syncedAt,
      googleSyncStatus: "success",
      googleLastError: null,
    });

    return {
      success: true,
      syncedCount: existingReviews.length,
      lastSyncedAt: syncedAt,
      isApiFlagEnabled: false,
    };
  }

  // When API flag is enabled, perform live Google Business Profile API sync
  try {
    let accessToken = shop.googleAccessToken;

    // Check token expiration
    if (
      shop.googleTokenExpiry &&
      new Date(shop.googleTokenExpiry).getTime() <= Date.now() + 60000
    ) {
      accessToken = (await refreshGoogleAccessToken(shop)) || accessToken;
    }

    if (!accessToken) {
      throw new Error(
        "Google access token is missing or expired. Please reconnect Google."
      );
    }

    const accountId = shop.googleAccountId || "accounts/me";
    const locationId = shop.googleLocationId || "locations/primary";

    // Call Google My Business v4 reviews endpoint
    const url = `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Google API returned status ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const rawReviews = (data.reviews as Array<Record<string, any>>) || [];

    const mappedReviews: GoogleReview[] = rawReviews.map((r) => ({
      id: `rev_${r.reviewId || Date.now()}`,
      businessId: shop.id,
      businessSlug: shop.slug,
      googleReviewId: String(r.reviewId || `${Date.now()}_${Math.random()}`),
      stars: parseGoogleStarRating(r.starRating),
      text: String(r.comment || ""),
      authorName: String(r.reviewer?.displayName || "Google User"),
      authorPhotoUrl: r.reviewer?.profilePhotoUrl ? String(r.reviewer.profilePhotoUrl) : undefined,
      postedAt: String(r.createTime || new Date().toISOString()),
      createdAt: new Date().toISOString(),
    }));

    if (mappedReviews.length > 0) {
      await saveGoogleReviews(mappedReviews);
    }

    const syncedAt = new Date().toISOString();
    await updateBusinessGoogleSync(slug, {
      googleLastSyncedAt: syncedAt,
      googleSyncStatus: "success",
      googleLastError: null,
    });

    return {
      success: true,
      syncedCount: mappedReviews.length,
      lastSyncedAt: syncedAt,
      isApiFlagEnabled: true,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to sync Google reviews.";
    console.error("Google sync error for", slug, errorMsg);

    await updateBusinessGoogleSync(slug, {
      googleSyncStatus: "failed",
      googleLastError: errorMsg,
    });

    return {
      success: false,
      syncedCount: 0,
      error: errorMsg,
      isApiFlagEnabled: true,
    };
  }
}
