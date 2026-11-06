"use client";

import React from "react";
import CustomerReviewFlow from "@/components/CustomerReviewFlow";
import { DEFAULT_SHOPS } from "@/lib/default-shops";

// Root URL always shows the demo (Cafe Mokka).
// Real businesses are served at /r/[slug] from Supabase.
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0B0E] flex flex-col items-center justify-center p-0 md:py-6 font-sans">
      <div className="w-full max-w-md bg-[#131318] min-h-screen md:min-h-0 md:rounded-3xl md:border md:border-[#262632] md:shadow-2xl overflow-hidden">
        <CustomerReviewFlow shop={DEFAULT_SHOPS[0]} />
      </div>
    </main>
  );
}
