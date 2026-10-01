import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import { OrderList } from '@/components/account/order-list';
import { EmptyState } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';
import type { OrderSummary } from '@/lib/types';

export const metadata: Metadata = { title: 'Your orders' };

export default async function OrdersPage() {
  const orders = await serverApi.request<OrderSummary[]>('/orders');

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Your orders</h1>
      {orders.length ? (
        <OrderList orders={orders} />
      ) : (
        <EmptyState
          icon={Package}
          title="No orders yet"
          body="Signs you order will show up here, with their design proofs and delivery updates."
          action={{ href: '/shop', label: 'Browse signs' }}
        />
      )}
    </>
  );
}
