import { NextRequest, NextResponse } from "next/server";
import { ReviewDraftRequest, ReviewDraftResponse, ReviewTone } from "@/types/shop";

export const runtime = "nodejs";

/**
 * Intelligent local synthesizer fallback that creates realistic, authentic
 * human reviews matching user's rating, tags, and tone even without an API key.
 */
function synthesizeReview(
  shopName: string,
  rating: number,
  tags: string[],
  tone: ReviewTone = "standard"
): string {
  const allTags = tags.length > 0 ? tags : ["Good service"];

  if (tone === "shorter") {
    if (rating >= 4) {
      const joined = allTags.slice(0, 3).join(", ");
      const templates = [
        `Great experience at ${shopName}! Loved the ${joined.toLowerCase()}. Highly recommended.`,
        `Solid ${rating}-star visit. ${joined} made it totally worth coming back.`,
        `Really enjoyed my time here. ${joined.toLowerCase()} — 10/10!`,
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      return `Decent experience at ${shopName}. ${allTags.join(", ")}. Room for improvement.`;
    }
  }

  if (tone === "hinglish") {
    if (rating >= 4) {
      const templates = [
        `${shopName} mein experience bohot badiya raha! ${allTags.slice(0, 2).join(" aur ")} ekdum top notch tha. Definitely visiting again!`,
        `Mast jagah hai! Staff was very polite aur ${allTags.join(", ").toLowerCase()} kaafi accha laga. Totally loved the vibe!`,
        `Sach mein worth it tha. ${allTags.join(" aur ").toLowerCase()} bohot solid experience raha. Friends ke saath aane ke liye perfect spot!`,
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      return `Theek-thaak experience raha ${shopName} par. ${allTags.join(", ")}, thoda improve kar sakte hain.`;
    }
  }

  // Standard tone - matches screenshot example:
  // "The food was tasty, the staff were friendly and the ambience was nice."
  if (rating >= 4) {
    if (allTags.length === 1) {
      return `Had a great time at ${shopName}. The ${allTags[0].toLowerCase()} was really impressive.`;
    }
    if (allTags.length === 2) {
      return `The ${allTags[0].toLowerCase()} was great and the ${allTags[1].toLowerCase()} was pleasant. Would definitely recommend ${shopName}!`;
    }
    // 3 or more tags
    const lead = allTags.slice(0, -1).map((t) => `the ${t.toLowerCase()}`).join(", ");
    const last = allTags[allTags.length - 1].toLowerCase();
    
    const standardTemplates = [
      `The ${allTags[0].toLowerCase()} was tasty, the ${allTags[1]?.toLowerCase() || "service"} were friendly and the ${last} was nice.`,
      `Had a wonderful experience at ${shopName}. The ${lead} and the ${last} really stood out. Looking forward to visiting again!`,
      `Really pleased with my visit. Loved the ${lead} and especially the ${last}. Keep up the great work!`,
    ];
    return standardTemplates[Math.floor(Math.random() * standardTemplates.length)];
  } else if (rating === 3) {
    return `An okay visit to ${shopName}. While ${allTags.join(", ").toLowerCase()} had some good points, there is still some scope for improvement.`;
  } else {
    return `My experience at ${shopName} could have been better. Noticed issues with ${allTags.join(", ").toLowerCase()}. Hope the management looks into this.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ReviewDraftRequest = await req.json();
    const {
      shopName = "this place",
      shopLocation = "",
      rating = 5,
      selectedTags = [],
      customTags = [],
      tone = "standard",
    } = body;

    const mergedTags = [...selectedTags, ...customTags].filter(Boolean);
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    // Attempt OpenAI API if API key is present
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const systemPrompt = `You are an AI assistant helping a real human customer draft a short, honest, natural-sounding Google review for a local business.
Rules:
- Write in first person ("I had...", "The food was...", "Loved the...").
- Keep it concise: 1 to 3 sentences maximum.
- Reflect their star rating: ${rating} out of 5 stars.
- Explicitly mention what they experienced: ${mergedTags.join(", ")}.
- Business name: ${shopName} (${shopLocation}).
- Tone requirement: ${
          tone === "shorter"
            ? "Very punchy, ultra-concise, under 20 words."
            : tone === "hinglish"
            ? "Natural urban Indian Hinglish blend (mix of Hindi & English words like 'mast', 'bohot badhiya', 'ekdum', 'accha')."
            : "Natural, conversational, authentic British/American/Indian English. No robotic corporate clichés or hashtags."
        }
- Do NOT include quotation marks, titles, or star symbols in your response. Return ONLY the plain text of the review.`;

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Write my ${rating}-star review highlighting: ${mergedTags.join(
                  ", "
                )}.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 150,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reviewText = data.choices?.[0]?.message?.content?.trim();
          if (reviewText) {
            const result: ReviewDraftResponse = {
              review: reviewText.replace(/^["']|["']$/g, ""),
              tokensUsed: data.usage?.total_tokens,
              source: "openai",
            };
            return NextResponse.json(result);
          }
        } else {
          const errText = await response.text();
          console.warn("OpenAI API returned non-200, falling back:", errText);
        }
      } catch (openAiError) {
        console.warn("OpenAI fetch failed, falling back to synthesizer:", openAiError);
      }
    }

    // High quality intelligent local synthesizer fallback
    const synthesized = synthesizeReview(shopName, rating, mergedTags, tone);
    const result: ReviewDraftResponse = {
      review: synthesized,
      source: "synthesizer",
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("API Error in /api/generate-review:", err);
    return NextResponse.json(
      {
        review:
          "Great experience overall! Friendly staff and lovely atmosphere. Highly recommended.",
        source: "synthesizer",
      },
      { status: 200 }
    );
  }
}
