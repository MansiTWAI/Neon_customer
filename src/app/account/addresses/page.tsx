import type { Metadata } from 'next';
import { AddressBook } from '@/components/account/address-book';
import { serverApi } from '@/lib/server-api';
import type { Address } from '@/lib/types';

export const metadata: Metadata = { title: 'Addresses' };

export default async function AddressesPage() {
  const [addresses, profile] = await Promise.all([
    serverApi.request<Address[]>('/me/addresses'),
    serverApi.profile(),
  ]);

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Addresses</h1>
      <AddressBook
        initial={addresses}
        customer={{ name: profile?.name ?? undefined, phone: profile?.phone ?? undefined }}
      />
    </>
  );
}
