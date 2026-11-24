"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Availability, FormField, SiteData } from "@/lib/types";
import { naira, whatsappLink } from "@/lib/format";
import { quote } from "@/lib/pricing";

const TIMES = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Props = {
  site: SiteData;
  availability: Availability;
  initialType?: string;
  initialPackage?: string;
};

export function BookingForm({ site, availability, initialType, initialPackage }: Props) {
  const { settings } = site;
  const [typeId, setTypeId] = useState(
    (site.sessionTypes.find((t) => t.slug === initialType) ?? site.sessionTypes.find((t) => t.ready) ?? site.sessionTypes[0]).id,
  );
  const type = site.sessionTypes.find((t) => t.id === typeId)!;
  const packages = site.packages.filter((p) => p.session_type_id === typeId).sort((a, b) => a.sort - b.sort);
  const [packageId, setPackageId] = useState(packages.find((p) => p.id === initialPackage)?.id ?? packages[0]?.id ?? "");
  const pkg = packages.find((p) => p.id === packageId) ?? packages[0] ?? null;

  const [outfits, setOutfits] = useState(1);
  const [where, setWhere] = useState<"studio" | "outdoor" | "home">("studio");
  const fees = site.logistics.filter((l) => l.session_type_id === typeId || l.session_type_id === null);
  const areaFees = fees.filter((f) => f.kind === where);
  const [feeId, setFeeId] = useState<string | null>(null);
  const fee = where === "studio" ? null : areaFees.find((f) => f.id === feeId) ?? null;
  const [express, setExpress] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const fields = site.fields.filter((f) => f.session_type_id === typeId).sort((a, b) => a.sort - b.sort);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const q = quote({
    pkg,
    outfits,
    logistics: fee,
    express: type.has_express && express,
    expressFee: settings.express_fee,
    depositPercent: settings.deposit_percent,
  });

  const blocked = useMemo(() => new Set(availability.blockedDays), [availability]);
  const todayIso = iso(today);
  const cells = useMemo(() => {
    const first = new Date(month);
    const lead = first.getDay();
    const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: ({ iso: string; n: number; off: boolean } | null)[] = Array(lead).fill(null);
    for (let n = 1; n <= daysIn; n++) {
      const d = iso(new Date(month.getFullYear(), month.getMonth(), n));
      out.push({ iso: d, n, off: d < todayIso || blocked.has(d) });
    }
    return out;
  }, [month, blocked, todayIso]);
  const takenTimes = new Set(availability.takenSlots.filter((s) => s.day === day).map((s) => s.time));

  function chooseType(id: string) {
    setTypeId(id);
    const first = site.packages.filter((p) => p.session_type_id === id).sort((a, b) => a.sort - b.sort)[0];
    setPackageId(first?.id ?? "");
    setWhere("studio");
    setFeeId(null);
    setExpress(false);
    setOutfits(1);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pkg) return setError("Please choose a package.");
    if (where !== "studio" && !fee) return setError("Please choose the area for your shoot.");
    if (!day) return setError("Please choose a date.");
    if (!type.full_day && !time) return setError("Please choose a start time.");
    for (const f of fields) if (f.required && !answers[f.id]?.trim()) return setError(`Please fill in "${f.label}".`);
    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTypeId: typeId,
          packageId: pkg.id,
          outfits,
          locationKind: where,
          logisticsFeeId: fee?.id ?? null,
          express,
          day,
          time: type.full_day ? null : time,
          answers,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      window.location.href = json.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const ready = type.ready && packages.some((p) => p.price !== null);

  return (
    <form onSubmit={submit} className="mt-14 flex flex-wrap items-start gap-16">
      <div className="min-w-0 flex-[999_1_560px]">
        {/* Session */}
        <section className="border-b border-line pb-12">
          <h2 className="m-0 mb-5 text-[22px] font-medium tracking-[-0.015em]">Session</h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {site.sessionTypes.map((t) => (
              <button
                type="button"
                key={t.id}
                className="opt flex min-h-[92px] flex-col justify-between gap-2.5 p-[18px]"
                aria-pressed={t.id === typeId}
                onClick={() => chooseType(t.id)}
              >
                <span className="text-[17px] font-medium">{t.name}</span>
                <span className="line-clamp-2 text-[13px] text-muted">{t.tagline}</span>
              </button>
            ))}
          </div>

          {ready ? (
            <>
              <div className="mt-8 flex items-baseline justify-between">
                <span className="text-[15px] font-medium">Package</span>
                <Link className="u text-[13px] text-ink-2" href={`/rates?type=${type.slug}`}>
                  See the {type.name.toLowerCase()} rate card
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {packages.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="opt flex flex-col gap-1.5 p-[18px]"
                    aria-pressed={p.id === pkg?.id}
                    onClick={() => setPackageId(p.id)}
                  >
                    <span className="flex justify-between gap-3 text-base font-medium">
                      <span>{p.name}</span>
                      <span>
                        {naira(p.price)}
                        {p.per_outfit ? " / outfit" : ""}
                      </span>
                    </span>
                    <span className="text-[13px] text-muted">{p.included.map((i) => i.title).slice(0, 3).join(" · ")}</span>
                  </button>
                ))}
              </div>

              {pkg?.per_outfit && (
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-medium">Number of outfits</div>
                    <div className="mt-1 text-[13px] text-muted">Priced per outfit</div>
                  </div>
                  <div className="flex items-center border border-ink bg-white">
                    <button type="button" aria-label="One less outfit" className="h-12 w-12 text-xl hover:bg-ink hover:text-paper" onClick={() => setOutfits(Math.max(1, outfits - 1))}>
                      −
                    </button>
                    <span className="w-14 text-center text-lg font-medium" aria-live="polite">
                      {outfits}
                    </span>
                    <button type="button" aria-label="One more outfit" className="h-12 w-12 text-xl hover:bg-ink hover:text-paper" onClick={() => setOutfits(Math.min(20, outfits + 1))}>
                      +
                    </button>
                  </div>
                </div>
              )}

              {type.has_logistics && (
                <>
                  <div className="mt-7 text-[15px] font-medium">Where?</div>
                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: "studio", name: "Sheyilor Studio", sub: "No extra cost" },
                        { id: "outdoor", name: "Outdoor", sub: `From ${naira(Math.min(...fees.filter((f) => f.kind === "outdoor").map((f) => f.fee)))}` },
                        { id: "home", name: "Your home", sub: `Studio setup from ${naira(Math.min(...fees.filter((f) => f.kind === "home").map((f) => f.fee)))}` },
                      ] as const
                    ).map((l) => (
                      <button
                        type="button"
                        key={l.id}
                        className="opt flex flex-col gap-1 px-3 py-3.5 md:px-[18px] md:py-4"
                        aria-pressed={where === l.id}
                        onClick={() => {
                          setWhere(l.id);
                          setFeeId(null);
                        }}
                      >
                        <span className="text-[15px] font-medium">{l.name}</span>
                        <span className="text-[13px] text-muted">{l.sub}</span>
                      </button>
                    ))}
                  </div>
                  {where !== "studio" && (
                    <div className="rise mt-3.5">
                      <div className="mb-2.5 text-sm text-ink-2">Area</div>
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                        {areaFees.map((f) => (
                          <button
                            type="button"
                            key={f.id}
                            className="opt flex justify-between gap-2.5 px-4 py-3.5 text-[15px]"
                            aria-pressed={feeId === f.id}
                            onClick={() => setFeeId(f.id)}
                          >
                            <span>{f.area}</span>
                            <span className="text-muted">{naira(f.fee)}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-2.5 text-[13px] text-muted">
                        {where === "home" ? "We bring backdrops, stands, 2 to 3 lights and modifiers." : "Logistics fee for shooting outside the studio."}
                      </p>
                    </div>
                  )}
                </>
              )}

              {type.has_express && (
                <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 border border-line bg-white px-[18px] py-4">
                  <span>
                    <span className="block text-[15px] font-medium">Express delivery</span>
                    <span className="text-[13px] text-muted">Faster than our standard 2 working days · {naira(settings.express_fee)}</span>
                  </span>
                  <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} className="h-5 w-5 accent-ink" />
                </label>
              )}
            </>
          ) : (
            <div className="mt-6 border border-line bg-white p-6">
              <p className="m-0 text-[15px]">Online booking for {type.name.toLowerCase()} opens soon.</p>
              <a className="btn mt-4" href={whatsappLink(settings.whatsapp, `Hello, I'd like to book a ${type.name.toLowerCase()}.`)}>
                Book on WhatsApp
              </a>
            </div>
          )}
        </section>

        {ready && (
          <>
            {/* Date and time */}
            <section className="border-b border-line py-12">
              <h2 className="m-0 mb-5 text-[22px] font-medium tracking-[-0.015em]">{type.full_day ? "Date" : "Date and time"}</h2>
              <div className="flex flex-wrap gap-8">
                <div className="min-w-0 flex-[1_1_360px] border border-line bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label="Previous month"
                      className="h-11 w-11 text-lg disabled:opacity-30"
                      disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)}
                      onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    >
                      ←
                    </button>
                    <span className="font-medium">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
                    <button type="button" aria-label="Next month" className="h-11 w-11 text-lg" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                      →
                    </button>
                  </div>
                  <div className="mb-1.5 grid grid-cols-7 text-center text-xs text-muted">
                    {WEEKDAYS.map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {cells.map((c, i) =>
                      c ? (
                        <button
                          type="button"
                          key={c.iso}
                          disabled={c.off}
                          aria-pressed={day === c.iso}
                          aria-label={new Date(`${c.iso}T12:00`).toDateString() + (c.off ? ", unavailable" : "")}
                          onClick={() => {
                            setDay(c.iso);
                            setTime(null);
                          }}
                          className={`h-[46px] text-[15px] transition-colors ${
                            day === c.iso ? "bg-ink text-paper" : c.off ? "cursor-not-allowed text-faint line-through" : "hover:bg-line-2"
                          }`}
                        >
                          {c.n}
                        </button>
                      ) : (
                        <span key={`b${i}`} />
                      ),
                    )}
                  </div>
                  <p className="mt-3.5 text-xs text-muted">Crossed-out dates are taken. Not sure of your date yet? Pay now and pick it with us later.</p>
                </div>
                {!type.full_day && (
                  <div className="min-w-0 flex-[1_1_220px]">
                    <div className="mb-3 text-[15px] font-medium">Start time</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {TIMES.map((t) => (
                        <button
                          type="button"
                          key={t}
                          disabled={!day || takenTimes.has(t)}
                          className="opt flex h-[52px] items-center justify-center text-center text-[15px] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-pressed={time === t}
                          onClick={() => setTime(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3.5 text-[13px] leading-normal text-muted">
                      {day ? "" : "Pick a date first. "}Please arrive on time. After 30 minutes, a lateness fee of {naira(settings.lateness_fee)} per hour applies.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Details */}
            <section className="pt-12">
              <h2 className="m-0 mb-5 text-[22px] font-medium tracking-[-0.015em]">Your details</h2>
              <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] md:grid-cols-2">
                {fields.map((f) => (
                  <Field key={f.id} field={f} value={answers[f.id] ?? ""} onChange={(v) => setAnswers({ ...answers, [f.id]: v })} />
                ))}
              </div>
              <div className="mt-[18px] flex flex-col gap-2">
                <label htmlFor="notes" className="text-sm text-ink-2">
                  Anything else? (optional)
                </label>
                <textarea id="notes" rows={3} className="field" placeholder="Theme, colours, references" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </section>
          </>
        )}
      </div>

      {/* Summary */}
      {ready && (
        <aside className="min-w-0 flex-[1_1_340px] border border-line bg-white p-7 md:sticky md:top-6">
          <div className="text-[13px] text-muted">Summary</div>
          <div className="mt-2 text-[28px] font-medium tracking-[-0.025em]">{pkg ? `${pkg.name} session` : type.name}</div>
          <div className="mt-1.5 text-[15px] text-ink-2">
            {day ? new Date(`${day}T12:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "Pick a date"}
            {!type.full_day && time ? ` · ${time}` : ""}
          </div>
          <div className="mt-5 border-t border-line-2">
            <Row label={`${pkg?.name ?? "Package"}${pkg?.per_outfit ? ` × ${q.outfits} outfit${q.outfits > 1 ? "s" : ""}` : ""}`} value={naira(q.subtotal)} />
            {q.logistics > 0 && fee && <Row label={`${where === "home" ? "Home setup" : "Outdoor"}, ${fee.area}`} value={naira(q.logistics)} />}
            {q.expressFee > 0 && <Row label="Express delivery" value={naira(q.expressFee)} />}
            <div className="flex justify-between gap-4 py-3 text-base font-medium">
              <span>Total</span>
              <span>{naira(q.total)}</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between border-t border-ink pt-4">
            <span className="text-[15px] font-medium">Deposit today ({settings.deposit_percent}%)</span>
            <span className="text-[26px] font-medium tracking-[-0.02em]">{naira(q.deposit)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm text-muted">
            <span>Balance on or before shoot day</span>
            <span>{naira(q.balance)}</span>
          </div>
          {error && (
            <p role="alert" className="mt-4 border border-owed/40 bg-[#FBF3EC] p-3 text-sm text-owed">
              {error}
            </p>
          )}
          <button type="submit" className="btn mt-5 w-full" disabled={busy}>
            {busy ? "Opening Paystack…" : "Pay deposit with Paystack"}
          </button>
          <p className="mt-3.5 text-[13px] leading-normal text-muted">
            Payment confirms your booking. No refunds after 48 hours, but you can pass your shoot to someone else.{" "}
            <Link className="u text-ink" href={`/rates?type=${type.slug}`}>
              Full terms
            </Link>
          </p>
          <a className="u mt-4 inline-block text-sm" href={whatsappLink(settings.whatsapp, settings.whatsapp_message)}>
            Questions? Chat on WhatsApp →
          </a>
        </aside>
      )}
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EFECE7] py-[11px] text-[15px]">
      <span className="text-ink-2">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({ field, value, onChange }: { field: FormField; value: string; onChange: (v: string) => void }) {
  const id = `f-${field.id}`;
  const label = (
    <label htmlFor={id} className="text-sm text-ink-2">
      {field.label}
      {!field.required && " (optional)"}
    </label>
  );
  const common = { id, required: field.required, value, className: "field", placeholder: field.placeholder ?? undefined };
  return (
    <div className={`flex flex-col gap-2 ${field.field_type === "long" ? "md:col-span-2" : ""}`}>
      {label}
      {field.field_type === "choice" ? (
        <select {...common} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose one</option>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : field.field_type === "long" ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...common}
          type={field.field_type === "text" ? "text" : field.field_type}
          autoComplete={field.role === "name" ? "name" : field.role === "email" ? "email" : field.role === "phone" ? "tel" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
