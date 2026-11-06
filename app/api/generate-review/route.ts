import { NextRequest, NextResponse } from "next/server";
import { ReviewDraftRequest, ReviewDraftResponse } from "@/types/shop";
import { generateVariedReview } from "@/lib/synthesizer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: ReviewDraftRequest = await req.json();
    const {
      shopName = "this place",
      selectedTags = [],
      customTags = [],
      tone = "standard",
    } = body;

    const reviewText = generateVariedReview(
      shopName,
      selectedTags,
      customTags,
      tone
    );

    const result: ReviewDraftResponse = {
      review: reviewText,
      source: "synthesizer",
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Review generation error:", err);
    return NextResponse.json(
      {
        review:
          "Had a wonderful experience! The service was prompt and the team was very friendly. Highly recommended!",
        source: "synthesizer",
      },
      { status: 200 }
    );
  }
}
