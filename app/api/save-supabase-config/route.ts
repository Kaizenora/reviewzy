import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { supabaseUrl } = await req.json();

    if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid Supabase URL. Must start with https://" },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    // Update NEXT_PUBLIC_SUPABASE_URL
    if (content.includes("NEXT_PUBLIC_SUPABASE_URL=")) {
      content = content.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.*/,
        `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}`
      );
    } else {
      content += `\nNEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}`;
    }

    fs.writeFileSync(envPath, content, "utf-8");

    return NextResponse.json({
      success: true,
      message: "Supabase URL saved successfully. Connected!",
    });
  } catch (err: unknown) {
    console.error("Failed to save supabase config:", err);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}
