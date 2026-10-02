import { Check, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/shop/buy-box';
import { PincodeCheck } from '@/components/shop/pincode-check';
import { ProductGrid } from '@/components/shop/product-card';
import { NeonBackdrop, NeonText } from '@/components/ui/neon-text';
import { fetchProduct, loadStorefrontData } from '@/lib/api';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await fetchProduct((await params).slug);
  if (!product) return {};
  return {
    title: `${product.name} neon sign`,
    description: product.description ?? `${product.name} LED neon sign, handmade and delivered across India.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, { rules }] = await Promise.all([fetchProduct(slug), loadStorefrontData()]);
  if (!product?.design || !product.sizes.length || !product.backboards.length) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <NeonBackdrop className="aspect-[4/3] rounded-3xl border border-white/5 lg:sticky lg:top-24">
          <NeonText
            lines={product.design.lines}
            fontFamily={product.design.fontFamily}
            size="lg"
            className="animate-flicker-on"
          />
        </NeonBackdrop>

        <div>
          <h1 className="font-display text-3xl font-bold">{product.name}</h1>
          {product.description && <p className="mt-3 text-muted">{product.description}</p>}

          <div className="mt-6">
            <BuyBox product={product} rules={rules} />
          </div>

          <div className="mt-6">
            <PincodeCheck />
          </div>

          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted">
              <Clock className="size-4 text-neon-cyan" /> Made and tested in {product.leadTimeDays} working
              days
            </li>
            {product.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2 text-muted">
                <Check className="size-4 text-neon-cyan" /> {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 font-display text-2xl font-semibold">You may also like</h2>
          <ProductGrid products={product.related} />
        </section>
      )}
    </div>
  );
}
