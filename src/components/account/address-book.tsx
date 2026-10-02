'use client';

import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState } from '@/components/ui/card';
import { Button, FormError } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { addressLines, formatPhone } from '@/lib/format';
import type { Address } from '@/lib/types';
import { AddressForm } from './address-form';

type Editing = { kind: 'new' } | { kind: 'edit'; address: Address } | null;

export function AddressBook({
  initial,
  customer,
}: {
  initial: Address[];
  customer: { name?: string; phone?: string };
}) {
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<Editing>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setAddresses(await api.request<Address[]>('/me/addresses'));
  }

  async function remove(id: string) {
    setRemoving(id);
    setError(null);
    try {
      await api.request(`/me/addresses/${id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'Could not delete the address.');
    } finally {
      setRemoving(null);
    }
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-white/5 bg-night-800 p-5 sm:p-6">
        <h2 className="mb-5 font-semibold">{editing.kind === 'new' ? 'New address' : 'Edit address'}</h2>
        <AddressForm
          address={editing.kind === 'edit' ? editing.address : undefined}
          defaults={customer}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            await reload();
            setEditing(null);
          }}
        />
      </div>
    );
  }

  if (!addresses.length) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          body="Save an address to check out faster next time."
        />
        <Button onClick={() => setEditing({ kind: 'new' })}>
          <Plus className="size-4" /> Add an address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex flex-col rounded-2xl border border-white/5 bg-night-800 p-5 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{address.label ?? address.name}</span>
              {address.isDefault && <Badge tone="cyan">Default</Badge>}
            </div>
            <address className="mt-2 flex-1 text-muted not-italic">
              {address.label && <span className="block text-ink">{address.name}</span>}
              {addressLines(address).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">{formatPhone(address.phone)}</span>
              {address.gstin && (
                <span className="mt-1 block text-xs">
                  {address.businessName}, GSTIN {address.gstin}
                </span>
              )}
            </address>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setEditing({ kind: 'edit', address })}
                className="font-semibold text-neon-cyan hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => remove(address.id)}
                disabled={removing === address.id}
                className="text-muted hover:text-red-300 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <FormError message={error} />
      <Button variant="secondary" onClick={() => setEditing({ kind: 'new' })}>
        <Plus className="size-4" /> Add an address
      </Button>
    </div>
  );
}
