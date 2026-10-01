'use client';

import { formatINR, type PriceResult } from '@neon-adda/shared';
import { Bookmark, Check, ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type RefObject } from 'react';
import { ApiError, fetchPrice, type PriceRequest } from '@/lib/api';
import { api } from '@/lib/browser-api';
import type { DesignInput } from '@/lib/types';
import { useCart, type CartDisplay } from '@/stores/cart-store';
import type { Snapshot } from './neon-canvas';

type Feedback =
  | { status: 'idle' }
  | { status: 'working'; action: 'add' | 'save' }
  | { status: 'added' }
  | { status: 'saved' }
  | { status: 'price-changed'; payablePaise: number }
  | { status: 'error'; message: string };

const QUOTE_REASONS: Record<string, string> = {
  MAX_WIDTH_EXCEEDED: 'Signs this wide are made to order.',
  MAX_HEIGHT_EXCEEDED: 'Signs this tall are made to order.',
  MAX_QTY_EXCEEDED: 'Bulk orders are quoted separately.',
  NO_RATE: 'This combination is quoted separately.',
};

interface PriceBarProps {
  price: PriceResult;
  /** Null while there is nothing to order yet, e.g. every line is empty. */
  design: DesignInput | null;
  display: CartDisplay;
  request: PriceRequest;
  snapshotRef: RefObject<Snapshot | null>;
}

export function PriceBar({ price, design, display, request, snapshotRef }: PriceBarProps) {
  const router = useRouter();
  const [showBreakup, setShowBreakup] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ status: 'idle' });
  const addToCart = useCart((cart) => cart.add);
  const designKey = JSON.stringify(design);

  useEffect(() => setFeedback({ status: 'idle' }), [designKey]);

  const busy = feedback.status === 'working';

  async function handleAdd() {
    if (price.status !== 'OK' || !design) return;
    setFeedback({ status: 'working', action: 'add' });
    try {
      // The browser's price is a preview; the server's calculation is the one we honour.
      const confirmed = await fetchPrice(request);
      if (confirmed.status !== 'OK') {
        setFeedback({ status: 'error', message: 'This design now needs a custom quotation.' });
        return;
      }
      if (confirmed.payablePaise !== price.payablePaise) {
        setFeedback({ status: 'price-changed', payablePaise: confirmed.payablePaise });
        return;
      }
      const added = addToCart(design, display, snapshotRef.current?.() ?? null);
      setFeedback(
        added
          ? { status: 'added' }
          : { status: 'error', message: 'Your cart is full. Check out or remove a sign first.' },
      );
    } catch (error) {
      setFeedback({ status: 'error', message: messageOf(error) });
    }
  }

  async function handleSave() {
    if (!design) return;
    setFeedback({ status: 'working', action: 'save' });
    try {
      await api.request('/designs', {
        method: 'POST',
        body: JSON.stringify({
          ...design,
          name: display.title.slice(0, 60),
          preview: snapshotRef.current?.() ?? undefined,
        }),
      });
      setFeedback({ status: 'saved' });
    } catch (error) {
      // The design is kept in this browser, so signing in brings the customer straight back to it.
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login?next=/studio');
        return;
      }
      setFeedback({ status: 'error', message: messageOf(error) });
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-night-800/90 backdrop-blur lg:static lg:mt-6 lg:rounded-2xl lg:border">
      {showBreakup && price.status === 'OK' && <Breakup price={price} />}

      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        {price.status === 'OK' && (
          <>
            <div className="min-w-0 text-sm text-muted">
              <span className="hidden sm:inline">
                {price.areaSqft.toFixed(2)} sq ft
                {price.billableSqft !== price.areaSqft && `, billed as ${price.billableSqft.toFixed(2)}`}
                {' · '}
              </span>
              <button
                onClick={() => setShowBreakup((open) => !open)}
                aria-expanded={showBreakup}
                className="inline-flex items-center gap-1 font-semibold text-neon-cyan hover:underline"
              >
                Price breakup
                {showBreakup ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
              </button>
            </div>
            <div className="ml-auto text-right">
              <div
                key={price.payablePaise}
                className="animate-flicker-on font-display text-2xl font-bold tabular-nums"
              >
                {formatINR(price.payablePaise)}
              </div>
              <div className="text-xs text-muted">incl. GST</div>
            </div>
            <button
              onClick={handleSave}
              disabled={!design || busy}
              aria-label="Save design"
              title="Save to your designs"
              className="grid size-12 place-items-center rounded-full border border-white/15 text-muted transition hover:border-white/40 hover:text-ink disabled:opacity-50"
            >
              {feedback.status === 'working' && feedback.action === 'save' ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </button>
            <button
              onClick={handleAdd}
              disabled={!design || busy}
              className="inline-flex items-center gap-2 rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            >
              {feedback.status === 'working' && feedback.action === 'add' && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Add to cart
            </button>
          </>
        )}

        {price.status === 'QUOTE_REQUIRED' && (
          <>
            <p className="text-sm">
              {QUOTE_REASONS[price.reason]} Reduce the size for an instant price, or ask us for a quotation.
            </p>
            <Link
              href={`/quote?kind=${price.reason === 'MAX_QTY_EXCEEDED' ? 'BULK' : 'LARGE'}&from=studio`}
              className="ml-auto rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon"
            >
              Get a quote
            </Link>
          </>
        )}

        {price.status === 'INVALID' && (
          <p className="text-sm text-amber-300">This is smaller than we can make. Try a larger width.</p>
        )}
      </div>

      <Feedback state={feedback} />
    </div>
  );
}

function messageOf(error: unknown) {
  return error instanceof ApiError ? error.title : 'We could not reach the store. Please try again.';
}

function Breakup({ price }: { price: Extract<PriceResult, { status: 'OK' }> }) {
  const gst = price.gst.cgstPaise + price.gst.sgstPaise + price.gst.igstPaise;
  const rows: [string, number][] = [
    ...price.breakup.map((line) => [line.label, line.amountPaise] as [string, number]),
    [`GST ${price.gst.ratePct}%`, gst],
    ...(price.roundOffPaise ? [['Round off', price.roundOffPaise] as [string, number]] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl border-b border-white/10 px-4 py-3 text-sm">
      <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1">
        {rows.map(([label, amount]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right tabular-nums">{formatINR(amount, { paise: true })}</dd>
          </div>
        ))}
        <dt className="pt-1 font-semibold">Total</dt>
        <dd className="pt-1 text-right font-semibold tabular-nums">{formatINR(price.payablePaise)}</dd>
      </dl>
      <p className="mt-2 text-xs text-muted">
        Delivery and installation are added at checkout based on your pincode.
      </p>
    </div>
  );
}

function Feedback({ state }: { state: Feedback }) {
  if (state.status === 'idle' || state.status === 'working') return null;

  return (
    <p role="status" className="mx-auto max-w-7xl px-4 pb-3 text-sm">
      {state.status === 'added' && (
        <span className="inline-flex items-center gap-2 text-emerald-300">
          <Check className="size-4" /> Added to your cart.
          <Link href="/cart" className="font-semibold underline underline-offset-2">
            View cart
          </Link>
        </span>
      )}
      {state.status === 'saved' && (
        <span className="inline-flex items-center gap-2 text-emerald-300">
          <Check className="size-4" /> Saved to your designs.
          <Link href="/account/designs" className="font-semibold underline underline-offset-2">
            View designs
          </Link>
        </span>
      )}
      {state.status === 'price-changed' && (
        <span className="text-amber-300">
          Our prices were just updated. This sign is now {formatINR(state.payablePaise)}. Refresh the page to
          continue.
        </span>
      )}
      {state.status === 'error' && <span className="text-red-300">{state.message}</span>}
    </p>
  );
}
