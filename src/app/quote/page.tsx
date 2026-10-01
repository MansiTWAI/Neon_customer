import type { Metadata } from 'next';
import { QuoteRequestForm } from '@/components/quote/quote-request-form';
import { loadStorefrontData } from '@/lib/api';
import type { QuoteKind } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Request a quotation',
  description:
    'Large signs, shop fronts and bulk orders for events, priced by our team within one working day.',
};

const KINDS: QuoteKind[] = ['LOGO', 'LARGE', 'BULK', 'CUSTOM'];

export default async function QuoteRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; from?: string }>;
}) {
  const { kind, from } = await searchParams;
  const { assets } = await loadStorefrontData();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Request a quotation</h1>
      <p className="mt-2 mb-8 text-muted">
        For signs bigger than we price online, bulk orders and anything unusual. Our team replies within one
        working day with a price, a design mock-up and delivery dates.
      </p>
      <QuoteRequestForm
        assets={assets}
        initialKind={KINDS.includes(kind as QuoteKind) ? (kind as QuoteKind) : 'CUSTOM'}
        fromStudio={from === 'studio'}
      />
    </div>
  );
}
