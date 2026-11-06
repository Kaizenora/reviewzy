import { Shop } from "@/types/shop";

export const DEFAULT_SHOPS: Shop[] = [
  {
    id: "shop_cafe_mokka",
    slug: "cafe-mokka",
    name: "Cafe Mokka",
    location: "Kothrud, Pune",
    logoLetter: "M",
    brandColor: "#E36427",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJgW1x7j_BwjsReO-3aHox_zY",
    category: "Cafe & Restaurant",
    whatWentWellTags: [
      "Tasty food",
      "Friendly staff",
      "Quick service",
      "Good value",
      "Nice ambience",
      "Clean place",
      "Comfortable seating",
      "Great view",
    ],
    couldBeBetterTags: [
      "Slow service",
      "Too noisy",
      "Overpriced",
    ],
  },
  {
    id: "shop_urban_salon",
    slug: "urban-salon",
    name: "Urban Salon & Spa",
    location: "Bandra West, Mumbai",
    logoLetter: "U",
    brandColor: "#8B5CF6",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ5TSp_WvCwjsR2X7QdZ9_gqI",
    category: "Salon & Wellness",
    whatWentWellTags: [
      "Great haircut",
      "Expert stylist",
      "Hygienic equipment",
      "Relaxing massage",
      "Punctual timing",
      "Aesthetic interior",
      "Polite reception",
    ],
    couldBeBetterTags: [
      "Waiting time",
      "Parking difficulty",
      "Slightly expensive",
    ],
  },
  {
    id: "shop_apex_dental",
    slug: "apex-dental",
    name: "Apex Smile Dental",
    location: "Indiranagar, Bengaluru",
    logoLetter: "A",
    brandColor: "#0284C7",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJw_b9wRQXrjsRP3V6_u-gD08",
    category: "Dental & Healthcare",
    whatWentWellTags: [
      "Painless treatment",
      "Gentle doctor",
      "Sparkling clean clinic",
      "Clear explanation",
      "Modern digital X-ray",
      "Warm staff",
    ],
    couldBeBetterTags: [
      "Crowded waiting room",
      "Appointment delay",
    ],
  },
  {
    id: "shop_sharma_sweets",
    slug: "sharma-sweets",
    name: "Sharma Sweets & Chaat",
    location: "Connaught Place, New Delhi",
    logoLetter: "S",
    brandColor: "#DC2626",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ4-uD07jjDDkRj_8W1o1Q3mY",
    category: "Sweets & Street Food",
    whatWentWellTags: [
      "Authentic pure ghee taste",
      "Crisp hot samosas",
      "Super fresh gulab jamun",
      "Quick packing",
      "Must try rabdi jalebi",
      "Hygienic counters",
    ],
    couldBeBetterTags: [
      "Heavy evening rush",
      "Limited seating space",
    ],
  },
];

export function getShopBySlugFromDefaults(slug: string): Shop | undefined {
  return DEFAULT_SHOPS.find(
    (s) => s.slug.toLowerCase() === slug.toLowerCase()
  );
}
