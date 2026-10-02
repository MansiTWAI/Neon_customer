import { formatINR, type PriceResult } from '@neon-adda/shared';

/** Says up front when a sign on its own is below the minimum order, instead of at checkout. */
export function MinimumOrderNote({ price, minimumPaise }: { price: PriceResult; minimumPaise: number }) {
  if (price.status !== 'OK' || !price.warnings.includes('BELOW_MIN_ORDER_VALUE')) return null;
  return (
    <p className="text-xs text-amber-300">
      Orders start at {formatINR(minimumPaise)} before GST. Choose a larger size or add another sign.
    </p>
  );
}
