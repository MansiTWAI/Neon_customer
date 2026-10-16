import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_SCENES } from '@/content/sign-photos';
import { notFound } from 'next/navigation';
import { IdeaCard } from '@/components/home/idea-card';
import { ProductGrid } from '@/components/shop/product-card';
import { USE_CASES } from '@/content/uses';
import { fetchProducts } from '@/lib/api';

interface UsePageProps {
  params: Promise<{ use: string }>;
}

export function generateStaticParams() {
  return Object.keys(USE_CASES).map((use) => ({ use }));
}

export async function generateMetadata({ params }: UsePageProps): Promise<Metadata> {
  const use = (await params).use;
  const page = USE_CASES[use];
  return page
    ? { title: page.title, description: page.intro, alternates: { canonical: `/neon-for/${use}` } }
    : {};
}

export default async function UsePage({ params }: UsePageProps) {
  const page = USE_CASES[(await params).use];
  if (!page) notFound();
  const products = await fetchProducts({ tag: page.tag }).catch(() => []);
  const scene = CATEGORY_SCENES[(await params).use];

  return (
    <>
      <section className="border-b border-white/5 bg-night-950">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_1.15fr] md:py-16">
          <div>
            <p className="eyebrow">{page.title}</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              {page.headline}
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted">{page.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="btn-primary">
                Design yours <ArrowRight className="size-4" />
              </Link>
              <Link href="/shop" className="btn-outline">
                Shop ready-made
              </Link>
            </div>
          </div>
          {scene && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={scene}
                alt={`A neon sign in a ${page.label.toLowerCase()} setting`}
                fill
                priority
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <p className="eyebrow">Ideas</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Start from an idea</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {page.ideas.map((idea) => (
            <IdeaCard
              key={idea.text}
              label={idea.text}
              text={idea.text}
              font={idea.font}
              color={idea.glowHex}
            />
          ))}
        </div>
      </section>

      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <h2 className="mb-6 font-display text-2xl font-semibold">Ready to order</h2>
          <ProductGrid products={products} />
        </section>
      )}

      <section className="border-t border-white/5 bg-night-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-14 sm:grid-cols-3">
          {page.points.map((point) => (
            <div key={point.title}>
              <h3 className="font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm text-muted">{point.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
