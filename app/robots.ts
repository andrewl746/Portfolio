import { MetadataRoute } from 'next'
import { SITE } from '@/lib/content'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/Andrew_Li_Resume.pdf',
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}