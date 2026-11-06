import { Shop } from "@/types/shop";
import { DEFAULT_SHOPS, getShopBySlugFromDefaults } from "./default-shops";

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
        return data.map((item: Record<string, unknown>) => ({
          id: String(item.id || ""),
          slug: String(item.slug || ""),
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
        }));
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to defaults:", err);
    }
  }

  const custom = getLocalCustomShops();
  const map = new Map<string, Shop>();
  DEFAULT_SHOPS.forEach((s) => map.set(s.slug, s));
  custom.forEach((s) => map.set(s.slug, s));

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
        return {
          id: String(item.id || ""),
          slug: String(item.slug || ""),
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
  if (custom) return custom;

  // Fallback to presets
  return getShopBySlugFromDefaults(slug) || null;
}

/**
 * Save or create a new tenant business
 */
export async function saveShop(shop: Shop): Promise<Shop> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const dbPayload = {
        slug: shop.slug.toLowerCase(),
        name: shop.name,
        location: shop.location,
        logo_letter: shop.logoLetter,
        logo_url: shop.logoUrl || null,
        brand_color: shop.brandColor,
        google_review_url: shop.googleReviewUrl,
        what_went_well_tags: shop.whatWentWellTags,
        could_be_better_tags: shop.couldBeBetterTags,
        category: shop.category || "General",
        is_active: true,
      };

      const { data, error } = await sb
        .from("businesses")
        .upsert(dbPayload as any, { onConflict: "slug" })
        .select()
        .single();

      if (error) {
        console.error("Supabase businesses upsert error:", error);
      } else if (data) {
        const item = data as Record<string, unknown>;
        saveLocalCustomShop({ ...shop, id: String(item.id || shop.id) });
        return { ...shop, id: String(item.id || shop.id) };
      }
    } catch (err) {
      console.error("Failed to save to Supabase:", err);
    }
  }

  // Fallback to local storage
  saveLocalCustomShop(shop);
  return shop;
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
