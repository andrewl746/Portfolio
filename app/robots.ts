import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/Andrew_Li_Resume.pdf',
    },
    sitemap: 'https://andrewli.app/sitemap.xml',
  }
}