import { formatINR } from '@neon-adda/shared';
import { ChevronRight, ReceiptText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, EmptyState } from '@/components/ui/card';
import { SignThumb } from '@/components/ui/sign-thumb';
import { formatDate, QUOTE_KIND, QUOTE_STATUS } from '@/lib/format';
import { serverApi } from '@/lib/server-api';
import type { Quote } from '@/lib/types';

export const metadata: Metadata = { title: 'Quotations' };

export default async function QuotesPage() {
  const quotes = await serverApi.request<Quote[]>('/quotations');

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Quotations</h1>
        <Link
          href="/quote"
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15"
        >
          Request a quotation
        </Link>
      </div>

      {quotes.length ? (
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-800">
          {quotes.map((quote) => {
            const status = QUOTE_STATUS[quote.status];
            return (
              <li key={quote.id}>
                <Link
                  href={`/account/quotes/${quote.id}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-white/[0.02]"
                >
                  <SignThumb
                    previewUrl={quote.previewUrl ?? quote.logoUrl}
                    lettering={quote.lettering}
                    alt=""
                    className="size-16"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{quote.quoteNo}</span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {quote.request ? QUOTE_KIND[quote.request.kind] : 'Quotation'} · Requested{' '}
                      {formatDate(quote.requestedAt)}
                    </p>
                  </div>
                  {quote.totals && (
                    <span className="hidden font-semibold tabular-nums sm:block">
                      {formatINR(quote.totals.totalPaise)}
                    </span>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No quotations yet"
          body="Logo signs, very large signs and bulk orders are priced by quotation. Ask for one and it will appear here."
          action={{ href: '/studio?mode=logo', label: 'Upload a logo' }}
        />
      )}
    </>
  );
}
