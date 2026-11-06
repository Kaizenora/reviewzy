"use client";

import React, { useState, useEffect } from "react";
import { Shop, ReviewStep, ReviewTone } from "@/types/shop";
import {
  Sparkles,
  RotateCcw,
  Check,
  Copy,
  ExternalLink,
  Plus,
} from "lucide-react";
import confetti from "canvas-confetti";
import { logReviewGenerated } from "@/lib/supabase";

interface Props {
  shop: Shop;
}

export default function CustomerReviewFlow({ shop }: Props) {
  const [step, setStep] = useState<ReviewStep>(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const [reviewDraft, setReviewDraft] = useState<string>("");
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTone, setActiveTone] = useState<ReviewTone>("standard");
  const [copied, setCopied] = useState(false);

  // Synchronize initial tags from shop preset
  useEffect(() => {
    if (shop.whatWentWellTags && shop.whatWentWellTags.length > 0) {
      setSelectedTags(shop.whatWentWellTags.slice(0, 3));
    }
  }, [shop]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setCustomTags((prev) => [...prev, trimmed]);
      setSelectedTags((prev) => [...prev, trimmed]);
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  // Generate review via synthesizer with typing animation
  const generateReviewDraft = async (toneToUse: ReviewTone = "standard") => {
    setIsGenerating(true);
    setActiveTone(toneToUse);

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shop.name,
          shopLocation: shop.location,
          selectedTags,
          customTags,
          tone: toneToUse,
        }),
      });

      const data = await res.json();
      const newReview = data.review || `Great experience at ${shop.name}! Highly recommended.`;
      setReviewDraft(newReview);

      logReviewGenerated({
        shopSlug: shop.slug,
        rating: 5,
        tags: selectedTags,
        reviewText: newReview,
        tone: toneToUse,
      });

      return newReview;
    } catch {
      const fallback = `Loved my visit to ${shop.name}! ${selectedTags.join(", ")} was really great.`;
      setReviewDraft(fallback);
      return fallback;
    } finally {
      setIsGenerating(false);
    }
  };

  // Typing animation
  const startTypingAnimation = (fullText: string) => {
    setIsTypingAnimation(true);
    setDisplayedText("");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTypingAnimation(false);
      }
    }, 18);
  };

  // Transition from Step 1 -> Step 2 -> Step 3
  const handleProceedToGenerate = async () => {
    setStep(2);
    const reviewResult = await generateReviewDraft("standard");
    setTimeout(() => {
      setStep(3);
      startTypingAnimation(reviewResult);
    }, 1600);
  };

  // Tone rewrite buttons in Step 3
  const handleToneChange = async (tone: ReviewTone) => {
    setIsTypingAnimation(true);
    setDisplayedText("");
    const newText = await generateReviewDraft(tone);
    startTypingAnimation(newText);
  };

  // Step 4 copy & redirect to Google Maps (app deep-link avoids web login)
  const handleCopyAndOpenGoogle = () => {
    navigator.clipboard.writeText(reviewDraft);
    setCopied(true);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    // Direct Google Maps search URL - opens Google Maps app on mobile without web login
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
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between max-w-md mx-auto relative px-5 py-6 select-none font-sans">
      {/* TOP HEADER: 4-BAR STEP PROGRESS INDICATOR */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-stone-500 text-xs font-semibold tracking-wide">
            Scan · Review
          </span>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-[#E36427]" : "bg-[#EAE2D5]"
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
              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-[#E7DFD2]"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
              style={{ backgroundColor: shop.brandColor || "#E36427" }}
            >
              {shop.logoLetter || shop.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-[#181715] leading-tight">
              {shop.name}
            </h2>
            <p className="text-xs text-stone-500 font-medium">{shop.location}</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCREEN 1: HOW WAS YOUR VISIT? (NO STAR PICKER) */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#181715] tracking-tight mb-2">
              How was your visit?
            </h1>

            <p className="text-xs text-stone-500 font-medium mb-6">
              Pick what went well to shape your draft review.
            </p>

            {/* WHAT WENT WELL */}
            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase block mb-3">
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
                          ? "bg-[#181715] text-white shadow-sm"
                          : "bg-[#FAF7F2] text-[#181715] border border-[#E7DFD2] hover:bg-[#F3EDE2]"
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
              <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase block mb-3">
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
                          ? "bg-[#181715] text-white shadow-sm"
                          : "bg-[#FAF7F2] text-[#181715] border-[1.5px] border-dashed border-[#D5CCBD] hover:bg-[#F3EDE2]"
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
                          ? "bg-[#181715] text-white shadow-sm"
                          : "bg-[#FAF7F2] text-[#181715] border border-[#E7DFD2]"
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
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Great coffee"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#E36427] bg-white outline-none w-32"
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
                      className="text-xs text-stone-500 px-1"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="text-xs font-medium px-4 py-2 rounded-full border border-[#E7DFD2] bg-[#FAF7F2] text-[#181715] hover:bg-[#F3EDE2] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
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
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#181715] tracking-tight mb-2">
              Writing your review...
            </h1>
            <p className="text-sm text-stone-500 font-medium mb-6">
              Using only the points you picked.
            </p>

            {/* CARD WITH SPARKLE AND PICKED PILLS */}
            <div className="rounded-3xl border border-[#E9DFD2] bg-[#FAF6EE] p-8 flex flex-col items-center justify-center text-center shadow-card min-h-[220px]">
              <div className="mb-4 text-[#E36427] animate-pulse-glow">
                <Sparkles className="w-8 h-8 fill-[#E36427]/20" />
              </div>
              <h3 className="text-sm font-semibold text-stone-700 mb-5">
                Turning your choices into a short review
              </h3>

              {/* Display picked chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-[#181715] text-white text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Language & style indicator */}
            <div className="mt-5 text-xs text-stone-500 font-medium flex items-center gap-1.5">
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
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#181715] tracking-tight mb-1.5">
              Your draft
            </h1>
            <p className="text-sm text-stone-500 font-medium mb-4">
              Edit it freely. It is your review.
            </p>

            {/* EDITABLE DRAFT CONTAINER */}
            <div className="rounded-2xl border border-[#E9DFD2] bg-[#FAF6EE] p-4 relative mb-4">
              <textarea
                value={isTypingAnimation ? displayedText : reviewDraft}
                onChange={(e) => {
                  if (!isTypingAnimation) {
                    setReviewDraft(e.target.value);
                  }
                }}
                rows={4}
                className="w-full bg-transparent text-[#181715] text-sm md:text-base leading-relaxed resize-none outline-none font-normal"
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
                    ? "border-[#181715] bg-[#181715] text-white"
                    : "border-[#E7DFD2] bg-[#FAF6EE] text-[#181715] hover:bg-[#F3EDE2]"
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
                    ? "border-[#181715] bg-[#181715] text-white"
                    : "border-[#E7DFD2] bg-[#FAF6EE] text-[#181715] hover:bg-[#F3EDE2]"
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
                    ? "border-[#181715] bg-[#181715] text-white"
                    : "border-[#E7DFD2] bg-[#FAF6EE] text-[#181715] hover:bg-[#F3EDE2]"
                }`}
              >
                <span>Hinglish</span>
              </button>
            </div>

            {/* BASED ON RECAP (NO STARS) */}
            <p className="text-xs text-stone-500 font-medium line-clamp-1 mb-2">
              Based on: {selectedTags.join(" · ")}
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 4: LAST STEP: POST ON GOOGLE */}
        {/* ========================================================= */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#181715] tracking-tight mb-2">
              Last step: post on Google
            </h1>
            <p className="text-sm text-stone-500 font-medium mb-6">
              We copy your review, then open {shop.name}&apos;s Google page.
            </p>

            {/* 3 NUMBERED STEPS */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-stone-700 font-medium">
                  Tap below. Your review is copied automatically.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-stone-700 font-medium">
                  On Google Maps, tap on Write a Review and paste it.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-stone-700 font-medium">
                  Choose your stars and tap Post.
                </p>
              </div>
            </div>

            {/* HELPFUL NOTE CARD */}
            <div className="rounded-2xl bg-[#F4EADA] border border-[#EBDDC8] p-4 text-xs text-stone-700 leading-relaxed font-normal mb-6">
              Opens directly in Google Maps where you are already signed in.
              Answer optional questions only if you prefer.
            </div>

            {/* COPY CONFIRMATION BADGE */}
            {copied && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-full flex items-center justify-center gap-2 animate-bounce">
                <Check className="w-4 h-4" />
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
                : "bg-stone-300 cursor-not-allowed"
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

        {/* BRANDED FOOTER */}
        <div className="text-center mt-5 text-[11px] text-stone-400 font-medium flex flex-col items-center justify-center gap-2">
          {step === 4 ? (
            <p className="text-stone-500">You post it yourself from your Google account</p>
          ) : (
            <p>Demo shop, sample data</p>
          )}
          <div className="flex items-center justify-center gap-1.5 pt-2 opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-[10px] tracking-wide uppercase text-stone-400 font-semibold">Designed by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sg-logo.png"
              alt="SG"
              className="h-5 w-auto object-contain inline-block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
