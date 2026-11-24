import Link from "next/link";

// Sheyilor script logo. Source files: public/brand/logo-black.png and logo-white.png (1200 × 448)
export function Logo({ tone = "black", className = "h-14 md:h-[76px]" }: { tone?: "black" | "white"; className?: string }) {
  return (
    <Link href="/" aria-label="Sheyilor Photography, home" className="inline-block shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/brand/logo-${tone}.png`} alt="Sheyilor Photography" width={1200} height={448} className={`w-auto ${className}`} />
    </Link>
  );
}
