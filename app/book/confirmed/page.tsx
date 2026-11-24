import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";
import { db, hasDatabase } from "@/lib/supabase/admin";
import { hasPaystack, verifyPayment } from "@/lib/paystack";
import { recordSuccessfulPayment } from "@/lib/payments";
import { naira, prettyDate, whatsappLink } from "@/lib/format";
import { getSiteData } from "@/lib/data";

export const metadata: Metadata = { title: "Booking confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

// Paystack sends the client back here with ?reference=...
export default async function ConfirmedPage(props: PageProps<"/book/confirmed">) {
  const { reference, trxref } = await props.searchParams;
  const ref = String(reference ?? trxref ?? "");
  const site = await getSiteData();

  let state: "paid" | "pending" | "failed" = "failed";
  let booking: Record<string, any> | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (ref && hasDatabase() && hasPaystack()) {
    try {
      const tx = await verifyPayment(ref);
      if (tx.status === "success") {
        await recordSuccessfulPayment(tx);
        state = "paid";
      } else {
        state = tx.status === "abandoned" || tx.status === "failed" ? "failed" : "pending";
      }
      const { data: payment } = await db().from("payments").select("booking_id").eq("reference", ref).maybeSingle();
      if (payment?.booking_id) {
        const { data } = await db().from("bookings").select("*, session_types(name)").eq("id", payment.booking_id).single();
        booking = data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="mx-auto max-w-[760px] px-5 py-16 md:py-24">
      <Logo />

      {state === "paid" && booking ? (
        <div className="rise mt-16">
          <h1 className="m-0 text-[clamp(44px,7vw,80px)] font-medium leading-none tracking-[-0.045em]">
            You&apos;re booked, {String(booking.client_name).split(" ")[0]}.
          </h1>
          <p className="mt-5 text-lg text-ink-2">Your deposit is in and your slot is locked. We&apos;ve emailed the details to {booking.client_email}.</p>
          <div className="mt-10 border-t border-line">
            {[
              ["Booking", booking.ref],
              ["Session", `${booking.session_types?.name ?? ""}, ${booking.package_name}`],
              ["Date", `${prettyDate(booking.shoot_date)}${booking.shoot_time ? `, ${booking.shoot_time}` : ""}`],
              ["Paid today", naira(booking.amount_paid)],
              ["Balance before your shoot", naira(Math.max(0, booking.total - booking.amount_paid))],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line py-3.5 text-[15px]">
                <span className="text-muted">{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link className="btn" href="/">
              Back to the site
            </Link>
            <a className="btn btn-ghost" href={whatsappLink(site.settings.whatsapp, `Hello, I just booked (${booking.ref}).`)}>
              Message us on WhatsApp
            </a>
          </div>
        </div>
      ) : state === "pending" ? (
        <div className="mt-16">
          <h1 className="m-0 text-5xl font-medium tracking-[-0.04em]">We&apos;re confirming your payment</h1>
          <p className="mt-5 text-lg text-ink-2">This usually takes a few seconds. Refresh this page, or check your email for the confirmation.</p>
        </div>
      ) : (
        <div className="mt-16">
          <h1 className="m-0 text-5xl font-medium tracking-[-0.04em]">Payment not completed</h1>
          <p className="mt-5 text-lg text-ink-2">Your booking isn&apos;t confirmed yet. You can try again, or message us and we&apos;ll help.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn" href="/book">
              Try again
            </Link>
            <a className="btn btn-ghost" href={whatsappLink(site.settings.whatsapp, site.settings.whatsapp_message)}>
              WhatsApp us
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
