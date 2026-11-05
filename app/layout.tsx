import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/content";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

// Phones tint their address/status bar with theme-color, so it blends into
// the night sky instead of showing a white or grey strip above the site.
export const viewport: Viewport = {
  themeColor: "#07080d",
  colorScheme: "dark",
};

const DESCRIPTION =
  "Computer Science student at the University of Waterloo. Software engineer at Marble Investments and UW Orbital.";

export const metadata: Metadata = {
  // Relative URLs below (canonical, link preview image) resolve against this.
  metadataBase: new URL(SITE.url),
  title: "Andrew Li",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  icons: {
    // One square source everywhere: the tab shows the square icon, and Google
    // masks it into a circle on its own end (the star has padding, so it
    // survives the crop cleanly).
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/app-icon-og-v2.png",
  },
  openGraph: {
    title: "Andrew Li",
    description: DESCRIPTION,
    url: "/",
    siteName: "Andrew Li",
    // Link preview card for LinkedIn, X, iMessage and so on. Only text that
    // doesn't change with the hero, so it never needs updating with it.
    images: [
      {
        // A new file name when the image changes, so link previews that
        // cached the old one fetch it fresh.
        url: "/og-image-v2.jpg",
        width: 1200,
        height: 630,
        alt: "Andrew Li, software engineer, aiming for space, above eastern North America at night with a satellite in orbit",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Andrew Li",
    description: DESCRIPTION,
    images: ["/og-image-v2.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
      // The inline script below adds `js` before hydration, so React would
      // otherwise warn about the className mismatch on <html>.
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint: marks JS as available so animated content
            can wait for its animation instead of flashing the final state. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="min-h-full">
        {children}
        {/* Vercel Web Analytics: page views and referrers, with no cookies.
            Its script only exists on Vercel once Analytics is switched on
            for the project in the Vercel dashboard. */}
        <Analytics />
      </body>
    </html>
  );
}
