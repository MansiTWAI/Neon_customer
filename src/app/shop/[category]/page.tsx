import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopPage, toSort } from '@/components/shop/shop-page';
import { fetchCategories } from '@/lib/api';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const match = (await fetchCategories()).find((c) => c.slug === category);
  return match ? { title: `${match.name} neon signs`, description: match.description ?? undefined } : {};
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ category }, { sort }] = await Promise.all([params, searchParams]);
  const categories = await fetchCategories();
  if (!categories.some((c) => c.slug === category)) notFound();
  return <ShopPage category={category} sort={toSort(sort)} />;
}
