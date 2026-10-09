import type { MetadataRoute } from 'next';
import { SITE_URL as SITE } from '@/lib/site';
import { POLICIES } from '@/content/policies';
import { USE_CASES } from '@/content/uses';
import { fetchCategories, fetchProducts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchProducts().catch(() => []),
  ]);

  const paths = [
    '/',
    '/shop',
    '/studio',
    '/create',
    '/faq',
    '/size-guide',
    '/about',
    '/contact',
    ...categories.map((c) => `/shop/${c.slug}`),
    ...products.map((p) => `/p/${p.slug}`),
    ...Object.keys(USE_CASES).map((slug) => `/neon-for/${slug}`),
    ...Object.keys(POLICIES).map((slug) => `/policies/${slug}`),
  ];
  return paths.map((path) => ({ url: `${SITE}${path}` }));
}
