import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

// The site is one page. Its sections are anchors on it, and search engines
// ignore everything after the #, so they don't get entries of their own.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, lastModified: new Date() }];
}
