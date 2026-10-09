import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PortfolioHome } from "@/components/PortfolioHome";

type Params = { type: string };

async function getProfileDocument(type: string) {
  return await fetchQuery(api.profileDocuments.getProfileDocumentWithSections, {
    type,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type } = await params;
  const data = await getProfileDocument(type);
  if (!data) {
    return { title: "Profile" };
  }
  return { title: data.document.title };
}

export default async function ProfileDocumentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type } = await params;
  if (type === "how-i-work") redirect("/how-i-work");
  const data = await getProfileDocument(type);
  if (!data) {
    notFound();
  }

  return type === "how-i-work" ? <PortfolioHome initialView="howIWork" /> : <PortfolioHome />;
}
