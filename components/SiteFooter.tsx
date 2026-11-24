import Link from "next/link";
import type { Settings } from "@/lib/types";
import { whatsappLink } from "@/lib/format";
import { Logo } from "./Logo";

export function SiteFooter({ settings, lead = "Dates for 2026 and 2027 are open" }: { settings: Settings; lead?: string }) {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-24 md:px-8 md:pt-28">
        <Link href="/book" className="reveal block text-paper">
          <span className="block text-[15px] text-[#A9A49B]">{lead}</span>
          <span className="u mt-4 inline-block text-[clamp(56px,10vw,150px)] font-medium leading-[0.95] tracking-[-0.05em]">
            Book a date →
          </span>
        </Link>
        <footer className="mt-24 flex flex-col items-center border-t border-[#333] pt-10 text-center text-[13px] text-[#A9A49B]">
          <Logo tone="white" className="h-16 md:h-20" />
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2.5">
            <Link className="u text-paper" href="/gallery">
              Client gallery
            </Link>
            <Link className="u text-paper" href="/rates">
              Rates
            </Link>
            <a className="u text-paper" href={`https://instagram.com/${settings.instagram}`}>
              Instagram
            </a>
            <a className="u text-paper" href={`https://tiktok.com/@${settings.tiktok}`}>
              TikTok
            </a>
            <a className="u text-paper" href={`https://x.com/${settings.x_handle}`}>
              X
            </a>
            <a className="u text-paper" href={whatsappLink(settings.whatsapp, settings.whatsapp_message)}>
              WhatsApp
            </a>
            <a className="u text-paper" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          </div>
          <div className="mt-4">
            © {new Date().getFullYear()} {settings.business_name}, {settings.location.split(",")[0]}
          </div>
        </footer>
      </div>
    </section>
  );
}
