import { withAuth } from "@workos-inc/authkit-nextjs";
import Link from "next/link";

/**
 * Admin shell. Server-side session check on every admin page render —
 * this runs in addition to src/proxy.ts, which bounces anonymous
 * visitors to AuthKit. Convex admin functions verify identity again
 * (convex/adminAuth.ts).
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // withAuth() reads the session the proxy refreshed and forwarded.
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <span className="block text-[15px] font-semibold tracking-tight text-neutral-900">
              Admin
            </span>
            <span className="mt-0.5 block text-[13px] text-neutral-500">
              {user.email}
            </span>
          </div>
          <nav aria-label="Admin" className="flex items-center gap-5 pt-0.5">
            <Link
              href="/admin/capabilities"
              className="text-[13px] text-neutral-600 hover:text-neutral-900"
            >
              Capabilities
            </Link>
            <Link
              href="/admin/work"
              className="text-[13px] text-neutral-600 hover:text-neutral-900"
            >
              Work
            </Link>
            <Link
              href="/admin/applications"
              className="text-[13px] text-neutral-600 hover:text-neutral-900"
            >
              Applications
            </Link>
            <Link
              href="/admin/profile"
              className="text-[13px] text-neutral-600 hover:text-neutral-900"
            >
              Profile
            </Link>
            <Link
              href="/"
              className="text-[13px] text-neutral-600 hover:text-neutral-900"
            >
              View site
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        {children}
      </main>
    </div>
  );
}
