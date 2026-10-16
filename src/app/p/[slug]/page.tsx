import { Banknote, Check, Clock, PenLine } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/shop/buy-box';
import { PincodeCheck } from '@/components/shop/pincode-check';
import { ProductGrid } from '@/components/shop/product-card';
import { ProductGallery } from '@/components/shop/product-gallery';
import { signPhotos } from '@/content/sign-photos';
import { fetchProduct, loadStorefrontData } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await fetchProduct((await params).slug);
  if (!product) return {};
  return {
    title: `${product.name} neon sign`,
    description: product.description ?? `${product.name} LED neon sign, handmade and delivered across India.`,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { images: [product.imageUrl ?? signPhotos(product.slug)?.front].filter(Boolean) as string[] },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, { rules }] = await Promise.all([fetchProduct(slug), loadStorefrontData()]);
  if (!product?.design || !product.sizes.length || !product.backboards.length) notFound();

  // Lets search engines show the product with its starting price.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name} neon sign`,
    description: product.description ?? undefined,
    image:
      product.imageUrl ??
      (signPhotos(product.slug) ? `${SITE_URL}${signPhotos(product.slug)!.front}` : undefined),
    category: product.category.name,
    brand: { '@type': 'Brand', name: 'Neon Adda' },
    url: `${SITE_URL}/p/${product.slug}`,
    ...(product.fromPricePaise
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: (product.fromPricePaise / 100).toFixed(2),
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  const photos = signPhotos(product.slug);
  const colours = [...new Set(product.design.lines.map((line) => line.colorName))];
  const specs: [string, React.ReactNode][] = [
    [
      'Lettering',
      `${product.design.lines.map((line) => line.text).join(' / ')} in ${product.design.fontFamily}`,
    ],
    ['Colours', colours.join(', ')],
    [
      'Sizes',
      <ul key="sizes" className="space-y-0.5">
        {product.sizes.map((size) => (
          <li key={size.label}>
            {size.label}: {size.widthIn}″ × {size.heightIn}″{' '}
            <span className="text-muted">
              ({Math.round(size.widthIn * 2.54)} × {Math.round(size.heightIn * 2.54)} cm)
            </span>
          </li>
        ))}
      </ul>,
    ],
    ['Backboards', product.backboards.map((board) => board.name).join(', ')],
    ['Made in', `${product.leadTimeDays} working days, then shipped`],
    ['Power', '12 V adapter with a 2 m clear cable'],
    ['In the box', 'The sign on its backboard, adapter, wall standoffs and screws, mounting guide'],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            name={product.name}
            photos={photos}
            imageUrl={product.imageUrl}
            design={product.design}
          />
        </div>

        <div>
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
          {product.description && <p className="mt-3 text-muted">{product.description}</p>}

          <div className="mt-6 border-t border-white/10 pt-6">
            <BuyBox product={product} rules={rules} />
          </div>

          <div className="mt-6">
            <PincodeCheck />
          </div>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-ink/70" aria-hidden /> Made and tested in{' '}
              {product.leadTimeDays} working days
            </li>
            <li className="flex items-center gap-2.5">
              <PenLine className="size-4 shrink-0 text-ink/70" aria-hidden /> Design proof before we make it,
              three rounds of changes included
            </li>
            <li className="flex items-center gap-2.5">
              <Banknote className="size-4 shrink-0 text-ink/70" aria-hidden /> Cash on delivery ·{' '}
              <Link href="/policies/warranty" className="text-ink underline underline-offset-4">
                warranty terms
              </Link>
            </li>
            {product.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2.5">
                <Check className="size-4 shrink-0 text-ink/70" aria-hidden /> {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-16 grid gap-10 border-t border-white/10 pt-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="eyebrow">Details</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Specifications</h2>
          <p className="mt-3 text-sm text-muted">
            Want different words, a font or a colour?{' '}
            <Link href="/create" className="text-ink underline underline-offset-4">
              Design your own
            </Link>
            , or see the{' '}
            <Link href="/size-guide" className="text-ink underline underline-offset-4">
              size guide
            </Link>
            .
          </p>
        </div>
        <dl className="divide-y divide-white/10 border-y border-white/10 text-sm">
          {specs.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[8rem_1fr] gap-4 py-3.5 sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[8rem_1fr] gap-4 py-3.5 sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted">Installation</dt>
            <dd>
              Screw-mounted with the standoffs provided. In partner cities a technician can install it; check
              your pincode above.
            </dd>
          </div>
        </dl>
      </section>

      {product.related.length > 0 && (
        <section className="mt-16 border-t border-white/10 pt-12">
          <p className="eyebrow">More like this</p>
          <h2 className="mt-2 mb-8 font-display text-2xl font-semibold">You may also like</h2>
          <ProductGrid products={product.related} />
        </section>
      )}
    </div>
  );
}
