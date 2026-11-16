export interface Shop {
  id: string;
  slug: string;
  name: string;
  location: string;
  logoLetter: string;
  logoUrl?: string; // Base64 or external URL for custom logo image
  brandColor: string;
  googleReviewUrl: string;
  whatWentWellTags: string[];
  couldBeBetterTags: string[];
  category?: string;
  createdAt?: string;
  // Report & Google Business Connection
  reportToken?: string;
  timezone?: string; // e.g. "Asia/Kolkata"
  googleConnected?: boolean;
  googleAccountId?: string;
  googleLocationId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: string;
  googleLastSyncedAt?: string;
  googleLastError?: string | null;
  googleSyncStatus?: "idle" | "syncing" | "failed" | "success";
}

export interface GoogleReview {
  id: string;
  businessId: string;
  businessSlug: string;
  googleReviewId: string;
  stars: number;
  text: string;
  authorName: string;
  authorPhotoUrl?: string;
  postedAt: string; // ISO 8601 string
  createdAt?: string;
}

export type ReviewStep = 1 | 2 | 3 | 4;

export type ReviewTone = "standard" | "shorter" | "hinglish";

export interface ReviewDraftRequest {
  shopName: string;
  shopLocation?: string;
  selectedTags: string[];
  customTags?: string[];
  tone?: ReviewTone;
  language?: string;
}

export interface ReviewDraftResponse {
  review: string;
  source: "synthesizer";
}
