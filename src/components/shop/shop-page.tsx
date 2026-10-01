import { PenTool } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/ui/card';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { ProductGrid } from './product-card';
import { SORTS, SortSelect, type Sort } from './sort-select';

export const toSort = (value: string | undefined): Sort =>
  value && value in SORTS ? (value as Sort) : 'featured';

/** The shop listing, for all signs or one category. */
export async function ShopPage({ category, sort }: { category?: string; sort: Sort }) {
  const [categories, products] = await Promise.all([fetchCategories(), fetchProducts({ category, sort })]);
  const current = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">{current?.name ?? 'Shop neon signs'}</h1>
      <p className="mt-2 max-w-xl text-muted">
        {current?.description ??
          'Ready-made designs in three sizes, or start from one and make it yours in the studio.'}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <nav
          aria-label="Categories"
          className="-mx-1 flex [scrollbar-width:none] gap-2 overflow-x-auto px-1 pb-1"
        >
          <CategoryLink href="/shop" active={!category}>
            All
          </CategoryLink>
          {categories.map((c) => (
            <CategoryLink key={c.slug} href={`/shop/${c.slug}`} active={c.slug === category}>
              {c.name}
            </CategoryLink>
          ))}
        </nav>
        <Suspense>
          <SortSelect value={sort} />
        </Suspense>
      </div>

      <div className="mt-6">
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={PenTool}
            title="Nothing here yet"
            body="Design exactly what you want in the studio instead."
            action={{ href: '/studio', label: 'Open the studio' }}
          />
        )}
      </div>

      <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/5 bg-night-800 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">Have your own words in mind?</p>
          <p className="mt-1 text-sm text-muted">Type them in the studio and see the price as you design.</p>
        </div>
        <Link
          href="/studio"
          className="rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon"
        >
          Design your own
        </Link>
      </div>
    </div>
  );
}

function CategoryLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? 'border-neon-pink bg-neon-pink/15 text-white'
          : 'border-white/15 text-muted hover:border-white/40 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
