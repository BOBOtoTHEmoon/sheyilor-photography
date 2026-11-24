"use client";

import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/types";

// Masonry grid with a full-screen viewer (arrow keys and Esc work too)
export function PhotoGrid({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = photos.length;
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  if (n === 0) {
    return <p className="py-24 text-center text-muted">New photos for this collection are coming soon.</p>;
  }

  const current = open === null ? null : photos[open];

  return (
    <>
      <div className="columns-2 gap-2.5 md:columns-3 md:gap-4 xl:columns-4">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1}`}
            className="shot reveal-img mb-2.5 block w-full cursor-zoom-in border-0 p-0 md:mb-4"
            style={{ breakInside: "avoid", aspectRatio: p.width && p.height ? `${p.width} / ${p.height}` : "4 / 5", ["--d" as string]: `${(i % 3) * 200}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.alt} loading={i < 3 ? "eager" : "lazy"} />
          </button>
        ))}
      </div>

      {current && (
        <div role="dialog" aria-label="Photo viewer" className="fixed inset-0 z-50 flex flex-col bg-[#111]/95" style={{ animation: "up .3s both" }}>
          <div className="flex items-center justify-between px-6 py-4 text-sm text-paper">
            <span>
              {title} · {open! + 1} / {n}
            </span>
            <button onClick={() => setOpen(null)} aria-label="Close" className="btn btn-light h-11 w-11 min-h-0 p-0">
              ✕
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center gap-4 px-4 pb-8">
            <button onClick={() => step(-1)} aria-label="Previous photo" className="btn btn-light h-12 w-12 min-h-0 shrink-0 p-0">
              ←
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.alt} className="max-h-[80vh] max-w-[min(78vw,1000px)] object-contain" />
            <button onClick={() => step(1)} aria-label="Next photo" className="btn btn-light h-12 w-12 min-h-0 shrink-0 p-0">
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
