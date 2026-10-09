import { formatINR } from '@neon-adda/shared';
import { ApiError } from '@neon-adda/shared/web/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteResponse } from '@/components/account/quote-response';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/form';
import { formatDate, formatSize, QUOTE_KIND, QUOTE_STATUS } from '@/lib/format';
import { serverApi } from '@/lib/server-api';
import type { Address, Quote } from '@/lib/types';

export const metadata: Metadata = { title: 'Quotation' };

interface QuotePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requested?: string }>;
}

async function loadQuote(id: string) {
  try {
    return await serverApi.request<Quote>(`/quotations/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}

export default async function QuotePage({ params, searchParams }: QuotePageProps) {
  const [{ id }, { requested }] = await Promise.all([params, searchParams]);
  const quote = await loadQuote(id);
  const addresses = quote.status === 'SENT' ? await serverApi.request<Address[]>('/me/addresses') : [];
  const status = QUOTE_STATUS[quote.status];
  const request = quote.request;
  const picture = quote.previewUrl ?? quote.logoUrl ?? quote.referenceUrl;

  return (
    <div className="space-y-6">
      {requested && (
        <Notice tone="success">
          Request received. Our team will send your quotation within one working day, and we will let you know
          when it is ready.
        </Notice>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/account/quotes" className="text-sm text-muted hover:text-ink">
            Quotations
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold">
            {quote.quoteNo}
            {quote.version > 1 && <span className="text-muted"> v{quote.version}</span>}
          </h1>
          <p className="mt-1 text-sm text-muted">Requested {formatDate(quote.requestedAt)}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {request && (
        <Card>
          <CardTitle>What you asked for</CardTitle>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row">
            {picture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={picture}
                alt=""
                className="aspect-[1.6] w-full rounded-xl bg-night-950 object-contain sm:w-64"
              />
            )}
            <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted">Type</dt>
              <dd>{QUOTE_KIND[request.kind]}</dd>
              {request.widthIn && request.heightIn && (
                <>
                  <dt className="text-muted">Size</dt>
                  <dd>{formatSize(request.widthIn, request.heightIn)}</dd>
                </>
              )}
              <dt className="text-muted">Quantity</dt>
              <dd>{request.qty}</dd>
              <dt className="text-muted">Delivery</dt>
              <dd>
                {request.pincode}
                {request.installation && ', with installation'}
              </dd>
              {request.message && (
                <>
                  <dt className="text-muted">Notes</dt>
                  <dd className="whitespace-pre-line">{request.message}</dd>
                </>
              )}
            </dl>
          </div>
        </Card>
      )}

      {quote.totals ? (
        <Card>
          <CardTitle>Our quotation</CardTitle>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {quote.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-4">
                    {item.description}
                    {item.qty > 1 && <span className="text-muted"> × {item.qty}</span>}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {formatINR(item.amountPaise, { paise: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-3 space-y-1.5 border-t border-white/5 pt-3 text-sm">
            {quote.totals.discountPaise > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="text-emerald-300 tabular-nums">
                  {formatINR(-quote.totals.discountPaise, { paise: true })}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">GST</dt>
              <dd className="tabular-nums">{formatINR(quote.totals.gstPaise, { paise: true })}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatINR(quote.totals.totalPaise)}</dd>
            </div>
          </dl>
          {quote.terms && <p className="mt-4 text-sm whitespace-pre-line text-muted">{quote.terms}</p>}
          {quote.validUntil && quote.status === 'SENT' && (
            <p className="mt-2 text-xs text-muted">
              Valid until {formatDate(quote.validUntil)}. GST follows your delivery state.
            </p>
          )}

          {quote.status === 'SENT' && (
            <div className="mt-6">
              <QuoteResponse quoteId={quote.id} addresses={addresses} />
            </div>
          )}
          {quote.orderNo && (
            <Link
              href={`/orders/${quote.orderNo}`}
              className="mt-6 inline-block font-semibold text-neon-cyan hover:underline"
            >
              View order {quote.orderNo}
            </Link>
          )}
        </Card>
      ) : (
        <Card>
          <CardTitle>Our quotation</CardTitle>
          <p className="mt-2 text-sm text-muted">
            {quote.status === 'CHANGES_REQUESTED'
              ? 'We are revising the quotation with your changes.'
              : 'Our designers are working out the tube layout and price. You will hear from us within one working day.'}
          </p>
        </Card>
      )}
    </div>
  );
}
