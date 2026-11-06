# 🌟 Reviewzy

> **AI-Powered 30-Second Google Reviews with Custom QR Codes & Multi-Tenant RLS Architecture**

Reviewzy helps local businesses, cafes, salons, clinics, and restaurants collect authentic 5-star Google reviews effortlessly. Customers scan a table QR code, pick interactive keywords about their visit, and AI generates an authentic, natural review in seconds with live typing animation, tone customization (Standard, Shorter, Hinglish), one-click clipboard copy, and direct Google Review redirection.

---

## 📸 Screenshots & Flow

| 1. Scan & Tap Keywords | 2. AI Review Drafting | 3. Edit & Refine Draft | 4. One-Click Google Post |
|:---:|:---:|:---:|:---:|
| Select stars & custom tags | Real-time sparkle & choices | Type, rewrite, or Hinglish | Copy text & open Google |

---

## ✨ Features

- **Exact UI Reproduction**: Pixel-matched warm cream aesthetic (`#FAF7F2`), terracotta orange accents (`#E36427`), charcoal pills, and step indicators.
- **Multi-Tenant RLS System**:
  - Independent tenant profiles for each business.
  - Unique QR codes and unique URLs for every shop (`/r/[shop-slug]`).
  - Distinct keywords for each business type (e.g. Cafe food/ambience vs Salon styling/hygiene vs Dental care).
  - Custom Google Review links and branding per business.
  - Strict Row Level Security (RLS) in Supabase ensures businesses can only view and manage their own reviews & analytics.
- **AI Review Generation**:
  - Uses OpenAI (`gpt-4o-mini`) to generate authentic, non-robotic customer reviews.
  - **Zero-Failure Fallback Engine**: If no API key is provided or quota runs out, a smart local generative synthesizer crafts natural reviews with zero downtime.
  - **Tone Customization**: `↺ Rewrite`, `Shorter` (punchy), and `Hinglish` (desi urban blend).
- **QR Code Stand & Table Cards**:
  - Built-in printable table tents & counter cards (`/r/[slug]/qr`) with high-contrast SVG QR codes.
- **Admin / Merchant Dashboard**:
  - Route `/dashboard` (or `/admin`) to add new shops, edit logos, customize keywords, manage redirection links, and view live previews.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **Icons & Animations**: Lucide React + Canvas Confetti
- **QR Code Generation**: `qrcode.react` (SVG)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **AI**: OpenAI API with intelligent rule-based synthesizer fallback

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your credentials (all optional for local preview — works out of the box with built-in presets):
```env
# Supabase (for multi-tenant database & RLS)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (for AI review generation)
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Multi-Tenant Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
4. Copy your **Project URL** and **Anon Key** from `Project Settings -> API` into `.env.local`.

---

## 🔗 Key Routes

- `/`: Interactive Customer Flow Demo (with Cafe Mokka, Urban Salon, Apex Dental, and Sharma Sweets presets).
- `/r/cafe-mokka`: Standalone customer scan & review page for Cafe Mokka.
- `/r/[slug]/qr`: Print-ready QR table card and counter stand.
- `/dashboard`: Merchant management dashboard to add/edit businesses, upload logos, and customize keywords.

---

## 📦 Pushing to your GitHub Repository

To push this codebase to [github.com/Kaizenora/reviewzy](https://github.com/Kaizenora/reviewzy):

```bash
git add .
git commit -m "feat: complete Reviewzy multi-tenant QR review system with AI drafting and Supabase RLS"
git push -u origin main
```
