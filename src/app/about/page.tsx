import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          About
        </h1>
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="max-w-xl text-sm leading-6 text-neutral-600">
            About page. Profile documents — experience, skills, and
            background — will render here.
          </p>
        </div>
      </main>
    </div>
  );
}
