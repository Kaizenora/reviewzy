import { ReviewTone } from "@/types/shop";

/**
 * Format tags into natural English list:
 * 1 tag:  "tasty food"
 * 2 tags: "tasty food and friendly staff"
 * 3 tags: "tasty food, friendly staff and nice ambience"
 */
function formatTagsEnglish(tags: string[]): string {
  const cleaned = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (cleaned.length === 0) return "great service";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")} and ${cleaned[cleaned.length - 1]}`;
}

/**
 * Format tags into natural Hinglish list:
 * 1 tag:  "tasty food"
 * 2 tags: "tasty food aur friendly staff"
 * 3 tags: "tasty food, friendly staff aur nice ambience"
 */
function formatTagsHinglish(tags: string[]): string {
  const cleaned = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (cleaned.length === 0) return "acchi service";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} aur ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")} aur ${cleaned[cleaned.length - 1]}`;
}

// ============================================================================
// HINGLISH REVIEW TEMPLATES (25+ rich, natural, authentic templates)
// ============================================================================
const HINGLISH_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `${shop} mein experience sach mein bohot hi zabardast raha! Yahan ka ${formatTagsHinglish(tags)} ekdum top class hai. Staff ka behaviour bhi bohot polite aur helpful tha. Definitely visiting again!`,

  (shop: string, tags: string[]) =>
    `Aaj visit kiya ${shop} aur dil khush ho gaya! ${formatTagsHinglish(tags)} sach mein standout karta hai. Quality aur cleanliness dono 10 on 10 thi. Family aur friends ke saath aane ke liye best jagah hai.`,

  (shop: string, tags: string[]) =>
    `Bohot hi shandaar jagah hai ${shop}! Yahan ki service aur especially ${formatTagsHinglish(tags)} ne dil jeet liya. Paisa vasool experience raha. 5 stars all the way!`,

  (shop: string, tags: string[]) =>
    `${shop} par mera first visit tha and I am super impressed! ${formatTagsHinglish(tags)} kaafi accha laga. Vibe bhi peaceful thi aur overall management ekdum perfect tha. Highly recommended!`,

  (shop: string, tags: string[]) =>
    `Sach mein maza aa gaya ${shop} aake! Yahan ka ${formatTagsHinglish(tags)} bohot badiya hai. Sabhi cheezein properly taken care of thi. Jarur recommend karunga sabhi ko!`,

  (shop: string, tags: string[]) =>
    `One of the best spots in town — ${shop}! Special mention for ${formatTagsHinglish(tags)}, it was simply phenomenal. Hospitality aur environment dono superb the. 10/10 recommendation!`,

  (shop: string, tags: string[]) =>
    `${shop} ka experience ek number tha! Yahan par ${formatTagsHinglish(tags)} sach mein lajawab hai. Fast service aur courteous team. Zaroor visit karein!`,

  (shop: string, tags: string[]) =>
    `Bohot accha laga yahan aana! ${shop} mein ${formatTagsHinglish(tags)} sach mein next level hai. Sab kuch neat, clean aur well managed tha. Definitely coming back soon!`,

  (shop: string, tags: string[]) =>
    `Bilkul paisa vasool visit raha at ${shop}! ${formatTagsHinglish(tags)} ne expectaction se bhi zyada accha feel karwaya. Good vibes, great service!`,

  (shop: string, tags: string[]) =>
    `${shop} par aakar mood ekdum fresh ho gaya! Highly impressed with their ${formatTagsHinglish(tags)}. Team kaafi responsive aur humble hai. Full 5 star rating!`,

  (shop: string, tags: string[]) =>
    `Superb service at ${shop}! ${formatTagsHinglish(tags)} kaafi authentic aur satisfying tha. Yahan ki warmth aur quality bohot pasand aayi. Must visit place!`,

  (shop: string, tags: string[]) =>
    `Kya kamaal ka experience tha ${shop} mein! ${formatTagsHinglish(tags)} sach mein standout feature hai. Family ke saath aane ke liye ideal spot. Jarur try karein!`,

  (shop: string, tags: string[]) =>
    `Loved the hospitality at ${shop}! Yahan ka ${formatTagsHinglish(tags)} dono hi bohot impressive the. Fast response aur positive vibe. Definitely recommended!`,

  (shop: string, tags: string[]) =>
    `Ekdum premium feel aayi at ${shop}! Special shoutout for their ${formatTagsHinglish(tags)}. Everything was smooth and enjoyable. 5 out of 5!`,

  (shop: string, tags: string[]) =>
    `${shop} never fails to impress! Yahan aakar ${formatTagsHinglish(tags)} ka experience bohot badiya raha. Staff bohot cooperative hai. Will visit again for sure!`,

  (shop: string, tags: string[]) =>
    `Bohot hi hygienic aur friendly atmosphere hai ${shop} par. ${formatTagsHinglish(tags)} was totally worth it. 10/10 recommend karunga!`,

  (shop: string, tags: string[]) =>
    `Great visit to ${shop} today! ${formatTagsHinglish(tags)} kaafi mast tha aur bill bhi totally reasonable laga. Glad to have this place around!`,

  (shop: string, tags: string[]) =>
    `Sach mein aisi service kam hi dekhne ko milti hai. ${shop} mein ${formatTagsHinglish(tags)} sach mein top-notch tha. Keep up the good work team!`,

  (shop: string, tags: string[]) =>
    `First time try kiya aur dil jeet liya ${shop} ne! Yahan ka ${formatTagsHinglish(tags)} bohot pasand aaya. A complete 5-star experience!`,

  (shop: string, tags: string[]) =>
    `Family ke saath ${shop} gaye the and sabhi ko bohot pasand aaya. Special praise for ${formatTagsHinglish(tags)}. Har cheez perfect thi!`,

  (shop: string, tags: string[]) =>
    `${shop} mein har cheez spot on thi! ${formatTagsHinglish(tags)} sach mein mind-blowing tha. Super happy with the entire visit!`,

  (shop: string, tags: string[]) =>
    `Agar aap quality dhoondh rahe hain toh ${shop} zaroor visit karein. ${formatTagsHinglish(tags)} kaafi lajawab hai. Fully satisfied customer!`,
];

// ============================================================================
// SHORT / PUNCHY TEMPLATES (20+ variations)
// ============================================================================
const SHORT_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `Great visit to ${shop}! Loved the ${formatTagsEnglish(tags)}. Highly recommended.`,
  (shop: string, tags: string[]) =>
    `Top-notch ${formatTagsEnglish(tags)} at ${shop}! Wonderful service and vibe.`,
  (shop: string, tags: string[]) =>
    `Super happy with my experience at ${shop}. ${formatTagsEnglish(tags)} — totally worth it!`,
  (shop: string, tags: string[]) =>
    `Fantastic experience at ${shop}. Loved the ${formatTagsEnglish(tags)}!`,
  (shop: string, tags: string[]) =>
    `10/10 for ${shop}! The ${formatTagsEnglish(tags)} was spot on.`,
  (shop: string, tags: string[]) =>
    `Excellent service and ${formatTagsEnglish(tags)}. Will definitely visit ${shop} again.`,
  (shop: string, tags: string[]) =>
    `Quick, seamless, and high quality. Loved the ${formatTagsEnglish(tags)} at ${shop}!`,
  (shop: string, tags: string[]) =>
    `Best in the area! Special shoutout for the ${formatTagsEnglish(tags)} at ${shop}.`,
  (shop: string, tags: string[]) =>
    `Loved everything about ${shop}. The ${formatTagsEnglish(tags)} was top tier.`,
  (shop: string, tags: string[]) =>
    `Smooth experience, friendly team, and great ${formatTagsEnglish(tags)}. 5 stars!`,
  (shop: string, tags: string[]) =>
    `Highly recommend ${shop}! The ${formatTagsEnglish(tags)} was amazing.`,
  (shop: string, tags: string[]) =>
    `So glad I came to ${shop}. Exceptional ${formatTagsEnglish(tags)}!`,
  (shop: string, tags: string[]) =>
    `Fast, polite, and great quality. Loved the ${formatTagsEnglish(tags)}!`,
  (shop: string, tags: string[]) =>
    `Top quality at ${shop}. The ${formatTagsEnglish(tags)} made my day.`,
  (shop: string, tags: string[]) =>
    `Cannot recommend ${shop} enough. Outstanding ${formatTagsEnglish(tags)}!`,
  (shop: string, tags: string[]) =>
    `5 stars! Clean place, great staff, and wonderful ${formatTagsEnglish(tags)}.`,
  (shop: string, tags: string[]) =>
    `Very satisfied with ${shop}. The ${formatTagsEnglish(tags)} was genuinely impressive.`,
];

// ============================================================================
// NATURAL / STANDARD ENGLISH TEMPLATES (Multi-sentence rich paragraphs)
// ============================================================================
const STORY_TEMPLATES = [
  (shop: string, tags: string[]) =>
    `Visited ${shop} today and had such a pleasant experience. The ${formatTagsEnglish(tags)} made a lasting impression. Clean, welcoming and very professional from start to finish. Highly recommend to everyone!`,

  (shop: string, tags: string[]) =>
    `If you're considering visiting ${shop}, do not hesitate. The ${formatTagsEnglish(tags)} was exceptional and the overall vibe was top class. Truly worth 5 stars!`,

  (shop: string, tags: string[]) =>
    `Had a really positive experience at ${shop}. The team was attentive and the ${formatTagsEnglish(tags)} was genuinely impressive. Definitely coming back soon.`,

  (shop: string, tags: string[]) =>
    `${shop} never disappoints! Outstanding ${formatTagsEnglish(tags)}. Great atmosphere and friendly faces everywhere. A solid 10/10!`,

  (shop: string, tags: string[]) =>
    `First time at ${shop} and I'm very impressed. The ${formatTagsEnglish(tags)} made the entire visit wonderful. Will definitely be a regular here from now on.`,

  (shop: string, tags: string[]) =>
    `Super happy with my visit to ${shop}! You can feel the quality right away. Loved the ${formatTagsEnglish(tags)}. Keep up the great standards!`,

  (shop: string, tags: string[]) =>
    `Great vibes and even better service at ${shop}. The ${formatTagsEnglish(tags)} was spot on. Worth every single penny!`,

  (shop: string, tags: string[]) =>
    `Really appreciated the promptness and warmth at ${shop}. The ${formatTagsEnglish(tags)} was a huge plus. Definitely recommending to all my contacts!`,

  (shop: string, tags: string[]) =>
    `Can't say enough good things about ${shop}! From the ${formatTagsEnglish(tags)} to the overall experience, everything was handled with perfection.`,

  (shop: string, tags: string[]) =>
    `Awesome visit to ${shop}. The staff was welcoming and the ${formatTagsEnglish(tags)} was top tier. Looking forward to our next visit!`,

  (shop: string, tags: string[]) =>
    `Had an absolute 10/10 experience at ${shop}. The ${formatTagsEnglish(tags)} truly stood out. Outstanding customer care and quality. Five stars all the way!`,

  (shop: string, tags: string[]) =>
    `Such a delightful visit to ${shop}! Everything from the ${formatTagsEnglish(tags)} to the courteous team exceeded expectations. Highly recommended spot in the city.`,

  (shop: string, tags: string[]) =>
    `Stopped by ${shop} earlier today and loved every bit of it. The ${formatTagsEnglish(tags)} was exceptional. Definitely coming back with friends!`,

  (shop: string, tags: string[]) =>
    `One of the best experiences I've had recently! ${shop} impressed me with their ${formatTagsEnglish(tags)}. Smooth, pleasant and high quality.`,

  (shop: string, tags: string[]) =>
    `Five stars for ${shop}! Loved the ${formatTagsEnglish(tags)}. The team goes out of their way to make you feel comfortable. A must-visit!`,
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
  const allTags = [...selectedTags, ...customTags].map((t) => t.trim()).filter(Boolean);
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

  // Standard / Natural English
  const fn = STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
  return fn(shopName, shuffledTags);
}
