import type { Metadata } from "next";
import { PortfolioHome } from "@/components/PortfolioHome";
import { howIWorkFallback } from "@/lib/howIWorkFallback";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected product engineering, AI product, marketplace, and software-integration work by Reggie Sackey-Addo.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work — Reggie Sackey-Addo",
    description:
      "Selected product engineering, AI product, marketplace, and software-integration work by Reggie Sackey-Addo.",
    url: "/work",
  },
};

// Content is canonical in Convex; reflect publish state immediately
// rather than baking the list at build time.
export const dynamic = "force-dynamic";

export default function WorkIndexPage() {
  return <PortfolioHome initialView="caseStudies" initialProfile={howIWorkFallback} />;
}
