import { formatINR } from '@neon-adda/shared';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/card';
import { SignThumb } from '@/components/ui/sign-thumb';
import { formatDate, ORDER_STATUS } from '@/lib/format';
import type { OrderSummary } from '@/lib/types';

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-800">
      {orders.map((order) => {
        const status = ORDER_STATUS[order.status];
        return (
          <li key={order.orderNo}>
            <Link
              href={`/orders/${order.orderNo}`}
              className="flex items-center gap-4 p-4 transition hover:bg-white/[0.02]"
            >
              <SignThumb
                previewUrl={order.previewUrl}
                lettering={order.lettering}
                alt=""
                className="size-16"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{order.orderNo}</span>
                  <Badge tone={order.awaitingProof ? 'pink' : status.tone}>
                    {order.awaitingProof ? 'Approve your proof' : status.label}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted">{order.title}</p>
                <p className="text-xs text-muted">
                  {formatDate(order.placedAt)} · {order.signs} {order.signs === 1 ? 'sign' : 'signs'}
                </p>
              </div>
              <span className="hidden font-semibold tabular-nums sm:block">
                {formatINR(order.totalPaise)}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
