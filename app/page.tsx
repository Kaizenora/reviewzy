"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllShops } from "@/lib/supabase";
import { DEFAULT_SHOPS } from "@/lib/default-shops";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToShop() {
      // Try Supabase first
      try {
        const all = await getAllShops();
        if (all && all.length > 0) {
          // Prefer a non-demo shop (not one of the defaults)
          const defaultSlugs = DEFAULT_SHOPS.map((s) => s.slug);
          const realShop = all.find((s) => !defaultSlugs.includes(s.slug)) || all[0];
          router.replace(`/r/${realShop.slug}`);
          return;
        }
      } catch {
        // Fall through to default
      }

      // Fallback: first default shop
      router.replace(`/r/${DEFAULT_SHOPS[0].slug}`);
    }

    redirectToShop();
  }, [router]);

  // Show a minimal loading state while redirecting
  return (
    <main className="min-h-screen bg-[#0B0B0E] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#E36427] border-t-transparent animate-spin" />
        <p className="text-zinc-500 text-sm font-medium">Loading...</p>
      </div>
    </main>
  );
}
