import type { Metadata } from 'next';
import { ShopPage, toSort } from '@/components/shop/shop-page';

export const metadata: Metadata = {
  title: 'Shop neon signs',
  description: 'Ready-made LED neon signs for bedrooms, weddings, cafés and shops, delivered across India.',
  alternates: { canonical: '/shop' },
};

export default async function Shop({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  return <ShopPage sort={toSort(sort)} />;
}
