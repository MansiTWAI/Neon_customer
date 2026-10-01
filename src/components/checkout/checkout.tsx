'use client';

import { formatINR, type OrderPriceOk } from '@neon-adda/shared';
import { MapPin, Plus, ShoppingBag, Tag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AddressForm } from '@/components/account/address-form';
import { EmptyState } from '@/components/ui/card';
import { Button, FormError, Notice } from '@/components/ui/form';
import { SignThumb } from '@/components/ui/sign-thumb';
import { ApiError, publicRequest } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { addressLines, formatSize } from '@/lib/format';
import { letteringOf, type Address, type CheckoutPrice } from '@/lib/types';
import { useCart } from '@/stores/cart-store';

interface CheckoutProps {
  addresses: Address[];
  customer: { name: string | null; phone: string | null };
}

export function Checkout({ addresses: initialAddresses, customer }: CheckoutProps) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [hydrated, setHydrated] = useState(false);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(
    initialAddresses.find((a) => a.isDefault)?.id ?? initialAddresses[0]?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(initialAddresses.length === 0);
  const [installation, setInstallation] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'ADVANCE'>('FULL');
  const [quote, setQuote] = useState<CheckoutPrice | null>(null);
  const [pricing, setPricing] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setHydrated(true), []);

  const address = addresses.find((a) => a.id === addressId) ?? null;
  const lines = useMemo(() => items.map((item) => ({ design: item.design, qty: item.qty })), [items]);
  const pricingRequest = useMemo(
    () =>
      lines.length
        ? JSON.stringify({
            lines,
            pincode: address?.pincode,
            billingStateCode: address?.stateCode,
            installation,
            couponCode: couponCode ?? undefined,
          })
        : null,
    [lines, address?.pincode, address?.stateCode, installation, couponCode],
  );

  useEffect(() => {
    if (!hydrated || !pricingRequest) return;
    let cancelled = false;
    setPricing(true);
    setError(null);
    publicRequest<CheckoutPrice>('/checkout/price', { method: 'POST', body: pricingRequest })
      .then((result) => {
        if (cancelled) return;
        setQuote(result);
        if (!result.zone?.installationAvailable) setInstallation(false);
        if (result.price.status === 'OK' && !result.price.advance.eligible) setPaymentMode('FULL');
      })
      .catch(
        (err) =>
          !cancelled && setError(err instanceof ApiError ? err.title : 'Could not work out your total.'),
      )
      .finally(() => !cancelled && setPricing(false));
    return () => {
      cancelled = true;
    };
  }, [pricingRequest, hydrated]);

  const price = quote?.price.status === 'OK' ? quote.price : null;

  async function placeOrder() {
    if (!price || !address) return;
    setPlacing(true);
    setError(null);
    setNotice(null);
    try {
      const { orderNo } = await api.request<{ orderNo: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          lines: items.map((item) => ({
            design: item.design,
            qty: item.qty,
            preview: item.previewUrl ?? undefined,
          })),
          addressId: address.id,
          installation,
          couponCode: couponCode ?? undefined,
          paymentMode,
          expectedPayablePaise: price.payablePaise,
        }),
      });
      clear();
      router.replace(`/orders/${orderNo}?placed=1`);
    } catch (err) {
      setPlacing(false);
      if (err instanceof ApiError && err.code === 'PRICE_CHANGED') {
        setQuote((current) => current && { ...current, price: err.details.price as OrderPriceOk });
        setNotice(err.title);
        return;
      }
      setError(err instanceof ApiError ? err.title : 'We could not place your order. Please try again.');
    }
  }

  if (!hydrated) return <div className="mx-auto h-96 max-w-6xl animate-pulse px-4 py-10" />;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out"
          body="Your cart is empty. Add a sign from the studio or the shop first."
          action={{ href: '/shop', label: 'Go to the shop' }}
        />
      </div>
    );
  }

  const quoteProblem = quote && quote.price.status !== 'OK' ? quote : null;
  const belowMinimum = price?.warnings.includes('BELOW_MIN_ORDER_VALUE');
  const canPlace = Boolean(price && address && !belowMinimum && !pricing && !addingAddress);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Checkout</h1>

        <Step number={1} title="Delivery address">
          {addingAddress ? (
            <AddressForm
              defaults={{ name: customer.name ?? undefined, phone: customer.phone ?? undefined }}
              submitLabel="Deliver here"
              onCancel={addresses.length ? () => setAddingAddress(false) : undefined}
              onSaved={(saved) => {
                setAddresses((current) => [saved, ...current.filter((a) => a.id !== saved.id)]);
                setAddressId(saved.id);
                setAddingAddress(false);
              }}
            />
          ) : (
            <div className="space-y-3">
              <div role="radiogroup" aria-label="Delivery address" className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`cursor-pointer rounded-xl border p-4 text-sm transition ${
                      a.id === addressId
                        ? 'border-neon-pink bg-neon-pink/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={a.id === addressId}
                      onChange={() => setAddressId(a.id)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 font-semibold">
                      <MapPin className="size-4 text-muted" />
                      {a.label ?? a.name}
                    </span>
                    <span className="mt-2 block text-muted">
                      {a.label && <span className="block text-ink">{a.name}</span>}
                      {addressLines(a).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                      {a.gstin && <span className="mt-1 block text-xs">GSTIN {a.gstin}</span>}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setAddingAddress(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-neon-cyan hover:underline"
              >
                <Plus className="size-4" /> Add a new address
              </button>
            </div>
          )}
        </Step>

        <Step number={2} title="Delivery and installation">
          {!address ? (
            <p className="text-sm text-muted">Choose an address to see delivery options.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                {price?.deliveryDays
                  ? `Delivered to ${address.city} in ${price.deliveryDays.min}–${price.deliveryDays.max} days after you approve the design.`
                  : `Delivering to ${address.city}.`}
              </p>
              <Choice
                checked={!installation}
                onSelect={() => setInstallation(false)}
                title="Delivery only"
                detail="Comes with wall screws, standoffs and a simple mounting guide."
              />
              <Choice
                checked={installation}
                disabled={!quote?.zone?.installationAvailable}
                onSelect={() => setInstallation(true)}
                title="Delivery and installation"
                detail={
                  quote?.zone?.installationAvailable
                    ? 'A trained technician mounts it and tests it with you.'
                    : `Installation is not offered at ${address.pincode} yet.`
                }
              />
            </div>
          )}
        </Step>

        <Step number={3} title="Payment">
          <div className="space-y-3 text-sm">
            <Choice
              checked={paymentMode === 'FULL'}
              onSelect={() => setPaymentMode('FULL')}
              title={`Pay in full${price ? `, ${formatINR(price.payablePaise)}` : ''}`}
            />
            {price?.advance.eligible && (
              <Choice
                checked={paymentMode === 'ADVANCE'}
                onSelect={() => setPaymentMode('ADVANCE')}
                title={`Pay ${formatINR(price.advance.amountPaise)} now`}
                detail={`The remaining ${formatINR(price.payablePaise - price.advance.amountPaise)} is due before dispatch.`}
              />
            )}
            <p className="text-muted">
              Once you place the order we send a secure payment link to your mobile on WhatsApp. Work on your
              sign starts as soon as the payment is received.
            </p>
          </div>
        </Step>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-white/5 bg-night-800 p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Your order</h2>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <SignThumb
                previewUrl={item.previewUrl}
                lettering={letteringOf(item.design)}
                alt=""
                className="size-14"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.display.title}</p>
                <p className="text-xs text-muted">
                  {formatSize(item.design.widthIn, item.design.heightIn)} · Qty {item.qty}
                </p>
                {quoteProblem?.price.status !== 'OK' && quoteProblem?.price.lineIndex === i && (
                  <p className="mt-1 text-xs text-amber-300">
                    This sign needs a quotation. Remove it to continue.
                  </p>
                )}
              </div>
              {price && (
                <span className="tabular-nums">{formatINR(price.lines[i]!.itemsPaise, { paise: true })}</span>
              )}
            </li>
          ))}
        </ul>

        <CouponField
          applied={quote?.coupon ?? null}
          onApply={setCouponCode}
          onRemove={() => setCouponCode(null)}
          disabled={pricing}
        />

        {price && <Totals price={price} />}
        {belowMinimum && quote && (
          <Notice tone="warning">
            The minimum order is {formatINR(quote.minOrderValuePaise)} before GST.
          </Notice>
        )}
        {notice && <Notice tone="warning">{notice}</Notice>}
        <FormError message={error} />

        <Button onClick={placeOrder} pending={placing} disabled={!canPlace} className="w-full">
          Place order
        </Button>
        {!address && <p className="text-center text-xs text-muted">Add a delivery address to continue.</p>}
        <p className="text-center text-xs text-muted">
          By placing the order you agree to our terms, shipping and returns policies.
        </p>
      </aside>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-night-800 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-white/10 text-sm tabular-nums">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice(props: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  detail?: string;
}) {
  return (
    <label
      className={`flex gap-3 rounded-xl border p-4 transition ${
        props.disabled
          ? 'cursor-not-allowed border-white/5 opacity-60'
          : props.checked
            ? 'cursor-pointer border-neon-pink bg-neon-pink/5'
            : 'cursor-pointer border-white/10 hover:border-white/30'
      }`}
    >
      <input
        type="radio"
        checked={props.checked}
        disabled={props.disabled}
        onChange={props.onSelect}
        className="mt-0.5 accent-pink-500"
      />
      <span>
        <span className="block font-semibold">{props.title}</span>
        {props.detail && <span className="mt-0.5 block text-muted">{props.detail}</span>}
      </span>
    </label>
  );
}

function CouponField({
  applied,
  onApply,
  onRemove,
  disabled,
}: {
  applied: CheckoutPrice['coupon'];
  onApply: (code: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('coupon') ?? '')
      .trim()
      .toUpperCase();
    if (code) onApply(code);
  }

  if (applied?.applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2 text-emerald-200">
          <Tag className="size-4" /> {applied.code} applied
        </span>
        <button onClick={onRemove} aria-label="Remove coupon" className="text-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="coupon">
          Coupon code
        </label>
        <input
          id="coupon"
          name="coupon"
          placeholder="Coupon code"
          defaultValue={applied?.code}
          maxLength={20}
          className="w-full rounded-full border border-white/10 bg-night-900 px-4 py-2 text-sm uppercase outline-none placeholder:normal-case focus:border-neon-cyan"
        />
        <button
          disabled={disabled}
          className="rounded-full bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60"
        >
          Apply
        </button>
      </div>
      {applied?.message && (
        <p className="mt-1.5 flex items-center justify-between text-xs text-amber-300">
          {applied.message}
          <button type="button" onClick={onRemove} className="text-muted hover:text-ink">
            Clear
          </button>
        </p>
      )}
    </form>
  );
}

function Totals({ price }: { price: OrderPriceOk }) {
  const rows: [string, number][] = [
    ['Signs', price.itemsPaise],
    ...(price.installationPaise ? [['Installation', price.installationPaise] as [string, number]] : []),
    ['Delivery', price.deliveryPaise],
    ...(price.discountPaise ? [['Discount', -price.discountPaise] as [string, number]] : []),
    ...(price.gst.type === 'INTRA'
      ? [
          [`CGST ${price.gst.ratePct / 2}%`, price.gst.cgstPaise] as [string, number],
          [`SGST ${price.gst.ratePct / 2}%`, price.gst.sgstPaise] as [string, number],
        ]
      : [[`IGST ${price.gst.ratePct}%`, price.gst.igstPaise] as [string, number]]),
    ...(price.roundOffPaise ? [['Round off', price.roundOffPaise] as [string, number]] : []),
  ];

  return (
    <dl className="space-y-1.5 border-t border-white/5 pt-4 text-sm">
      {rows.map(([label, amount]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-muted">{label}</dt>
          <dd className={`tabular-nums ${amount < 0 ? 'text-emerald-300' : ''}`}>
            {label === 'Delivery' && amount === 0 ? 'Free' : formatINR(amount, { paise: true })}
          </dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-white/5 pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatINR(price.payablePaise)}</dd>
      </div>
    </dl>
  );
}
