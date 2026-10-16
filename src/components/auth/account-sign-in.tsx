'use client';

import { ApiError } from '@neon-adda/shared/web/client';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/browser-api';

interface CodeSent {
  resendInSeconds: number;
  /** Returned while WhatsApp is not connected yet. */
  previewCode?: string;
}

interface Registration extends CodeSent {
  challenge: string;
  phone: string;
}

type Mode = 'sign-in' | 'register' | 'forgot';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-night-900 px-4 py-3 text-base outline-none placeholder:text-muted/60 focus:border-neon-cyan';

/** What went wrong, in words: the first field the API rejected, or its title. */
function messageOf(err: unknown) {
  if (!(err instanceof ApiError)) return 'We could not reach the store. Check your connection.';
  const fields = err.details.errors as { message: string }[] | undefined;
  return fields?.[0]?.message ?? err.title;
}

const fieldsOf = (event: FormEvent<HTMLFormElement>) =>
  Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;

/**
 * Registration confirms the mobile number with a one-time code; after that, customers sign in with
 * their email or mobile number and password, with no code each time.
 */
const HEADINGS: Record<Mode, string> = {
  'sign-in': 'Sign in',
  register: 'Create an account',
  forgot: 'Reset your password',
};

export function AccountSignIn({ next, initialMode = 'sign-in' }: { next: string; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{HEADINGS[mode]}</h1>
      <p className="mt-2 mb-8 text-muted">Track orders, approve design proofs and check out faster.</p>
      <SignInForms next={next} mode={mode} setMode={setMode} />
    </>
  );
}

function SignInForms({ next, mode, setMode }: { next: string; mode: Mode; setMode: (mode: Mode) => void }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [resetSent, setResetSent] = useState<(CodeSent & { phone: string }) | null>(null);
  const [resetAvailable, setResetAvailable] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .request<{ passwordReset: boolean }>('/auth/customer/options')
      .then((options) => setResetAvailable(options.passwordReset))
      .catch(() => setResetAvailable(false));
  }, []);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setPending(false);
    }
  }

  // A full load, so nothing rendered for the previous session survives in the router cache.
  const finish = () => window.location.replace(next);

  function switchTo(target: Mode) {
    setMode(target);
    setError(null);
    setRegistration(null);
    setResetSent(null);
  }

  const post = <T,>(path: string, body: unknown) =>
    api.request<T>(path, { method: 'POST', body: JSON.stringify(body) });

  if (registration) {
    return (
      <CodeForm
        sent={registration}
        phone={registration.phone}
        pending={pending}
        error={error}
        submitLabel="Create account"
        onBack={() => setRegistration(null)}
        onSubmit={(code) =>
          run(async () => {
            await post('/auth/customer/register/verify', { challenge: registration.challenge, code });
            finish();
          })
        }
      />
    );
  }

  if (mode === 'register') {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const fields = fieldsOf(event);
          void run(async () => setRegistration(await post<Registration>('/auth/customer/register', fields)));
        }}
      >
        <Field label="Full name">
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={60}
            autoFocus
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={120}
            className={inputClass}
          />
        </Field>
        <PhoneField />
        <Field label="Password" hint="At least 8 characters.">
          <PasswordInput autoComplete="new-password" />
        </Field>
        <ErrorNote message={error} />
        <Submit pending={pending}>Continue</Submit>
        <p className="text-center text-xs text-muted">
          We’ll send a code on WhatsApp to confirm your number, once. After that you sign in with your
          password.
        </p>
        <SwitchLine prompt="Already have an account?" action="Sign in" onClick={() => switchTo('sign-in')} />
      </form>
    );
  }

  if (mode === 'forgot') {
    if (resetSent) {
      return (
        <CodeForm
          sent={resetSent}
          phone={resetSent.phone}
          pending={pending}
          error={error}
          submitLabel="Set new password"
          withPassword
          onBack={() => setResetSent(null)}
          onSubmit={(code, password) =>
            run(async () => {
              await post('/auth/customer/password/reset', { phone: resetSent.phone, code, password });
              finish();
            })
          }
        />
      );
    }
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const { phone } = fieldsOf(event);
          void run(async () => {
            const sent = await post<CodeSent>('/auth/customer/password/forgot', { phone });
            setResetSent({ ...sent, phone: phone! });
          });
        }}
      >
        <p className="text-sm text-muted">
          Enter the mobile number on your account. We’ll send a code on WhatsApp to set a new password.
        </p>
        <PhoneField autoFocus />
        <ErrorNote message={error} />
        <Submit pending={pending}>Send code</Submit>
        <SwitchLine prompt="Remembered it?" action="Sign in" onClick={() => switchTo('sign-in')} />
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const fields = fieldsOf(event);
        void run(async () => {
          await post('/auth/customer/login', fields);
          finish();
        });
      }}
    >
      <Field label="Email or mobile number">
        <input
          name="login"
          autoComplete="username"
          placeholder="you@example.com or 98123 45678"
          required
          autoFocus
          className={inputClass}
        />
      </Field>
      <Field label="Password">
        <PasswordInput autoComplete="current-password" />
      </Field>
      <ErrorNote message={error} />
      <Submit pending={pending}>Sign in</Submit>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {resetAvailable ? (
          <button type="button" onClick={() => switchTo('forgot')} className="link">
            Forgot password?
          </button>
        ) : (
          <span className="text-xs text-muted">Forgot your password? Contact us and we’ll help.</span>
        )}
      </div>
      <SwitchLine prompt="New here?" action="Create an account" onClick={() => switchTo('register')} />
      <p className="text-center text-xs text-muted">
        Used to sign in with a WhatsApp code? Create an account with the same number to set a password. Your
        orders stay with it.
      </p>
    </form>
  );
}

function CodeForm({
  sent,
  phone,
  pending,
  error,
  submitLabel,
  withPassword = false,
  onBack,
  onSubmit,
}: {
  sent: CodeSent;
  phone: string;
  pending: boolean;
  error: string | null;
  submitLabel: string;
  withPassword?: boolean;
  onBack: () => void;
  onSubmit: (code: string, password?: string) => void;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const { code, password } = fieldsOf(event);
        onSubmit(code!, password);
      }}
    >
      <Field label={`Enter the code we sent on WhatsApp to ${phone}`}>
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
          className={`${inputClass} text-center font-mono text-xl tracking-[0.5em]`}
        />
        {sent.previewCode && (
          <span className="mt-1.5 block text-xs text-amber-300">
            WhatsApp is not connected yet, so use the code {sent.previewCode}. We have filled it in for you.
          </span>
        )}
      </Field>
      {withPassword && (
        <Field label="New password" hint="At least 8 characters.">
          <PasswordInput autoComplete="new-password" />
        </Field>
      )}
      <ErrorNote message={error} />
      <Submit pending={pending}>{submitLabel}</Submit>
      <button type="button" onClick={onBack} className="text-sm text-muted hover:text-ink">
        Change details
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function PhoneField({ autoFocus = false }: { autoFocus?: boolean }) {
  return (
    <Field label="Mobile number">
      <div className="flex">
        <span className="grid place-items-center rounded-l-xl border border-r-0 border-white/10 bg-night-800 px-3 text-muted">
          +91
        </span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98123 45678"
          required
          autoFocus={autoFocus}
          className={`${inputClass} rounded-l-none`}
        />
      </div>
    </Field>
  );
}

function PasswordInput({ autoComplete }: { autoComplete: 'current-password' | 'new-password' }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        name="password"
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        minLength={autoComplete === 'new-password' ? 8 : 1}
        maxLength={128}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SwitchLine({ prompt, action, onClick }: { prompt: string; action: string; onClick: () => void }) {
  return (
    <p className="text-center text-sm text-muted">
      {prompt}{' '}
      <button type="button" onClick={onClick} className="font-semibold link">
        {action}
      </button>
    </p>
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

function ErrorNote({ message }: { message: string | null }) {
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
