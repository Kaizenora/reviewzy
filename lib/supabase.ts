import { createClient } from "@supabase/supabase-js";
import { Shop } from "@/types/shop";
import { DEFAULT_SHOPS, getShopBySlugFromDefaults } from "./default-shops";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

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

/**
 * Fetch all available businesses / shops
 * Works across Supabase (with multi-tenant RLS) and local storage fallback
 */
export async function getAllShops(): Promise<Shop[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          location: item.location,
          logoLetter: item.logo_letter || item.name.charAt(0).toUpperCase(),
          brandColor: item.brand_color || "#E36427",
          googleReviewUrl: item.google_review_url,
          whatWentWellTags: item.what_went_well_tags || [],
          couldBeBetterTags: item.could_be_better_tags || [],
          category: item.category || "General",
          createdAt: item.created_at,
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
 * Fetch a single business by unique slug (for public customer QR scan flow)
 */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug.toLowerCase())
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          name: data.name,
          location: data.location,
          logoLetter: data.logo_letter || data.name.charAt(0).toUpperCase(),
          brandColor: data.brand_color || "#E36427",
          googleReviewUrl: data.google_review_url,
          whatWentWellTags: data.what_went_well_tags || [],
          couldBeBetterTags: data.could_be_better_tags || [],
          category: data.category || "General",
          createdAt: data.created_at,
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
  if (supabase) {
    try {
      const dbPayload = {
        slug: shop.slug.toLowerCase(),
        name: shop.name,
        location: shop.location,
        logo_letter: shop.logoLetter,
        brand_color: shop.brandColor,
        google_review_url: shop.googleReviewUrl,
        what_went_well_tags: shop.whatWentWellTags,
        could_be_better_tags: shop.couldBeBetterTags,
        category: shop.category || "General",
        is_active: true,
      };

      const { data, error } = await supabase
        .from("businesses")
        .upsert(dbPayload, { onConflict: "slug" })
        .select()
        .single();

      if (error) {
        console.error("Supabase businesses upsert error:", error);
      } else if (data) {
        saveLocalCustomShop({ ...shop, id: data.id });
        return { ...shop, id: data.id };
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
  if (supabase) {
    try {
      // Find business ID by slug if possible
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", review.shopSlug)
        .maybeSingle();

      await supabase.from("review_logs").insert([
        {
          business_id: business?.id || null,
          business_slug: review.shopSlug,
          rating: review.rating,
          selected_tags: review.tags,
          review_text: review.reviewText,
          tone: review.tone,
          action_status: review.actionStatus || "copied_and_opened_google",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      // Silent error logging for analytics
    }
  }
}
