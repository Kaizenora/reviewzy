import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug } from "@/lib/supabase";
import { buildGoogleAuthUrl } from "@/lib/google-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");

  if (!slug || !token) {
    return NextResponse.json(
      { error: "Missing required parameters: slug and token" },
      { status: 400 }
    );
  }

  const shop = await getShopBySlug(slug);
  if (!shop) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Scoped access verification
  if (shop.reportToken && shop.reportToken !== token) {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 403 });
  }

  const authUrl = buildGoogleAuthUrl(slug, token);
  return NextResponse.json({ authUrl });
}
