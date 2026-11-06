import React from "react";
import { notFound } from "next/navigation";
import CustomerReviewFlow from "@/components/CustomerReviewFlow";
import { getShopBySlug } from "@/lib/supabase";
import { Metadata } from "next";

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Shop Not Found - Reviewzy" };

  return {
    title: `Review ${shop.name} · Fast Google Review in 30s`,
    description: `Leave an authentic review for ${shop.name} in ${shop.location} with just a few taps.`,
  };
}

export default async function ShopReviewPage({ params }: Props) {
  const shop = await getShopBySlug(params.slug);

  if (!shop) {
    notFound();
  }

  return <CustomerReviewFlow shop={shop} />;
}
