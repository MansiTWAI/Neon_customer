import { LoaderCircle } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const control =
  'w-full rounded-xl border border-white/10 bg-night-900 px-4 py-2.5 text-base outline-none transition placeholder:text-muted/60 focus:border-neon-cyan disabled:opacity-60 aria-invalid:border-red-400/70';

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className = '',
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="text-muted">
        {label}
        {optional && <span className="text-muted/60"> (optional)</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1 block text-xs text-red-300">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${control} resize-y ${props.className ?? ''}`} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-neon-pink text-white hover:shadow-neon',
  secondary: 'bg-white/10 text-ink hover:bg-white/15',
  ghost: 'text-muted hover:bg-white/5 hover:text-ink',
  danger: 'bg-red-500/15 text-red-200 hover:bg-red-500/25',
};

export function Button({
  variant = 'primary',
  pending = false,
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  pending?: boolean;
  size?: 'sm' | 'md';
}) {
  const sizing = size === 'sm' ? 'px-4 py-2 text-sm' : 'px-6 py-3';
  return (
    <button
      {...props}
      disabled={disabled || pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none ${sizing} ${variants[variant]} ${className}`}
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
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

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning';
  children: ReactNode;
}) {
  const tones = {
    info: 'border-neon-cyan/30 bg-neon-cyan/10 text-cyan-100',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

/** Field errors from a VALIDATION_FAILED problem, keyed by field path. */
export function fieldErrors(details: Record<string, unknown> | undefined): Record<string, string> {
  const errors = (details?.errors ?? []) as { field: string; message: string }[];
  return Object.fromEntries(errors.map((e) => [e.field, e.message]));
}
