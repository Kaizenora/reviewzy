"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shop, ReviewTone } from "@/types/shop";
import { logReviewGenerated } from "@/lib/supabase";
import { generateVariedReview } from "@/lib/synthesizer";
import confetti from "canvas-confetti";
import {
  Check,
  RotateCcw,
  Copy,
  ExternalLink,
  Plus,
  Star,
  Pencil,
} from "lucide-react";

interface Props {
  shop: Shop;
}

export default function CustomerReviewFlow({ shop }: Props) {
  // Pre-select first 2 tags or fallback tags
  const initialTags =
    shop.whatWentWellTags && shop.whatWentWellTags.length > 0
      ? [shop.whatWentWellTags[0], shop.whatWentWellTags[1]].filter(Boolean)
      : ["Tasty food", "Friendly staff"];

  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Tone state: natural (standard), short (shorter), hinglish (hinglish)
  const [activeTone, setActiveTone] = useState<ReviewTone>("standard");

  // Review draft state (full target text vs displayed animated text)
  const [fullReviewText, setFullReviewText] = useState<string>("");
  const [displayedReviewText, setDisplayedReviewText] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUserEdited, setIsUserEdited] = useState(false);

  // Typing animation interval ref
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Copy success & toast state
  const [copied, setCopied] = useState(false);

  // Smooth typewriter runner
  const startTypewriter = (text: string) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    setIsTyping(true);
    setDisplayedReviewText("");

    let index = 0;
    const len = text.length;

    // Smooth, realistic typewriter animation (1 char at a time at ~28ms)
    typingTimerRef.current = setInterval(() => {
      index += 1;
      if (index >= len) {
        setDisplayedReviewText(text);
        setIsTyping(false);
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      } else {
        setDisplayedReviewText(text.slice(0, index));
      }
    }, 28);
  };

  // Generate initial review on mount or when shop changes
  useEffect(() => {
    const text = generateVariedReview(
      shop.name,
      selectedTags,
      customTags,
      activeTone
    );
    setFullReviewText(text);
    setIsUserEdited(false);
    startTypewriter(text);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.name]);

  // Regenerate draft review with typewriter effect
  const triggerReviewUpdate = (
    tags: string[],
    customs: string[],
    tone: ReviewTone
  ) => {
    const text = generateVariedReview(shop.name, tags, customs, tone);
    setFullReviewText(text);
    setIsUserEdited(false);
    startTypewriter(text);
  };

  // Toggle selection of tags
  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(nextTags);
    triggerReviewUpdate(nextTags, customTags, activeTone);
  };

  // Add custom tag
  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !customTags.includes(trimmed)) {
      const nextCustoms = [...customTags, trimmed];
      const nextSelected = [...selectedTags, trimmed];
      setCustomTags(nextCustoms);
      setSelectedTags(nextSelected);
      setNewTagInput("");
      setIsAddingTag(false);
      triggerReviewUpdate(nextSelected, nextCustoms, activeTone);
    }
  };

  // Switch tone
  const handleToneChange = (tone: ReviewTone) => {
    setActiveTone(tone);
    triggerReviewUpdate(selectedTags, customTags, tone);
  };

  // Re-draft button to roll another variation from the extensive library
  const handleReDraft = () => {
    triggerReviewUpdate(selectedTags, customTags, activeTone);
  };

  // Handle manual typing/editing in the textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // If typing animation was running, stop it and immediately take user's text
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }
    setIsTyping(false);
    setIsUserEdited(true);
    setFullReviewText(e.target.value);
    setDisplayedReviewText(e.target.value);
  };

  // If user clicks into textarea while typing, immediately show full text
  const handleTextareaFocus = () => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setIsTyping(false);
      setDisplayedReviewText(fullReviewText);
    }
  };

  // Copy to clipboard and launch Google Maps
  const handleCopyAndOpenGoogle = async () => {
    const textToCopy = (isTyping ? fullReviewText : displayedReviewText).trim();
    if (!textToCopy) return;

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
      shop.googleReviewUrl &&
      !shop.googleReviewUrl.includes("search.google.com/local/writereview")
        ? shop.googleReviewUrl
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${shop.name} ${shop.location}`
          )}`;

    setTimeout(() => {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }, 700);

    setTimeout(() => {
      setCopied(false);
    }, 4000);
  };

  // Combine default tags with custom tags
  const allPositiveTags = Array.from(
    new Set([...shop.whatWentWellTags, ...customTags])
  );

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-zinc-100 flex flex-col justify-between max-w-md mx-auto relative px-5 py-6 font-sans">
      {/* ========================================================= */}
      {/* HEADER: SHOP NAME + 5 GOLD STARS + SUBTITLE */}
      {/* ========================================================= */}
      <div className="w-full">
        <div className="flex flex-col items-center text-center pt-2 pb-5">
          {shop.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-[#272738] mb-3"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border border-[#272738] mb-3"
              style={{ backgroundColor: shop.brandColor || "#E36427" }}
            >
              {shop.logoLetter || shop.name.charAt(0)}
            </div>
          )}

          <h1 className="text-2xl font-black text-white tracking-tight mb-1">
            {shop.name}
          </h1>

          {/* 5 GOLD STARS */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-5 h-5 fill-[#FBBF24] text-[#FBBF24]"
              />
            ))}
          </div>

          <p className="text-xs text-zinc-400 font-medium">
            Tap highlights to craft your review
          </p>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: WHAT WENT WELL? (TAG CHIPS) */}
        {/* ========================================================= */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              What went well?
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {selectedTags.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {allPositiveTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? "bg-[#E36427] text-white border border-[#FF8A50] shadow-md shadow-[#E36427]/30"
                      : "bg-[#161622] text-zinc-300 border border-[#2B2B3E] hover:border-zinc-600"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{tag}</span>
                </button>
              );
            })}

            {/* ADD CUSTOM TAG BUTTON */}
            {!isAddingTag ? (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#161622] text-zinc-400 border border-dashed border-[#38384E] hover:text-white hover:border-zinc-500 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add my own</span>
              </button>
            ) : (
              <form
                onSubmit={handleAddCustomTag}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="e.g. Super clean"
                  autoFocus
                  className="px-3.5 py-1.5 text-xs bg-[#1A1A28] border border-[#E36427] rounded-full text-white placeholder-zinc-500 outline-none w-32"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#E36427] text-white rounded-full text-xs font-bold shadow-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTagInput("");
                  }}
                  className="px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: REVIEW EDITING BOX (NO AI BADGE + RICH VARIATION + EDITABLE) */}
        {/* ========================================================= */}
        <div className="bg-[#14141C] border border-[#262638] rounded-2xl p-4 shadow-xl mb-6">
          {/* CARD HEADER: EDIT REVIEW LABEL + RE-DRAFT + TONE PILLS */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222232]">
            {/* LEFT: EDIT REVIEW LABEL & RE-DRAFT */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-zinc-200">
                <Pencil className="w-3.5 h-3.5 text-[#E36427]" />
                Edit review
              </span>

              <button
                type="button"
                onClick={handleReDraft}
                title="Change review wording"
                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white bg-[#1C1C28] hover:bg-[#252538] px-2.5 py-1 rounded-lg border border-[#2D2D40] transition-all active:scale-95"
              >
                <RotateCcw className="w-3 h-3 text-[#E36427]" />
                <span>Change</span>
              </button>
            </div>

            {/* RIGHT: TONE SWITCHER PILLS */}
            <div className="flex items-center gap-1 bg-[#1A1A26] p-1 rounded-xl border border-[#28283C]">
              <button
                type="button"
                onClick={() => handleToneChange("standard")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTone === "standard"
                    ? "bg-[#333346] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Natural
              </button>
              <button
                type="button"
                onClick={() => handleToneChange("shorter")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTone === "shorter"
                    ? "bg-[#333346] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Short
              </button>
              <button
                type="button"
                onClick={() => handleToneChange("hinglish")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTone === "hinglish"
                    ? "bg-[#333346] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Hinglish
              </button>
            </div>
          </div>

          {/* EDITABLE TEXTAREA WITH TYPEWRITER ANIMATION */}
          <div className="relative">
            <textarea
              value={displayedReviewText}
              onChange={handleTextareaChange}
              onFocus={handleTextareaFocus}
              rows={4}
              placeholder="Tap highlights above or write your review directly here..."
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 leading-relaxed outline-none resize-none font-medium selection:bg-[#E36427]/40 cursor-text"
            />

            {/* CURSOR BLINK WHILE TYPEWRITING */}
            {isTyping && (
              <span className="inline-block w-1.5 h-4 bg-[#E36427] ml-0.5 animate-pulse align-middle" />
            )}

            {/* HELPER HINT AT BOTTOM OF BOX */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-500">
                Tap anywhere above to edit or add details
              </span>

              {isUserEdited && (
                <span className="text-[10px] text-[#FFA575] font-semibold">
                  Customized
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM ACTIONS: 1-TAP COPY & OPEN GOOGLE + FOOTER */}
      {/* ========================================================= */}
      <div className="w-full pt-2">
        {/* FLOATING TOAST UPON COPY */}
        {copied && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#16A34A] border border-[#86EFAC]/40 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce z-50 whitespace-nowrap">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Review copied! Opening Google Maps...</span>
          </div>
        )}

        {/* PRIMARY CTA: COPY REVIEW & OPEN GOOGLE */}
        <button
          type="button"
          onClick={handleCopyAndOpenGoogle}
          disabled={!displayedReviewText.trim()}
          className="w-full py-4 px-5 rounded-2xl bg-[#E36427] hover:bg-[#D4551A] text-white font-black text-base shadow-xl shadow-[#E36427]/30 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none mb-4 cursor-pointer"
        >
          <Copy className="w-5 h-5" />
          <span>Copy review & open Google</span>
          <ExternalLink className="w-4 h-4 opacity-75 ml-0.5" />
        </button>

        {/* BRANDED FOOTER: DESIGNED BY SG */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sg-logo.png"
            alt="SG Logo"
            className="w-4 h-4 object-contain brightness-110"
          />
          <span className="text-[11px] text-zinc-400 font-semibold tracking-wide">
            Designed by <span className="text-[#D4AF37] font-bold">SG</span>
          </span>
        </div>
      </div>
    </div>
  );
}
