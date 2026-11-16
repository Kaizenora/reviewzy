import { Shop, GoogleReview } from "@/types/shop";
import { DEFAULT_SHOPS, getShopBySlugFromDefaults } from "./default-shops";
import {
  getServerBusinessData,
  saveServerBusinessData,
  getServerGoogleReviews,
  saveServerGoogleReviews,
} from "./server-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl.trim().length > 5 &&
    supabaseAnonKey &&
    supabaseAnonKey.trim().length > 5
);

// Lazy-loaded Supabase client to avoid webpack vendor chunk issues on Windows
let supabaseInstance: any = null;

async function getSupabase(): Promise<any> {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    } catch (err) {
      console.warn("Could not load @supabase/supabase-js dynamically:", err);
      return null;
    }
  }
  return supabaseInstance;
}

// In-memory / local storage backup for client-side shop creation
const LOCAL_STORAGE_KEY = "reviewzy_custom_businesses";

function getLocalCustomShops(): Shop[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomShop(shop: Shop) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalCustomShops().filter((s) => s.slug !== shop.slug);
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify([...existing, shop])
    );
  } catch (e) {
    console.error("Failed to save local shop:", e);
  }
}

function deleteLocalCustomShop(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalCustomShops().filter(
      (s) => s.slug.toLowerCase() !== slug.toLowerCase()
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to delete local shop:", e);
  }
}

export function generateReportToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tok_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let str = "tok_";
  for (let i = 0; i < 32; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

/**
 * Fetch all available businesses / shops
 */
export async function getAllShops(): Promise<Shop[]> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: Record<string, unknown>) => {
          const sSlug = String(item.slug || "");
          const serverData = getServerBusinessData(sSlug);
          return {
            id: String(item.id || ""),
            slug: sSlug,
            name: String(item.name || ""),
            location: String(item.location || ""),
            logoLetter: String(
              item.logo_letter || String(item.name || "M").charAt(0).toUpperCase()
            ),
            logoUrl: item.logo_url ? String(item.logo_url) : undefined,
            brandColor: String(item.brand_color || "#E36427"),
            googleReviewUrl: String(item.google_review_url || ""),
            whatWentWellTags: (item.what_went_well_tags as string[]) || [],
            couldBeBetterTags: (item.could_be_better_tags as string[]) || [],
            category: String(item.category || "General"),
            createdAt: String(item.created_at || ""),
            reportToken:
              serverData?.reportToken ||
              (item.report_token
                ? String(item.report_token)
                : `tok_${sSlug.replace(/[^a-z0-9]/g, "")}_${String(item.id || "00").slice(0, 6)}`),
            timezone: serverData?.timezone || String(item.timezone || "Asia/Kolkata"),
            googleConnected:
              serverData?.googleConnected !== undefined
                ? Boolean(serverData.googleConnected)
                : Boolean(item.google_connected),
            googleAccountId: item.google_account_id ? String(item.google_account_id) : undefined,
            googleLocationId: item.google_location_id ? String(item.google_location_id) : undefined,
            googleAccessToken: item.google_access_token ? String(item.google_access_token) : undefined,
            googleRefreshToken: item.google_refresh_token ? String(item.google_refresh_token) : undefined,
            googleTokenExpiry: item.google_token_expiry ? String(item.google_token_expiry) : undefined,
            googleLastSyncedAt:
              serverData?.googleLastSyncedAt ||
              (item.google_last_synced_at ? String(item.google_last_synced_at) : undefined),
            googleLastError:
              serverData?.googleLastError !== undefined
                ? serverData.googleLastError
                : item.google_last_error
                ? String(item.google_last_error)
                : null,
            googleSyncStatus:
              serverData?.googleSyncStatus || (item.google_sync_status as any) || "idle",
          };
        });
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to defaults:", err);
    }
  }

  const custom = getLocalCustomShops();
  const map = new Map<string, Shop>();
  DEFAULT_SHOPS.forEach((s) => {
    const sData = getServerBusinessData(s.slug);
    map.set(s.slug, sData ? { ...s, ...sData } : s);
  });
  custom.forEach((s) => {
    const sData = getServerBusinessData(s.slug);
    map.set(s.slug, sData ? { ...s, ...sData } : s);
  });

  return Array.from(map.values());
}

/**
 * Fetch a single business by unique slug
 */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .eq("slug", slug.toLowerCase())
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        const item = data as Record<string, unknown>;
        const sSlug = String(item.slug || slug);
        const serverData = getServerBusinessData(sSlug);
        return {
          id: String(item.id || ""),
          slug: sSlug,
          name: String(item.name || ""),
          location: String(item.location || ""),
          logoLetter: String(
            item.logo_letter || String(item.name || "M").charAt(0).toUpperCase()
          ),
          logoUrl: item.logo_url ? String(item.logo_url) : undefined,
          brandColor: String(item.brand_color || "#E36427"),
          googleReviewUrl: String(item.google_review_url || ""),
          whatWentWellTags: (item.what_went_well_tags as string[]) || [],
          couldBeBetterTags: (item.could_be_better_tags as string[]) || [],
          category: String(item.category || "General"),
          createdAt: String(item.created_at || ""),
          reportToken:
            serverData?.reportToken ||
            (item.report_token
              ? String(item.report_token)
              : `tok_${sSlug.replace(/[^a-z0-9]/g, "")}_${String(item.id || "00").slice(0, 6)}`),
          timezone: serverData?.timezone || String(item.timezone || "Asia/Kolkata"),
          googleConnected:
            serverData?.googleConnected !== undefined
              ? Boolean(serverData.googleConnected)
              : Boolean(item.google_connected),
          googleAccountId: item.google_account_id ? String(item.google_account_id) : undefined,
          googleLocationId: item.google_location_id ? String(item.google_location_id) : undefined,
          googleAccessToken: item.google_access_token ? String(item.google_access_token) : undefined,
          googleRefreshToken: item.google_refresh_token ? String(item.google_refresh_token) : undefined,
          googleTokenExpiry: item.google_token_expiry ? String(item.google_token_expiry) : undefined,
          googleLastSyncedAt:
            serverData?.googleLastSyncedAt ||
            (item.google_last_synced_at ? String(item.google_last_synced_at) : undefined),
          googleLastError:
            serverData?.googleLastError !== undefined
              ? serverData.googleLastError
              : item.google_last_error
              ? String(item.google_last_error)
              : null,
          googleSyncStatus:
            serverData?.googleSyncStatus || (item.google_sync_status as any) || "idle",
        };
      }
    } catch (err) {
      console.warn("Supabase getShopBySlug failed:", err);
    }
  }

  // Check custom local shops
  const custom = getLocalCustomShops().find(
    (s) => s.slug.toLowerCase() === slug.toLowerCase()
  );
  if (custom) {
    const serverData = getServerBusinessData(slug);
    return serverData ? { ...custom, ...serverData } : custom;
  }

  // Fallback to presets
  const def = getShopBySlugFromDefaults(slug);
  if (def) {
    const serverData = getServerBusinessData(slug);
    if (serverData) {
      return {
        ...def,
        ...serverData,
        reportToken: serverData.reportToken || def.reportToken,
        timezone: serverData.timezone || def.timezone,
        googleConnected:
          serverData.googleConnected !== undefined
            ? Boolean(serverData.googleConnected)
            : def.googleConnected,
        googleLastSyncedAt: serverData.googleLastSyncedAt || def.googleLastSyncedAt,
        googleLastError:
          serverData.googleLastError !== undefined
            ? serverData.googleLastError
            : def.googleLastError,
        googleSyncStatus: serverData.googleSyncStatus || def.googleSyncStatus,
      };
    }
    return def;
  }

  return null;
}

/**
 * Save or create a new tenant business
 */
export async function saveShop(shop: Shop): Promise<Shop> {
  const token = shop.reportToken || generateReportToken();
  const tz = shop.timezone || "Asia/Kolkata";
  const shopWithDefaults: Shop = {
    ...shop,
    reportToken: token,
    timezone: tz,
    googleConnected: Boolean(shop.googleConnected),
    googleSyncStatus: shop.googleSyncStatus || "idle",
  };

  // Always persist server-side in file-backed store
  saveServerBusinessData(shopWithDefaults.slug, {
    googleConnected: shopWithDefaults.googleConnected,
    reportToken: shopWithDefaults.reportToken,
    timezone: shopWithDefaults.timezone,
    googleLastSyncedAt: shopWithDefaults.googleLastSyncedAt,
    googleLastError: shopWithDefaults.googleLastError,
    googleSyncStatus: shopWithDefaults.googleSyncStatus,
  });

  const sb = await getSupabase();
  if (sb) {
    try {
      const dbPayload = {
        slug: shopWithDefaults.slug.toLowerCase(),
        name: shopWithDefaults.name,
        location: shopWithDefaults.location,
        logo_letter: shopWithDefaults.logoLetter,
        logo_url: shopWithDefaults.logoUrl || null,
        brand_color: shopWithDefaults.brandColor,
        google_review_url: shopWithDefaults.googleReviewUrl,
        what_went_well_tags: shopWithDefaults.whatWentWellTags,
        could_be_better_tags: shopWithDefaults.couldBeBetterTags,
        category: shopWithDefaults.category || "General",
        is_active: true,
        report_token: shopWithDefaults.reportToken,
        timezone: shopWithDefaults.timezone,
        google_connected: shopWithDefaults.googleConnected,
        google_account_id: shopWithDefaults.googleAccountId || null,
        google_location_id: shopWithDefaults.googleLocationId || null,
        google_access_token: shopWithDefaults.googleAccessToken || null,
        google_refresh_token: shopWithDefaults.googleRefreshToken || null,
        google_token_expiry: shopWithDefaults.googleTokenExpiry || null,
        google_last_synced_at: shopWithDefaults.googleLastSyncedAt || null,
        google_last_error: shopWithDefaults.googleLastError || null,
        google_sync_status: shopWithDefaults.googleSyncStatus,
      };

      const { data, error } = await sb
        .from("businesses")
        .upsert(dbPayload as any, { onConflict: "slug" })
        .select()
        .single();

      if (error) {
        // Fallback upsert with base schema columns if new columns are not yet in Supabase schema
        const basePayload = {
          slug: shopWithDefaults.slug.toLowerCase(),
          name: shopWithDefaults.name,
          location: shopWithDefaults.location,
          logo_letter: shopWithDefaults.logoLetter,
          logo_url: shopWithDefaults.logoUrl || null,
          brand_color: shopWithDefaults.brandColor,
          google_review_url: shopWithDefaults.googleReviewUrl,
          what_went_well_tags: shopWithDefaults.whatWentWellTags,
          could_be_better_tags: shopWithDefaults.couldBeBetterTags,
          category: shopWithDefaults.category || "General",
          is_active: true,
        };

        const { data: baseData } = await sb
          .from("businesses")
          .upsert(basePayload as any, { onConflict: "slug" })
          .select()
          .single();

        const item = baseData as Record<string, unknown> | null;
        const finalShop = { ...shopWithDefaults, id: String(item?.id || shopWithDefaults.id) };
        saveLocalCustomShop(finalShop);
        return finalShop;
      } else if (data) {
        const item = data as Record<string, unknown>;
        const finalShop = { ...shopWithDefaults, id: String(item.id || shopWithDefaults.id) };
        saveLocalCustomShop(finalShop);
        return finalShop;
      }
    } catch (err) {
      console.error("Failed to save to Supabase:", err);
    }
  }

  // Fallback to local storage
  saveLocalCustomShop(shopWithDefaults);
  return shopWithDefaults;
}

const GOOGLE_REVIEWS_STORAGE_PREFIX = "reviewzy_google_reviews_";

function getLocalGoogleReviews(slug: string): GoogleReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${GOOGLE_REVIEWS_STORAGE_PREFIX}${slug.toLowerCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalGoogleReviews(slug: string, reviews: GoogleReview[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalGoogleReviews(slug);
    const map = new Map<string, GoogleReview>();
    existing.forEach((r) => map.set(r.googleReviewId, r));
    reviews.forEach((r) => map.set(r.googleReviewId, r));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    localStorage.setItem(
      `${GOOGLE_REVIEWS_STORAGE_PREFIX}${slug.toLowerCase()}`,
      JSON.stringify(merged)
    );
  } catch (e) {
    console.error("Failed to save local google reviews:", e);
  }
}

/**
 * Fetch actual Google reviews for a given business
 */
export async function getGoogleReviews(businessSlug: string): Promise<GoogleReview[]> {
  const slug = businessSlug.toLowerCase();
  let dbReviews: GoogleReview[] = [];

  const sb = await getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("google_reviews")
        .select("*")
        .eq("business_slug", slug)
        .order("posted_at", { ascending: false });

      if (!error && data && data.length > 0) {
        dbReviews = data.map((r: Record<string, unknown>) => ({
          id: String(r.id || ""),
          businessId: String(r.business_id || ""),
          businessSlug: String(r.business_slug || ""),
          googleReviewId: String(r.google_review_id || ""),
          stars: Number(r.stars || 5),
          text: String(r.text || ""),
          authorName: String(r.author_name || "Google User"),
          authorPhotoUrl: r.author_photo_url ? String(r.author_photo_url) : undefined,
          postedAt: String(r.posted_at || new Date().toISOString()),
          createdAt: String(r.created_at || ""),
        }));
      }
    } catch (err) {
      console.warn("Supabase getGoogleReviews failed, falling back:", err);
    }
  }

  const serverReviews = getServerGoogleReviews(slug);
  const localReviews = getLocalGoogleReviews(slug);

  const map = new Map<string, GoogleReview>();
  dbReviews.forEach((r) => map.set(r.googleReviewId, r));
  localReviews.forEach((r) => map.set(r.googleReviewId, r));
  serverReviews.forEach((r) => map.set(r.googleReviewId, r));

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

/**
 * Save actual Google reviews into database / storage
 */
export async function saveGoogleReviews(reviews: GoogleReview[]): Promise<boolean> {
  if (!reviews || reviews.length === 0) return true;
  const slug = reviews[0].businessSlug.toLowerCase();

  // 1. Save to server store
  saveServerGoogleReviews(slug, reviews);

  // 2. Save to local storage (if in browser)
  saveLocalGoogleReviews(slug, reviews);

  // 3. Save to Supabase (if table exists)
  const sb = await getSupabase();
  if (sb) {
    try {
      const dbPayload = reviews.map((r) => ({
        business_id: r.businessId && r.businessId.startsWith("shop_") ? null : r.businessId || null,
        business_slug: r.businessSlug.toLowerCase(),
        google_review_id: r.googleReviewId,
        stars: r.stars,
        text: r.text || "",
        author_name: r.authorName,
        author_photo_url: r.authorPhotoUrl || null,
        posted_at: r.postedAt,
      }));

      const { error } = await sb
        .from("google_reviews")
        .upsert(dbPayload, { onConflict: "business_slug,google_review_id" });

      if (error) {
        console.warn("Supabase google_reviews upsert notice:", error.message);
      }
    } catch (err) {
      console.warn("Supabase saveGoogleReviews notice:", err);
    }
  }

  return true;
}

/**
 * Update Google sync metadata for a business
 */
export async function updateBusinessGoogleSync(
  slug: string,
  updates: Partial<Shop>
): Promise<boolean> {
  const current = await getShopBySlug(slug);
  if (!current) return false;

  const updated: Shop = {
    ...current,
    ...updates,
  };

  await saveShop(updated);
  return true;
}

/**
 * Delete a shop
 */
export async function deleteShop(slug: string): Promise<boolean> {
  const sb = await getSupabase();
  if (sb) {
    try {
      await sb
        .from("businesses")
        .delete()
        .eq("slug", slug.toLowerCase());
    } catch (err) {
      console.error("Failed to delete from Supabase:", err);
    }
  }

  deleteLocalCustomShop(slug);
  return true;
}

/**
 * Log customer review generation / copy action
 */
export async function logReviewGenerated(review: {
  shopSlug: string;
  rating: number;
  tags: string[];
  reviewText: string;
  tone: string;
  actionStatus?: string;
}) {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data: business } = await sb
        .from("businesses")
        .select("id")
        .eq("slug", review.shopSlug)
        .maybeSingle();

      const businessItem = business as Record<string, unknown> | null;

      await sb.from("review_logs").insert([
        {
          business_id: businessItem?.id || null,
          business_slug: review.shopSlug,
          rating: review.rating,
          selected_tags: review.tags,
          review_text: review.reviewText,
          tone: review.tone,
          action_status: review.actionStatus || "copied_and_opened_google",
          created_at: new Date().toISOString(),
        } as any,
      ]);
    } catch {
      // Silent error logging for analytics
    }
  }
}
