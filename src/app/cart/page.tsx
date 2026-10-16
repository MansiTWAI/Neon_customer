import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';
import { ProductGrid } from '@/components/shop/product-card';
import { fetchProducts, loadStorefrontData } from '@/lib/api';

export const metadata: Metadata = { title: 'Your cart', robots: { index: false } };

// Totals must use the live rate card, never one captured at build time.
export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const [{ rules }, products] = await Promise.all([loadStorefrontData(), fetchProducts().catch(() => [])]);
  const popular = products.filter((product) => product.isFeatured).slice(0, 4);
  return <CartView rules={rules} suggestions={popular.length ? <ProductGrid products={popular} /> : null} />;
}
