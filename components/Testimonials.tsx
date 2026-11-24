"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/types";

export function Testimonials({ items }: { items: Testimonial[] }) {
  const [i, setI] = useState(0);
  if (items.length === 0) return null;
  const t = items[i];
  const go = (d: number) => setI((i + d + items.length) % items.length);
  return (
    <section aria-label="Client words" className="border-y border-line">
      <div className="reveal mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-10 px-5 py-24 md:px-8">
        <figure key={t.id} className="rise m-0 min-w-0 flex-[1_1_640px]">
          <blockquote className="m-0 text-[clamp(28px,3.2vw,46px)] leading-[1.2] tracking-[-0.025em]">“{t.quote}”</blockquote>
          <figcaption className="mt-7 text-sm text-muted">
            {t.name}
            {t.context ? `, ${t.context.toLowerCase()}` : ""}
          </figcaption>
        </figure>
        {items.length > 1 && (
          <div className="flex items-center gap-4 text-[13px] text-muted">
            <span>
              {i + 1} / {items.length}
            </span>
            <button onClick={() => go(-1)} aria-label="Previous review" className="btn btn-ghost h-12 w-12 min-h-0 p-0 text-lg">
              ←
            </button>
            <button onClick={() => go(1)} aria-label="Next review" className="btn btn-ghost h-12 w-12 min-h-0 p-0 text-lg">
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
