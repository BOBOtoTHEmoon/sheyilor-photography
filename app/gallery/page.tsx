import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = { title: "Client gallery", robots: { index: false } };

// Phase 2 replaces this with the full private gallery (password, favourites, downloads).
export default async function GalleryLanding() {
  const { settings } = await getSiteData();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Logo />
      <div className="rise mt-16 w-full max-w-[440px]">
        <h1 className="m-0 text-5xl font-medium leading-none tracking-[-0.04em]">Your gallery</h1>
        <p className="mt-5 text-ink-2">
          After your shoot, we email you a private link and password. Open that link to view, pick and download your photos.
        </p>
        <a className="btn mt-8 w-full" href={whatsappLink(settings.whatsapp, "Hello, I can't find my gallery link.")}>
          Can&apos;t find your link? Message us
        </a>
      </div>
    </main>
  );
}
