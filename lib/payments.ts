import "server-only";
import { db } from "./supabase/admin";
import { sendBookingConfirmed } from "./email";
import type { VerifiedTransaction } from "./paystack";

// Records a successful Paystack payment exactly once, whether it arrives
// through the webhook or the page the client returns to.
export async function recordSuccessfulPayment(tx: VerifiedTransaction) {
  const s = db();
  const { data: payment } = await s.from("payments").select("*").eq("reference", tx.reference).maybeSingle();
  if (!payment) return { ok: false as const, reason: "unknown reference" };
  if (payment.status === "success") return { ok: true as const, already: true, payment };

  const paidNaira = Math.round(tx.amount / 100);
  if (paidNaira < payment.amount) return { ok: false as const, reason: "amount paid is less than expected" };

  // Only the first caller flips pending -> success, so emails go out once.
  const { data: updated } = await s
    .from("payments")
    .update({ status: "success", paid_at: tx.paid_at ?? new Date().toISOString(), raw: tx as unknown as Record<string, unknown> })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select()
    .maybeSingle();
  if (!updated) return { ok: true as const, already: true, payment };

  if (payment.booking_id && (payment.kind === "deposit" || payment.kind === "balance")) {
    const { data: booking } = await s
      .from("bookings")
      .select("*, session_types(name)")
      .eq("id", payment.booking_id)
      .single();
    if (booking) {
      const amountPaid = (booking.amount_paid ?? 0) + payment.amount;
      await s
        .from("bookings")
        .update({ amount_paid: amountPaid, status: booking.status === "pending_payment" ? "confirmed" : booking.status })
        .eq("id", booking.id);

      if (payment.kind === "deposit") {
        const { data: settings } = await s.from("settings").select("email, lateness_fee").eq("id", 1).maybeSingle();
        await sendBookingConfirmed(
          { ...booking, amount_paid: amountPaid, session_name: booking.session_types?.name ?? "Session" },
          process.env.STUDIO_EMAIL || settings?.email || "sheyilorphotography@gmail.com",
          settings?.lateness_fee ?? 10000,
        );
      }
    }
  }
  return { ok: true as const, already: false, payment: updated };
}
