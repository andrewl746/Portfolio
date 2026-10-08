import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
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
  "Computer Science student at the University of Waterloo. Software engineer at Marble Investments and UW Orbital, aimed at aerospace.";

export const metadata: Metadata = {
  metadataBase: new URL("https://andrewli.app"),
  title: "Andrew Li",
  description: DESCRIPTION,
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
    url: "https://andrewli.app",
    siteName: "Andrew Li",
    images: [
      {
        url: "/app-icon-og-v2.png",
        width: 512,
        height: 512,
        alt: "Andrew Li app icon",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Andrew Li",
    description: DESCRIPTION,
    images: ["/app-icon-og-v2.png"],
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
