import { currentStageIndex, orderStages, type OrderStage } from '@neon-adda/shared';
import { Check } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { OrderDetail } from '@/lib/types';

const STAGE_LABELS: Record<OrderStage, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROOF: 'Design approved',
  PRODUCTION: 'Made and tested',
  DISPATCHED: 'Shipped',
  DELIVERED: 'Delivered',
  INSTALLED: 'Installed',
};

/** Statuses that complete each step, used to date the steps from the order's history. */
const STAGE_DONE_BY: Record<OrderStage, string[]> = {
  PLACED: ['PENDING_PAYMENT'],
  CONFIRMED: ['CONFIRMED'],
  PROOF: ['PROOF_APPROVED'],
  PRODUCTION: ['READY_TO_DISPATCH'],
  DISPATCHED: ['SHIPPED'],
  DELIVERED: ['DELIVERED'],
  INSTALLED: ['INSTALLED', 'COMPLETED'],
};

export function OrderTimeline({ order }: { order: OrderDetail }) {
  const stages = orderStages(order.installationRequired);
  const current = currentStageIndex(order.status, order.installationRequired);
  const doneAt = (stage: OrderStage) =>
    stage === 'PLACED'
      ? order.placedAt
      : (order.history.find((entry) => STAGE_DONE_BY[stage].includes(entry.status))?.at ?? null);

  return (
    <ol className="grid gap-4 sm:flex sm:gap-0" aria-label="Order progress">
      {stages.map((stage, i) => {
        const date = doneAt(stage);
        // A step is done once a later step is current, or when its own completing status was recorded.
        const done = i < current || Boolean(date) || (i === current && stage === 'PLACED');
        const active = i === current && !done;
        return (
          <li key={stage} className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-3.5 right-1/2 hidden h-0.5 w-full sm:block ${i <= current ? 'bg-neon-pink' : 'bg-white/10'}`}
              />
            )}
            <span
              className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                done
                  ? 'border-neon-pink bg-neon-pink text-white'
                  : active
                    ? 'border-neon-pink bg-night-800 text-neon-pink shadow-neon'
                    : 'border-white/15 bg-night-800 text-muted'
              }`}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className="text-sm">
              <span className={done || active ? 'font-semibold' : 'text-muted'}>{STAGE_LABELS[stage]}</span>
              {date && <span className="block text-xs text-muted">{formatDate(date)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
