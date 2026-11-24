import "server-only";
import { naira, prettyDate, siteUrl } from "./format";

type Mail = { to: string | string[]; subject: string; html: string; replyTo?: string };

export async function sendEmail({ to, subject, html, replyTo }: Mail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email skipped, RESEND_API_KEY not set] ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Sheyilor Photography <onboarding@resend.dev>",
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F4F2EE;font-family:Helvetica,Arial,sans-serif;color:#151515">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em">Sheyilor</div>
    <h1 style="font-size:28px;font-weight:500;letter-spacing:-0.02em;margin:32px 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:40px;font-size:12px;color:#6B6760">Sheyilor Photography · Lagos · <a href="${siteUrl()}" style="color:#6B6760">${siteUrl().replace(/^https?:\/\//, "")}</a></p>
  </div></body></html>`;
}

function rows(items: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:15px">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #D9D5CE;color:#6B6760">${esc(k)}</td><td style="padding:10px 0;border-top:1px solid #D9D5CE;text-align:right">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

export type BookingForEmail = {
  ref: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  session_name: string;
  package_name: string;
  outfits: number;
  location_kind: string;
  logistics_area: string | null;
  express: boolean;
  shoot_date: string | null;
  shoot_time: string | null;
  total: number;
  deposit: number;
  amount_paid: number;
  answers: { label: string; value: string }[];
  notes: string;
};

function summary(b: BookingForEmail) {
  const where = b.location_kind === "studio" ? "Sheyilor Studio" : `${b.location_kind === "home" ? "Home studio setup" : "Outdoor"}, ${b.logistics_area ?? ""}`;
  return rows([
    ["Booking", b.ref],
    ["Session", `${b.session_name}${b.package_name ? `, ${b.package_name}` : ""}`],
    ["Outfits", String(b.outfits)],
    ["Date", b.shoot_date ? `${prettyDate(b.shoot_date)}${b.shoot_time ? `, ${b.shoot_time}` : ""}` : "To be agreed"],
    ["Where", where],
    ...(b.express ? ([["Express delivery", "Yes"]] as [string, string][]) : []),
    ["Total", naira(b.total)],
    ["Paid", naira(b.amount_paid)],
    ["Balance", naira(Math.max(0, b.total - b.amount_paid))],
  ]);
}

export async function sendBookingConfirmed(b: BookingForEmail, studioEmail: string, latenessFee: number) {
  const first = b.client_name.split(" ")[0];
  await sendEmail({
    to: b.client_email,
    replyTo: studioEmail,
    subject: `Your shoot is booked · ${b.ref}`,
    html: layout(
      `You're booked, ${esc(first)}.`,
      `<p style="font-size:15px;line-height:1.6;color:#4A4741">Thank you. Your deposit is in and your slot is locked. Here are your details.</p>
       ${summary(b)}
       <p style="font-size:15px;line-height:1.6;color:#4A4741;margin-top:24px">Please pay the balance on or before your shoot day, and arrive on time. After 30 minutes, a lateness fee of ${naira(latenessFee)} per hour applies.</p>
       <p style="font-size:15px;line-height:1.6;color:#4A4741">Questions? Just reply to this email.</p>`,
    ),
  });
  await sendEmail({
    to: studioEmail,
    replyTo: b.client_email,
    subject: `New booking: ${b.client_name} · ${b.session_name} · ${b.shoot_date ? prettyDate(b.shoot_date) : "date TBC"}`,
    html: layout(
      `New booking from ${esc(b.client_name)}`,
      `${summary(b)}
       <h2 style="font-size:16px;margin:28px 0 8px">Their answers</h2>
       ${rows([...b.answers.map((a) => [a.label, a.value] as [string, string]), ...(b.notes ? ([["Notes", b.notes]] as [string, string][]) : [])])}
       <p style="font-size:14px;color:#6B6760;margin-top:20px">Phone: ${esc(b.client_phone)} · Email: ${esc(b.client_email)}</p>`,
    ),
  });
}
