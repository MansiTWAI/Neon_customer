import {
  Banknote,
  BadgeCheck,
  Hammer,
  IndianRupee,
  PenLine,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';

/**
 * Reassurances shown around the shop. Each one is something the shop really does (see the FAQ,
 * the policies and checkout); none are ratings or claims that cannot be checked.
 */
const POINTS = [
  { icon: Hammer, label: 'Handmade and tested' },
  { icon: IndianRupee, label: 'Priced by size, GST included' },
  { icon: PenLine, label: '3 free proof changes' },
  { icon: ShieldCheck, label: '1-year warranty' },
  { icon: Banknote, label: 'Cash on delivery' },
  { icon: Truck, label: 'Delivered across India' },
  { icon: Wrench, label: 'Installation in partner cities' },
];

/** The thin bar above the header: the three things people ask first. */
export function AnnouncementBar() {
  return (
    <div className="border-b border-white/5 bg-night-950 px-4 py-2 text-center text-xs text-muted">
      <span className="text-ink">Cash on delivery</span> · Design proof before we make it
      <span className="hidden sm:inline"> · Delivered across India</span>
    </div>
  );
}

/** The same promises as a quiet row, for under a hero or a buy box. */
export function TrustRow({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted ${className}`}>
      {POINTS.slice(2, 6).map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="size-4 text-ink/70" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

const SERVICES = [
  {
    icon: Truck,
    title: 'Delivered across India',
    body: 'Packed in a rigid box, with tracking on your order page.',
  },
  {
    icon: BadgeCheck,
    title: 'Proof before we make it',
    body: 'Three rounds of changes included with every sign.',
  },
  {
    icon: Zap,
    title: 'Cool and efficient',
    body: 'LED neon on a 12 V adapter, a fraction of glass neon’s power.',
  },
  { icon: ShieldCheck, title: '1-year warranty', body: 'On the LED neon, the adapter and the dimmer.' },
];

/** Four promises above the footer, on every page. */
export function ServiceStrip() {
  return (
    <section aria-label="Our promises" className="border-t border-white/5 bg-night-900">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4">
        {SERVICES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/5">
              <Icon className="size-5 text-ink/80" aria-hidden />
            </span>
            <span className="mt-2 sm:mt-0 sm:ml-3">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-0.5 block text-xs text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
