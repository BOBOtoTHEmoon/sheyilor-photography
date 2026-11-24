import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionPhotos, getPhotoCounts, getSiteData } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoGrid } from "@/components/PhotoGrid";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const site = await getSiteData();
  const c = site.collections.find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: `${c.name} photography in Lagos`,
    description: `${c.description} See ${c.name.toLowerCase()} photos by Sheyilor Photography and book your date online.`,
    openGraph: c.cover_url ? { images: [c.cover_url] } : undefined,
  };
}

export default async function CollectionPage(props: PageProps<"/portfolio/[slug]">) {
  const { slug } = await props.params;
  const site = await getSiteData();
  const index = site.collections.findIndex((x) => x.slug === slug);
  if (index === -1) notFound();
  const collection = site.collections[index];
  const next = site.collections[(index + 1) % site.collections.length];
  const [photos, counts] = await Promise.all([getCollectionPhotos(collection), getPhotoCounts()]);

  return (
    <main>
      <SiteHeader active="work" />

      <section className="mx-auto max-w-[1400px] px-5 pt-14 md:px-8 md:pt-16">
        <Link className="u rise text-sm text-ink-2" href="/#categories">
          ← All collections
        </Link>
        <div className="mt-6 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="rise">
            <h1 className="m-0 text-[clamp(64px,11vw,168px)] font-medium leading-[0.9] tracking-[-0.055em]">{collection.name}</h1>
            <p className="mt-6 max-w-[560px] text-lg leading-[1.55] text-ink-2">{collection.description}</p>
          </div>
          <div className="rise rise-2 flex shrink-0 flex-col items-start gap-3.5">
            <Link className="btn" href={`/book${collection.session_type_slug ? `?type=${collection.session_type_slug}` : ""}`}>
              {collection.cta_label}
            </Link>
            <Link className="u text-sm" href={`/rates${collection.session_type_slug ? `?type=${collection.session_type_slug}` : ""}`}>
              See the rate card
            </Link>
          </div>
        </div>

        <nav
          aria-label="Collections"
          className="mt-14 flex gap-7 overflow-x-auto whitespace-nowrap border-y border-line py-4 text-sm"
        >
          {site.collections.map((c) => (
            <Link
              key={c.id}
              href={`/portfolio/${c.slug}`}
              aria-current={c.id === collection.id ? "page" : undefined}
              className={c.id === collection.id ? "text-ink underline underline-offset-[6px]" : "text-muted hover:text-ink"}
            >
              {c.name} <span className="text-faint">{counts[c.id] ?? 0}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 md:px-8">
        <PhotoGrid photos={photos} title={collection.name} />
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-20 md:px-8">
          <Link href={`/portfolio/${next.slug}`} className="block">
            <span className="block text-sm text-muted">Next collection</span>
            <span className="mt-2.5 block text-[clamp(48px,8vw,120px)] font-medium leading-[0.95] tracking-[-0.05em]">
              {next.name} <span className="arrow">→</span>
            </span>
          </Link>
        </div>
      </section>

      <SiteFooter settings={site.settings} />
    </main>
  );
}
