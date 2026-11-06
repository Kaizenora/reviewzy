"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shop } from "@/types/shop";
import { getShopBySlug } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ShopQrPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    async function load() {
      if (slug) {
        const found = await getShopBySlug(slug);
        setShop(found);
      }
      setLoading(false);
    }
    load();
    if (typeof window !== "undefined") {
      setCurrentUrl(`${window.location.origin}/r/${slug}`);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-stone-500 text-sm">
        Loading QR Code...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-stone-800 mb-2">Shop Not Found</h1>
        <Link href="/" className="text-sm text-[#E36427] font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 flex flex-col items-center justify-center font-sans">
      {/* Top nav */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/r/${shop.slug}`}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Test Review Flow</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-[#181715] text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-stone-800 shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Stand</span>
        </button>
      </div>

      {/* PRINT-READY TABLE CARD / COUNTER STAND */}
      <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-[#EADFCF] p-8 shadow-card flex flex-col items-center text-center relative overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Decorative top ribbon */}
        <div
          className="h-2 w-full absolute top-0 left-0"
          style={{ backgroundColor: shop.brandColor || "#E36427" }}
        />

        {/* Shop logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-sm mb-3 mt-1"
          style={{ backgroundColor: shop.brandColor || "#E36427" }}
        >
          {shop.logoLetter || shop.name.charAt(0)}
        </div>

        <h1 className="text-2xl font-black text-stone-900 mb-1">{shop.name}</h1>
        <p className="text-xs font-medium text-stone-500 mb-6">{shop.location}</p>

        {/* Call to action badge */}
        <div className="bg-[#FAF7F2] border border-[#E7DFD2] rounded-full px-4 py-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#E36427]" />
          <span>Scan to review in 30 seconds</span>
        </div>

        {/* The QR Code */}
        <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 shadow-sm mb-6">
          <QRCodeSVG
            value={currentUrl || `https://reviewzy.app/r/${shop.slug}`}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Instructions */}
        <div className="space-y-1.5 text-xs text-stone-600 font-medium">
          <p className="font-bold text-stone-800">1. Point phone camera</p>
          <p>2. Tap the options that describe your visit</p>
          <p>3. Copy & paste onto Google with 1 click!</p>
        </div>

        <div className="mt-8 pt-4 border-t border-stone-100 w-full flex items-center justify-between text-[10px] text-stone-400 font-medium">
          <span>Powered by Reviewzy</span>
          <span>Google Reviews</span>
        </div>
      </div>

      <div className="mt-6 text-center print:hidden">
        <Link
          href={`/r/${shop.slug}`}
          target="_blank"
          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
        >
          <span>Open customer link: {currentUrl}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
