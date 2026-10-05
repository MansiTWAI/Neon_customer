import { Clock, MessageCircle, ReceiptText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadForm } from '@/components/contact/lead-form';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Questions about a sign, a bulk order or becoming a partner? Send us a message and we will call you.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div>
        <h1 className="font-display text-3xl font-bold">Talk to us</h1>
        <p className="mt-3 text-muted">
          Leave your number and a line about what you need. Someone from our team, or the partner studio
          nearest you, will call back.
        </p>
        <ul className="mt-8 space-y-5 text-sm">
          <li className="flex gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-neon-cyan" />
            <span>
              <span className="block font-semibold">Monday to Saturday, 10 am to 7 pm</span>
              <span className="text-muted">We reply within one working day.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <ReceiptText className="mt-0.5 size-5 shrink-0 text-neon-cyan" />
            <span>
              <span className="block font-semibold">Need a price for something big?</span>
              <Link href="/quote" className="text-neon-cyan hover:underline">
                Request a quotation
              </Link>
            </span>
          </li>
          <li className="flex gap-3">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-neon-cyan" />
            <span>
              <span className="block font-semibold">About an existing order?</span>
              <span className="text-muted">
                Open it from{' '}
                <Link href="/account/orders" className="text-neon-cyan hover:underline">
                  your orders
                </Link>{' '}
                and choose Get help, so we have the details to hand.
              </span>
            </span>
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border border-white/5 bg-night-800 p-5 sm:p-6">
        <LeadForm />
      </div>
    </div>
  );
}
