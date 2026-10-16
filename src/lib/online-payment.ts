'use client';

import { ApiError } from '@neon-adda/shared/web/client';
import { api } from '@/lib/browser-api';

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

interface PaymentStart {
  orderNo: string;
  keyId: string;
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  prefill: { name?: string; email?: string; contact?: string };
}

interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CheckoutFailure {
  error?: { code?: string; description?: string };
}

interface RazorpayCheckout {
  open(): void;
  on(event: 'payment.failed', handler: (failure: CheckoutFailure) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

/** paid: confirmed by our server with Razorpay. Anything else leaves the order waiting for payment. */
export type PaymentOutcome = 'paid' | 'failed' | 'cancelled' | 'pending';

let loading: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('The payment window could not be loaded. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Opens Razorpay's payment window for an order awaiting payment. The result the window gives is
 * only passed to our server, which checks it with Razorpay before the order counts as paid.
 */
export async function payOnline(orderNo: string): Promise<PaymentOutcome> {
  const start = await api.request<PaymentStart>(`/orders/${encodeURIComponent(orderNo)}/payments`, {
    method: 'POST',
  });
  await loadCheckout();

  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false;
    const finish = (outcome: PaymentOutcome) => {
      if (!settled) {
        settled = true;
        resolve(outcome);
      }
    };

    const checkout = new window.Razorpay!({
      key: start.keyId,
      order_id: start.gatewayOrderId,
      amount: start.amountPaise,
      currency: start.currency,
      name: 'Neon Adda',
      description: `Order ${orderNo}`,
      prefill: start.prefill,
      theme: { color: '#ff2e88' },
      handler: async (result: CheckoutResult) => {
        try {
          const verified = await api.request<{ outcome: PaymentOutcome }>(
            `/orders/${encodeURIComponent(orderNo)}/payments/verify`,
            {
              method: 'POST',
              body: JSON.stringify({
                gatewayOrderId: result.razorpay_order_id,
                paymentId: result.razorpay_payment_id,
                signature: result.razorpay_signature,
              }),
            },
          );
          finish(
            verified.outcome === 'paid' || (verified.outcome as string) === 'already-paid'
              ? 'paid'
              : verified.outcome,
          );
        } catch {
          // The money may still have gone through; the webhook or our check will settle it.
          finish('pending');
        }
      },
      modal: { ondismiss: () => finish('cancelled'), confirm_close: true },
    });
    checkout.on('payment.failed', (failure) => {
      void api
        .request(`/orders/${encodeURIComponent(orderNo)}/payments/failed`, {
          method: 'POST',
          body: JSON.stringify({
            gatewayOrderId: start.gatewayOrderId,
            code: failure.error?.code?.slice(0, 60),
            reason: failure.error?.description?.slice(0, 300),
          }),
        })
        .catch(() => undefined);
      // Razorpay keeps its window open so the customer can try another method; closing it ends here.
    });
    checkout.open();
  });
}

export function paymentErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.title;
  if (err instanceof Error) return err.message;
  return 'We could not start the payment. Please try again.';
}
