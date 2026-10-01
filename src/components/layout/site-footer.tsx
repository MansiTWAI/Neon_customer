import Link from 'next/link';
import { POLICIES } from '@/content/policies';
import { USE_CASES } from '@/content/uses';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All signs' },
      { href: '/studio', label: 'Design your sign' },
      { href: '/studio?mode=logo', label: 'Logo signs' },
      { href: '/quote', label: 'Bulk and large orders' },
    ],
  },
  {
    title: 'Ideas',
    links: Object.entries(USE_CASES).map(([slug, page]) => ({
      href: `/neon-for/${slug}`,
      label: page.label,
    })),
  },
  {
    title: 'Help',
    links: [
      { href: '/faq', label: 'Questions and answers' },
      { href: '/size-guide', label: 'Size guide' },
      { href: '/account/orders', label: 'Track an order' },
      { href: '/contact', label: 'Contact us' },
      { href: '/about', label: 'About us' },
    ],
  },
  {
    title: 'Policies',
    links: Object.entries(POLICIES).map(([slug, policy]) => ({
      href: `/policies/${slug}`,
      label: policy.title,
    })),
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-night-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm text-muted sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-display text-base font-bold text-ink">
            <span className="neon-text">NEON</span> ADDA
          </p>
          <p className="mt-3 max-w-xs">
            Handmade LED neon signs for homes, weddings and businesses across India.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="font-semibold text-ink">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-white/5 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Neon Adda. Prices include GST.
      </p>
    </footer>
  );
}
