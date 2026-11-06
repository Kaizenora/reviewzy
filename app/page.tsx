"use client";

import React, { useState, useEffect } from "react";
import CustomerReviewFlow from "@/components/CustomerReviewFlow";
import { DEFAULT_SHOPS } from "@/lib/default-shops";
import { Shop } from "@/types/shop";
import { getAllShops } from "@/lib/supabase";

export default function HomePage() {
  const [shop, setShop] = useState<Shop>(DEFAULT_SHOPS[0]);

  useEffect(() => {
    async function load() {
      const all = await getAllShops();
      if (all && all.length > 0) {
        const defaultShop = all.find((s) => s.slug === "cafe-mokka") || all[0];
        setShop(defaultShop);
      }
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-0 md:py-6 font-sans">
      <div className="w-full max-w-md bg-[#FAF7F2] min-h-screen md:min-h-0 md:rounded-3xl md:border md:border-[#EADFCF] md:shadow-card overflow-hidden">
        <CustomerReviewFlow key={shop.slug} shop={shop} />
      </div>
    </main>
  );
}
