import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug, saveGoogleReviews, updateBusinessGoogleSync } from "@/lib/supabase";
import { GoogleReview } from "@/types/shop";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, token, reviews } = body;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const shop = await getShopBySlug(slug);
    if (!shop) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (shop.reportToken && shop.reportToken !== token) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 403 });
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: "No reviews provided" }, { status: 400 });
    }

    const mapped: GoogleReview[] = reviews.map((r: any, idx: number) => ({
      id: r.id || `rev_real_${Date.now()}_${idx}`,
      businessId: shop.id,
      businessSlug: shop.slug,
      googleReviewId: r.googleReviewId || `g_rev_real_${Date.now()}_${idx}`,
      stars: Number(r.stars || 5),
      text: String(r.text || ""),
      authorName: String(r.authorName || "Google Reviewer"),
      authorPhotoUrl: r.authorPhotoUrl,
      postedAt: r.postedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }));

    await saveGoogleReviews(mapped);

    const syncedAt = new Date().toISOString();
    await updateBusinessGoogleSync(slug, {
      googleConnected: true,
      googleLastSyncedAt: syncedAt,
      googleSyncStatus: "success",
      googleLastError: null,
    });

    return NextResponse.json({
      success: true,
      importedCount: mapped.length,
      lastSyncedAt: syncedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Import failed" }, { status: 500 });
  }
}
