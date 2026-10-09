import { candidate } from "@/config/candidate";
import Link from "next/link";

/**
 * Shared site header. Server component, no client JS.
 * No public login affordance — admin sign-in happens by visiting /admin.
 */
export function SiteHeader() {
  return (
    <header className="site-header border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-start justify-between px-6 py-5">
        <Link href="/" className="group block">
          <span className="block text-[15px] font-semibold tracking-tight text-neutral-900">
            {candidate.name}
          </span>
          <span className="mt-0.5 block text-[13px] text-neutral-500">
            {candidate.headline}
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-5 pt-0.5">
          <Link
            href="/work"
            className="text-[13px] text-neutral-600 hover:text-neutral-900"
          >
            Work
          </Link>
          <Link
            href="/how-i-work"
            className="text-[13px] text-neutral-600 hover:text-neutral-900"
          >
            How I work
          </Link>
          <Link
            href="/about"
            className="text-[13px] text-neutral-600 hover:text-neutral-900"
          >
            About
          </Link>
          {candidate.contactEmail ? (
            <a
              href={`mailto:${candidate.contactEmail}`}
              className="text-[13px] text-neutral-600 hover:text-neutral-900"
            >
              Contact
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
