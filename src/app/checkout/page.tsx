import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Checkout } from '@/components/checkout/checkout';
import { serverApi } from '@/lib/server-api';
import type { Address } from '@/lib/types';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const profile = await serverApi.profile();
  if (!profile) redirect('/login?next=/checkout');
  const addresses = await serverApi.request<Address[]>('/me/addresses');

  return <Checkout addresses={addresses} customer={{ name: profile.name, phone: profile.phone }} />;
}
