export interface Shop {
  id: string;
  slug: string;
  name: string;
  location: string;
  logoLetter: string;
  brandColor: string;
  googleReviewUrl: string;
  whatWentWellTags: string[];
  couldBeBetterTags: string[];
  category?: string;
  createdAt?: string;
}

export type ReviewStep = 1 | 2 | 3 | 4;

export type ReviewTone = "standard" | "shorter" | "hinglish";

export interface ReviewDraftRequest {
  shopName: string;
  shopLocation: string;
  rating: number;
  selectedTags: string[];
  customTags?: string[];
  tone?: ReviewTone;
  language?: string;
}

export interface ReviewDraftResponse {
  review: string;
  tokensUsed?: number;
  source: "openai" | "synthesizer";
}
