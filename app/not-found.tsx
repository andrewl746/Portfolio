import type { Metadata } from "next";
import Link from "next/link";
import Starfield from "@/components/Starfield";

export const metadata: Metadata = { title: "Page not found · Andrew Li" };

// Shown for any address the site doesn't have. It renders inside the root
// layout, so it gets the same fonts and night sky. Next marks it noindex and
// returns a 404 status on its own.
export default function NotFound() {
  return (
    <>
      <Starfield />
      <main className="relative flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-brass">404</p>
        <h1 className="mt-5 font-serif text-5xl text-primary sm:text-6xl">
          Signal lost
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-body">
          There&apos;s nothing at this address. The link may have a typo, or
          the page has moved.
        </p>
        <Link
          href="/"
          className="mt-10 border border-ember bg-ember/10 px-6 py-3 text-sm text-[#f2a3ae] shadow-[0_0_14px_rgba(224,69,95,0.25)] transition-shadow hover:shadow-[0_0_22px_rgba(224,69,95,0.4)]"
        >
          Back to the homepage
        </Link>
      </main>
    </>
  );
}
