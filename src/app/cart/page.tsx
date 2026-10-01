import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';
import { loadStorefrontData } from '@/lib/api';

export const metadata: Metadata = { title: 'Your cart', robots: { index: false } };

// Totals must use the live rate card, never one captured at build time.
export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const { rules } = await loadStorefrontData();
  return <CartView rules={rules} />;
}
