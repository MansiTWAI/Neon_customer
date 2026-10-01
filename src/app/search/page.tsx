import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductGrid } from '@/components/shop/product-card';
import { EmptyState } from '@/components/ui/card';
import { fetchProducts } from '@/lib/api';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().slice(0, 60) ?? '';
  const products = query.length >= 2 ? await fetchProducts({ q: query }) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <form action="/search" className="flex max-w-xl gap-2">
        <label className="sr-only" htmlFor="q">
          Search signs
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search for wedding, café, quotes…"
          minLength={2}
          autoFocus={!query}
          className="w-full rounded-full border border-white/10 bg-night-900 px-5 py-3 outline-none focus:border-neon-cyan"
        />
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-neon-pink text-white"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>
      </form>

      {query && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-muted">
            {products.length} {products.length === 1 ? 'sign' : 'signs'} for “{query}”
          </p>
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState
              icon={Search}
              title="No ready-made signs match"
              body="Type exactly what you want in the studio and we will make it."
              action={{ href: `/studio?text=${encodeURIComponent(query)}`, label: `Design “${query}”` }}
            />
          )}
        </div>
      )}
      {!query && (
        <p className="mt-6 text-sm text-muted">
          Or browse the{' '}
          <Link href="/shop" className="text-neon-cyan hover:underline">
            whole shop
          </Link>
          .
        </p>
      )}
    </div>
  );
}
