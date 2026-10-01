'use client';

import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/stores/cart-store';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/studio', label: 'Design your sign' },
  { href: '/studio?mode=logo', label: 'Logo signs' },
  { href: '/faq', label: 'Help' },
];

export function SiteHeader() {
  const count = useCart((cart) => cart.items.reduce((sum, item) => sum + item.qty, 0));
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const iconLink = 'rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-ink';

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-night-900/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4" aria-label="Main">
        <Link href="/" className="font-display text-lg font-bold tracking-wide">
          <span className="neon-text">NEON</span> ADDA
        </Link>
        <div className="hidden items-center gap-6 text-sm text-muted md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/search" className={iconLink} aria-label="Search">
            <Search className="size-5" />
          </Link>
          <Link href="/account" className={iconLink} aria-label="Your account">
            <UserRound className="size-5" />
          </Link>
          <Link
            href="/cart"
            className={`relative ${iconLink}`}
            aria-label={mounted && count ? `Cart, ${count} items` : 'Cart'}
          >
            <ShoppingBag className="size-5" />
            {mounted && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-neon-pink text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className={`${iconLink} md:hidden`}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div id="mobile-menu" className="border-t border-white/5 px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-2 py-2.5 text-muted hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
