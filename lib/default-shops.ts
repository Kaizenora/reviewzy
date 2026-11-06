import { Shop } from "@/types/shop";

export const DEFAULT_SHOPS: Shop[] = [
  {
    id: "shop_cafe_mokka",
    slug: "cafe-mokka",
    name: "Cafe Mokka",
    location: "Kothrud, Pune",
    logoLetter: "M",
    brandColor: "#E36427",
    googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Mokka+Kothrud+Pune",
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
    googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Urban+Salon+and+Spa+Bandra+West+Mumbai",
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
    googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Apex+Smile+Dental+Indiranagar+Bengaluru",
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
    googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Sharma+Sweets+Chaat+Connaught+Place+New+Delhi",
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
