'use client';

import { CheckCircle2, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/card';
import { Button, FormError, TextArea } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { formatDateTime } from '@/lib/format';
import type { OrderDetail } from '@/lib/types';

type Item = OrderDetail['items'][number];

/** The latest proof for one sign, with approve and request-changes actions while it is pending. */
export function ProofReview({ orderNo, item }: { orderNo: string; item: Item }) {
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'changes'>('idle');
  const [pending, setPending] = useState<'APPROVE' | 'CHANGES' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const proof = item.proofs[0];
  if (!proof) return null;

  async function respond(decision: 'APPROVE' | 'CHANGES', comment?: string) {
    setPending(decision);
    setError(null);
    try {
      await api.request(`/orders/${orderNo}/proofs/${proof!.id}`, {
        method: 'POST',
        body: JSON.stringify({ decision, comment }),
      });
      setMode('idle');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'Could not send your answer. Please try again.');
    } finally {
      setPending(null);
    }
  }

  function requestChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void respond('CHANGES', String(new FormData(event.currentTarget).get('comment') ?? '').trim());
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Design proof, version {proof.version}</p>
        {proof.status === 'APPROVED' && <Badge tone="green">Approved</Badge>}
        {proof.status === 'CHANGES_REQUESTED' && <Badge tone="cyan">Changes requested</Badge>}
        {proof.status === 'PENDING' && <Badge tone="pink">Waiting for you</Badge>}
      </div>

      {proof.imageUrl && (
        <a href={proof.imageUrl} target="_blank" rel="noreferrer" className="mt-3 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proof.imageUrl}
            alt={`Proof version ${proof.version}`}
            className="max-h-80 w-full rounded-lg bg-night-950 object-contain"
          />
        </a>
      )}
      {proof.designerNote && <p className="mt-3 text-sm text-muted">{proof.designerNote}</p>}
      {proof.customerComment && (
        <p className="mt-3 flex gap-2 text-sm">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>
            <span className="text-muted">You asked: </span>
            {proof.customerComment}
          </span>
        </p>
      )}

      {proof.status === 'PENDING' && mode === 'idle' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => respond('APPROVE')} pending={pending === 'APPROVE'}>
            <CheckCircle2 className="size-4" /> Approve and start making
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setMode('changes')}
            disabled={item.revisionsLeft === 0}
          >
            Request changes
          </Button>
          <span className="text-xs text-muted">
            {item.revisionsLeft
              ? `${item.revisionsLeft} ${item.revisionsLeft === 1 ? 'round' : 'rounds'} of changes left`
              : 'All free changes used'}
          </span>
        </div>
      )}

      {proof.status === 'PENDING' && mode === 'changes' && (
        <form onSubmit={requestChanges} className="mt-4 space-y-3">
          <TextArea
            name="comment"
            required
            minLength={5}
            maxLength={1000}
            rows={3}
            autoFocus
            placeholder="For example: make the second line bigger, use the warmer white"
          />
          <div className="flex gap-3">
            <Button size="sm" type="submit" pending={pending === 'CHANGES'}>
              Send to designer
            </Button>
            <Button size="sm" type="button" variant="ghost" onClick={() => setMode('idle')}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {proof.status === 'CHANGES_REQUESTED' && (
        <p className="mt-3 text-xs text-muted">
          Sent {proof.respondedAt && formatDateTime(proof.respondedAt)}. Our designer will send a new version
          shortly.
        </p>
      )}
      <div className="mt-3">
        <FormError message={error} />
      </div>
    </div>
  );
}
