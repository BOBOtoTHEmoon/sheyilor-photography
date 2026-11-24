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
      <header className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3 md:px-8 md:py-5">
        <Link className="u justify-self-start text-[15px] font-medium" href="/">
          Back
        </Link>
        <Logo />
        <span />
      </header>
      <div className="mx-auto max-w-[1400px] px-5 pb-0 pt-6 md:px-8 md:pb-28 md:pt-12">
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
