import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { JobInput } from "@/components/JobInput";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:pt-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            What are you hiring for?
          </h1>

          <p className="mt-4 text-base leading-7 text-neutral-600">
            Paste a job description or upload the requirements. I&rsquo;ll show
            you where I fit, where I don&rsquo;t, and the work that supports
            it.
          </p>
        </div>

        <div className="mt-10">
          <JobInput />
        </div>

        <p className="mt-10 text-sm text-neutral-500">
          Not hiring right now?{" "}
          <Link
            href="/work"
            className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            View my work →
          </Link>
        </p>
      </main>
    </div>
  );
}
