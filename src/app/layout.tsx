import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { ReferralCapture } from '@/components/layout/referral-capture';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SITE_URL } from '@/lib/site';
import { NEON_FONTS_STYLESHEET } from '@neon-adda/shared';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Neon Adda | Custom LED neon signs', template: '%s | Neon Adda' },
  description:
    'Design a custom LED neon sign online, see it glow on your wall and know the price before you order.',
  applicationName: 'Neon Adda',
  openGraph: { siteName: 'Neon Adda', type: 'website', locale: 'en_IN' },
  twitter: { card: 'summary_large_image' },
};

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Neon Adda',
  url: SITE_URL,
  logo: `${SITE_URL}/icon-192.png`,
  description: 'Custom LED neon signs, handmade and installed across India.',
};

export const viewport: Viewport = { themeColor: '#0b0b12' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sora.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={NEON_FONTS_STYLESHEET} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ReferralCapture />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }}
        />
      </body>
    </html>
  );
}
