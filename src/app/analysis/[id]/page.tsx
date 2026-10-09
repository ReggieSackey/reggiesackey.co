import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioHome } from "@/components/PortfolioHome";

export const metadata: Metadata = { title: "Fit analysis" };
export const dynamic = "force-dynamic";

export default async function AnalysisPage({ params }: PageProps<"/analysis/[id]">) {
  const { id } = await params;
  if (!/^[a-z0-9]{22,32}$/i.test(id)) notFound();
  return <PortfolioHome initialView="analysis" initialAnalysisId={id} />;
}
