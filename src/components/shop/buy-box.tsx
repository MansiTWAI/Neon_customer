'use client';

import { calculatePrice, formatINR, type PricingRules } from '@neon-adda/shared';
import { MinimumOrderNote } from './minimum-order-note';
import { Check, Minus, Palette, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/form';
import { ApiError, fetchPrice } from '@/lib/api';
import { handoffFromReadymade, openInStudio } from '@/lib/studio-handoff';
import type { DesignInput, ProductDetail } from '@/lib/types';
import { MAX_QTY, useCart } from '@/stores/cart-store';

export function BuyBox({ product, rules }: { product: ProductDetail; rules: PricingRules }) {
  const router = useRouter();
  const addToCart = useCart((cart) => cart.add);
  const design = product.design!;
  const colorCount = new Set(design.lines.map((line) => line.glowHex)).size;
  const priceAt = (index: number, backboard: string, quantity: number) =>
    calculatePrice(
      {
        productType: 'READYMADE',
        backboardCode: backboard,
        widthIn: product.sizes[index]!.widthIn,
        heightIn: product.sizes[index]!.heightIn,
        colorCount,
        addonCodes: [],
        qty: quantity,
        installation: false,
        rateOverridePaise: product.rateOverridePaise,
      },
      rules,
    );
  // Open on the smallest size that can be ordered on its own.
  const [sizeIndex, setSizeIndex] = useState(() => {
    const backboard = product.backboards.some((b) => b.code === design.backboardCode)
      ? design.backboardCode
      : product.backboards[0]!.code;
    const orderable = product.sizes.findIndex((_, i) => {
      const p = priceAt(i, backboard, 1);
      return p.status === 'OK' && !p.warnings.includes('BELOW_MIN_ORDER_VALUE');
    });
    return orderable >= 0 ? orderable : product.sizes.length - 1;
  });
  const [backboardCode, setBackboardCode] = useState(
    product.backboards.some((b) => b.code === design.backboardCode)
      ? design.backboardCode
      : product.backboards[0]!.code,
  );
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<
    { status: 'idle' | 'adding' | 'added' } | { status: 'error'; message: string }
  >({
    status: 'idle',
  });

  const size = product.sizes[sizeIndex]!;
  const request = {
    productId: product.id,
    productType: 'READYMADE' as const,
    backboardCode,
    widthIn: size.widthIn,
    heightIn: size.heightIn,
    colorCount,
    addonCodes: [],
    qty,
    installation: false,
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- priceAt only reads props already listed
  const price = useMemo(() => priceAt(sizeIndex, backboardCode, qty), [sizeIndex, backboardCode, qty, rules]);

  async function add() {
    if (price.status !== 'OK') return;
    setState({ status: 'adding' });
    try {
      const confirmed = await fetchPrice(request);
      if (confirmed.status !== 'OK' || confirmed.payablePaise !== price.payablePaise) {
        setState({
          status: 'error',
          message: 'Our prices were just updated. Refresh the page to see the new price.',
        });
        return;
      }
      const cartDesign: DesignInput = {
        productId: product.id,
        config: { mode: 'TEXT', lines: design.lines, fontFamily: design.fontFamily },
        widthIn: size.widthIn,
        heightIn: size.heightIn,
        backboardCode,
        addonCodes: [],
      };
      const added = addToCart(
        cartDesign,
        {
          title: product.name,
          productName: product.name,
          productType: 'READYMADE',
          backboardName: product.backboards.find((b) => b.code === backboardCode)!.name,
        },
        null,
        qty,
      );
      setState(
        added ? { status: 'added' } : { status: 'error', message: 'Your cart is full. Check out first.' },
      );
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof ApiError ? error.title : 'Could not reach the store.',
      });
    }
  }

  const pill = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-left text-sm transition ${
      active ? 'border-neon-pink bg-neon-pink/10' : 'border-white/10 hover:border-white/30'
    }`;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-3xl font-bold tabular-nums">
          {price.status === 'OK' ? formatINR(price.payablePaise) : 'Price on request'}
        </p>
        <p className="text-sm text-muted">Including GST. Delivery worked out at checkout.</p>
        <MinimumOrderNote price={price} minimumPaise={rules.minOrderValuePaise} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">Size</legend>
        <div className="grid grid-cols-3 gap-2">
          {product.sizes.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSizeIndex(i)}
              aria-pressed={i === sizeIndex}
              className={pill(i === sizeIndex)}
            >
              <span className="block font-semibold">{s.label}</span>
              <span className="text-xs text-muted">
                {s.widthIn}″ × {s.heightIn}″
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">Backboard</legend>
        <div className="grid gap-2">
          {product.backboards.map((b) => (
            <button
              key={b.code}
              onClick={() => setBackboardCode(b.code)}
              aria-pressed={b.code === backboardCode}
              className={pill(b.code === backboardCode)}
            >
              {b.name}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-white/10">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="p-3 text-muted hover:text-ink disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            disabled={qty >= MAX_QTY}
            aria-label="Increase quantity"
            className="p-3 text-muted hover:text-ink disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          onClick={add}
          pending={state.status === 'adding'}
          disabled={price.status !== 'OK'}
          className="flex-1"
        >
          Add to cart
        </Button>
      </div>

      {state.status === 'added' && (
        <p role="status" className="flex items-center gap-2 text-sm text-emerald-300">
          <Check className="size-4" /> Added to your cart.
          <Link href="/cart" className="font-semibold underline underline-offset-2">
            View cart
          </Link>
        </p>
      )}
      {state.status === 'error' && <p className="text-sm text-red-300">{state.message}</p>}

      <button
        onClick={() =>
          router.push(openInStudio(handoffFromReadymade({ ...design, backboardCode }, size.widthIn)))
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-neon-cyan hover:underline"
      >
        <Palette className="size-4" /> Change the words, font or colour
      </button>
    </div>
  );
}
