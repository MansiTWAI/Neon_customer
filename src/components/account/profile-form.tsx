'use client';

import { ApiError } from '@neon-adda/shared/web/client';
import { Check, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/browser-api';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-white/10 bg-night-900 px-4 py-2.5 outline-none focus:border-neon-cyan';

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('saving');
    setError(null);
    try {
      await api.request('/auth/customer/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.get('name'),
          email: String(form.get('email') ?? '').trim() || null,
        }),
      });
      setStatus('saved');
      router.refresh();
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiError ? err.title : 'Could not save your details.');
    }
  }

  return (
    <form
      onSubmit={save}
      onChange={() => setStatus('idle')}
      className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <label className="block text-sm text-muted">
        Full name
        <input
          name="name"
          defaultValue={name}
          autoComplete="name"
          required
          minLength={2}
          className={inputClass}
        />
      </label>
      <label className="block text-sm text-muted">
        Email <span className="text-muted/60">(optional)</span>
        <input name="email" type="email" defaultValue={email} autoComplete="email" className={inputClass} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-300 sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60"
        >
          {status === 'saving' && <LoaderCircle className="size-4 animate-spin" />}
          Save
        </button>
        {status === 'saved' && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-300">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
