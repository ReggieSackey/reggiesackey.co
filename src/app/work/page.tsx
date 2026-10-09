import type { Metadata } from "next";
import { PortfolioHome } from "@/components/PortfolioHome";
import { howIWorkFallback } from "@/lib/howIWorkFallback";

export const metadata: Metadata = {
  title: "Work",
};

// Content is canonical in Convex; reflect publish state immediately
// rather than baking the list at build time.
export const dynamic = "force-dynamic";

export default function WorkIndexPage() {
  return <PortfolioHome initialView="caseStudies" initialProfile={howIWorkFallback} />;
}
