import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug } from "@/lib/supabase";
import { syncBusinessGoogleReviews } from "@/lib/google-sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, token } = body;

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

    if (body.action === "connect") {
      const { updateBusinessGoogleSync } = await import("@/lib/supabase");
      await updateBusinessGoogleSync(slug, {
        googleConnected: true,
        googleSyncStatus: "idle",
        googleLastError: null,
      });
    }

    const result = await syncBusinessGoogleReviews(slug);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}

// Support GET for scheduled cron triggers or webhook checks
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");

  if (!slug) {
    return NextResponse.json({ error: "Missing required slug parameter" }, { status: 400 });
  }

  const shop = await getShopBySlug(slug);
  if (!shop) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Scoped access verification
  if (shop.reportToken && shop.reportToken !== token) {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 403 });
  }

  const result = await syncBusinessGoogleReviews(slug);
  return NextResponse.json(result);
}
