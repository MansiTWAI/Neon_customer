import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
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
  const page = USE_CASES[(await params).use];
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function UsePage({ params }: UsePageProps) {
  const page = USE_CASES[(await params).use];
  if (!page) notFound();
  const products = await fetchProducts({ tag: page.tag }).catch(() => []);

  return (
    <>
      <section className="border-b border-white/5 bg-[radial-gradient(ellipse_at_top,#2a1020,#0b0b12_65%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <p className="text-sm font-semibold tracking-widest text-neon-cyan uppercase">{page.title}</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold md:text-5xl">{page.headline}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{page.intro}</p>
          <Link
            href="/studio"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon"
          >
            Design yours <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-2xl font-semibold">Start from an idea</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3">
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
