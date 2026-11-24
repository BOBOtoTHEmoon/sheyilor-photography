export function naira(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "₦ [price]";
  return "₦" + Math.round(amount).toLocaleString("en-NG");
}

export function whatsappLink(number: string, message?: string) {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function prettyDate(day: string | null | undefined) {
  if (!day) return "";
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Public address of the site. On Vercel it falls back to the project's own domain,
// so link previews and Paystack return links work before a custom domain is set.
export function siteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}
