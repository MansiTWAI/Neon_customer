'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, FormError } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';

export function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await api.request('/auth/customer/me', { method: 'DELETE' });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(err instanceof ApiError ? err.title : 'Could not close your account. Please try again.');
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Closing your account removes your details, addresses and saved designs. Invoices for past orders are
        kept, as the law requires.
      </p>
      {confirming ? (
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="danger" onClick={remove} pending={pending}>
            Yes, close my account
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} className="text-red-300">
          Close account
        </Button>
      )}
      <FormError message={error} />
    </div>
  );
}
