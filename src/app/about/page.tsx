import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About us',
  description: 'Neon Adda makes custom LED neon signs by hand, with partner studios across India.',
};

const FACTS = [
  { value: 'Made to order', label: 'Every sign is made for you, to your design' },
  { value: 'Proof first', label: 'Nothing is made until you approve the design' },
  { value: '1 year', label: 'Warranty on the LEDs and adapter' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-semibold tracking-widest text-neon-cyan uppercase">About Neon Adda</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Signs that make a place feel like yours</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>
          Neon Adda started with a simple frustration: ordering a custom neon sign meant sending sketches back
          and forth and waiting days for a price. So we built a studio where you type your words, see the sign
          glowing on a wall, and know the price before you order.
        </p>
        <p>
          Behind the studio is a workshop of people who bend and fit every sign by hand, and a network of
          partner studios that deliver and install across India. Before we make anything, our designers send
          you a proof to approve, so the sign on your wall is the one you pictured.
        </p>
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.label} className="rounded-2xl border border-white/5 bg-night-800 p-5">
            <dt className="font-display text-2xl font-bold neon-text">{fact.value}</dt>
            <dd className="mt-2 text-sm text-muted">{fact.label}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/studio"
          className="rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon"
        >
          Design your sign
        </Link>
        <Link
          href="/contact"
          className="rounded-full bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/15"
        >
          Talk to us
        </Link>
      </div>
    </div>
  );
}
