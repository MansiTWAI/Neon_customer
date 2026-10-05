import { ArrowRight, Hammer, PenTool, Ruler, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Faq } from '@/components/home/faq';
import { IdeaCard } from '@/components/home/idea-card';
import { ProductGrid } from '@/components/shop/product-card';
import { fetchProducts } from '@/lib/api';

const IDEAS = [
  { label: 'Bedroom', text: 'Riya', font: 'Neonderthaw', color: '#FF2E88' },
  { label: 'Weddings', text: 'Mr & Mrs', font: 'Great Vibes', color: '#FFD89A' },
  { label: 'Cafés', text: 'But first, coffee', font: 'Yellowtail', color: '#22D3EE' },
  { label: 'Workspaces', text: 'Hustle', font: 'Monoton', color: '#8B5CF6' },
];

const STEPS = [
  {
    icon: PenTool,
    title: 'Design it',
    body: 'Type your words, pick a font and colour, and see it glow on a wall.',
  },
  {
    icon: Ruler,
    title: 'Approve the proof',
    body: 'Our designers send the final artwork. Nothing is made until you approve.',
  },
  {
    icon: Hammer,
    title: 'We make it',
    body: 'Each sign is handcrafted and tested in our workshop, usually within a week.',
  },
  {
    icon: Truck,
    title: 'Delivered or installed',
    body: 'Shipped across India, with installation in cities where we have partners.',
  },
];

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const featured = (await fetchProducts().catch(() => [])).filter((p) => p.isFeatured).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-sm font-semibold tracking-widest text-neon-cyan uppercase">Custom LED neon</p>
            <h1 className="mt-3 font-display text-4xl leading-tight font-bold md:text-6xl">
              Your words.
              <br />
              <span className="neon-text">In neon.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Design your sign, see it on your wall and know the price before you order. Priced by size, never
              by guesswork.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon"
              >
                Design your sign <ArrowRight className="size-4" />
              </Link>
              <Link href="/shop" className="font-semibold text-muted transition hover:text-ink">
                Shop ready-made signs
              </Link>
            </div>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_center,#2a1020,#0b0b12_70%)]">
            <span
              className="animate-flicker-on text-6xl neon-text md:text-7xl"
              style={{ fontFamily: 'Neonderthaw, cursive' }}
            >
              Good Vibes
            </span>
          </div>
        </div>
      </section>

      <section id="uses" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">Start from an idea</h2>
        <p className="mt-2 text-muted">Pick one and make it yours in the studio.</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IDEAS.map((idea) => (
            <IdeaCard key={idea.label} {...idea} />
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold">Ready to hang</h2>
              <p className="mt-2 text-muted">Popular designs, made and shipped in about a week.</p>
            </div>
            <Link href="/shop" className="shrink-0 text-sm font-semibold text-neon-cyan hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      <section className="border-y border-white/5 bg-night-950">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold">How it works</h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-2xl border border-white/5 bg-night-800 p-6">
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-neon-pink" />
                  <span className="text-sm font-semibold text-muted tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">Questions, answered</h2>
        <Faq />
      </section>
    </>
  );
}
