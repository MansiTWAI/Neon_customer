'use client';

import { formatINR } from '@neon-adda/shared';
import { CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, FormError, Notice } from '@/components/ui/form';
import { payOnline, paymentErrorMessage, type PaymentOutcome } from '@/lib/online-payment';

const MESSAGES: Record<Exclude<PaymentOutcome, 'paid'>, string> = {
  failed:
    'The payment did not go through. If money left your account, your bank returns it on its own. Try again, or use another method.',
  cancelled: 'You closed the payment window. Your order is saved; pay whenever you are ready.',
  pending:
    'We are confirming your payment with the bank. This page will show it as paid within a few minutes. Please do not pay again.',
};

/** For an order placed to pay online: opens the payment window, and shows what happened. */
export function PayNow({
  orderNo,
  duePaise,
  expiresAt,
  initialOutcome,
}: {
  orderNo: string;
  duePaise: number;
  expiresAt: string | null;
  initialOutcome?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(
    initialOutcome && initialOutcome in MESSAGES ? (initialOutcome as PaymentOutcome) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const deadline = expiresAt
    ? new Intl.DateTimeFormat('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(
        new Date(expiresAt),
      )
    : null;

  async function pay() {
    setPending(true);
    setError(null);
    try {
      const result = await payOnline(orderNo);
      setOutcome(result);
      if (result === 'paid') router.replace(`/orders/${orderNo}?placed=1`);
      else router.refresh();
    } catch (err) {
      setError(paymentErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-neon-pink/30 bg-night-800 p-5">
      <p className="flex items-center gap-2 font-semibold">
        <CreditCard className="size-5 text-neon-pink" /> Payment needed
      </p>
      <p className="text-sm text-muted">
        We start on your sign once {formatINR(duePaise)} is paid
        {deadline ? `. Please pay by ${deadline} today, or the order lapses.` : '.'}
      </p>
      {outcome && outcome !== 'paid' && (
        <Notice tone={outcome === 'pending' ? 'info' : 'warning'}>{MESSAGES[outcome]}</Notice>
      )}
      <FormError message={error} />
      {outcome === 'pending' ? (
        <Button onClick={() => router.refresh()} variant="secondary" className="w-full sm:w-auto">
          Check payment status
        </Button>
      ) : (
        <Button onClick={pay} pending={pending} className="w-full sm:w-auto">
          Pay {formatINR(duePaise)} now
        </Button>
      )}
    </div>
  );
}
