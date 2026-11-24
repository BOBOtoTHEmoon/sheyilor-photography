import Link from "next/link";
import type { Metadata } from "next";
import { getAvailability, getSiteData } from "@/lib/data";
import { BookingForm } from "@/components/BookingForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Book a date",
  description: "Choose your session, pick a date and pay your deposit online to lock in your shoot with Sheyilor Photography.",
};

export const dynamic = "force-dynamic";

export default async function BookPage(props: PageProps<"/book">) {
  const { type, package: pkg } = await props.searchParams;
  const [site, availability] = await Promise.all([getSiteData(), getAvailability()]);
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Logo />
        <Link className="u text-sm" href="/">
          ← Back to site
        </Link>
      </header>
      <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-12 md:px-8 md:pt-14">
        <h1 className="m-0 text-[clamp(44px,6vw,88px)] font-medium leading-none tracking-[-0.045em]">Book a date</h1>
        <BookingForm
          site={site}
          availability={availability}
          initialType={typeof type === "string" ? type : undefined}
          initialPackage={typeof pkg === "string" ? pkg : undefined}
        />
      </div>
    </main>
  );
}
