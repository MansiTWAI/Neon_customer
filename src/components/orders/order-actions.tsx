'use client';

import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Field, FormError, Select, TextArea } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { TICKET_TYPES } from '@/lib/format';

function useOrderAction(orderNo: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(path: string, body: unknown): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      await api.request(`/orders/${orderNo}/${path}`, { method: 'POST', body: JSON.stringify(body) });
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error };
}

export function CancelOrder({ orderNo }: { orderNo: string }) {
  const [open, setOpen] = useState(false);
  const { run, pending, error } = useOrderAction(orderNo);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    if (await run('cancel', { reason })) setOpen(false);
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Cancel order
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3 rounded-xl border border-red-500/20 p-4">
      <Field label="Why are you cancelling?">
        <Select name="reason" required defaultValue="">
          <option value="" disabled>
            Choose a reason
          </option>
          <option>Ordered by mistake</option>
          <option>Want to change the design</option>
          <option>Found it cheaper elsewhere</option>
          <option>No longer needed</option>
          <option>Delivery takes too long</option>
        </Select>
      </Field>
      <FormError message={error} />
      <div className="flex gap-3">
        <Button size="sm" variant="danger" type="submit" pending={pending}>
          Cancel this order
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
          Keep it
        </Button>
      </div>
    </form>
  );
}

export function ReviewForm({ orderNo }: { orderNo: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { run, pending, error } = useOrderAction(orderNo);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = String(new FormData(event.currentTarget).get('comment') ?? '').trim();
    void run('review', { rating, comment: comment || undefined });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHover(value)}
            className="p-0.5"
          >
            <Star
              className={`size-7 transition ${
                value <= (hover || rating) ? 'fill-amber-300 text-amber-300' : 'text-white/25'
              }`}
            />
          </button>
        ))}
      </div>
      <TextArea name="comment" rows={3} maxLength={1000} placeholder="How does it look on your wall?" />
      <FormError message={error} />
      <Button size="sm" type="submit" pending={pending} disabled={!rating}>
        Post review
      </Button>
    </form>
  );
}

export function SupportForm({ orderNo }: { orderNo: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { run, pending, error } = useOrderAction(orderNo);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await run('tickets', {
      type: form.get('type'),
      description: String(form.get('description') ?? '').trim(),
    });
    if (ok) {
      setOpen(false);
      setSent(true);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Get help with this order
        </Button>
        {sent && (
          <span className="text-sm text-emerald-300">
            Request sent. We will call you within a working day.
          </span>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="What is it about?">
        <Select name="type" required defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          {Object.entries(TICKET_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tell us what happened">
        <TextArea name="description" required minLength={10} maxLength={2000} rows={4} />
      </Field>
      <FormError message={error} />
      <div className="flex gap-3">
        <Button size="sm" type="submit" pending={pending}>
          Send
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
