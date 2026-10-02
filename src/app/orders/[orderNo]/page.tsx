import { formatINR } from '@neon-adda/shared';
import { ApiError } from '@neon-adda/shared/web/server';
import { CalendarClock, ExternalLink, FileText, PartyPopper, Truck, Wrench } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { CancelOrder, ReviewForm, SupportForm } from '@/components/orders/order-actions';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { ProofReview } from '@/components/orders/proof-review';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/form';
import { SignThumb } from '@/components/ui/sign-thumb';
import {
  addressLines,
  formatDate,
  formatDateTime,
  formatPhone,
  formatSize,
  ORDER_STATUS,
  PAYMENT_STATUS,
  TICKET_TYPES,
} from '@/lib/format';
import { serverApi } from '@/lib/server-api';
import type { OrderDetail } from '@/lib/types';

interface OrderPageProps {
  params: Promise<{ orderNo: string }>;
  searchParams: Promise<{ placed?: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  return { title: `Order ${(await params).orderNo}`, robots: { index: false } };
}

async function loadOrder(orderNo: string): Promise<OrderDetail> {
  try {
    return await serverApi.request<OrderDetail>(`/orders/${encodeURIComponent(orderNo)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const [{ orderNo }, { placed }] = await Promise.all([params, searchParams]);
  const order = await loadOrder(orderNo);
  const status = ORDER_STATUS[order.status];
  const { totals } = order;
  const awaitingPayment = order.status === 'PENDING_PAYMENT';
  const payOnDelivery =
    order.paymentMode === 'COD' &&
    totals.duePaise > 0 &&
    !['PENDING_PAYMENT', 'EXPIRED', 'CANCELLED'].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      {placed && (
        <Notice tone="success">
          <span className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="block font-semibold">Thank you, your order is placed.</span>
              We have sent the details to {formatPhone(order.shippingAddress.phone)}.
            </span>
          </span>
        </Notice>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-muted hover:text-ink">
            Your orders
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold">Order {order.orderNo}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {order.status === 'CANCELLED' ? (
        <Notice tone="warning">
          Cancelled {order.cancelledAt && formatDate(order.cancelledAt)}
          {order.cancelReason && `: ${order.cancelReason}`}
        </Notice>
      ) : (
        <Card>
          <OrderTimeline order={order} />
        </Card>
      )}

      {awaitingPayment && (
        <Notice tone="warning">
          Our team will call {formatPhone(order.shippingAddress.phone)} to confirm this order before we start
          making it.
        </Notice>
      )}
      {order.installation?.completionCode && (
        <Card className="border-neon-cyan/30">
          <CardTitle>Installation code</CardTitle>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[0.3em] tabular-nums">
            {order.installation.completionCode}
          </p>
          <p className="mt-1 text-sm text-muted">
            Once your sign is up and working, read this code out to the technician to confirm the job is done.
            Do not share it before then.
          </p>
        </Card>
      )}
      {payOnDelivery && (
        <Card className="border-neon-pink/20">
          <CardTitle>Cash on delivery</CardTitle>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums">{formatINR(totals.duePaise)}</p>
          <p className="text-sm text-muted">
            Pay in cash or by UPI when your sign {order.installationRequired ? 'is installed' : 'arrives'}.
            Keep the amount ready so the handover is quick.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardTitle>{order.items.length === 1 ? 'Your sign' : 'Your signs'}</CardTitle>
            <ul className="mt-4 divide-y divide-white/5">
              {order.items.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex gap-4">
                    <SignThumb
                      previewUrl={item.previewUrl}
                      lettering={item.lettering}
                      alt=""
                      className="size-20"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{item.description}</p>
                      <p className="mt-1 text-muted">
                        {item.widthIn > 0 && `${formatSize(item.widthIn, item.heightIn)} · `}Qty {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatINR(item.amountPaise, { paise: true })}
                    </p>
                  </div>
                  <ProofReview orderNo={order.orderNo} item={item} />
                </li>
              ))}
            </ul>
          </Card>

          {(order.shipment || order.installation) && (
            <Card>
              <CardTitle>Delivery</CardTitle>
              <div className="mt-4 space-y-4 text-sm">
                {order.shipment && (
                  <Fact icon={<Truck className="size-4" />}>
                    {order.shipment.courier ?? 'Courier'}
                    {order.shipment.awbNo && `, tracking number ${order.shipment.awbNo}`}
                    {order.shipment.trackingUrl && (
                      <a
                        href={order.shipment.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-1 font-semibold text-neon-cyan hover:underline"
                      >
                        Track <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </Fact>
                )}
                {order.installation && (
                  <Fact icon={<Wrench className="size-4" />}>
                    {order.installation.completedAt
                      ? `Installed ${formatDate(order.installation.completedAt)}`
                      : order.installation.scheduledStart
                        ? `Installation on ${formatDateTime(order.installation.scheduledStart)}`
                        : 'We will call you to book an installation slot once the sign is ready.'}
                    {order.installation.technician && ` by ${order.installation.technician}`}
                  </Fact>
                )}
              </div>
            </Card>
          )}

          {(order.canReview || order.review) && (
            <Card>
              <CardTitle>Your review</CardTitle>
              <div className="mt-4">
                {order.review ? (
                  <div className="text-sm">
                    <p className="text-amber-300" aria-label={`${order.review.rating} out of 5`}>
                      {'★'.repeat(order.review.rating)}
                      <span className="text-white/20">{'★'.repeat(5 - order.review.rating)}</span>
                    </p>
                    {order.review.comment && <p className="mt-2">{order.review.comment}</p>}
                    {order.review.reply && (
                      <p className="mt-3 border-l-2 border-neon-pink pl-3 text-muted">
                        Neon Adda: {order.review.reply}
                      </p>
                    )}
                  </div>
                ) : (
                  <ReviewForm orderNo={order.orderNo} />
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardTitle>Help</CardTitle>
            {order.tickets.length > 0 && (
              <ul className="mt-4 space-y-3 text-sm">
                {order.tickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-xl border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{TICKET_TYPES[ticket.type] ?? ticket.type}</span>
                      <Badge
                        tone={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'green' : 'amber'}
                      >
                        {ticket.status === 'OPEN'
                          ? 'Open'
                          : ticket.status === 'IN_PROGRESS'
                            ? 'In progress'
                            : 'Resolved'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted">{ticket.description}</p>
                    {ticket.resolution && <p className="mt-2">{ticket.resolution}</p>}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap items-start gap-3">
              <SupportForm orderNo={order.orderNo} />
              {order.canCancel && <CancelOrder orderNo={order.orderNo} />}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardTitle>Payment</CardTitle>
            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Signs" amount={totals.itemsPaise} />
              {totals.installationPaise > 0 && <Row label="Installation" amount={totals.installationPaise} />}
              <Row label="Delivery" amount={totals.deliveryPaise} free />
              {totals.discountPaise > 0 && <Row label="Discount" amount={-totals.discountPaise} />}
              {totals.igstPaise > 0 ? (
                <Row label="IGST" amount={totals.igstPaise} />
              ) : (
                <>
                  <Row label="CGST" amount={totals.cgstPaise} />
                  <Row label="SGST" amount={totals.sgstPaise} />
                </>
              )}
              {totals.roundOffPaise !== 0 && <Row label="Round off" amount={totals.roundOffPaise} />}
              <div className="flex justify-between border-t border-white/5 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(totals.totalPaise)}</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-muted">
                  {payOnDelivery && order.paymentStatus === 'UNPAID'
                    ? 'Pay on delivery'
                    : PAYMENT_STATUS[order.paymentStatus]}
                </dt>
                <dd className="text-muted tabular-nums">
                  {totals.duePaise > 0 ? `${formatINR(totals.duePaise)} due` : 'Nothing due'}
                </dd>
              </div>
            </dl>
            {order.invoices.map((invoice) => (
              <a
                key={invoice.invoiceNo}
                href={invoice.url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-neon-cyan hover:underline"
              >
                <FileText className="size-4" /> Tax invoice {invoice.invoiceNo}
              </a>
            ))}
          </Card>

          <Card>
            <CardTitle>Delivering to</CardTitle>
            <address className="mt-3 text-sm not-italic">
              <span className="font-semibold">{order.shippingAddress.name}</span>
              {addressLines(order.shippingAddress).map((line) => (
                <span key={line} className="block text-muted">
                  {line}
                </span>
              ))}
              <span className="block text-muted">{formatPhone(order.shippingAddress.phone)}</span>
              {order.billingAddress.gstin && (
                <span className="mt-2 block text-xs text-muted">
                  GST invoice to {order.billingAddress.businessName}, {order.billingAddress.gstin}
                </span>
              )}
            </address>
          </Card>

          {order.history.length > 1 && (
            <Card>
              <CardTitle>Activity</CardTitle>
              <ol className="mt-3 space-y-3 text-sm">
                {[...order.history].reverse().map((entry) => (
                  <li key={`${entry.status}-${entry.at}`} className="flex gap-3">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted" />
                    <span>
                      <span className="block">{entry.note ?? ORDER_STATUS[entry.status].label}</span>
                      <span className="text-xs text-muted">{formatDateTime(entry.at)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, amount, free = false }: { label: string; amount: number; free?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular-nums ${amount < 0 ? 'text-emerald-300' : ''}`}>
        {free && amount === 0 ? 'Free' : formatINR(amount, { paise: true })}
      </dd>
    </div>
  );
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <span>{children}</span>
    </p>
  );
}
