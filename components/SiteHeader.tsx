"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "./Logo";

type Props = { active?: "work" | "rates" | "about" | "book" };

const LINKS = [
  { href: "/#work", label: "Work", key: "work" },
  { href: "/rates", label: "Rates", key: "rates" },
  { href: "/#about", label: "About", key: "about" },
] as const;

export function SiteHeader({ active }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="rise grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3 md:flex md:justify-between md:px-8">
      {/* Phone: menu on the left */}
      <button
        type="button"
        className="h-11 justify-self-start text-[15px] font-medium md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        Menu
      </button>

      <div className="justify-self-center md:justify-self-auto">
        <Logo />
      </div>

      {/* Phone: book on the right */}
      <Link href="/book" className="justify-self-end text-[15px] font-medium md:hidden">
        Book
      </Link>

      {/* Desktop */}
      <nav aria-label="Main" className="hidden items-center gap-8 text-sm md:flex">
        {LINKS.map((l) => (
          <Link key={l.key} className={`u${active === l.key ? " font-semibold" : ""}`} href={l.href}>
            {l.label}
          </Link>
        ))}
        <Link className="u font-semibold" href="/book">
          Book a date →
        </Link>
      </nav>

      {/* Rendered into <body> so the header's entrance animation can't trap it */}
      {open && createPortal(
        <div id="mobile-menu" role="dialog" aria-label="Menu" className="menu fixed inset-0 z-50 flex flex-col bg-paper px-5 py-3 md:hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <button type="button" className="h-11 justify-self-start text-[15px] font-medium" onClick={() => setOpen(false)}>
              Close
            </button>
            <Logo />
            <span />
          </div>
          <nav aria-label="Main" className="mt-14 flex flex-col">
            {[...LINKS, { href: "/gallery", label: "Client gallery", key: "gallery" }].map((l, i) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="menu-item border-b border-line py-5 text-[40px] font-medium leading-none tracking-[-0.03em]"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/book" onClick={() => setOpen(false)} className="menu-item btn mt-auto mb-6 w-full" style={{ animationDelay: "520ms" }}>
            Book a date
          </Link>
        </div>,
        document.body,
      )}
    </header>
  );
}
