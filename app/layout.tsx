import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://andrewli.app"),
  title: "Andrew Li",
  description:
    "Incoming Computer Science student at the University of Waterloo, class of 2031. Builder of OlympIQ and other tools that make people's lives a little easier.",
  openGraph: {
    title: "Andrew Li",
    description:
      "Incoming Computer Science student at the University of Waterloo, class of 2031. Builder of OlympIQ and other tools that make people's lives a little easier.",
    url: "https://andrewli.app",
    siteName: "Andrew Li",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
