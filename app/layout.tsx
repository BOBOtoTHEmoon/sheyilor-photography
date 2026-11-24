import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#F4F2EE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Lets the scroll animations hide content only when JavaScript is running */}
        <script
          dangerouslySetInnerHTML={{
            // Hide content for the scroll animations, but bring everything back after
            // 2.5s if the animation script never starts (slow network, blocked scripts).
            __html:
              "var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.hasAttribute('data-reveal'))d.classList.remove('js')},2500)",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
