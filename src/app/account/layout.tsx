import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AccountNav } from '@/components/account/account-nav';
import { serverApi } from '@/lib/server-api';

export const metadata: Metadata = {
  title: { default: 'Your account', template: '%s | Neon Adda' },
  robots: { index: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const profile = await serverApi.profile();
  if (!profile) redirect('/login?next=/account');

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[200px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
