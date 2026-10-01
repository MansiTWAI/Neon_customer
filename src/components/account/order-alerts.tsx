'use client';

import { enablePushNotifications, pushSupport, type PushOutcome } from '@neon-adda/shared/web/client';
import { BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/browser-api';
import { FIREBASE_CONFIG } from '@/lib/firebase';

type State = PushOutcome | 'available' | 'checking' | 'working' | 'failed';

const MESSAGES: Partial<Record<State, string>> = {
  enabled: 'You’ll get an alert on this device when your proof is ready and when your order ships.',
  denied: 'Notifications are blocked for this site. Allow them in your browser settings to get order alerts.',
  unsupported: 'This browser can’t show notifications. We’ll keep you posted on WhatsApp instead.',
  failed: 'Something went wrong turning on alerts. Please try again.',
};

/** Order alerts through Firebase Cloud Messaging. Not rendered when Firebase is not configured. */
export function OrderAlerts() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    void pushSupport(FIREBASE_CONFIG).then(setState);
  }, []);

  if (state === 'checking' || state === 'unconfigured') return null;

  async function enable() {
    setState('working');
    try {
      setState(
        await enablePushNotifications(FIREBASE_CONFIG, (token) =>
          api.request('/notifications/customer/devices', { method: 'POST', body: JSON.stringify({ token }) }),
        ),
      );
    } catch {
      setState('failed');
    }
  }

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-night-800 p-6">
      <BellRing className="size-6 shrink-0 text-neon-pink" />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">Order alerts</h2>
        <p className="mt-1 text-sm text-muted">
          {MESSAGES[state] ??
            'Get notified on this device when your design proof is ready and when your sign ships.'}
        </p>
      </div>
      {(state === 'available' || state === 'working' || state === 'failed') && (
        <button
          onClick={enable}
          disabled={state === 'working'}
          className="rounded-full bg-neon-pink px-5 py-2 text-sm font-bold text-white transition hover:shadow-neon disabled:opacity-60"
        >
          Turn on
        </button>
      )}
    </section>
  );
}
