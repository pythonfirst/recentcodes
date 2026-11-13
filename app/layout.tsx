import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { DISCLAIMER, NOINDEX, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/config/site";
import { JsonLd } from "@/components/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Official Game Redeem Codes | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description: "Recent Codes lists only verifiable official game redeem codes, with newest game launches first. An unofficial fan resource, not affiliated with any publisher.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
  robots: NOINDEX ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f1115" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <header className="site-header">
          <Link href="/" className="logo">
            Recent <span>Codes</span>
          </Link>
          <nav aria-label="Main">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <nav aria-label="About this site">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <p className="small">{SITE_TAGLINE}.</p>
          <p className="small disclaimer">{DISCLAIMER}</p>
        </footer>
      </body>
    </html>
  );
}
