'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const SORTS = {
  featured: 'Featured',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
  new: 'Newest',
} as const;

export type Sort = keyof typeof SORTS;

export function SortSelect({ value }: { value: Sort }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Sort
      <select
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value === 'featured') next.delete('sort');
          else next.set('sort', event.target.value);
          router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
        }}
        className="rounded-full border border-white/10 bg-night-900 px-3 py-1.5 text-ink outline-none focus:border-neon-cyan"
      >
        {Object.entries(SORTS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
