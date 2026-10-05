import { formatINR } from '@neon-adda/shared';
import Link from 'next/link';
import { NeonBackdrop, NeonText } from '@/components/ui/neon-text';
import type { ProductCard as Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-white/5 bg-night-800 transition hover:border-white/20"
    >
      <NeonBackdrop className="aspect-[4/3] transition group-hover:brightness-110">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          product.design && <NeonText lines={product.design.lines} fontFamily={product.design.fontFamily} />
        )}
      </NeonBackdrop>
      <div className="px-4 py-3">
        <p className="font-semibold">{product.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {product.fromPricePaise ? `From ${formatINR(product.fromPricePaise)}` : product.category.name}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
