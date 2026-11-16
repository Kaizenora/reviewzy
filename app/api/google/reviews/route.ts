import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug, getGoogleReviews } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");

  if (!slug) {
    return NextResponse.json({ error: "Missing required slug" }, { status: 400 });
  }

  const shop = await getShopBySlug(slug);
  if (!shop) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Scoped access verification
  if (shop.reportToken && shop.reportToken !== token) {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 403 });
  }

  const reviews = await getGoogleReviews(slug);

  return NextResponse.json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      location: shop.location,
      logoUrl: shop.logoUrl,
      logoLetter: shop.logoLetter,
      brandColor: shop.brandColor,
      timezone: shop.timezone || "Asia/Kolkata",
      googleConnected: Boolean(shop.googleConnected),
      googleLastSyncedAt: shop.googleLastSyncedAt,
      googleLastError: shop.googleLastError,
      googleSyncStatus: shop.googleSyncStatus || "idle",
      reportToken: shop.reportToken,
    },
    reviews,
  });
}
