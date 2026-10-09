import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PortfolioHome } from "@/components/PortfolioHome";
import { howIWorkFallback } from "@/lib/howIWorkFallback";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchQuery(api.profileDocuments.getProfileDocumentWithSections, {
    type: "how-i-work",
  });
  return { title: data?.document.title ?? howIWorkFallback?.document.title ?? "How I Work" };
}

export default async function HowIWorkPage() {
  const data = await fetchQuery(api.profileDocuments.getProfileDocumentWithSections, {
    type: "how-i-work",
  });
  if (!data && !howIWorkFallback) notFound();
  return <PortfolioHome initialView="howIWork" initialProfile={data ?? howIWorkFallback} />;
}
