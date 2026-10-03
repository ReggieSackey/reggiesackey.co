import Link from "next/link";

/**
 * Shared site header. Server component, no client JS.
 * No public login affordance — admin sign-in happens by visiting /admin.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-start justify-between px-6 py-5">
        <Link href="/" className="group block">
          <span className="block text-[15px] font-semibold tracking-tight text-neutral-900">
            Reg Sackey-Addo
          </span>
          <span className="mt-0.5 block text-[13px] text-neutral-500">
            Product Engineer
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
            href="/about"
            className="text-[13px] text-neutral-600 hover:text-neutral-900"
          >
            About
          </Link>
          {/* Placeholder until a contact route exists. */}
          <span
            aria-disabled="true"
            className="cursor-default text-[13px] text-neutral-400"
            title="Contact page coming soon"
          >
            Contact
          </span>
        </nav>
      </div>
    </header>
  );
}
