'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Field, FormError, Select, TextArea } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { addressLines } from '@/lib/format';
import type { Address } from '@/lib/types';

type Mode = 'idle' | 'accept' | 'changes' | 'reject';

export function QuoteResponse({ quoteId, addresses }: { quoteId: string; addresses: Address[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(path: string, body: unknown) {
    setPending(true);
    setError(null);
    try {
      const result = await api.request<{ orderNo?: string }>(`/quotations/${quoteId}/${path}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (result.orderNo) router.push(`/orders/${result.orderNo}?placed=1`);
      else {
        setMode('idle');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'Could not send your answer. Please try again.');
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (mode === 'accept') void send('accept', { addressId: form.get('addressId') });
    else
      void send('respond', {
        decision: mode === 'changes' ? 'CHANGES' : 'REJECT',
        comment: form.get('comment') || undefined,
      });
  }

  if (mode === 'idle') {
    return (
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setMode('accept')}>Accept and place order</Button>
        <Button variant="secondary" onClick={() => setMode('changes')}>
          Ask for changes
        </Button>
        <Button variant="ghost" onClick={() => setMode('reject')}>
          Decline
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === 'accept' &&
        (addresses.length ? (
          <Field label="Deliver to">
            <Select
              name="addressId"
              defaultValue={addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label ?? a.name}: {addressLines(a).join(', ')}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-sm">
            <Link href="/account/addresses" className="font-semibold text-neon-cyan hover:underline">
              Add a delivery address
            </Link>{' '}
            first, then come back to accept.
          </p>
        ))}
      {mode === 'changes' && (
        <Field label="What should we change?">
          <TextArea name="comment" required minLength={5} maxLength={1000} rows={3} autoFocus />
        </Field>
      )}
      {mode === 'reject' && (
        <Field label="Anything we could do better?" optional>
          <TextArea name="comment" maxLength={1000} rows={3} />
        </Field>
      )}
      <FormError message={error} />
      <div className="flex gap-3">
        <Button type="submit" pending={pending} disabled={mode === 'accept' && !addresses.length}>
          {mode === 'accept' ? 'Place order' : mode === 'changes' ? 'Send' : 'Decline quotation'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setMode('idle')}>
          Back
        </Button>
      </div>
    </form>
  );
}
