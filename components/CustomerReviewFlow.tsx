"use client";

import React, { useState, useEffect } from "react";
import { Shop, ReviewTone } from "@/types/shop";
import { logReviewGenerated } from "@/lib/supabase";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Check,
  RotateCcw,
  Copy,
  ExternalLink,
  Plus,
} from "lucide-react";

interface Props {
  shop: Shop;
}

export default function CustomerReviewFlow({ shop }: Props) {
  // Navigation: Step 1 (Options) -> Step 2 (Thinking/Writing) -> Step 3 (Draft Review) -> Step 4 (Post Google)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected tags
  const [selectedTags, setSelectedTags] = useState<string[]>([
    shop.whatWentWellTags[0] || "Tasty food",
    shop.whatWentWellTags[1] || "Friendly staff",
  ]);

  // Custom tags added by user
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Review Draft state
  const [reviewDraft, setReviewDraft] = useState<string>("");
  const [activeTone, setActiveTone] = useState<ReviewTone>("standard");
  const [isGenerating, setIsGenerating] = useState(false);

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);

  // Copy success state
  const [copied, setCopied] = useState(false);

  // Toggle selection of tags
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Add custom tag
  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags((prev) => [...prev, trimmed]);
      setSelectedTags((prev) => [...prev, trimmed]);
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  // Trigger typewriter effect for freshly drafted text
  useEffect(() => {
    if (reviewDraft && step === 3) {
      setIsTypingAnimation(true);
      setDisplayedText("");
      let i = 0;
      const interval = setInterval(() => {
        if (i < reviewDraft.length) {
          setDisplayedText(reviewDraft.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setIsTypingAnimation(false);
        }
      }, 14);

      return () => clearInterval(interval);
    }
  }, [reviewDraft, step]);

  // Call synthesizer API
  const generateReviewFromApi = async (tone: ReviewTone = "standard") => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: shop.slug,
          shopName: shop.name,
          category: shop.category || "General",
          tags: selectedTags,
          tone,
        }),
      });

      const data = await res.json();
      if (data && data.review) {
        setReviewDraft(data.review);
        setActiveTone(tone);
      }
    } catch (err) {
      console.error("Failed to generate review:", err);
      setReviewDraft(
        `Visited ${shop.name} in ${shop.location}. Really enjoyed the experience! ${selectedTags.join(
          ", "
        )}. Definitely recommend stopping by.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Proceed from Step 1 to Step 2 then auto-advance to Step 3
  const handleProceedToGenerate = async () => {
    if (selectedTags.length === 0) return;
    setStep(2);

    // Call API and set brief realistic animation timer
    const apiPromise = generateReviewFromApi("standard");
    const timerPromise = new Promise((resolve) => setTimeout(resolve, 1400));

    await Promise.all([apiPromise, timerPromise]);
    setStep(3);
  };

  // Switch tone in Step 3
  const handleToneChange = async (tone: ReviewTone) => {
    if (tone === activeTone || isGenerating) return;
    await generateReviewFromApi(tone);
  };

  // Step 4: Copy to clipboard and launch Google Review URL
  const handleCopyAndOpenGoogle = async () => {
    const textToCopy = reviewDraft || displayedText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#E36427", "#F59E0B", "#10B981", "#8B5CF6"],
      });
    } catch {
      // Confetti fallback
    }

    // Log review activity
    logReviewGenerated({
      shopSlug: shop.slug,
      rating: 5,
      tags: selectedTags,
      reviewText: textToCopy,
      tone: activeTone,
      actionStatus: "copied_and_opened_google",
    });

    // Deep-link to Google Maps
    const targetUrl =
      shop.googleReviewUrl && !shop.googleReviewUrl.includes("search.google.com/local/writereview")
        ? shop.googleReviewUrl
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${shop.name} ${shop.location}`
          )}`;

    setTimeout(() => {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }, 700);
  };

  const totalPicked = selectedTags.length;

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-zinc-100 flex flex-col justify-between max-w-md mx-auto relative px-5 py-6 select-none font-sans">
      {/* TOP HEADER: 4-BAR STEP PROGRESS INDICATOR */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-500 text-xs font-semibold tracking-wide">
            Scan · Review
          </span>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-[#E36427]" : "bg-[#22222C]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* SHOP IDENTITY HEADER */}
        <div className="flex items-center gap-3.5 mb-5">
          {shop.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-12 h-12 rounded-2xl object-cover shadow-md border border-[#272736]"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md"
              style={{ backgroundColor: shop.brandColor || "#E36427" }}
            >
              {shop.logoLetter || shop.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {shop.name}
            </h2>
            <p className="text-xs text-zinc-400 font-medium">{shop.location}</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCREEN 1: HOW WAS YOUR VISIT? (NO STAR PICKER) */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              How was your visit?
            </h1>

            <p className="text-xs text-zinc-400 font-medium mb-6">
              Pick what went well to shape your draft review.
            </p>

            {/* WHAT WENT WELL */}
            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block mb-3">
                WHAT WENT WELL
              </span>
              <div className="flex flex-wrap gap-2">
                {shop.whatWentWellTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-medium px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#E36427] text-white shadow-button font-bold border border-[#E36427]"
                          : "bg-[#16161E] text-zinc-300 border border-[#272736] hover:bg-[#20202A] hover:border-[#38384C]"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COULD BE BETTER */}
            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block mb-3">
                COULD BE BETTER
              </span>
              <div className="flex flex-wrap gap-2">
                {shop.couldBeBetterTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-medium px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#E36427] text-white shadow-button font-bold border border-[#E36427]"
                          : "bg-[#16161E] text-zinc-300 border-[1.5px] border-dashed border-[#343448] hover:bg-[#20202A]"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}

                {/* Custom tags added by user */}
                {customTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-medium px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#E36427] text-white shadow-button font-bold border border-[#E36427]"
                          : "bg-[#16161E] text-zinc-300 border border-[#272736]"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}

                {/* Add my own button */}
                {isAddingTag ? (
                  <form
                    onSubmit={handleAddCustomTag}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Great coffee"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#E36427] bg-[#16161E] text-white outline-none w-32"
                    />
                    <button
                      type="submit"
                      className="text-xs bg-[#E36427] text-white px-3 py-1.5 rounded-full font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(false)}
                      className="text-xs text-zinc-400 hover:text-white px-1"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="text-xs font-medium px-4 py-2 rounded-full border border-[#272736] bg-[#16161E] text-zinc-300 hover:bg-[#20202A] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#E36427]" />
                    <span>Add my own</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 2: WRITING YOUR REVIEW... */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="animate-fadeIn py-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              Writing your review...
            </h1>
            <p className="text-sm text-zinc-400 font-medium mb-6">
              Using only the points you picked.
            </p>

            {/* CARD WITH SPARKLE AND PICKED PILLS */}
            <div className="rounded-3xl border border-[#262634] bg-[#14141C] p-8 flex flex-col items-center justify-center text-center shadow-2xl min-h-[220px]">
              <div className="mb-4 text-[#E36427] animate-pulse-glow">
                <Sparkles className="w-8 h-8 fill-[#E36427]/30" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-5">
                Turning your choices into a short review
              </h3>

              {/* Display picked chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-[#20202C] border border-[#303042] text-zinc-200 text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3 h-3 text-[#E36427] stroke-[2.5]" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Language & style indicator */}
            <div className="mt-5 text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <span className="text-[#E36427] font-semibold">✨ Review Draft</span>
              <span>· Authentic & Ready</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 3: YOUR DRAFT */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1.5">
              Your draft
            </h1>
            <p className="text-sm text-zinc-400 font-medium mb-4">
              Edit it freely. It is your review.
            </p>

            {/* EDITABLE DRAFT CONTAINER */}
            <div className="rounded-2xl border border-[#282838] bg-[#14141C] p-4 relative mb-4 shadow-inner">
              <textarea
                value={isTypingAnimation ? displayedText : reviewDraft}
                onChange={(e) => {
                  if (!isTypingAnimation) {
                    setReviewDraft(e.target.value);
                  }
                }}
                rows={4}
                className="w-full bg-transparent text-white text-sm md:text-base leading-relaxed resize-none outline-none font-normal placeholder:text-zinc-500"
                placeholder="Write your review..."
              />
              {isTypingAnimation && (
                <span className="inline-block w-0.5 h-4 bg-[#E36427] ml-0.5 animate-pulse align-middle" />
              )}
            </div>

            {/* TONE ADJUSTMENT BUTTONS */}
            <div className="flex items-center gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => handleToneChange("standard")}
                disabled={isGenerating || isTypingAnimation}
                className={`flex-1 py-2 rounded-full border text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  activeTone === "standard"
                    ? "border-[#E36427] bg-[#E36427] text-white shadow-button"
                    : "border-[#272736] bg-[#16161E] text-zinc-300 hover:bg-[#20202C]"
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Rewrite</span>
              </button>

              <button
                type="button"
                onClick={() => handleToneChange("shorter")}
                disabled={isGenerating || isTypingAnimation}
                className={`flex-1 py-2 rounded-full border text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  activeTone === "shorter"
                    ? "border-[#E36427] bg-[#E36427] text-white shadow-button"
                    : "border-[#272736] bg-[#16161E] text-zinc-300 hover:bg-[#20202C]"
                }`}
              >
                <span>Shorter</span>
              </button>

              <button
                type="button"
                onClick={() => handleToneChange("hinglish")}
                disabled={isGenerating || isTypingAnimation}
                className={`flex-1 py-2 rounded-full border text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  activeTone === "hinglish"
                    ? "border-[#E36427] bg-[#E36427] text-white shadow-button"
                    : "border-[#272736] bg-[#16161E] text-zinc-300 hover:bg-[#20202C]"
                }`}
              >
                <span>Hinglish</span>
              </button>
            </div>

            {/* BASED ON RECAP (NO STARS) */}
            <p className="text-xs text-zinc-400 font-medium line-clamp-1 mb-2">
              Based on: {selectedTags.join(" · ")}
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 4: LAST STEP: POST ON GOOGLE */}
        {/* ========================================================= */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              Last step: post on Google
            </h1>
            <p className="text-sm text-zinc-400 font-medium mb-6">
              We copy your review, then open {shop.name}&apos;s Google page.
            </p>

            {/* 3 NUMBERED STEPS */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-zinc-200 font-medium">
                  Tap below. Your review is copied automatically.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-zinc-200 font-medium">
                  On Google Maps, tap on Write a Review and paste it.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-zinc-200 font-medium">
                  Choose your stars and tap Post.
                </p>
              </div>
            </div>

            {/* HELPFUL NOTE CARD */}
            <div className="rounded-2xl bg-[#14141C] border border-[#272736] p-4 text-xs text-zinc-300 leading-relaxed font-normal mb-6">
              Opens directly in Google Maps where you are already signed in.
              Answer optional questions only if you prefer.
            </div>

            {/* COPY CONFIRMATION BADGE */}
            {copied && (
              <div className="mb-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-full flex items-center justify-center gap-2 animate-bounce">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to clipboard! Opening Google Maps...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* STICKY BOTTOM ACTIONS & FOOTER */}
      {/* ========================================================= */}
      <div className="mt-8 pt-4 w-full">
        {step === 1 && (
          <button
            type="button"
            disabled={totalPicked === 0}
            onClick={handleProceedToGenerate}
            className={`w-full py-4 rounded-full font-bold text-sm md:text-base text-white transition-all shadow-button active:scale-[0.98] ${
              totalPicked > 0
                ? "bg-[#E36427] hover:bg-[#D4561B]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {totalPicked > 0
              ? `Write my review · ${totalPicked} picked`
              : "Pick at least 1 keyword"}
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full py-4 rounded-full font-bold text-sm md:text-base text-white bg-[#E36427] hover:bg-[#D4561B] transition-all shadow-button active:scale-[0.98]"
          >
            Looks good
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={handleCopyAndOpenGoogle}
            className="w-full py-4 rounded-full font-bold text-sm md:text-base text-white bg-[#E36427] hover:bg-[#D4561B] transition-all shadow-button active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copy review & open Google</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* PROMINENT DARK THEME BRANDED FOOTER */}
        <div className="text-center mt-6 flex flex-col items-center justify-center gap-2.5">
          {step === 4 ? (
            <p className="text-[11px] text-zinc-400">You post it yourself from your Google account</p>
          ) : (
            <p className="text-[11px] text-zinc-500">Live preview · Powered by Reviewzy</p>
          )}

          {/* HIGH-CONTRAST "DESIGNED BY SG" MARK */}
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
