import Link from "next/link";
import { Logo } from "./Logo";

type Props = { active?: "work" | "rates" | "about" | "book" };

export function SiteHeader({ active }: Props) {
  const cls = (key: Props["active"]) => `u${active === key ? " font-semibold" : ""}`;
  return (
    <header className="rise flex flex-wrap items-center justify-between gap-4 px-5 py-3 md:px-8">
      <Logo />
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm">
        <Link className={`${cls("work")} hidden md:inline`} href="/#work">
          Work
        </Link>
        <Link className={`${cls("rates")} hidden md:inline`} href="/rates">
          Rates
        </Link>
        <Link className={`${cls("about")} hidden md:inline`} href="/#about">
          About
        </Link>
        <Link className="u" href="/gallery">
          Client gallery
        </Link>
        <Link className="u font-semibold" href="/book">
          Book a date →
        </Link>
      </nav>
    </header>
  );
}
