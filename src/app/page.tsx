import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Faq } from '@/components/home/faq';
import { TrustRow } from '@/components/home/trust';
import { ProductCard } from '@/components/shop/product-card';
import { CATEGORY_SCENES, SCENES, signPhotos } from '@/content/sign-photos';
import { USE_CASES } from '@/content/uses';
import { fetchCategories, fetchProducts } from '@/lib/api';

/** The three ways to buy. */
const ROUTES = [
  {
    eyebrow: 'Made to order',
    title: 'Your name or words',
    body: 'Type it, choose the font, colours and size, and see it lit in 3D with the price.',
    cta: 'Design your sign',
    href: '/create',
    image: SCENES.nameSign,
  },
  {
    eyebrow: 'Ready to hang',
    title: 'Ready-made designs',
    body: 'Popular signs in three sizes, made and shipped in about a week.',
    cta: 'Shop the collection',
    href: '/shop',
    image: '/images/signs/but-first-coffee-room.jpg',
  },
  {
    eyebrow: 'For business',
    title: 'Logos and shop signage',
    body: 'Upload your logo and our team sends a quotation and mock-up within a day.',
    cta: 'Get a logo quote',
    href: '/studio?mode=logo',
    image: SCENES.logoSign,
  },
];

/** What comes with every sign, from the FAQ and the warranty policy. */
const IN_THE_BOX = [
  'LED neon flex, bent by hand to your lettering',
  'Clear or black acrylic backboard, cut and drilled',
  'Wall standoffs and screws, with a mounting guide',
  '12 V adapter with a 2 m clear cable',
  'One-year warranty on the LEDs, adapter and dimmer',
];

const DESIGNER_POINTS = [
  'Names and dates in up to three lines',
  '25 neon symbols, bent like your letters',
  'Download a picture to share',
];

const STEPS = [
  {
    title: 'Design it',
    body: 'Type your words, pick a font, colour and size, and see the price as you go.',
  },
  {
    title: 'Approve the proof',
    body: 'Our designers send the final artwork with exact tube placement. Three rounds of changes are included.',
  },
  {
    title: 'We make it',
    body: 'Handcrafted and tested in about a week, delivered across India or installed in partner cities.',
  },
];

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchCategories().catch(() => []),
  ]);
  // Featured designs first, then the rest of the catalogue.
  const bestSellers = [...products].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).slice(0, 4);
  const detail = signPhotos('good-vibes-only')?.detail;
  const useCases = Object.entries(USE_CASES);

  return (
    <>
      {/* A real sign in a believable room, with the words on the dark wall beside it. */}
      <section className="relative isolate overflow-hidden bg-night-950">
        {/* Phones see the picture, then the words; wider screens set the words on the dark wall. */}
        <div className="relative aspect-[5/4] md:absolute md:inset-0 md:-z-10 md:aspect-auto">
          <Image
            src={SCENES.hero}
            alt="A pink “Good vibes only” LED neon sign on clear acrylic above a sofa"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center]"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night-950 to-transparent md:hidden" />
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(7_7_11/0.95)_0%,rgb(7_7_11/0.7)_32%,transparent_58%)] md:block" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col px-4 pt-2 pb-12 md:min-h-[620px] md:justify-center md:py-24">
          <p className="eyebrow">Custom LED neon signs · Handmade in India</p>
          <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl">
            Your words, bent into light.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink/80">
            Design a sign for your home, wedding or business, see it lit in 3D, and know the price before you
            order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="btn-primary">
              Design your sign <ArrowRight className="size-4" />
            </Link>
            <Link href="/shop" className="btn-outline bg-night-950/40 backdrop-blur">
              Shop ready-made
            </Link>
          </div>
          <TrustRow className="mt-10" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
          {ROUTES.map((route) => (
            <Link key={route.href} href={route.href} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src={route.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <p className="mt-5 eyebrow">{route.eyebrow}</p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold">{route.title}</h2>
              <p className="mt-2 text-muted">{route.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-semibold">
                {route.cta}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <SectionHeading
              eyebrow="Best sellers"
              title="Signs people order most"
              link={{ href: '/shop', label: 'Shop all signs' }}
            />
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
            <Link href="/shop" className="mt-10 btn-outline w-full sm:hidden">
              Shop all signs
            </Link>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="border-t border-white/5 bg-night-950">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <SectionHeading eyebrow="Collections" title="Shop by space" />
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop/${category.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-night-900"
                >
                  {CATEGORY_SCENES[category.slug] && (
                    <Image
                      src={CATEGORY_SCENES[category.slug]!}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="font-display text-lg font-semibold sm:text-xl">{category.name}</p>
                    <p className="mt-0.5 text-sm text-ink/70">
                      {category.products} {category.products === 1 ? 'design' : 'designs'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">
              Ideas for{' '}
              {useCases.map(([slug, page], index) => (
                <span key={slug}>
                  <Link
                    href={`/neon-for/${slug}`}
                    className="text-ink underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  >
                    {page.label.toLowerCase()}
                  </Link>
                  {index < useCases.length - 2 ? ', ' : index === useCases.length - 2 ? ' and ' : '.'}
                </span>
              ))}
            </p>
          </div>
        </section>
      )}

      <section className="border-t border-white/5">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={SCENES.coupleDetail}
              alt="A two-colour name sign with a neon heart, seen from the side on clear acrylic"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="md:pl-6">
            <p className="eyebrow">The 3D designer</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              See it lit before you buy.
            </h2>
            <p className="mt-4 text-muted">
              Your exact words are bent into tubes as you type, in the shop&rsquo;s own fonts and colours. Add
              a heart, a crown or a lightning bolt, choose clear or black acrylic, and turn the sign to see
              its depth. The price updates with every change.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {DESIGNER_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-ink/70" aria-hidden /> {point}
                </li>
              ))}
            </ul>
            <Link href="/create" className="mt-8 btn-primary">
              Open the designer <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-night-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1fr_1.2fr] md:py-20">
          <div>
            <p className="eyebrow">What you receive</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              A finished sign, ready for the wall.
            </h2>
            <ul className="mt-8 divide-y divide-white/5 border-y border-white/5">
              {IN_THE_BOX.map((item) => (
                <li key={item} className="flex gap-3 py-3.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-ink/70" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/faq"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              Care, installation and warranty <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {detail && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-auto">
              <Image
                src={detail}
                alt="Close-up of LED neon tubes on a clear acrylic board with steel standoffs"
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <SectionHeading eyebrow="How it works" title="From your words to your wall" />
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-white/10 pt-5">
                <span className="font-display text-sm text-muted tabular-nums">0{index + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-white/5">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1fr_2fr] md:py-20">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Before you order</h2>
            <p className="mt-3 text-sm text-muted">
              More in{' '}
              <Link href="/faq" className="text-ink underline underline-offset-4">
                questions and answers
              </Link>
              .
            </p>
          </div>
          <Faq />
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold hover:underline sm:inline-flex"
        >
          {link.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
