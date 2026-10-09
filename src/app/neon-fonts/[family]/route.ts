import { NEON_FONT_FAMILIES } from '@neon-adda/shared';

/**
 * The neon fonts as TrueType, for the 3D sign renderer, which reads the letter outlines with
 * opentype.js. Browsers are sent WOFF2 by Google Fonts, which opentype.js cannot read; asked from
 * a server, Google answers with TrueType. Only the shop's own neon fonts are served.
 */
const FAMILIES = new Map(NEON_FONT_FAMILIES.map((spec) => [spec.split(':')[0]!, spec]));
const DAY = 86_400;

export async function GET(_request: Request, { params }: { params: Promise<{ family: string }> }) {
  const { family } = await params;
  const spec = FAMILIES.get(decodeURIComponent(family));
  if (!spec) return new Response('Unknown font', { status: 404 });

  const css = await fetch(`https://fonts.googleapis.com/css2?family=${spec.replace(/ /g, '+')}`, {
    next: { revalidate: DAY },
  })
    .then((res) => (res.ok ? res.text() : ''))
    .catch(() => '');
  const url = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/.exec(css)?.[1];
  if (!url) return new Response('Font unavailable', { status: 502 });

  const font = await fetch(url, { next: { revalidate: DAY * 30 } }).catch(() => null);
  if (!font?.ok) return new Response('Font unavailable', { status: 502 });
  return new Response(await font.arrayBuffer(), {
    headers: {
      'content-type': 'font/ttf',
      'cache-control': `public, max-age=${DAY * 30}, immutable`,
    },
  });
}
