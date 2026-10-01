import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/5 bg-night-800 p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <Icon className="size-9 text-muted" />
      <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 rounded-full bg-neon-pink px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-neon"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-white/10 text-ink',
  pink: 'bg-neon-pink/15 text-pink-200',
  cyan: 'bg-neon-cyan/15 text-cyan-200',
  green: 'bg-emerald-500/15 text-emerald-200',
  amber: 'bg-amber-500/15 text-amber-200',
  red: 'bg-red-500/15 text-red-200',
};

export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}
