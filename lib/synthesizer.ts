import { ReviewTone } from "@/types/shop";

// Diverse openers for English reviews
const ENGLISH_OPENERS = [
  "Had an amazing experience at",
  "Recently visited",
  "Went to",
  "Had a wonderful time at",
  "Really impressed by my visit to",
  "One of the best experiences at",
  "Visited",
  "Stopped by",
];

// Diverse sentence templates for combining keywords
const KEYWORD_TEMPLATES = [
  (tags: string[]) => `The ${tags.join(", ").toLowerCase()} truly stood out.`,
  (tags: string[]) => `Loved the ${tags.slice(0, -1).join(", ").toLowerCase()} and especially the ${tags[tags.length - 1].toLowerCase()}.`,
  (tags: string[]) => `Everything from the ${tags[0].toLowerCase()} to the ${tags.slice(1).join(" and ").toLowerCase()} was top notch.`,
  (tags: string[]) => `Special mention for the ${tags.join(" and ").toLowerCase()}, really made the visit worthwhile.`,
  (tags: string[]) => `Particularly loved how ${tags.join(", ").toLowerCase()} was maintained throughout.`,
];

// Diverse closers
const ENGLISH_CLOSERS = [
  "Definitely coming back again!",
  "Highly recommended to everyone.",
  "Will surely visit again soon.",
  "10/10 would recommend!",
  "Great job by the team.",
  "A must-visit spot in the area.",
  "Looking forward to my next visit!",
];

// Hinglish phrases and templates
const HINGLISH_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `${shop} mein experience bohot badiya raha! ${tags.slice(0, 2).join(" aur ")} ekdum top notch tha. Definitely visiting again!`,
  (shop: string, tags: string[]) =>
    `Sach mein maza aa gaya! ${tags.join(", ").toLowerCase()} kaafi accha laga aur service bhi smooth thi. Loved the whole vibe!`,
  (shop: string, tags: string[]) =>
    `Bohot badhiya jagah hai. Special mention for ${tags.join(" aur ").toLowerCase()}. Family aur friends ke saath aane ke liye perfect spot!`,
  (shop: string, tags: string[]) =>
    `${shop} par visit karke dil khush ho gaya. ${tags.slice(0, 1)} bohot mast tha aur overall experience 10 on 10 raha!`,
  (shop: string, tags: string[]) =>
    `Superb experience! Yahan ka ${tags.join(", ").toLowerCase()} ekdum authentic aur clean hai. Jarur recommend karunga sabko!`,
];

// Short / Punchy templates
const SHORT_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `Great visit to ${shop}! Loved the ${tags.join(" & ").toLowerCase()}. Highly recommended.`,
  (shop: string, tags: string[]) =>
    `Top-notch ${tags.join(", ").toLowerCase()}! Wonderful service and vibe.`,
  (shop: string, tags: string[]) =>
    `Super happy with my experience. ${tags.join(", ")} — totally worth it!`,
  (shop: string, tags: string[]) =>
    `Fantastic experience at ${shop}. Loved the ${tags[0].toLowerCase()}!`,
];

/**
 * Intelligent review generator that crafts authentic, varied human reviews
 * based on selected tags and chosen tone, with zero OpenAI dependency.
 */
export function generateVariedReview(
  shopName: string,
  selectedTags: string[],
  customTags: string[] = [],
  tone: ReviewTone = "standard"
): string {
  const allTags = [...selectedTags, ...customTags].filter(Boolean);
  const tags = allTags.length > 0 ? allTags : ["Good service", "Great experience"];

  // Shuffle tags slightly for natural variety
  const shuffledTags = [...tags].sort(() => 0.5 - Math.random());

  if (tone === "shorter") {
    const fn = SHORT_TEMPLATES[Math.floor(Math.random() * SHORT_TEMPLATES.length)];
    return fn(shopName, shuffledTags);
  }

  if (tone === "hinglish") {
    const fn = HINGLISH_TEMPLATES[Math.floor(Math.random() * HINGLISH_TEMPLATES.length)];
    return fn(shopName, shuffledTags);
  }

  // Standard English: dynamically construct from components
  const opener = ENGLISH_OPENERS[Math.floor(Math.random() * ENGLISH_OPENERS.length)];
  const templateFn = KEYWORD_TEMPLATES[Math.floor(Math.random() * KEYWORD_TEMPLATES.length)];
  const closer = ENGLISH_CLOSERS[Math.floor(Math.random() * ENGLISH_CLOSERS.length)];

  if (shuffledTags.length === 1) {
    const singleOptions = [
      `${opener} ${shopName}. The ${shuffledTags[0].toLowerCase()} was really exceptional. ${closer}`,
      `Loved my visit to ${shopName}! Particularly impressed with the ${shuffledTags[0].toLowerCase()}. ${closer}`,
      `Great experience at ${shopName}. The ${shuffledTags[0].toLowerCase()} made my day!`,
    ];
    return singleOptions[Math.floor(Math.random() * singleOptions.length)];
  }

  if (shuffledTags.length === 2) {
    const doubleOptions = [
      `${opener} ${shopName}. The ${shuffledTags[0].toLowerCase()} was great and the ${shuffledTags[1].toLowerCase()} was delightful. ${closer}`,
      `Had a wonderful time at ${shopName}! Both the ${shuffledTags[0].toLowerCase()} and the ${shuffledTags[1].toLowerCase()} were spot on. ${closer}`,
      `Really happy with ${shopName}. Loved the ${shuffledTags[0].toLowerCase()} as well as the ${shuffledTags[1].toLowerCase()}. ${closer}`,
    ];
    return doubleOptions[Math.floor(Math.random() * doubleOptions.length)];
  }

  // 3 or more tags
  const bodySentence = templateFn(shuffledTags);
  return `${opener} ${shopName}. ${bodySentence} ${closer}`;
}
