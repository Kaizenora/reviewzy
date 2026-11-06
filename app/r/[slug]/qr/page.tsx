"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shop } from "@/types/shop";
import { getShopBySlug } from "@/lib/supabase";
import { getShopBySlugFromDefaults } from "@/lib/default-shops";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowLeft, ExternalLink, Star } from "lucide-react";
import Link from "next/link";

export default function ShopQrPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "cafe-mokka";

  const [shop, setShop] = useState<Shop | null>(
    () => getShopBySlugFromDefaults(slug) || null
  );
  const [currentUrl, setCurrentUrl] = useState(
    `https://reviewzy.vercel.app/r/${slug}`
  );
  const [standTheme, setStandTheme] = useState<"white" | "dark">("white");

  useEffect(() => {
    async function load() {
      if (slug) {
        const found = await getShopBySlug(slug);
        if (found) {
          setShop(found);
        }
      }
    }
    load();
    if (typeof window !== "undefined") {
      setCurrentUrl(`${window.location.origin}/r/${slug}`);
    }
  }, [slug]);

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0B0B0E] text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-xl font-bold text-white mb-2">Shop Not Found</h1>
        <p className="text-xs text-zinc-400 mb-4">Slug: {slug}</p>
        <Link href="/" className="text-sm text-[#E36427] font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  const isDarkStand = standTheme === "dark";

  return (
    <div className="min-h-screen bg-[#0B0B0E] py-8 px-4 flex flex-col items-center justify-center font-sans text-zinc-100">
      {/* Top action bar */}
      <div className="w-full max-w-md flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link
          href={`/r/${shop.slug}`}
          className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Test Customer Flow</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* THEME TOGGLE FOR PRINT STAND */}
          <div className="bg-[#181822] border border-[#2A2A3C] rounded-full p-1 flex items-center gap-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setStandTheme("white")}
              className={`px-3 py-1 rounded-full transition-all ${
                !isDarkStand
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Classic White
            </button>
            <button
              type="button"
              onClick={() => setStandTheme("dark")}
              className={`px-3 py-1 rounded-full transition-all ${
                isDarkStand
                  ? "bg-[#2A2A3C] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Luxury Dark
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-[#E36427] text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-[#D4561B] shadow-button transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Stand</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PRINT-READY ACRYLIC TABLE STAND CARD */}
      {/* ===================================================================== */}
      <div
        className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden transition-colors border-2 ${
          isDarkStand
            ? "bg-[#14141C] border-[#2A2A3C] text-white"
            : "bg-white border-stone-200 text-stone-900"
        } print:border-none print:shadow-none print:p-4 print:max-w-none print:w-[360px] mx-auto`}
      >
        {/* Brand Top Accent Ribbon */}
        <div
          className="h-2 w-full absolute top-0 left-0"
          style={{ backgroundColor: shop.brandColor || "#E36427" }}
        />

        {/* 1. COMPANY NAME & LOGO */}
        <div className="flex items-center gap-3 mb-4 mt-1">
          {shop.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className={`w-11 h-11 rounded-2xl object-cover shadow-sm border ${
                isDarkStand ? "border-[#2D2D40]" : "border-stone-200"
              }`}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
              style={{ backgroundColor: shop.brandColor || "#E36427" }}
            >
              {shop.logoLetter || shop.name.charAt(0)}
            </div>
          )}
          <div className="text-left">
            <h2
              className={`text-lg font-black leading-tight tracking-tight ${
                isDarkStand ? "text-white" : "text-stone-900"
              }`}
            >
              {shop.name}
            </h2>
            <p
              className={`text-[11px] font-medium leading-none mt-0.5 ${
                isDarkStand ? "text-zinc-400" : "text-stone-500"
              }`}
            >
              {shop.location}
            </p>
          </div>
        </div>

        {/* 2. BIG OFFICIAL GOOGLE REVIEW BRANDING (MATCHING IMAGE) */}
        <div
          className={`w-full py-4 px-5 rounded-2xl mb-5 flex flex-col items-center justify-center ${
            isDarkStand
              ? "bg-[#1B1B26] border border-[#2B2B3C]"
              : "bg-[#F8F9FA] border border-stone-200"
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            {/* OFFICIAL 4-COLOR GOOGLE G LOGO */}
            <svg
              className="w-11 h-11 flex-shrink-0 drop-shadow-sm"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            <div className="text-left">
              <div
                className={`text-2xl font-black tracking-tight leading-[1.05] ${
                  isDarkStand ? "text-white" : "text-stone-800"
                }`}
              >
                Review us
              </div>
              <div
                className={`text-2xl font-black tracking-tight leading-[1.05] ${
                  isDarkStand ? "text-white" : "text-stone-800"
                }`}
              >
                on Google
              </div>
            </div>
          </div>

          {/* 5 GOLDEN STARS */}
          <div className="flex items-center justify-center gap-1 text-amber-400 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
        </div>

        {/* 3. HIGH-CONTRAST QR CODE CONTAINER */}
        <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 shadow-md mb-4 flex items-center justify-center">
          <QRCodeSVG
            value={currentUrl || `https://reviewzy.vercel.app/r/${shop.slug}`}
            size={195}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* 4. SCAN CALL TO ACTION INSTRUCTIONS */}
        <div className="mb-6 space-y-1">
          <p
            className={`text-xs font-extrabold uppercase tracking-wider ${
              isDarkStand ? "text-amber-400" : "text-[#E36427]"
            }`}
          >
            Point phone camera to review in 30s
          </p>
          <p
            className={`text-[11px] font-medium ${
              isDarkStand ? "text-zinc-400" : "text-stone-500"
            }`}
          >
            No app download needed · Instant auto-draft
          </p>
        </div>

        {/* 5. FOOTER WITH INLINE "DESIGNED BY" AND SG LOGO */}
        <div
          className={`w-full pt-4 border-t flex items-center justify-between text-[10px] ${
            isDarkStand
              ? "border-[#252536] text-zinc-500"
              : "border-stone-200 text-stone-500"
          }`}
        >
          <span className="font-semibold tracking-wide">
            Powered by Reviewzy
          </span>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${
              isDarkStand
                ? "bg-[#181824] border-[#2C2C40]"
                : "bg-stone-50 border-stone-200"
            }`}
          >
            <span
              className={`text-[9px] font-extrabold uppercase tracking-widest ${
                isDarkStand ? "text-zinc-300" : "text-stone-700"
              }`}
            >
              Designed by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sg-logo.png"
              alt="SG"
              className="h-4 w-auto object-contain inline-block filter drop-shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center print:hidden">
        <Link
          href={`/r/${shop.slug}`}
          target="_blank"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>Open live customer link: {currentUrl}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
