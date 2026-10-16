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
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <p className="eyebrow">{current ? 'Collection' : 'Shop'}</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">
        {current?.name ?? 'Ready-made neon signs'}
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        {current?.description ??
          'Popular designs in three sizes, made and tested in about a week. Change the words of any of them in the designer.'}
      </p>

      <div className="sticky top-16 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-white/5 bg-night-900/95 px-4 py-3 backdrop-blur">
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

      <p className="mt-6 text-sm text-muted">
        {products.length} {products.length === 1 ? 'design' : 'designs'}
      </p>
      <div className="mt-4">
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            icon={PenTool}
            title="Nothing here yet"
            body="Design exactly what you want instead, with the price as you go."
            action={{ href: '/create', label: 'Design your sign' }}
          />
        )}
      </div>

      <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-display text-xl font-semibold">Have your own words in mind?</p>
          <p className="mt-1 text-sm text-muted">
            Type them in the designer and see the sign lit in 3D, with the price.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
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
          ? 'border-white bg-white text-night-900'
          : 'border-white/15 text-muted hover:border-white/40 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
