/**
 * The storefront's public address, for canonical links, the sitemap and share previews.
 * `NEXT_PUBLIC_SITE_URL` wins; on Vercel the production domain is used when it is not set.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '');
