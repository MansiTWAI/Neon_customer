'use client';

import { calculateOrder, calculatePrice, formatINR, type PricingRules } from '@neon-adda/shared';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/card';
import { SignThumb } from '@/components/ui/sign-thumb';
import { formatSize } from '@/lib/format';
import { letteringOf } from '@/lib/types';
import { MAX_QTY, toLineInput, useCart, type CartItem } from '@/stores/cart-store';

export function CartView({ rules }: { rules: PricingRules }) {
  const { items, setQty, remove } = useCart();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const order = useMemo(
    () =>
      items.length ? calculateOrder({ lines: items.map(toLineInput), installation: false }, rules) : null,
    [items, rules],
  );

  if (!hydrated) return <div className="mx-auto h-96 max-w-4xl animate-pulse px-4 py-10" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          body="Design a sign in the studio or pick one from the shop, and it will wait for you here."
          action={{ href: '/studio', label: 'Start designing' }}
        />
      </div>
    );
  }

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const tooMany = order?.status === 'QUOTE_REQUIRED' && order.reason === 'MAX_QTY_EXCEEDED';
  const belowMinimum = order?.status === 'OK' && order.warnings.includes('BELOW_MIN_ORDER_VALUE');

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <section aria-labelledby="cart-title">
        <h1 id="cart-title" className="font-display text-2xl font-bold">
          Your cart
        </h1>
        <ul className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-800">
          {items.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              rules={rules}
              onQty={(qty) => setQty(item.id, qty)}
              onRemove={() => remove(item.id)}
            />
          ))}
        </ul>
        <Link href="/shop" className="mt-4 inline-block text-sm font-semibold text-neon-cyan hover:underline">
          Continue shopping
        </Link>
      </section>

      <aside className="h-fit rounded-2xl border border-white/5 bg-night-800 p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Signs</dt>
            <dd>{totalQty}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery and installation</dt>
            <dd className="text-muted">At checkout</dd>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">
              {order?.status === 'OK' ? formatINR(order.payablePaise) : 'By quotation'}
            </dd>
          </div>
        </dl>
        <p className="mt-1 text-xs text-muted">Includes GST</p>

        {tooMany && (
          <p className="mt-4 text-sm text-amber-300">
            Orders of more than {rules.maxQty} signs are quoted separately.{' '}
            <Link href="/quote?kind=BULK" className="font-semibold underline underline-offset-2">
              Get a bulk quote
            </Link>
          </p>
        )}
        {belowMinimum && (
          <p className="mt-4 text-sm text-amber-300">
            The minimum order is {formatINR(rules.minOrderValuePaise)} before GST. Add a sign or choose a
            bigger size.
          </p>
        )}

        {order?.status === 'OK' && !belowMinimum ? (
          <Link
            href="/checkout"
            className="mt-5 block rounded-full bg-neon-pink px-6 py-3 text-center font-bold text-white transition hover:shadow-neon"
          >
            Checkout
          </Link>
        ) : (
          <button
            disabled
            className="mt-5 w-full rounded-full bg-neon-pink px-6 py-3 font-bold text-white opacity-50"
          >
            Checkout
          </button>
        )}
      </aside>
    </div>
  );
}

function CartLine({
  item,
  rules,
  onQty,
  onRemove,
}: {
  item: CartItem;
  rules: PricingRules;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const { design, display } = item;
  const price = useMemo(
    () => calculatePrice({ ...toLineInput(item), installation: false }, rules),
    [item, rules],
  );
  const colours =
    design.config.mode === 'TEXT' ? [...new Set(design.config.lines.map((l) => l.colorName))].join(', ') : '';

  return (
    <li className="flex gap-4 p-4">
      <SignThumb
        previewUrl={item.previewUrl}
        lettering={letteringOf(design)}
        alt={`Preview of "${display.title}"`}
      />

      <div className="min-w-0 flex-1">
        <p
          className="truncate font-semibold"
          style={
            design.config.mode === 'TEXT'
              ? { fontFamily: `"${design.config.fontFamily}", cursive` }
              : undefined
          }
        >
          {display.title}
        </p>
        <p className="mt-1 text-sm text-muted">
          {formatSize(design.widthIn, design.heightIn)}
          {colours && ` · ${colours}`}
        </p>
        <p className="text-sm text-muted">{display.backboardName}</p>

        <div className="mt-3 flex items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-white/10">
            <button
              onClick={() => onQty(item.qty - 1)}
              disabled={item.qty <= 1}
              aria-label="Decrease quantity"
              className="p-2 text-muted hover:text-ink disabled:opacity-30"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
              {item.qty}
            </span>
            <button
              onClick={() => onQty(item.qty + 1)}
              disabled={item.qty >= MAX_QTY}
              aria-label="Increase quantity"
              className="p-2 text-muted hover:text-ink disabled:opacity-30"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-red-300"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      </div>

      <p className="shrink-0 font-semibold tabular-nums">
        {price.status === 'OK' ? formatINR(price.payablePaise) : 'Quote'}
      </p>
    </li>
  );
}
