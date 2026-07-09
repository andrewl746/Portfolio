import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://andrewli.app"),
  title: "Andrew Li",
  description:
    "Computer Science student at the University of Waterloo. Founder of OlympIQ and other tools that make people's lives easier.",
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
    description:
      "Computer Science student at the University of Waterloo. Founder of OlympIQ and other tools that make people's lives easier.",
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
    description:
      "Computer Science student at the University of Waterloo. Founder of OlympIQ and other tools that make people's lives easier.",
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
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
