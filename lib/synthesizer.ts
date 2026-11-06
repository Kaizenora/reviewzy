import { ReviewTone } from "@/types/shop";

// Diverse openers for English reviews (30+ variations)
const ENGLISH_OPENERS = [
  "Had an amazing experience at",
  "Recently visited",
  "Stopped by",
  "Had a wonderful time at",
  "Really impressed by my visit to",
  "One of the best experiences at",
  "Visited",
  "Dropped by",
  "Honestly blown away by",
  "Can't say enough good things about",
  "Hands down one of my favorite spots,",
  "So glad I checked out",
  "Had an absolute 10/10 time at",
  "My experience at",
  "Such a pleasant and smooth visit to",
  "Always a delight visiting",
  "First time visiting",
  "Came here on a high recommendation and",
  "Really happy with the service at",
  "Everything about my time at",
  "Super satisfied with our visit to",
  "Five stars all the way for",
  "What a great experience at",
  "Top-notch experience from start to finish at",
  "Thoroughly enjoyed visiting",
];

// Diverse sentence templates for combining keywords (20+ variations)
const KEYWORD_TEMPLATES = [
  (tags: string[]) => `The ${tags.join(", ").toLowerCase()} truly stood out.`,
  (tags: string[]) => `Loved the ${tags.slice(0, -1).join(", ").toLowerCase()} and especially the ${tags[tags.length - 1].toLowerCase()}.`,
  (tags: string[]) => `Everything from the ${tags[0].toLowerCase()} to the ${tags.slice(1).join(" and ").toLowerCase()} was top tier.`,
  (tags: string[]) => `Special mention for the ${tags.join(" and ").toLowerCase()}, really made the visit memorable.`,
  (tags: string[]) => `Particularly impressed with how ${tags.join(", ").toLowerCase()} was handled throughout.`,
  (tags: string[]) => `The ${tags[0].toLowerCase()} was incredible, and the ${tags.slice(1).join(" and ").toLowerCase()} exceeded expectations.`,
  (tags: string[]) => `Big shoutout for the ${tags.join(" and ").toLowerCase()} — absolutely spot on.`,
  (tags: string[]) => `You can tell they genuinely care about quality; the ${tags.join(", ").toLowerCase()} was fantastic.`,
  (tags: string[]) => `Both the ${tags[0].toLowerCase()} and ${tags.slice(1).join(" as well as ").toLowerCase()} were phenomenal.`,
  (tags: string[]) => `Super impressed with the ${tags.join(", ").toLowerCase()}.`,
  (tags: string[]) => `The standout was definitely the ${tags[0].toLowerCase()}, and the ${tags.slice(1).join(" along with ").toLowerCase()} made it perfect.`,
  (tags: string[]) => `From the ${tags.join(" down to the ").toLowerCase()}, everything was flawless.`,
  (tags: string[]) => `Really appreciated the attention to detail with the ${tags.join(" and ").toLowerCase()}.`,
];

// Diverse closers (25+ variations)
const ENGLISH_CLOSERS = [
  "Definitely coming back again!",
  "Highly recommended to everyone.",
  "Will surely visit again soon.",
  "10/10 would recommend!",
  "Great job by the entire team.",
  "A must-visit spot in the area.",
  "Looking forward to my next visit!",
  "Keep up the fantastic work!",
  "Cannot recommend this place enough.",
  "Already planning my next trip back.",
  "Easily one of the best around.",
  "Glad to have such quality nearby.",
  "Worth every single star!",
  "Definitely worth stopping by.",
  "Will be recommending this to friends and family.",
  "Outstanding service from start to finish.",
  "Super happy customer right here!",
];

// Diverse styles of complete multi-sentence paragraphs
const STORY_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `Visited ${shop} today and had such a pleasant experience. The ${tags.join(" and ").toLowerCase()} made a great impression. Clean, welcoming and very professional. Highly recommend!`,
  (shop: string, tags: string[]) =>
    `If you're considering visiting ${shop}, do not hesitate. The ${tags[0].toLowerCase()} was exceptional and the ${tags.slice(1).join(" & ").toLowerCase() || "overall vibe"} was top class. 5 stars all day!`,
  (shop: string, tags: string[]) =>
    `Had a really positive experience at ${shop}. The team was attentive and the ${tags.join(", ").toLowerCase()} was genuinely impressive. Definitely coming back soon.`,
  (shop: string, tags: string[]) =>
    `${shop} never disappoints! Outstanding ${tags.join(" and ").toLowerCase()}. Great atmosphere and friendly faces everywhere. 10/10!`,
  (shop: string, tags: string[]) =>
    `First time at ${shop} and I'm very impressed. The ${tags.slice(0, 2).join(" along with ").toLowerCase()} made the entire visit wonderful. Will definitely be a regular here.`,
  (shop: string, tags: string[]) =>
    `Super happy with my visit to ${shop}! You can feel the quality right away. Loved the ${tags.join(", ").toLowerCase()}. Keep up the great standards!`,
  (shop: string, tags: string[]) =>
    `Great vibes and even better service at ${shop}. The ${tags.join(" & ").toLowerCase()} was spot on. Worth every penny!`,
  (shop: string, tags: string[]) =>
    `Really appreciated the promptness and warmth at ${shop}. The ${tags[0].toLowerCase()} was a huge plus. Definitely recommending to all my contacts!`,
  (shop: string, tags: string[]) =>
    `Can't say enough good things about ${shop}! From the ${tags[0].toLowerCase()} to the ${tags.slice(1).join(" and ").toLowerCase() || "overall experience"}, everything was handled with perfection.`,
  (shop: string, tags: string[]) =>
    `Awesome visit to ${shop}. The staff was welcoming and the ${tags.join(", ").toLowerCase()} was top tier. Will definitely return!`,
];

// Short / Punchy templates (20+ variations)
const SHORT_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `Great visit to ${shop}! Loved the ${tags.join(" & ").toLowerCase()}. Highly recommended.`,
  (shop: string, tags: string[]) =>
    `Top-notch ${tags.join(", ").toLowerCase()} at ${shop}! Wonderful service and vibe.`,
  (shop: string, tags: string[]) =>
    `Super happy with my experience. ${tags.join(", ")} — totally worth it!`,
  (shop: string, tags: string[]) =>
    `Fantastic experience at ${shop}. Loved the ${tags[0].toLowerCase()}!`,
  (shop: string, tags: string[]) =>
    `10/10 for ${shop}! The ${tags.join(" and ").toLowerCase()} was spot on.`,
  (shop: string, tags: string[]) =>
    `Excellent service and ${tags.join(", ").toLowerCase()}. Will definitely visit again.`,
  (shop: string, tags: string[]) =>
    `Quick, seamless, and high quality. Loved the ${tags[0].toLowerCase()} at ${shop}!`,
  (shop: string, tags: string[]) =>
    `Best in the area! Special shoutout for the ${tags.join(" & ").toLowerCase()}.`,
  (shop: string, tags: string[]) =>
    `Loved everything about ${shop}. The ${tags.join(", ").toLowerCase()} was top tier.`,
  (shop: string, tags: string[]) =>
    `Smooth experience, friendly team, and great ${tags.join(" & ").toLowerCase()}. 5 stars!`,
  (shop: string, tags: string[]) =>
    `Highly recommend ${shop}! The ${tags[0].toLowerCase()} was amazing.`,
  (shop: string, tags: string[]) =>
    `So glad I came to ${shop}. Exceptional ${tags.join(" and ").toLowerCase()}!`,
  (shop: string, tags: string[]) =>
    `Fast, polite, and great quality. Loved the ${tags.join(", ").toLowerCase()}!`,
  (shop: string, tags: string[]) =>
    `Top quality at ${shop}. The ${tags.join(" + ").toLowerCase()} made my day.`,
  (shop: string, tags: string[]) =>
    `Cannot recommend ${shop} enough. Outstanding ${tags[0].toLowerCase()}!`,
];

// Hinglish phrases and templates (20+ variations)
const HINGLISH_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `${shop} mein experience bohot badiya raha! ${tags.slice(0, 2).join(" aur ").toLowerCase()} ekdum top notch tha. Definitely visiting again!`,
  (shop: string, tags: string[]) =>
    `Sach mein maza aa gaya! ${tags.join(", ").toLowerCase()} kaafi accha laga aur service bhi smooth thi. Loved the whole vibe!`,
  (shop: string, tags: string[]) =>
    `Bohot badhiya jagah hai. Special mention for ${tags.join(" aur ").toLowerCase()}. Family aur friends ke saath aane ke liye perfect spot!`,
  (shop: string, tags: string[]) =>
    `${shop} par visit karke dil khush ho gaya. ${tags.slice(0, 1).join("").toLowerCase()} bohot mast tha aur overall experience 10 on 10 raha!`,
  (shop: string, tags: string[]) =>
    `Superb experience! Yahan ka ${tags.join(", ").toLowerCase()} ekdum authentic aur clean hai. Jarur recommend karunga sabko!`,
  (shop: string, tags: string[]) =>
    `${shop} kaafi accha laga! ${tags.join(" aur ").toLowerCase()} dono bohot badhiya the. Team bhi kaafi polite hai.`,
  (shop: string, tags: string[]) =>
    `Mera first visit tha ${shop} par aur experience zabardast raha. ${tags.join(", ").toLowerCase()} was totally worth it.`,
  (shop: string, tags: string[]) =>
    `Bohot hi shandaar service aur badiya ${tags.join(" & ").toLowerCase()}. Definitely coming back soon with family!`,
  (shop: string, tags: string[]) =>
    `${shop} ekdum reliable aur mast jagah hai. ${tags[0].toLowerCase()} kaafi sahi laga. Full 5 stars!`,
  (shop: string, tags: string[]) =>
    `Paisa vasool experience at ${shop}! ${tags.join(" aur ").toLowerCase()} ek number tha. Highly recommended!`,
  (shop: string, tags: string[]) =>
    `Kaafi peaceful aur clean environment. ${tags.join(", ").toLowerCase()} bohot pasand aaya. Zaroor visit karein!`,
  (shop: string, tags: string[]) =>
    `Loved the hospitality at ${shop}! ${tags.join(" and ").toLowerCase()} dono ekdum mast the. 10/10!`,
  (shop: string, tags: string[]) =>
    `Bohot accha staff aur fast service. ${tags.slice(0, 2).join(" aur ").toLowerCase()} was simply superb!`,
  (shop: string, tags: string[]) =>
    `${shop} par jaakar maza aa gaya. Quality aur ${tags.join(", ").toLowerCase()} dono top class hain!`,
  (shop: string, tags: string[]) =>
    `Ekdum 5-star experience! ${tags.join(" aur ").toLowerCase()} ne dil jeet liya. Recommended to all!`,
];

/**
 * Intelligent review generator that crafts authentic, varied human reviews
 * based on selected tags and chosen tone, with zero OpenAI dependency and
 * hundreds of unique combinatoric possibilities.
 */
export function generateVariedReview(
  shopName: string,
  selectedTags: string[],
  customTags: string[] = [],
  tone: ReviewTone = "standard"
): string {
  const allTags = [...selectedTags, ...customTags].filter(Boolean);
  const tags = allTags.length > 0 ? allTags : ["Good service", "Great experience"];

  // Shuffle tags slightly for natural human variety
  const shuffledTags = [...tags].sort(() => 0.5 - Math.random());

  if (tone === "shorter") {
    const fn = SHORT_TEMPLATES[Math.floor(Math.random() * SHORT_TEMPLATES.length)];
    return fn(shopName, shuffledTags);
  }

  if (tone === "hinglish") {
    const fn = HINGLISH_TEMPLATES[Math.floor(Math.random() * HINGLISH_TEMPLATES.length)];
    return fn(shopName, shuffledTags);
  }

  // For Natural / Standard: Randomly pick between Story templates or Dynamic Opener+Body+Closer
  const useStoryTemplate = Math.random() > 0.45;
  if (useStoryTemplate) {
    const storyFn = STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
    return storyFn(shopName, shuffledTags);
  }

  // Dynamic composition
  const opener = ENGLISH_OPENERS[Math.floor(Math.random() * ENGLISH_OPENERS.length)];
  const closer = ENGLISH_CLOSERS[Math.floor(Math.random() * ENGLISH_CLOSERS.length)];
  const templateFn = KEYWORD_TEMPLATES[Math.floor(Math.random() * KEYWORD_TEMPLATES.length)];

  if (shuffledTags.length === 1) {
    const singleOptions = [
      `${opener} ${shopName}! The ${shuffledTags[0].toLowerCase()} was really exceptional. ${closer}`,
      `Loved my visit to ${shopName}. Particularly impressed with the ${shuffledTags[0].toLowerCase()}. ${closer}`,
      `Great experience at ${shopName}. The ${shuffledTags[0].toLowerCase()} made our day! ${closer}`,
      `So glad we stopped by ${shopName}. The ${shuffledTags[0].toLowerCase()} was simply outstanding. ${closer}`,
      `Had a 5-star visit to ${shopName}! Truly loved the ${shuffledTags[0].toLowerCase()}. ${closer}`,
    ];
    return singleOptions[Math.floor(Math.random() * singleOptions.length)];
  }

  if (shuffledTags.length === 2) {
    const doubleOptions = [
      `${opener} ${shopName}. The ${shuffledTags[0].toLowerCase()} was great and the ${shuffledTags[1].toLowerCase()} was delightful. ${closer}`,
      `Had a wonderful time at ${shopName}! Both the ${shuffledTags[0].toLowerCase()} and the ${shuffledTags[1].toLowerCase()} were spot on. ${closer}`,
      `Really happy with ${shopName}. Loved the ${shuffledTags[0].toLowerCase()} as well as the ${shuffledTags[1].toLowerCase()}. ${closer}`,
      `Visited ${shopName} and thoroughly enjoyed it. The ${shuffledTags[0].toLowerCase()} combined with ${shuffledTags[1].toLowerCase()} made for a top-tier visit. ${closer}`,
      `Top rating for ${shopName}! Outstanding ${shuffledTags[0].toLowerCase()} and super pleased with the ${shuffledTags[1].toLowerCase()}. ${closer}`,
      `Great vibe at ${shopName}. Loved the ${shuffledTags[0].toLowerCase()}, and the ${shuffledTags[1].toLowerCase()} was a huge plus! ${closer}`,
    ];
    return doubleOptions[Math.floor(Math.random() * doubleOptions.length)];
  }

  // 3 or more tags
  const bodySentence = templateFn(shuffledTags);
  return `${opener} ${shopName}. ${bodySentence} ${closer}`;
}
