"use client";

import React, { useEffect, useState, useRef } from "react";
import { Shop } from "@/types/shop";
import {
  getAllShops,
  saveShop,
  deleteShop,
} from "@/lib/supabase";
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
  Edit2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

export default function PrivateAdminPage() {
  const [shops, setShops] = useState<Shop[]>(DEFAULT_SHOPS);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShopSlug, setEditingShopSlug] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Shop form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [slug, setSlug] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#E36427");
  const [logoLetter, setLogoLetter] = useState("M");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [whatWentWellStr, setWhatWentWellStr] = useState(
    "Tasty food, Friendly staff, Quick service, Nice ambience, Clean place"
  );
  const [category, setCategory] = useState("Cafe & Restaurant");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadShops();
  }, []);

  async function loadShops() {
    setLoading(true);
    const data = await getAllShops();
    setShops(data);
    setLoading(false);
  }

  // Open modal for new shop
  const handleOpenCreateModal = () => {
    setEditingShopSlug(null);
    setName("");
    setLocation("");
    setSlug("");
    setGoogleReviewUrl("");
    setBrandColor("#E36427");
    setLogoLetter("M");
    setLogoUrl("");
    setWhatWentWellStr(
      "Tasty food, Friendly staff, Quick service, Nice ambience, Clean place"
    );
    setCategory("Cafe & Restaurant");
    setIsModalOpen(true);
  };

  // Open modal for editing existing shop
  const handleOpenEditModal = (shop: Shop) => {
    setEditingShopSlug(shop.slug);
    setName(shop.name);
    setLocation(shop.location);
    setSlug(shop.slug);
    setGoogleReviewUrl(shop.googleReviewUrl);
    setBrandColor(shop.brandColor || "#E36427");
    setLogoLetter(shop.logoLetter || shop.name.charAt(0).toUpperCase());
    setLogoUrl(shop.logoUrl || "");
    setWhatWentWellStr(shop.whatWentWellTags?.join(", ") || "");
    setCategory(shop.category || "General");
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingShopSlug) {
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
    }
  };

  // Handle image upload from computer (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Image must be smaller than 3MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    const targetSlug = editingShopSlug || slug.trim();

    const shopPayload: Shop = {
      id: editingShopSlug
        ? shops.find((s) => s.slug === editingShopSlug)?.id || `shop_${Date.now()}`
        : `shop_${Date.now()}`,
      slug: targetSlug,
      name: name.trim(),
      location: location.trim() || "Local Branch",
      logoLetter: logoLetter || name.charAt(0).toUpperCase(),
      logoUrl: logoUrl.trim() || undefined,
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
      couldBeBetterTags: [],
      category,
      createdAt: new Date().toISOString(),
    };

    await saveShop(shopPayload);
    await loadShops();
    setIsModalOpen(false);
  };

  const handleDeleteShop = async (shopSlug: string) => {
    if (confirm(`Are you sure you want to delete this business?`)) {
      await deleteShop(shopSlug);
      await loadShops();
    }
  };

  const copyShopUrl = (shopSlug: string) => {
    const url = `${window.location.origin}/r/${shopSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(shopSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCopySchema = () => {
    const sql = `-- ==============================================================================
-- REVIEWZY MULTI-TENANT ARCHITECTURE & SUPABASE SCHEMA
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  brand_color TEXT DEFAULT '#E36427',
  logo_letter TEXT DEFAULT 'M',
  logo_url TEXT,
  google_review_url TEXT NOT NULL,
  what_went_well_tags JSONB NOT NULL DEFAULT '["Tasty food", "Friendly staff", "Nice ambience"]'::jsonb,
  could_be_better_tags JSONB NOT NULL DEFAULT '["Slow service", "Too noisy", "Overpriced"]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_slug TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  selected_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_text TEXT NOT NULL,
  tone TEXT DEFAULT 'standard',
  action_status TEXT DEFAULT 'copied_and_opened_google',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active businesses by slug" ON public.businesses FOR SELECT USING (is_active = true);
CREATE POLICY "Public can insert and update businesses" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Customers can insert review submissions" ON public.review_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view review logs" ON public.review_logs FOR SELECT USING (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-zinc-100 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#22222E]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Reviewzy
              </span>
              <span className="bg-[#E36427]/20 text-[#FF7A38] border border-[#E36427]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Private Admin Panel
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Click &ldquo;Edit Details &amp; Logo&rdquo; on any card below to change logos, keywords, location, and Google Maps links.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3.5 py-2 rounded-full border border-[#272736] bg-[#14141C] hover:bg-[#1D1D28] flex items-center gap-1.5 transition-colors"
            >
              <span>Preview Customer App</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </Link>

            <button
              onClick={handleOpenCreateModal}
              className="bg-[#E36427] hover:bg-[#D4561B] text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-button transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Business</span>
            </button>
          </div>
        </div>

        {/* SUPABASE CLOUD SYNC BANNER */}
        <div className="mb-6 p-5 rounded-2xl bg-[#14141C] border border-[#262634] shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Supabase Connected &amp; Synced
                  </span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Connected to <code className="text-zinc-200 bg-[#1D1D2A] px-1.5 py-0.5 rounded">wrfqhxbedrgwqyizbsut.supabase.co</code>. Tables <code className="text-zinc-200 bg-[#1D1D2A] px-1.5 py-0.5 rounded">businesses</code> and <code className="text-zinc-200 bg-[#1D1D2A] px-1.5 py-0.5 rounded">review_logs</code> are active with real-time multi-tenant sync!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopySchema}
              className="text-xs font-bold text-zinc-200 bg-[#1A1A24] hover:bg-[#242432] border border-[#2D2D3E] px-4 py-2.5 rounded-full flex items-center gap-1.5 self-start md:self-center transition-colors whitespace-nowrap shadow-sm"
            >
              {copiedSchema ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-400 font-extrabold">Copied SQL Schema!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#E36427]" />
                  <span>Copy Supabase SQL Schema</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CREATE / EDIT SHOP MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#14141C] text-zinc-100 rounded-3xl border border-[#2A2A3C] p-6 max-w-xl w-full shadow-2xl my-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#242434]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#E36427]" />
                  <span>{editingShopSlug ? `Edit: ${name || "Business"}` : "Create New Business"}</span>
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-full text-base transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveShop} className="space-y-4">
                {/* LOGO CUSTOMIZATION & UPLOAD */}
                <div className="bg-[#181824] p-4 rounded-2xl border border-[#28283A]">
                  <label className="text-xs font-bold text-zinc-200 block mb-2">
                    Shop Logo (Upload Custom Image or Choose Badge)
                  </label>
                  <div className="flex items-center gap-4">
                    {/* LOGO PREVIEW */}
                    <div className="relative group flex-shrink-0">
                      {logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#38384E] shadow-md"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md"
                          style={{ backgroundColor: brandColor }}
                        >
                          {logoLetter || name.charAt(0) || "M"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-[#20202E] border border-[#323246] hover:bg-[#2A2A3C] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#E36427]" />
                          <span>Upload Logo Image</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1"
                          >
                            Remove Logo Image
                          </button>
                        )}
                      </div>

                      {/* Image URL input or Badge settings */}
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Or paste image URL (https://...)"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#2E2E40] outline-none text-xs bg-[#111118] text-white focus:border-[#E36427]"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium text-zinc-400">Letter:</span>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="M"
                            value={logoLetter}
                            onChange={(e) => setLogoLetter(e.target.value.toUpperCase())}
                            className="w-9 py-1.5 text-center font-bold rounded-lg border border-[#2E2E40] outline-none text-xs bg-[#111118] text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NAME & LOCATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cafe Mokka"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2E2E40] bg-[#111118] text-white outline-none focus:border-[#E36427]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Location / Area *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kothrud, Pune"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2E2E40] bg-[#111118] text-white outline-none focus:border-[#E36427]"
                    />
                  </div>
                </div>

                {/* SLUG, CATEGORY, BRAND COLOR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      URL Slug *
                    </label>
                    <div className="flex items-center text-xs text-zinc-400 border border-[#2E2E40] rounded-xl px-2.5 py-2 bg-[#111118]">
                      <span>/r/</span>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingShopSlug)}
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full bg-transparent outline-none font-semibold text-white disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#2E2E40] bg-[#111118] text-white outline-none focus:border-[#E36427]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-xl border border-[#2E2E40] bg-[#111118] text-white outline-none uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* GOOGLE MAPS DESTINATION */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Google Maps Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.google.com/maps/search/?api=1&query=..."
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2E2E40] bg-[#111118] text-white outline-none focus:border-[#E36427]"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Opens directly in the Google Maps app where users are already signed in.
                  </p>
                </div>

                {/* WHAT WENT WELL KEYWORDS */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Customer Review Keywords (comma-separated positive highlights)
                  </label>
                  <textarea
                    rows={3}
                    value={whatWentWellStr}
                    onChange={(e) => setWhatWentWellStr(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#2E2E40] bg-[#111118] text-white outline-none focus:border-[#E36427] leading-relaxed"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Customers can tap these chips on their phone to shape their authentic 5-star Google review.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#242434]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs font-bold text-zinc-400 hover:text-white px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#E36427] hover:bg-[#D4561B] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-button transition-all"
                  >
                    {editingShopSlug ? "Save Changes" : "Create Business"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SHOPS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Active Businesses ({shops.length})
            </h2>
            <button
              onClick={handleOpenCreateModal}
              className="text-xs font-bold text-[#E36427] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Shop</span>
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-zinc-500 py-10 text-center">
              Loading shops...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.map((s) => (
                <div
                  key={s.slug}
                  className="bg-[#14141C] rounded-3xl border border-[#262634] p-5 shadow-lg hover:border-[#38384C] transition-all flex flex-col justify-between relative group"
                >
                  <div>
                    {/* TOP INFO */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        onClick={() => handleOpenEditModal(s)}
                        className="flex items-center gap-3 cursor-pointer group-hover:opacity-90 transition-opacity"
                        title="Click to edit details"
                      >
                        {/* LOGO DISPLAY */}
                        {s.logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={s.logoUrl}
                            alt={s.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-[#2C2C3E] flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
                            style={{ backgroundColor: s.brandColor || "#E36427" }}
                          >
                            {s.logoLetter || s.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-base leading-tight hover:text-[#E36427] transition-colors">
                              {s.name}
                            </h3>
                            <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-[#E36427] transition-colors" />
                          </div>
                          <p className="text-xs text-zinc-400">{s.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-[#1F1F2C] border border-[#2D2D3E] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full">
                          {s.category || "Shop"}
                        </span>
                        <button
                          onClick={() => handleDeleteShop(s.slug)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete Business"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* KEYWORDS PREVIEW */}
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        What Went Well ({s.whatWentWellTags?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {s.whatWentWellTags?.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-[#1A1A24] border border-[#282838] text-zinc-300 px-2 py-0.5 rounded-full font-medium"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                        {(s.whatWentWellTags?.length || 0) > 4 && (
                          <span className="text-[10px] text-zinc-500 font-medium self-center">
                            +{s.whatWentWellTags.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="pt-3 border-t border-[#222230] flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                    <button
                      onClick={() => copyShopUrl(s.slug)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1"
                      title="Copy customer link"
                    >
                      {copiedSlug === s.slug ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {/* EDIT DETAILS BUTTON */}
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors font-bold text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit Details &amp; Logo</span>
                      </button>

                      <Link
                        href={`/r/${s.slug}/qr`}
                        className="bg-[#1C1C26] hover:bg-[#252534] text-zinc-200 border border-[#2D2D3E] px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#E36427]" />
                        <span>Print Stand</span>
                      </Link>

                      <Link
                        href={`/r/${s.slug}`}
                        target="_blank"
                        className="bg-[#E36427] hover:bg-[#D4561B] text-white px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-button"
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

        {/* PROMINENT DARK THEME BRANDED FOOTER */}
        <div className="mt-12 pt-6 border-t border-[#222230] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>© {new Date().getFullYear()} Reviewzy Multi-Tenant Platform · All rights reserved</p>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#15151D] border border-[#2B2B3C] shadow-md hover:border-[#3E3E54] transition-all">
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-300">
              Designed by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sg-logo.png"
              alt="SG Logo"
              className="h-6 w-auto object-contain filter drop-shadow-[0_1px_4px_rgba(234,179,8,0.35)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
