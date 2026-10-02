import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { ReferralCapture } from '@/components/layout/referral-capture';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { NEON_FONTS_STYLESHEET } from '@neon-adda/shared';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Neon Adda | Custom LED neon signs', template: '%s | Neon Adda' },
  description:
    'Design a custom LED neon sign online, see it glow on your wall and know the price before you order.',
  openGraph: { siteName: 'Neon Adda', type: 'website', locale: 'en_IN' },
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
      </body>
    </html>
  );
}
