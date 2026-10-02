'use client';

import { ApiError } from '@neon-adda/shared/web/client';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/browser-api';

interface OtpSent {
  resendInSeconds: number;
  /** Returned while WhatsApp is not connected yet. */
  previewCode?: string;
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-night-900 px-4 py-3 text-base outline-none placeholder:text-muted/60 focus:border-neon-cyan';

export function PhoneSignIn({ next }: { next: string }) {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'We could not reach the store. Check your connection.');
    } finally {
      setPending(false);
    }
  }

  const requestCode = () =>
    run(async () => {
      const result = await api.request<OtpSent>('/auth/customer/otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setSent(result);
      setResendIn(result.resendInSeconds);
    });

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get('code');
    void run(async () => {
      await api.request('/auth/customer/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      // A full load, so nothing rendered for the previous session survives in the router cache.
      window.location.replace(next);
    });
  }

  if (!sent) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void requestCode();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="text-sm text-muted">Mobile number</span>
          <div className="mt-1.5 flex">
            <span className="grid place-items-center rounded-l-xl border border-r-0 border-white/10 bg-night-800 px-3 text-muted">
              +91
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="98123 45678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              autoFocus
              className={`${inputClass} rounded-l-none`}
            />
          </div>
        </label>
        <Error message={error} />
        <Submit pending={pending}>Send code</Submit>
        <p className="text-center text-xs text-muted">
          We’ll send a 6-digit code on WhatsApp. No password needed.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <label className="block">
        <span className="text-sm text-muted">Enter the code we sent on WhatsApp to +91 {phone}</span>
        <input
          key={sent.previewCode}
          name="code"
          defaultValue={sent.previewCode}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder="000000"
          required
          autoFocus
          className={`${inputClass} mt-1.5 text-center font-mono text-xl tracking-[0.5em]`}
        />
        {sent.previewCode && (
          <span className="mt-1.5 block text-xs text-amber-300">
            WhatsApp is not connected yet, so we filled in your code: {sent.previewCode}
          </span>
        )}
      </label>
      <Error message={error} />
      <Submit pending={pending}>Continue</Submit>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={() => setSent(null)} className="text-muted hover:text-ink">
          Change number
        </button>
        <button
          type="button"
          onClick={requestCode}
          disabled={resendIn > 0 || pending}
          className="font-semibold text-neon-cyan disabled:text-muted"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon-pink px-6 py-3 font-bold text-white transition hover:shadow-neon disabled:opacity-60"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

function Error({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
    >
      {message}
    </p>
  );
}
