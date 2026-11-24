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
  const fromPrice = (id: string) => {
    const prices = site.packages.filter((p) => p.session_type_id === id && p.price !== null).map((p) => p.price as number);
    return prices.length ? `From ${naira(Math.min(...prices))}` : "Rates coming soon";
  };
  const minFee = (kind: "outdoor" | "home") => {
    const list = fees.filter((f) => f.kind === kind).map((f) => f.fee);
    return list.length ? naira(Math.min(...list)) : "";
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-start gap-x-16">
      <div className="min-w-0 flex-[999_1_560px]">
        {/* Session: chosen from his own photos */}
        <section>
          <p className="m-0 text-[13px] text-muted">Book a date</p>
          <h1 className="m-0 mt-2 text-[clamp(40px,5vw,72px)] font-medium leading-[1.02] tracking-[-0.04em]">What are we shooting?</h1>
          <div className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-7 md:mt-10 md:grid-cols-3 md:gap-x-5 md:gap-y-10">
            {site.sessionTypes.map((t, i) => {
              const on = t.id === typeId;
              return (
                <button type="button" key={t.id} aria-pressed={on} onClick={() => chooseType(t.id)} className="group text-left">
                  <span
                    className={`reveal-img relative block aspect-[3/4] overflow-hidden bg-paper-2 outline-offset-[5px] transition-[outline-color] duration-300 ${
                      on ? "outline outline-1 outline-ink" : "outline outline-1 outline-transparent"
                    }`}
                    style={{ ["--d" as string]: `${(i % 3) * 160}ms` }}
                  >
                    {t.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.cover_url} alt="" className="block h-full w-full object-cover" />
                    )}
                    {on && (
                      <span aria-hidden="true" className="absolute right-2.5 top-2.5 flex h-[26px] w-[26px] items-center justify-center bg-paper">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M2.5 7.5l3 3 6-7" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className="mt-3 block text-[15px] font-medium md:text-[17px]">{t.name}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">{fromPrice(t.id)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {!ready && (
          <div className="mb-16 mt-12 border border-line bg-white p-6">
            <p className="m-0 text-[15px]">Online booking for {type.name.toLowerCase()} opens soon.</p>
            <a className="btn mt-4" href={whatsappLink(settings.whatsapp, `Hello, I'd like to book a ${type.name.toLowerCase()}.`)}>
              Book on WhatsApp
            </a>
          </div>
        )}

        {ready && (
          <>
            {/* Package */}
            <section className="mt-14 md:mt-20">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="m-0 text-2xl font-medium tracking-[-0.02em]">Package</h2>
                <Link className="u text-[13px]" href={`/rates?type=${type.slug}`}>
                  Rate card
                </Link>
              </div>
              {packages.map((p) => {
                const on = p.id === pkg?.id;
                const bits = [p.per_outfit ? "Per outfit" : null, p.images_included ? `${p.images_included} edited images` : null, p.subtitle || null].filter(Boolean);
                return (
                  <button
                    type="button"
                    key={p.id}
                    aria-pressed={on}
                    onClick={() => setPackageId(p.id)}
                    className="flex w-full items-start gap-4 border-t border-line py-5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-3 text-xl font-medium tracking-[-0.02em]">
                        <span>{p.name}</span>
                        <span>{naira(p.price)}</span>
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-normal text-muted">{bits.join(" · ")}</span>
                    </span>
                    <Radio on={on} />
                  </button>
                );
              })}
              {pkg?.per_outfit && (
                <div className="flex items-center justify-between border-y border-line py-4">
                  <span className="text-[15px]">Outfits</span>
                  <div className="flex items-center border border-ink">
                    <button type="button" aria-label="One less outfit" className="h-11 w-11 text-xl transition-colors hover:bg-ink hover:text-paper" onClick={() => setOutfits(Math.max(1, outfits - 1))}>
                      −
                    </button>
                    <span className="w-10 text-center text-[17px] font-medium" aria-live="polite">
                      {outfits}
                    </span>
                    <button type="button" aria-label="One more outfit" className="h-11 w-11 text-xl transition-colors hover:bg-ink hover:text-paper" onClick={() => setOutfits(Math.min(20, outfits + 1))}>
                      +
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Where */}
            {type.has_logistics && (
              <section className="mt-12 md:mt-16">
                <h2 className="m-0 mb-3.5 text-2xl font-medium tracking-[-0.02em]">Where</h2>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "studio", name: "Studio", sub: "Included" },
                      { id: "outdoor", name: "Outdoor", sub: `From ${minFee("outdoor")}` },
                      { id: "home", name: "Your home", sub: `From ${minFee("home")}` },
                    ] as const
                  ).map((l) => (
                    <Tile
                      key={l.id}
                      on={where === l.id}
                      onClick={() => {
                        setWhere(l.id);
                        setFeeId(null);
                      }}
                      title={l.name}
                      sub={l.sub}
                    />
                  ))}
                </div>
                {where !== "studio" && (
                  <div className="rise mt-5">
                    <div className="mb-2.5 text-sm text-ink-2">Area</div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {areaFees.map((f) => (
                        <Tile key={f.id} on={feeId === f.id} onClick={() => setFeeId(f.id)} title={f.area} sub={naira(f.fee)} />
                      ))}
                    </div>
                    <p className="mt-2.5 text-[13px] text-muted">
                      {where === "home" ? "We bring backdrops, stands, 2 to 3 lights and modifiers." : "Logistics fee for shooting outside the studio."}
                    </p>
                  </div>
                )}
                {type.has_express && (
                  <button
                    type="button"
                    aria-pressed={express}
                    onClick={() => setExpress(!express)}
                    className="mt-5 flex w-full items-center justify-between gap-4 border-y border-line py-4 text-left"
                  >
                    <span>
                      <span className="block text-[15px] font-medium">Express delivery · {naira(settings.express_fee)}</span>
                      <span className="text-[13px] text-muted">Faster than the standard 2 working days</span>
                    </span>
                    <Radio on={express} square />
                  </button>
                )}
              </section>
            )}

            {/* Date and time */}
            <section className="mt-12 md:mt-16">
              <h2 className="m-0 mb-3.5 text-2xl font-medium tracking-[-0.02em]">{type.full_day ? "Date" : "Date and time"}</h2>
              <div className="flex flex-wrap gap-8">
                <div className="min-w-0 flex-[1_1_340px] border border-line bg-white px-3 pb-4 pt-3.5 md:p-5">
                  <div className="mb-2.5 flex items-center justify-between">
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
                          className={`h-[44px] text-[15px] transition-colors md:h-[46px] ${
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
                  <p className="mt-3.5 text-center text-xs text-muted">Crossed-out dates are already booked.</p>
                </div>
                {!type.full_day && (
                  <div className="min-w-0 flex-[1_1_220px]">
                    <div className="mb-3 text-[15px] font-medium">Start time</div>
                    <div className="grid grid-cols-2 gap-2">
                      {TIMES.map((t) => {
                        const taken = takenTimes.has(t);
                        return (
                          <button
                            type="button"
                            key={t}
                            disabled={!day || taken}
                            aria-pressed={time === t}
                            onClick={() => setTime(t)}
                            className={`flex h-[52px] items-center justify-center border text-[15px] transition-colors disabled:cursor-not-allowed ${
                              time === t
                                ? "border-ink bg-ink text-paper"
                                : taken
                                  ? "border-line text-faint line-through"
                                  : "border-line hover:border-ink disabled:opacity-40 disabled:hover:border-line"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3.5 text-[13px] leading-normal text-muted">
                      {day ? "" : "Pick a date first. "}Please arrive on time. After 30 minutes, lateness is {naira(settings.lateness_fee)} per hour.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Details */}
            <section className="mt-12 md:mt-16">
              <h2 className="m-0 mb-5 text-2xl font-medium tracking-[-0.02em]">Your details</h2>
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

      {/* Summary: a dark panel. Full width at the bottom on phones, beside the form on desktop. */}
      {ready && (
        <aside className="-mx-5 mt-14 min-w-0 flex-[1_1_360px] bg-ink px-5 pb-10 pt-9 text-paper md:mx-0 md:mt-0 md:p-8 lg:sticky lg:top-6">
          <div className="flex items-center gap-3.5">
            {type.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={type.cover_url} alt="" className="h-[72px] w-14 shrink-0 object-cover" />
            )}
            <div className="min-w-0">
              <div className="text-[22px] font-medium tracking-[-0.02em]">{type.name}</div>
              <div className="mt-0.5 text-sm text-[#C9C4BC]">
                {day ? new Date(`${day}T12:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Pick a date"}
                {!type.full_day && time ? ` · ${time}` : ""}
                {type.has_logistics ? ` · ${where === "studio" ? "Studio" : where === "home" ? "Your home" : "Outdoor"}` : ""}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <DarkRow label={`${pkg?.name ?? "Package"}${pkg?.per_outfit ? ` × ${q.outfits} outfit${q.outfits > 1 ? "s" : ""}` : ""}`} value={naira(q.subtotal)} />
            {type.has_logistics && where === "studio" && <DarkRow label="Studio" value="Included" />}
            {q.logistics > 0 && fee && <DarkRow label={`${where === "home" ? "Home setup" : "Outdoor"}, ${fee.area}`} value={naira(q.logistics)} />}
            {q.expressFee > 0 && <DarkRow label="Express delivery" value={naira(q.expressFee)} />}
            <DarkRow label="Total" value={naira(q.total)} strong />
          </div>
          <div className="flex items-baseline justify-between border-t border-paper pt-4">
            <span className="text-[15px]">Deposit today ({settings.deposit_percent}%)</span>
            <span className="text-[30px] font-medium tracking-[-0.03em]">{naira(q.deposit)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[13px] text-[#A8A39B]">
            <span>Balance on or before the day</span>
            <span>{naira(q.balance)}</span>
          </div>
          {error && (
            <p role="alert" className="mt-5 border border-[#E9B48A]/50 bg-[#2A211B] p-3 text-sm text-[#F2C9A6]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex h-[54px] w-full items-center justify-center border border-paper bg-paper text-[15px] font-medium text-ink transition-colors duration-300 hover:bg-transparent hover:text-paper disabled:opacity-60"
          >
            {busy ? "Opening Paystack…" : `Pay ${naira(q.deposit)} deposit`}
          </button>
          <p className="mt-3.5 text-center text-xs leading-normal text-[#A8A39B]">
            Payment confirms your booking. No refunds after 48 hours, but you can pass your shoot to someone else.{" "}
            <Link className="u text-paper" href={`/rates?type=${type.slug}`}>
              Full terms
            </Link>
          </p>
          <div className="mt-5 text-center">
            <a className="u text-sm text-paper" href={whatsappLink(settings.whatsapp, settings.whatsapp_message)}>
              Questions? Chat on WhatsApp
            </a>
          </div>
        </aside>
      )}
    </form>
  );
}

function Radio({ on, square = false }: { on: boolean; square?: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-1 flex h-5 w-5 flex-none items-center justify-center border border-ink ${square ? "" : "rounded-full"}`}>
      <span className={`h-2.5 w-2.5 bg-ink transition-transform duration-300 ${square ? "" : "rounded-full"} ${on ? "scale-100" : "scale-0"}`} />
    </span>
  );
}

function Tile({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 border px-2 py-3.5 text-center transition-colors duration-300 ${
        on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
      }`}
    >
      <span className="text-[15px] font-medium">{title}</span>
      <span className={`text-xs ${on ? "text-[#C9C4BC]" : "text-muted"}`}>{sub}</span>
    </button>
  );
}

function DarkRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 border-t border-[#2E2D2B] py-3 ${strong ? "text-base font-medium" : "text-[15px]"}`}>
      <span>{label}</span>
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
