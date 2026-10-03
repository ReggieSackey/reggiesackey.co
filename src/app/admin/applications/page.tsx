import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Applications",
};

export default function AdminApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Applications
      </h1>
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="max-w-xl text-sm leading-6 text-neutral-600">
          Application management. Track applications and their published
          status here.
        </p>
      </div>
    </div>
  );
}
