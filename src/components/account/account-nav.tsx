'use client';

import { Bookmark, LayoutGrid, MapPin, Package, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/account', label: 'Overview', icon: LayoutGrid },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/quotes', label: 'Quotations', icon: ReceiptText },
  { href: '/account/designs', label: 'Saved designs', icon: Bookmark },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
];

export function AccountNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/account' ? pathname === href : pathname.startsWith(href));

  return (
    <nav
      aria-label="Account"
      className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0"
    >
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
            isActive(href)
              ? 'bg-white/10 font-semibold text-ink'
              : 'text-muted hover:bg-white/5 hover:text-ink'
          }`}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
