import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/supabase/admin";
import { validSignature, verifyPayment } from "@/lib/paystack";
import { recordSuccessfulPayment } from "@/lib/payments";

// Paystack dashboard > Settings > API Keys & Webhooks > Webhook URL:
// https://YOUR-DOMAIN/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  if (!hasDatabase()) return NextResponse.json({ ok: true });

  const event = JSON.parse(raw) as { event: string; data: { reference: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    // Re-check with Paystack rather than trusting the payload alone.
    const tx = await verifyPayment(event.data.reference);
    if (tx.status === "success") await recordSuccessfulPayment(tx);
  }
  return NextResponse.json({ ok: true });
}
