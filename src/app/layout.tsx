import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree, IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bas-check.vercel.app"),
  title: {
    default: "BAS Check",
    template: "%s | BAS Check",
  },
  description:
    "Plain-English GST coding checks on an Australian CSV. Not a BAS agent. Not tax advice.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe6d4" },
    { media: "(prefers-color-scheme: dark)", color: "#08110f" },
  ],
};

/** CSP nonce is per request; a static prerender leaves scripts as nonce="$undefined". */
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await headers();
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="site-canvas flex min-h-full flex-col font-sans text-ink">
        <a className="skip-link" href="#main">
          Skip to check
        </a>
        <Suspense>
          <SiteHeader />
        </Suspense>
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
