import "server-only";
import crypto from "node:crypto";

const API = "https://api.paystack.co";

function key() {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return k;
}

export function hasPaystack() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

type InitArgs = {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export async function initializePayment({ email, amountNaira, reference, callbackUrl, metadata }: InitArgs) {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      amount: Math.round(amountNaira * 100), // Paystack takes kobo
      reference,
      currency: "NGN",
      callback_url: callbackUrl,
      metadata,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Could not start payment");
  return json.data as { authorization_url: string; access_code: string; reference: string };
}

export type VerifiedTransaction = {
  status: string; // "success" when paid
  reference: string;
  amount: number; // kobo
  paid_at: string | null;
  customer: { email: string };
};

export async function verifyPayment(reference: string): Promise<VerifiedTransaction> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key()}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Could not verify payment");
  return json.data;
}

// Paystack signs every webhook with HMAC SHA512 of the raw body.
export function validSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", key()).update(rawBody).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
