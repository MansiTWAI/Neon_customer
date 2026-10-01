import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeleteAccount } from '@/components/account/delete-account';
import { OrderAlerts } from '@/components/account/order-alerts';
import { OrderList } from '@/components/account/order-list';
import { ProfileForm } from '@/components/account/profile-form';
import { SignOutButton } from '@/components/account/sign-out-button';
import { Card, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/form';
import { formatPhone } from '@/lib/format';
import { serverApi } from '@/lib/server-api';
import type { OrderSummary, Quote } from '@/lib/types';

export default async function AccountPage() {
  const profile = await serverApi.profile();
  if (!profile) redirect('/login?next=/account');

  const [orders, quotes] = await Promise.all([
    serverApi.request<OrderSummary[]>('/orders'),
    serverApi.request<Quote[]>('/quotations'),
  ]);
  const proofsWaiting = orders.filter((order) => order.awaitingProof).length;
  const quotesWaiting = quotes.filter((quote) => quote.status === 'SENT').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {profile.name ? `Hi, ${profile.name.split(' ')[0]}` : 'Your account'}
          </h1>
          <p className="mt-1 text-muted">Signed in as {formatPhone(profile.phone)}</p>
        </div>
        <SignOutButton />
      </div>

      {(proofsWaiting > 0 || quotesWaiting > 0) && (
        <Notice tone="info">
          {proofsWaiting > 0 && (
            <span className="block">
              {proofsWaiting === 1 ? 'A design proof is' : `${proofsWaiting} design proofs are`} waiting for
              your approval.
            </span>
          )}
          {quotesWaiting > 0 && (
            <span className="block">
              {quotesWaiting === 1 ? 'Your quotation is' : `${quotesWaiting} quotations are`} ready.{' '}
              <Link href="/account/quotes" className="font-semibold underline underline-offset-2">
                See quotations
              </Link>
            </span>
          )}
        </Notice>
      )}

      {orders.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            {orders.length > 3 && (
              <Link href="/account/orders" className="text-sm font-semibold text-neon-cyan hover:underline">
                See all
              </Link>
            )}
          </div>
          <OrderList orders={orders.slice(0, 3)} />
        </section>
      )}

      <Card>
        <CardTitle>Your details</CardTitle>
        <p className="mt-1 text-sm text-muted">Used on your invoices and for order updates by email.</p>
        <ProfileForm name={profile.name ?? ''} email={profile.email ?? ''} />
      </Card>

      <OrderAlerts />

      <Card>
        <CardTitle>Close your account</CardTitle>
        <div className="mt-3">
          <DeleteAccount />
        </div>
      </Card>
    </div>
  );
}
