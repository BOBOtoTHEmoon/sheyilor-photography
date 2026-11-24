import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db, hasDatabase } from "@/lib/supabase/admin";
import { getAvailability, getSiteData } from "@/lib/data";
import { hasPaystack, initializePayment } from "@/lib/paystack";
import { quote } from "@/lib/pricing";
import { siteUrl } from "@/lib/format";

type Body = {
  sessionTypeId: string;
  packageId: string;
  outfits: number;
  locationKind: "studio" | "outdoor" | "home";
  logisticsFeeId: string | null;
  express: boolean;
  day: string | null;
  time: string | null;
  answers: Record<string, string>;
  notes?: string;
};

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

function makeRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "SHY-";
  for (const b of crypto.randomBytes(6)) out += alphabet[b % alphabet.length];
  return out;
}

export async function POST(req: Request) {
  if (!hasDatabase() || !hasPaystack()) {
    return fail("Online booking isn't switched on yet. Please message us on WhatsApp to book.", 503);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request");
  }

  const site = await getSiteData();
  const type = site.sessionTypes.find((t) => t.id === body.sessionTypeId);
  if (!type) return fail("Please choose a session.");
  const pkg = site.packages.find((p) => p.id === body.packageId && p.session_type_id === type.id);
  if (!pkg || pkg.price === null) return fail("Please choose a package.");

  // Location and logistics (only for session types that allow it)
  let locationKind: Body["locationKind"] = "studio";
  let logistics = null;
  if (type.has_logistics && body.locationKind !== "studio") {
    logistics =
      site.logistics.find(
        (l) => l.id === body.logisticsFeeId && l.kind === body.locationKind && (l.session_type_id === type.id || l.session_type_id === null),
      ) ?? null;
    if (!logistics) return fail("Please choose the area for your shoot.");
    locationKind = body.locationKind;
  }

  // Date and time
  const day = body.day && /^\d{4}-\d{2}-\d{2}$/.test(body.day) ? body.day : null;
  const today = new Date().toISOString().slice(0, 10);
  if (!day || day < today) return fail("Please choose a date.");
  const time = type.full_day ? null : body.time;
  if (!type.full_day && !time) return fail("Please choose a start time.");
  const availability = await getAvailability();
  if (availability.blockedDays.includes(day)) return fail("Sorry, that date was just taken. Please pick another.", 409);
  if (time && availability.takenSlots.some((s) => s.day === day && s.time === time))
    return fail("Sorry, that time was just taken. Please pick another.", 409);

  // Form answers, checked against the questions Sheyilor set for this session
  const fields = site.fields.filter((f) => f.session_type_id === type.id).sort((a, b) => a.sort - b.sort);
  const answers: { label: string; value: string }[] = [];
  let clientName = "";
  let clientEmail = "";
  let clientPhone = "";
  for (const f of fields) {
    const value = String(body.answers?.[f.id] ?? "").trim().slice(0, 500);
    if (f.required && !value) return fail(`Please fill in "${f.label}".`);
    if (f.field_type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return fail("Please enter a valid email address.");
    if (value) answers.push({ label: f.label, value });
    if (f.role === "name") clientName = value;
    if (f.role === "email") clientEmail = value;
    if (f.role === "phone") clientPhone = value;
  }
  if (!clientEmail) clientEmail = answers.find((a) => /@/.test(a.value))?.value ?? "";
  if (!clientName || !clientEmail) return fail("Please add your name and email.");

  const q = quote({
    pkg,
    outfits: body.outfits,
    logistics,
    express: type.has_express && Boolean(body.express),
    expressFee: site.settings.express_fee,
    depositPercent: site.settings.deposit_percent,
  });
  if (q.deposit < 100) return fail("This package isn't priced yet. Please message us on WhatsApp.");

  const s = db();
  const ref = makeRef();
  const { data: booking, error } = await s
    .from("bookings")
    .insert({
      ref,
      session_type_id: type.id,
      package_id: pkg.id,
      package_name: pkg.name,
      outfits: q.outfits,
      location_kind: locationKind,
      logistics_area: logistics?.area ?? null,
      express: q.expressFee > 0,
      shoot_date: day,
      shoot_time: time,
      answers,
      notes: String(body.notes ?? "").slice(0, 2000),
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      subtotal: q.subtotal,
      logistics: q.logistics,
      express_fee: q.expressFee,
      total: q.total,
      deposit: q.deposit,
    })
    .select("id")
    .single();
  if (error || !booking) {
    console.error(error);
    return fail("We couldn't save your booking. Please try again.", 500);
  }

  const reference = `${ref}-D`;
  await s.from("payments").insert({ reference, kind: "deposit", booking_id: booking.id, amount: q.deposit, email: clientEmail });

  try {
    const pay = await initializePayment({
      email: clientEmail,
      amountNaira: q.deposit,
      reference,
      callbackUrl: `${siteUrl()}/book/confirmed`,
      metadata: { booking_ref: ref, kind: "deposit", client_name: clientName },
    });
    return NextResponse.json({ ref, authorizationUrl: pay.authorization_url });
  } catch (err) {
    console.error(err);
    return fail("We couldn't open Paystack. Please try again in a moment.", 502);
  }
}
