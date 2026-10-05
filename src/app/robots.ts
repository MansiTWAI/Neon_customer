import type { MetadataRoute } from 'next';
import { SITE_URL as SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/checkout', '/orders', '/cart', '/login', '/d/'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
