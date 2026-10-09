import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PortfolioHome } from "@/components/PortfolioHome";
import { howIWorkFallback } from "@/lib/howIWorkFallback";

type Params = { slug: string };

async function getCaseStudy(slug: string) {
  return await fetchQuery(api.caseStudies.getCaseStudyWithSections, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCaseStudy(slug);
  if (!data) {
    return { title: "Case study" };
  }
  return { title: data.caseStudy.title, description: data.caseStudy.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getCaseStudy(slug);
  if (!data) {
    notFound();
  }

  return <PortfolioHome initialView="caseStudyDetail" initialSlug={slug} initialProfile={howIWorkFallback} />;
}
