import Link from "next/link";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/data";
import { naira, whatsappLink } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Rates",
  description: "Portrait, wedding, event and fashion photography rates in Lagos. Packages, logistics fees, extras and terms.",
};

export default async function RatesPage(props: PageProps<"/rates">) {
  const { type } = await props.searchParams;
  const site = await getSiteData();
  const { settings } = site;
  const current = site.sessionTypes.find((t) => t.slug === type) ?? site.sessionTypes[0];
  const packages = site.packages.filter((p) => p.session_type_id === current.id).sort((a, b) => a.sort - b.sort);
  const fees = site.logistics.filter((l) => l.session_type_id === current.id || l.session_type_id === null);
  const outdoor = fees.filter((f) => f.kind === "outdoor");
  const home = fees.filter((f) => f.kind === "home");
  const extras = site.extras.filter((e) => e.session_type_id === current.id);
  const deposit = settings.deposit_percent;

  return (
    <main>
      <SiteHeader active="rates" />

      <section className="mx-auto max-w-[1400px] px-5 pt-16 md:px-8">
        <div className="rise flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h1 className="m-0 text-[clamp(64px,11vw,168px)] font-medium leading-[0.9] tracking-[-0.055em]">Rates</h1>
            <p className="mt-6 max-w-[560px] text-lg leading-[1.55] text-ink-2">
              Our {new Date().getFullYear()} packages. Pay a {deposit}% deposit online to lock your slot, and the balance on or before your
              shoot day.
            </p>
          </div>
          {current.rate_card_url && (
            <a className="u shrink-0 text-sm" href={current.rate_card_url}>
              Download the {current.name.toLowerCase()} rate card (PDF)
            </a>
          )}
        </div>

        <nav aria-label="Session types" className="mt-14 flex gap-7 overflow-x-auto whitespace-nowrap border-y border-line py-4">
          {site.sessionTypes.map((t) => (
            <Link
              key={t.id}
              href={`/rates?type=${t.slug}`}
              scroll={false}
              aria-current={t.id === current.id ? "page" : undefined}
              className={`text-[15px] ${t.id === current.id ? "text-ink underline underline-offset-[6px]" : "text-muted hover:text-ink"}`}
            >
              {t.name}
            </Link>
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-12 md:px-8">
        <div className="mb-7 flex flex-col items-start justify-between gap-3 md:flex-row md:items-baseline">
          <h2 className="m-0 text-[clamp(32px,3.6vw,52px)] font-medium tracking-[-0.035em]">{current.name}</h2>
          <span className="text-[15px] text-ink-2">{current.tagline}</span>
        </div>

        {!current.ready || packages.length === 0 ? (
          <div className="border border-line bg-white p-10 text-center">
            <p className="m-0 text-lg">The {current.name.toLowerCase()} rate card is on its way to the site.</p>
            <p className="mt-2 text-muted">Message us for the latest packages and prices.</p>
            <a className="btn mt-6" href={whatsappLink(settings.whatsapp, `Hello, please send me your ${current.name.toLowerCase()} rate card.`)}>
              Get the rate card on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {packages.map((p) => {
              const dark = p.highlight;
              return (
                <article
                  key={p.id}
                  className={`reveal flex flex-col border p-8 ${
                    dark ? "border-ink bg-ink text-paper" : "border-line bg-white"
                  }`}
                >
                  <h3 className="m-0 text-[22px] font-medium tracking-[-0.02em]">{p.name}</h3>
                  <div className={`mt-1.5 text-sm ${dark ? "text-[#A9A49B]" : "text-muted"}`}>{p.subtitle}</div>
                  <div className="mt-6 flex items-baseline gap-2.5">
                    <span className="text-[46px] font-medium tracking-[-0.04em]">{naira(p.price)}</span>
                    {p.per_outfit && <span className={`text-sm ${dark ? "text-[#A9A49B]" : "text-muted"}`}>per outfit</span>}
                  </div>
                  {p.price !== null && (
                    <div className={`mt-1.5 text-sm ${dark ? "text-[#A9A49B]" : "text-muted"}`}>
                      {naira(Math.round((p.price * deposit) / 100))} deposit to book
                    </div>
                  )}
                  <ul className="m-0 mt-6 flex flex-1 list-none flex-col p-0">
                    {p.included.map((it) => (
                      <li key={it.title} className={`border-t py-3 ${dark ? "border-[#333]" : "border-line-2"}`}>
                        <span className="block text-[15px] font-medium">{it.title}</span>
                        <span className={`mt-0.5 block text-sm leading-snug ${dark ? "text-[#A9A49B]" : "text-muted"}`}>{it.detail}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className={`btn mt-6 ${dark ? "btn-light" : ""}`} href={`/book?type=${current.slug}&package=${p.id}`}>
                    Book this package
                  </Link>
                </article>
              );
            })}
            {current.notes.length > 0 && (
              <aside className="reveal flex flex-col border border-line p-8" style={{ ["--d" as string]: "200ms" }}>
                <h3 className="m-0 text-[22px] font-medium tracking-[-0.02em]">Take note</h3>
                <ul className="m-0 mt-5 list-none p-0">
                  {current.notes.map((n) => (
                    <li key={n} className="border-t border-line py-3 text-[15px] leading-normal">
                      {n}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        )}

        {current.ready && (
          <section className="reveal mt-4 flex flex-wrap items-center justify-between gap-10 bg-ink px-8 py-14 text-paper md:px-12">
            <div className="flex-[1_1_420px]">
              <h3 className="m-0 text-[clamp(40px,5vw,72px)] font-medium leading-[0.95] tracking-[-0.045em]">
                Pay now,
                <br />
                shoot later.
              </h3>
              <p className="mt-5 max-w-[440px] leading-relaxed text-[#C9C4BB]">
                Book today and pick a session date that suits you. Your rate is locked in from the day you pay.
              </p>
            </div>
            <div className="grid flex-[1_1_360px] grid-cols-2 gap-4">
              <div className="border-t border-[#444] pt-4">
                <div className="text-[44px] font-medium tracking-[-0.04em]">{deposit}%</div>
                <div className="mt-1.5 text-sm text-[#C9C4BB]">deposit to lock your booking slot</div>
              </div>
              <div className="border-t border-[#444] pt-4">
                <div className="text-[44px] font-medium tracking-[-0.04em]">{100 - deposit}%</div>
                <div className="mt-1.5 text-sm text-[#C9C4BB]">balance on or before your shoot day</div>
              </div>
              <Link className="btn btn-light col-span-2" href={`/book?type=${current.slug}`}>
                Secure your slot
              </Link>
            </div>
          </section>
        )}

        {(outdoor.length > 0 || home.length > 0 || extras.length > 0) && (
          <div className="reveal mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
            {(outdoor.length > 0 || home.length > 0) && (
              <section>
                <h3 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Outside the studio</h3>
                <p className="m-0 mb-4 text-sm text-muted">For sessions away from Sheyilor Studio.</p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { title: "Outdoor session", list: outdoor, note: "" },
                    { title: "Home studio setup", list: home, note: "Includes backdrops, stands, 2 to 3 lights and modifiers." },
                  ].map((g) =>
                    g.list.length ? (
                      <div key={g.title}>
                        <div className="pb-2.5 text-sm font-medium">{g.title}</div>
                        {g.list.map((f) => (
                          <div key={f.id} className="flex justify-between gap-2.5 border-t border-line py-3 text-[15px]">
                            <span>{f.area}</span>
                            <span>{naira(f.fee)}</span>
                          </div>
                        ))}
                        {g.note && <p className="mt-2.5 text-[13px] text-muted">{g.note}</p>}
                      </div>
                    ) : null,
                  )}
                </div>
              </section>
            )}
            {extras.length > 0 && (
              <section>
                <h3 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Extras</h3>
                <p className="m-0 mb-4 text-sm text-muted">Added on top of your package.</p>
                <div className="border-b border-line">
                  {extras.map((x) => (
                    <div key={x.id} className="flex justify-between gap-4 border-t border-line py-3 text-[15px]">
                      <span>{x.name}</span>
                      <span>
                        {naira(x.price)}
                        {x.unit ? ` ${x.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {current.terms.length > 0 && (
          <section className="mt-16">
            <h3 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">Terms</h3>
            <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
              {current.terms.map((t, i) => (
                <div key={t.title} className="reveal-row border-t border-line py-4" style={{ ["--d" as string]: `${(i % 2) * 90}ms` }}>
                  <div className="text-[15px] font-medium">{t.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-ink-2">{t.body}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>

      <SiteFooter settings={settings} lead="Found your package?" />
    </main>
  );
}
