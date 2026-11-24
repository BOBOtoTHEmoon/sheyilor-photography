"use client";

import { useEffect, useState } from "react";

// A short logo intro on the first visit of each session, then the page wipes in.
export function Intro() {
  const [state, setState] = useState<"hidden" | "show" | "leave">("hidden");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("shy-intro") === "1";
      sessionStorage.setItem("shy-intro", "1");
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setState("show");
    const t1 = setTimeout(() => setState("leave"), 2700);
    const t2 = setTimeout(() => setState("hidden"), 4100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (state === "hidden") return null;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-paper"
      style={{
        transition: "clip-path 1.3s cubic-bezier(0.65, 0, 0.25, 1)",
        clipPath: state === "leave" ? "inset(0 0 100% 0)" : "inset(0 0 0 0)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-black.png" alt="" className="intro-logo h-auto w-[min(70vw,420px)]" />
    </div>
  );
}
