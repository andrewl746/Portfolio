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
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Andrew Li",
    description:
      "Computer Science student at the University of Waterloo. Founder of OlympIQ and other tools that make people's lives easier.",
    url: "https://andrewli.app",
    siteName: "Andrew Li",
    images: [
      {
        url: "/icon.svg",
        width: 64,
        height: 64,
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
    images: ["/icon.svg"],
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
