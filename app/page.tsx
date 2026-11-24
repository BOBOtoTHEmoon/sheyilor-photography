import Link from "next/link";
import { getPhotoCounts, getSiteData } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Testimonials } from "@/components/Testimonials";
import { Intro } from "@/components/Intro";

export const revalidate = 60;

// Placement of the five featured photos on a 12-column grid (desktop)
const featuredLayout = [
  { place: "col-span-2 md:col-[1/span_5]", height: "md:h-[560px]" },
  { place: "md:col-[7/span_6] md:mt-[100px]", height: "md:h-[640px]" },
  { place: "md:col-[1/span_4]", height: "md:h-[420px]" },
  { place: "md:col-[5/span_4] md:mt-[60px]", height: "md:h-[420px]" },
  { place: "col-span-2 md:col-[9/span_4] md:mt-[120px]", height: "md:h-[420px]" },
];

const stagger = (i: number, step = 160) => ({ "--d": `${i * step}ms` }) as React.CSSProperties;

export default async function HomePage() {
  const [site, counts] = await Promise.all([getSiteData(), getPhotoCounts()]);
  const { settings } = site;
  const hero = site.home.filter((h) => h.section === "hero").sort((a, b) => a.position - b.position);
  const panels = [0, 1, 2].map((i) => ({ a: hero[i], b: hero[i + 3] })).filter((p) => p.a);
  const featured = site.home.filter((h) => h.section === "featured").sort((a, b) => a.position - b.position).slice(0, 5);
  const about = site.home.find((h) => h.section === "about");

  return (
    <main>
      <Intro />
      <SiteHeader />

      {settings.hero_video_url ? (
        /* Video hero: full width, muted, loops. Set in the dashboard or saved as public/video/hero.mp4 */
        <section aria-label="Showreel" className="px-5 md:px-8">
          <div className="wipe relative h-[480px] overflow-hidden bg-placeholder md:h-[640px]">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={settings.hero_video_url}
              poster={settings.hero_poster_url ?? hero[0]?.image_url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-paper md:inset-x-7 md:bottom-6">
              <span className="text-[13px]">Showreel {new Date().getFullYear()}</span>
              <Link href="#work" className="u text-[13px]">
                See the work ↓
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* Photo hero: three panels, each crossfading to a second photo */
        <section aria-label="Featured work" className="px-5 md:px-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {panels.map((p, i) => (
              <Link
                key={p.a.id}
                href={`/portfolio/${p.a.collection_slug ?? ""}`}
                aria-label={p.a.caption}
                className={`wipe relative block h-[480px] overflow-hidden bg-placeholder md:h-[640px] ${i > 0 ? "hidden md:block" : ""}`}
                style={stagger(i, 280)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.a.image_url}
                  alt={p.a.alt}
                  className="kb absolute inset-0 h-full w-full object-cover object-[center_20%]"
                  style={{ animationDelay: `${-i * 6.5}s` }}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
                {p.b && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.b.image_url}
                    alt={p.b.alt}
                    className="xf absolute inset-0 h-full w-full object-cover object-[center_20%]"
                    style={{ animationDelay: `${-i * 6.5}s` }}
                  />
                )}
              </Link>
            ))}
          </div>
          <div className="rise mt-3 flex justify-between gap-5 text-[13px] text-muted">
            <span>{panels.map((p) => p.a.caption).join(" · ")}</span>
            <span className="flex items-center gap-3">
              {new Date().getFullYear()}
              <span className="relative block h-px w-20 bg-ink/20">
                <span className="progress absolute inset-0 bg-ink" />
              </span>
            </span>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1400px] px-5 pb-10 pt-16 md:px-8 md:pt-[72px]">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <h1 className="reveal m-0 max-w-[900px] text-[clamp(40px,5.2vw,76px)] font-medium leading-[1.02] tracking-[-0.035em]">
            {settings.headline}
          </h1>
          <div className="reveal flex shrink-0 gap-3" style={stagger(2)}>
            <Link className="btn" href="/book">
              Book a date
            </Link>
            <Link className="btn btn-ghost" href="#work">
              See the work
            </Link>
          </div>
        </div>
      </section>

      {/* Featured work: each photo is uncovered as it scrolls into view */}
      <section id="work" className="mx-auto max-w-[1400px] px-5 pb-28 pt-16 md:px-8 md:pt-[72px]">
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-12 md:gap-x-6 md:gap-y-14">
          {featured.map((f, i) => (
            <Link key={f.id} href={`/portfolio/${f.collection_slug ?? ""}`} className={`block ${featuredLayout[i]?.place ?? ""}`}>
              <span className={`shot reveal-img h-[260px] ${featuredLayout[i]?.height ?? ""}`} style={stagger(i % 2, 220)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.image_url} alt={f.alt} loading="lazy" />
              </span>
              <span className="reveal mt-3 flex justify-between gap-3 text-[13px] text-muted" style={stagger(3)}>
                <span>{f.caption}</span>
                <span className="arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Collections: each row draws its line, then slides in */}
      <section id="categories" className="mx-auto max-w-[1400px] px-5 pb-36 md:px-8">
        <div className="reveal mb-7 flex items-baseline justify-between">
          <h2 className="m-0 text-[32px] font-medium tracking-[-0.02em]">Portfolio</h2>
          <span className="text-[13px] text-muted">{site.collections.length} collections</span>
        </div>
        <div className="border-b border-line">
          {site.collections.map((c, i) => (
            <Link
              key={c.id}
              href={`/portfolio/${c.slug}`}
              style={stagger(i % 4, 140)}
              className="idx reveal-row grid grid-cols-[minmax(0,1fr)_28px] items-center gap-5 border-t border-line py-[22px] md:grid-cols-[minmax(0,1fr)_160px_40px]"
            >
              <span className="text-[clamp(24px,2.6vw,38px)] font-medium tracking-[-0.025em]">{c.name}</span>
              <span className="hidden text-right text-[13px] text-muted md:block">
                {counts[c.id] ? `${counts[c.id]} photos` : "Coming soon"}
              </span>
              <span className="text-right text-xl">→</span>
              {c.cover_url && (
                <span className="thumb hidden bg-placeholder md:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.cover_url} alt="" loading="lazy" className="h-full w-full object-cover object-[center_20%]" />
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-paper-2 py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <div className="reveal mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <h2 className="m-0 text-[clamp(36px,4vw,56px)] font-medium leading-[1.05] tracking-[-0.03em]">Services and rates</h2>
            <p className="m-0 max-w-[380px] text-[15px] leading-relaxed text-muted">
              Open a rate card to see packages and prices, then book online in a few minutes.
            </p>
          </div>
          <div className="border-b border-line">
            {site.sessionTypes.map((t, i) => (
              <div
                key={t.id}
                style={stagger(i % 4, 140)}
                className="reveal-row grid grid-cols-1 items-baseline gap-2.5 border-t border-line py-[30px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] md:gap-8"
              >
                <span className="text-2xl font-medium tracking-[-0.02em]">{t.name}</span>
                <span className="text-[15px] leading-relaxed text-muted">
                  {t.tagline}
                  {t.slug === "training" ? `. Ask for ${settings.training_contact}.` : ""}
                </span>
                <span className="flex gap-6 whitespace-nowrap text-sm">
                  <Link className="u" href={`/rates?type=${t.slug}`}>
                    Rate card
                  </Link>
                  <Link className="u font-semibold" href={`/book?type=${t.slug}`}>
                    Book →
                  </Link>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-[1400px] px-5 py-32 md:px-8 md:py-36">
        <div className="flex flex-col gap-12 md:flex-row md:gap-20">
          <div className="shot reveal-img h-[420px] w-full md:h-[520px] md:w-[40%] md:shrink-0">
            {about ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.image_url} alt={about.alt} loading="lazy" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">Photo of Sheyilor</span>
            )}
          </div>
          <div className="min-w-0 flex-1 md:pt-5">
            <h2 className="reveal m-0 text-[clamp(32px,3.4vw,48px)] font-medium leading-[1.12] tracking-[-0.03em]">{settings.about_title}</h2>
            <p className="reveal mt-8 max-w-[560px] text-[17px] leading-[1.7] text-ink-2" style={stagger(1, 220)}>
              {settings.about_body}
            </p>
            <div className="reveal mt-12 flex flex-wrap gap-12 text-sm" style={stagger(2, 220)}>
              <div>
                <div className="text-4xl font-medium tracking-[-0.03em]">100+</div>
                <div className="mt-1 text-muted">clients photographed</div>
              </div>
              <div>
                <div className="text-4xl font-medium tracking-[-0.03em]">2 days</div>
                <div className="mt-1 text-muted">to your edited portraits</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials items={site.testimonials} />

      <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-8">
        <Link href="/gallery" className="reveal flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <span className="text-lg text-ink-2">Had a shoot with us? Your photos are waiting in your private gallery.</span>
          <span className="u text-lg font-semibold">Open your gallery →</span>
        </Link>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
