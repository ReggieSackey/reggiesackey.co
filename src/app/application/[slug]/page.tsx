import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Application",
};

export default async function ApplicationPage({
  params,
}: PageProps<"/application/[slug]">) {
  const { slug } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Application {slug}
        </h1>
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="max-w-xl text-sm leading-6 text-neutral-600">
            Published application page. Once applications are managed in
            admin, a reviewed and published application will render here.
          </p>
        </div>
      </main>
    </div>
  );
}
