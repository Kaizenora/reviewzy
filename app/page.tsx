"use client";

import React, { useState, useEffect } from "react";
import CustomerReviewFlow from "@/components/CustomerReviewFlow";
import { DEFAULT_SHOPS } from "@/lib/default-shops";
import { Shop } from "@/types/shop";
import { getAllShops } from "@/lib/supabase";
import Link from "next/link";
import { QrCode, Settings, ExternalLink } from "lucide-react";

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>(DEFAULT_SHOPS);
  const [selectedShop, setSelectedShop] = useState<Shop>(DEFAULT_SHOPS[0]);

  useEffect(() => {
    async function load() {
      const all = await getAllShops();
      if (all && all.length > 0) {
        setShops(all);
        // keep cafe mokka selected if available
        const cafe = all.find((s) => s.slug === "cafe-mokka") || all[0];
        setSelectedShop(cafe);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans">
      {/* TOP NOTIFICATION BAR FOR QUICK NAVIGATION & ADMIN */}
      <header className="bg-white border-b border-[#E7DFD2] py-2.5 px-4 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* LOGO & TITLE */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E36427] text-white flex items-center justify-center font-extrabold text-sm">
              R
            </div>
            <span className="font-extrabold text-stone-900 tracking-tight text-base">
              Reviewzy
            </span>
            <span className="hidden sm:inline-block text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
              Scan · AI Draft · Google Review
            </span>
          </div>

          {/* SHOP SELECTOR CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full text-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 hidden md:inline">
              Shop:
            </span>
            {shops.slice(0, 4).map((s) => (
              <button
                key={s.slug}
                onClick={() => setSelectedShop(s)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedShop.slug === s.slug
                    ? "bg-[#181715] text-white shadow-sm"
                    : "bg-[#FAF7F2] text-stone-700 border border-[#E7DFD2] hover:bg-stone-200"
                }`}
              >
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <Link
              href={`/r/${selectedShop.slug}/qr`}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E36427]" />
              <span className="hidden sm:inline">View QR Stand</span>
            </Link>

            <Link
              href="/admin"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#E36427] hover:bg-[#D4561B] text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin & Setup</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: CENTERED MOBILE EXPERIENCE */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 px-3">
        {/* Subtle phone frame container for ultra-clean presentation */}
        <div className="w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#EADFCF] shadow-card overflow-hidden">
          <CustomerReviewFlow
            key={selectedShop.slug}
            shop={selectedShop}
          />
        </div>

        {/* BOTTOM HELPER BANNER */}
        <div className="max-w-md w-full mt-4 flex items-center justify-between text-xs text-stone-500 px-2 font-medium">
          <span>Viewing: <strong>{selectedShop.name}</strong></span>
          <Link
            href={`/r/${selectedShop.slug}`}
            target="_blank"
            className="text-[#E36427] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Open in standalone page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}
