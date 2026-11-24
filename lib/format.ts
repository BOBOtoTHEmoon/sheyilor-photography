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

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
