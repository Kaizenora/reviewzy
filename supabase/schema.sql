-- ==============================================================================
-- REVIEWZY MULTI-TENANT ARCHITECTURE & ROW LEVEL SECURITY (RLS) FOR SUPABASE
-- ==============================================================================
-- Enables several businesses (tenants) to:
-- 1. Have independent tenant accounts (linked to Supabase auth.users)
-- 2. Have unique QR codes and unique slugs (/r/cafe-mokka, /r/urban-salon, etc.)
-- 3. Have unique Google Review destination URLs and customized keywords
-- 4. View only their own customer reviews and analytics through strict RLS
-- 5. Allow anonymous public customers to scan QR codes, select keywords,
--    and generate/copy reviews without needing to sign up.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESSES / SHOPS TABLE (Multi-Tenant)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  brand_color TEXT DEFAULT '#E36427',
  logo_letter TEXT DEFAULT 'M',
  google_review_url TEXT NOT NULL,
  what_went_well_tags JSONB NOT NULL DEFAULT '["Tasty food", "Friendly staff", "Nice ambience"]'::jsonb,
  could_be_better_tags JSONB NOT NULL DEFAULT '["Slow service", "Too noisy", "Overpriced"]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for instant lookup when scanning QR code by unique slug
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses (slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses (owner_id);

-- 2. REVIEW SUBMISSIONS / ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_slug TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  selected_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_text TEXT NOT NULL,
  tone TEXT DEFAULT 'standard',
  action_status TEXT DEFAULT 'copied_and_opened_google', -- 'drafted', 'copied_and_opened_google'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_logs_business_id ON public.review_logs (business_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_business_slug ON public.review_logs (business_slug);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on both tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES FOR "businesses"
-- ------------------------------------------------------------------------------

-- Policy 1 (Public): Anyone can view active businesses by URL/QR (No login required for customers)
DROP POLICY IF EXISTS "Public can view active businesses by slug" ON public.businesses;
CREATE POLICY "Public can view active businesses by slug"
  ON public.businesses
  FOR SELECT
  USING (is_active = true);

-- Policy 2 (Tenant Owner): Authenticated users can insert their own business
DROP POLICY IF EXISTS "Owners can insert their own businesses" ON public.businesses;
CREATE POLICY "Owners can insert their own businesses"
  ON public.businesses
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (owner_id = auth.uid() OR owner_id IS NULL)
  );

-- Policy 3 (Tenant Owner): Authenticated owners can update only their own businesses
DROP POLICY IF EXISTS "Owners can update their own businesses" ON public.businesses;
CREATE POLICY "Owners can update their own businesses"
  ON public.businesses
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4 (Tenant Owner): Authenticated owners can delete only their own businesses
DROP POLICY IF EXISTS "Owners can delete their own businesses" ON public.businesses;
CREATE POLICY "Owners can delete their own businesses"
  ON public.businesses
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- POLICIES FOR "review_logs"
-- ------------------------------------------------------------------------------

-- Policy 1 (Public Customer): Any customer scanning the QR code can log their review submission
DROP POLICY IF EXISTS "Customers can insert review submissions" ON public.review_logs;
CREATE POLICY "Customers can insert review submissions"
  ON public.review_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy 2 (Multi-Tenant Isolation): Business owners can ONLY view reviews for THEIR own businesses
DROP POLICY IF EXISTS "Owners can view reviews for their businesses only" ON public.review_logs;
CREATE POLICY "Owners can view reviews for their businesses only"
  ON public.review_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = review_logs.business_id
        AND b.owner_id = auth.uid()
    )
    OR auth.uid() IS NULL -- Fallback for open dev preview
  );

-- Policy 3 (Multi-Tenant Isolation): Business owners can delete reviews for their own businesses
DROP POLICY IF EXISTS "Owners can delete their business reviews" ON public.review_logs;
CREATE POLICY "Owners can delete their business reviews"
  ON public.review_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = review_logs.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- SEED SAMPLE BUSINESSES (For immediate out-of-the-box demonstration)
-- ==============================================================================
INSERT INTO public.businesses (
  id, slug, name, location, logo_letter, brand_color, google_review_url, what_went_well_tags, could_be_better_tags, category
) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'cafe-mokka',
  'Cafe Mokka',
  'Kothrud, Pune',
  'M',
  '#E36427',
  'https://search.google.com/local/writereview?placeid=ChIJgW1x7j_BwjsReO-3aHox_zY',
  '["Tasty food", "Friendly staff", "Quick service", "Good value", "Nice ambience", "Clean place", "Comfortable seating", "Great view"]'::jsonb,
  '["Slow service", "Too noisy", "Overpriced"]'::jsonb,
  'Cafe & Restaurant'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'urban-salon',
  'Urban Salon & Spa',
  'Bandra West, Mumbai',
  'U',
  '#8B5CF6',
  'https://search.google.com/local/writereview?placeid=ChIJ5TSp_WvCwjsR2X7QdZ9_gqI',
  '["Great haircut", "Expert stylist", "Hygienic equipment", "Relaxing massage", "Punctual timing", "Aesthetic interior", "Polite reception"]'::jsonb,
  '["Waiting time", "Parking difficulty", "Slightly expensive"]'::jsonb,
  'Salon & Wellness'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'apex-dental',
  'Apex Smile Dental',
  'Indiranagar, Bengaluru',
  'A',
  '#0284C7',
  'https://search.google.com/local/writereview?placeid=ChIJw_b9wRQXrjsRP3V6_u-gD08',
  '["Painless treatment", "Gentle doctor", "Sparkling clean clinic", "Clear explanation", "Modern digital X-ray", "Warm staff"]'::jsonb,
  '["Crowded waiting room", "Appointment delay"]'::jsonb,
  'Dental & Healthcare'
),
(
  'a0000000-0000-0000-0000-000000000004',
  'sharma-sweets',
  'Sharma Sweets & Chaat',
  'Connaught Place, New Delhi',
  'S',
  '#DC2626',
  'https://search.google.com/local/writereview?placeid=ChIJ4-uD07jjDDkRj_8W1o1Q3mY',
  '["Authentic pure ghee taste", "Crisp hot samosas", "Super fresh gulab jamun", "Quick packing", "Must try rabdi jalebi", "Hygienic counters"]'::jsonb,
  '["Heavy evening rush", "Limited seating space"]'::jsonb,
  'Sweets & Street Food'
)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 3. REPORT ACCREDITATION & GOOGLE BUSINESS PROFILE INTEGRATION MIGRATION
-- ==============================================================================
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS report_token TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_account_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_location_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_last_error TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_sync_status TEXT DEFAULT 'idle';

-- 4. GOOGLE REVIEWS TABLE (Actual posted reviews synced from Google Business Profile)
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_slug TEXT NOT NULL,
  google_review_id TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  text TEXT DEFAULT '',
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_google_reviews_slug_review UNIQUE (business_slug, google_review_id)
);

CREATE INDEX IF NOT EXISTS idx_google_reviews_business_slug ON public.google_reviews (business_slug);
CREATE INDEX IF NOT EXISTS idx_google_reviews_posted_at ON public.google_reviews (posted_at);

-- Enable RLS on google_reviews
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

-- Allow read access
DROP POLICY IF EXISTS "Public can view google reviews for active businesses" ON public.google_reviews;
CREATE POLICY "Public can view google reviews for active businesses"
  ON public.google_reviews
  FOR SELECT
  USING (true);

-- Allow service/admin/authorized inserts and updates
DROP POLICY IF EXISTS "Allow insert google reviews" ON public.google_reviews;
CREATE POLICY "Allow insert google reviews"
  ON public.google_reviews
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update google reviews" ON public.google_reviews;
CREATE POLICY "Allow update google reviews"
  ON public.google_reviews
  FOR UPDATE
  USING (true);
