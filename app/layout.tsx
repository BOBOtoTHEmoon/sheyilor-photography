import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteUrl } from "@/lib/format";
import { RevealObserver } from "@/components/RevealObserver";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Sheyilor Photography · Portrait, wedding and fashion photographer in Lagos",
    template: "%s · Sheyilor Photography",
  },
  description:
    "Lagos photographer for birthday portraits, weddings, fashion and events. See the work, check the rates and book your date online.",
  // The share image and icons come from app/opengraph-image.jpg, app/icon.png and app/apple-icon.png
  openGraph: {
    type: "website",
    siteName: "Sheyilor Photography",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    site: "@its_sheyilor",
  },
};

// Instrument Sans, served from this site rather than Google Fonts so the page never
// waits on a second server before it can paint.
const instrument = localFont({
  src: "./fonts/InstrumentSans.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-instrument",
});

const BOOT = `(function(){
var d=document.documentElement;d.classList.add('js');
setTimeout(function(){if(!d.hasAttribute('data-reveal'))d.classList.remove('js')},2500);
var seen=false;try{seen=sessionStorage.getItem('shy-intro')==='1';sessionStorage.setItem('shy-intro','1')}catch(e){}
var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function done(){window.__introDone=true;window.dispatchEvent(new Event('introdone'))}
if(seen||calm){done();return}
d.classList.add('intro-playing','intro-on');
setTimeout(function(){d.classList.add('intro-leave');d.classList.remove('intro-playing');done()},2800);
setTimeout(function(){d.classList.remove('intro-on','intro-leave')},4200);
})();`;

export const viewport: Viewport = {
  themeColor: "#F4F2EE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={instrument.variable} suppressHydrationWarning>
      <head>
        {/* Runs before anything is painted:
            1. Lets the scroll animations hide content only while JavaScript is running,
               with a safety net that shows everything if the animation script never starts.
            2. Plays the logo intro once per visit. Page animations wait until it lifts. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>
        <div className="intro" aria-hidden="true">
          <div className="intro-logo" />
        </div>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
