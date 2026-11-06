"use client";

import React, { useState, useEffect } from "react";
import { Shop, ReviewStep, ReviewTone } from "@/types/shop";
import {
  Star,
  Sparkles,
  RotateCcw,
  Check,
  Copy,
  ExternalLink,
  Plus,
  ArrowLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import { logReviewGenerated } from "@/lib/supabase";

interface Props {
  shop: Shop;
  onBackToHome?: () => void;
}

export default function CustomerReviewFlow({ shop, onBackToHome }: Props) {
  const [step, setStep] = useState<ReviewStep>(1);
  const [rating, setRating] = useState<number>(4);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Tasty food",
    "Friendly staff",
    "Nice ambience",
  ]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const [reviewDraft, setReviewDraft] = useState<string>(
    "The food was tasty, the staff were friendly and the ambience was nice."
  );
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTone, setActiveTone] = useState<ReviewTone>("standard");
  const [copied, setCopied] = useState(false);

  // Synchronize initial tags if shop has specific tags
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

  // Generate review via API with typing animation
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
          rating,
          selectedTags,
          customTags,
          tone: toneToUse,
        }),
      });

      const data = await res.json();
      const newReview =
        data.review ||
        "The food was tasty, the staff were friendly and the ambience was nice.";

      setReviewDraft(newReview);

      // Log generation for analytics if configured
      logReviewGenerated({
        shopSlug: shop.slug,
        rating,
        tags: selectedTags,
        reviewText: newReview,
        tone: toneToUse,
      });

      return newReview;
    } catch {
      const fallback = `Great experience at ${shop.name}! ${selectedTags.join(
        ", "
      )} made our visit memorable.`;
      setReviewDraft(fallback);
      return fallback;
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger typing animation when entering Step 3 or rewriting
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
    }, 20);
  };

  // Transition from Step 1 -> Step 2 -> Step 3
  const handleProceedToGenerate = async () => {
    setStep(2);
    // Simulate generation time of Step 2 screen (matches screenshot 3)
    const reviewResult = await generateReviewDraft("standard");
    setTimeout(() => {
      setStep(3);
      startTypingAnimation(reviewResult);
    }, 1800);
  };

  // Tone rewrite buttons in Step 3
  const handleToneChange = async (tone: ReviewTone) => {
    setIsTypingAnimation(true);
    setDisplayedText("");
    const newText = await generateReviewDraft(tone);
    startTypingAnimation(newText);
  };

  // Step 4 copy & redirect
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

    // Open Google Review URL after short delay
    setTimeout(() => {
      if (shop.googleReviewUrl) {
        window.open(shop.googleReviewUrl, "_blank", "noopener,noreferrer");
      }
    }, 800);
  };

  const totalPicked = selectedTags.length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between max-w-md mx-auto relative px-5 py-6 select-none font-sans">
      {/* TOP HEADER: Step Indicator & Back Button */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold tracking-wider">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="hover:text-stone-800 transition-colors p-1 -ml-1 rounded-full"
                title="Back to all shops"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <span>Scan · Review</span>
          </div>

          {/* 4-BAR STEP PROGRESS INDICATOR */}
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
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
            style={{ backgroundColor: shop.brandColor || "#E36427" }}
          >
            {shop.logoLetter || shop.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#181715] leading-tight">
              {shop.name}
            </h2>
            <p className="text-xs text-stone-500 font-medium">{shop.location}</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCREEN 1: HOW WAS YOUR VISIT? */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#181715] tracking-tight mb-3">
              How was your visit?
            </h1>

            {/* STAR RATING PICKER */}
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="transition-transform active:scale-95 focus:outline-none"
                  aria-label={`${s} stars`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= rating
                        ? "fill-[#E36427] text-[#E36427]"
                        : "fill-[#E8DFD1] text-[#E8DFD1]"
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs text-stone-500 font-medium mb-6">
              Stars help shape your draft. You will choose your Google rating
              again when posting.
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
              Using only your rating and what you picked.
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

            {/* Stars & language indicator */}
            <div className="mt-5 text-xs text-stone-500 font-medium flex items-center gap-1.5">
              <span className="text-[#E36427]">
                {"★".repeat(rating)}
                {"☆".repeat(5 - rating)}
              </span>
              <span>· English</span>
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

            {/* BASED ON RECAP */}
            <p className="text-xs text-stone-500 font-medium line-clamp-1 mb-2">
              Based on: {"★".repeat(rating)}
              {"☆".repeat(5 - rating)} · {selectedTags.join(" · ")}
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
              We copy your review, then open {shop.name}&apos;s Google review
              page.
            </p>

            {/* 3 NUMBERED STEPS */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-stone-700 font-medium">
                  Tap below. Your review is copied.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-stone-700 font-medium">
                  On Google, paste it into the review box.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#E36427] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-stone-700 font-medium">
                  Choose your stars there and tap Post.
                </p>
              </div>
            </div>

            {/* HELPFUL NOTE CARD */}
            <div className="rounded-2xl bg-[#F4EADA] border border-[#EBDDC8] p-4 text-xs text-stone-700 leading-relaxed font-normal mb-6">
              Google may ask extra questions about the place. Answer based on
              your experience; leave optional questions blank if you prefer.
            </div>

            {/* COPY CONFIRMATION BADGE */}
            {copied && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-full flex items-center justify-center gap-2 animate-bounce">
                <Check className="w-4 h-4" />
                <span>Copied to clipboard! Opening Google...</span>
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

        {/* FOOTER */}
        <div className="text-center mt-3 text-[11px] text-stone-400 font-medium">
          {step === 4 ? (
            <div>
              <p>You post it yourself from your Google account</p>
              <p className="mt-0.5">Demo shop, sample data</p>
            </div>
          ) : (
            <p>Demo shop, sample data</p>
          )}
        </div>
      </div>
    </div>
  );
}
