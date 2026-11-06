"use client";

import React, { useEffect, useState } from "react";
import { Shop } from "@/types/shop";
import { getAllShops, saveShop, isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_SHOPS } from "@/lib/default-shops";
import Link from "next/link";
import {
  Store,
  Plus,
  QrCode,
  Check,
  Database,
  ArrowRight,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function AdminPage() {
  const [shops, setShops] = useState<Shop[]>(DEFAULT_SHOPS);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // New shop form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [slug, setSlug] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#E36427");
  const [logoLetter, setLogoLetter] = useState("M");
  const [whatWentWellStr, setWhatWentWellStr] = useState(
    "Tasty food, Friendly staff, Quick service, Nice ambience, Clean place"
  );
  const [couldBeBetterStr, setCouldBeBetterStr] = useState(
    "Slow service, Too noisy, Overpriced"
  );
  const [category, setCategory] = useState("Cafe & Restaurant");

  useEffect(() => {
    loadShops();
  }, []);

  async function loadShops() {
    setLoading(true);
    const data = await getAllShops();
    setShops(data);
    setLoading(false);
  }

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
    setLogoLetter(val.charAt(0).toUpperCase() || "M");
    if (!googleReviewUrl) {
      setGoogleReviewUrl(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          val + " " + location
        )}`
      );
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    const newShop: Shop = {
      id: `shop_${Date.now()}`,
      slug: slug.trim(),
      name: name.trim(),
      location: location.trim() || "Local Branch",
      logoLetter: logoLetter || name.charAt(0).toUpperCase(),
      brandColor,
      googleReviewUrl:
        googleReviewUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          name + " " + location
        )}`,
      whatWentWellTags: whatWentWellStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      couldBeBetterTags: couldBeBetterStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      category,
      createdAt: new Date().toISOString(),
    };

    await saveShop(newShop);
    await loadShops();
    setIsCreating(false);

    // Reset form
    setName("");
    setLocation("");
    setSlug("");
    setGoogleReviewUrl("");
  };

  const copyShopUrl = (shopSlug: string) => {
    const url = `${window.location.origin}/r/${shopSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(shopSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 font-sans text-stone-900">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E7DFD2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-extrabold tracking-tight text-[#181715]">
                Reviewzy
              </span>
              <span className="bg-[#E36427]/10 text-[#E36427] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Private merchant dashboard: manage shops, custom keywords, QR stands, and Google Maps links.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-full border border-stone-200 bg-white flex items-center gap-1.5"
            >
              <span>View Customer App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#E36427] hover:bg-[#D4561B] text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Shop</span>
            </button>
          </div>
        </div>

        {/* DATABASE STATUS BANNER */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-[#E7DFD2] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSupabaseConfigured
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900">
                  {isSupabaseConfigured
                    ? "Supabase Connected & Syncing"
                    : "Supabase Keys Configured (Pending URL)"}
                </span>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Anon Key is loaded. Add your <code>NEXT_PUBLIC_SUPABASE_URL</code> to <code>.env.local</code> to complete cloud sync. Local storage is fully active as backup.
              </p>
            </div>
          </div>
        </div>

        {/* MODAL / FORM TO CREATE NEW SHOP */}
        {isCreating && (
          <div className="mb-8 p-6 bg-white rounded-3xl border-2 border-[#E36427]/30 shadow-card animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#E36427]" />
                <span>Create New Shop & QR Stand</span>
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Shop / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blue Tokai Coffee"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-[#E36427]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Koramangala, Bengaluru"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-[#E36427]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Unique URL Slug *
                  </label>
                  <div className="flex items-center text-xs text-stone-500 border border-stone-200 rounded-xl px-3 py-2 bg-stone-50">
                    <span>/r/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-transparent outline-none font-semibold text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-[#E36427]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full text-xs px-2 py-2 rounded-xl border border-stone-200 outline-none uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Google Maps Destination URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.google.com/maps/search/?api=1&query=..."
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-[#E36427]"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Opens Google Maps app natively on mobile phones where the user is already signed in!
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  &ldquo;WHAT WENT WELL&rdquo; Keywords (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={whatWentWellStr}
                  onChange={(e) => setWhatWentWellStr(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-[#E36427]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  &ldquo;COULD BE BETTER&rdquo; Keywords (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={couldBeBetterStr}
                  onChange={(e) => setCouldBeBetterStr(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none focus:border-[#E36427]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#E36427] hover:bg-[#D4561B] text-white text-xs font-bold px-6 py-2 rounded-full shadow-sm"
                >
                  Save & Generate Stand
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SHOPS LIST */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider mb-2">
            Active Shops ({shops.length})
          </h2>

          {loading ? (
            <div className="text-xs text-stone-500 py-10 text-center">
              Loading shops...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.map((s) => (
                <div
                  key={s.slug}
                  className="bg-white rounded-2xl border border-[#E7DFD2] p-5 shadow-card hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* TOP INFO */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                          style={{ backgroundColor: s.brandColor || "#E36427" }}
                        >
                          {s.logoLetter || s.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900 text-base leading-tight">
                            {s.name}
                          </h3>
                          <p className="text-xs text-stone-500">{s.location}</p>
                        </div>
                      </div>

                      <span className="text-[10px] bg-stone-100 font-semibold text-stone-600 px-2.5 py-0.5 rounded-full">
                        {s.category || "Shop"}
                      </span>
                    </div>

                    {/* KEYWORDS PREVIEW */}
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                        What Went Well ({s.whatWentWellTags?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {s.whatWentWellTags?.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-[#FAF7F2] border border-[#E7DFD2] text-stone-700 px-2 py-0.5 rounded-full font-medium"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                        {(s.whatWentWellTags?.length || 0) > 4 && (
                          <span className="text-[10px] text-stone-400 font-medium self-center">
                            +{s.whatWentWellTags.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTIONS */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold">
                    <button
                      onClick={() => copyShopUrl(s.slug)}
                      className="text-stone-600 hover:text-stone-900 flex items-center gap-1"
                      title="Copy customer link"
                    >
                      {copiedSlug === s.slug ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/r/${s.slug}/qr`}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Print QR Stand</span>
                      </Link>

                      <Link
                        href={`/r/${s.slug}`}
                        target="_blank"
                        className="bg-[#E36427] hover:bg-[#D4561B] text-white px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <span>Test Flow</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
