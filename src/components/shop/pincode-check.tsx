'use client';

import { MapPin, Truck, Wrench } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError, publicRequest } from '@/lib/api';
import type { Serviceability } from '@/lib/types';

export function PincodeCheck() {
  const [result, setResult] = useState<Serviceability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pincode = String(new FormData(event.currentTarget).get('pincode') ?? '').trim();
    setPending(true);
    setError(null);
    try {
      setResult(await publicRequest<Serviceability>(`/serviceability/${pincode}`));
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? 'Enter a valid 6-digit pincode' : 'Could not check right now.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <form onSubmit={check} className="flex gap-2">
        <label className="sr-only" htmlFor="pincode-check">
          Delivery pincode
        </label>
        <div className="relative flex-1">
          <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            id="pincode-check"
            name="pincode"
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            required
            placeholder="Delivery pincode"
            className="w-full rounded-full border border-white/10 bg-night-900 py-2 pr-3 pl-9 text-sm outline-none focus:border-neon-cyan"
          />
        </div>
        <button
          disabled={pending}
          className="rounded-full bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60"
        >
          Check
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      {result && (
        <ul className="mt-3 space-y-1.5 text-sm" aria-live="polite">
          {result.serviceable ? (
            <>
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-neon-cyan" />
                Delivered in {result.deliveryDays!.min}–{result.deliveryDays!.max} days
                {result.place && ` to ${result.place.city}`}
              </li>
              <li className="flex items-center gap-2 text-muted">
                <Wrench className="size-4" />
                {result.installationAvailable
                  ? 'Installation available at checkout'
                  : 'Delivery only, easy DIY mounting kit included'}
              </li>
            </>
          ) : (
            <li className="text-amber-300">We do not deliver to {result.pincode} yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
