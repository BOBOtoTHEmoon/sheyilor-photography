"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = ".reveal, .reveal-img, .reveal-row";

// Adds .in to elements as they scroll into view, so they animate in
// just before the visitor reaches them. Runs again on every page change.
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Tells the safety net in layout.tsx that animations are running
    document.documentElement.setAttribute("data-reveal", "on");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("in"));
      return;
    }
    // While the logo intro is showing, hold everything back so the page
    // animates in as the intro lifts instead of behind it.
    const w = window as Window & { __introDone?: boolean };
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    const start = () => {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io!.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.04 },
    );
    const watch = (root: ParentNode) => root.querySelectorAll(`${SELECTOR}`).forEach((el) => !el.classList.contains("in") && io!.observe(el));
    watch(document);

    // Catch anything added later (opened sections, client-side updates)
    mo = new MutationObserver((list) => {
      for (const m of list)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(SELECTOR) && !n.classList.contains("in")) io!.observe(n);
          watch(n);
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    };

    if (w.__introDone === false || document.documentElement.classList.contains("intro-playing")) {
      window.addEventListener("introdone", start, { once: true });
    } else {
      start();
    }

    return () => {
      window.removeEventListener("introdone", start);
      io?.disconnect();
      mo?.disconnect();
    };
  }, [pathname]);

  return null;
}
