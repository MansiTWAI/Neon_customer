'use client';

import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { NeonBackdrop, NeonText } from '@/components/ui/neon-text';
import { Button, Field, fieldErrors, FormError, Select, TextArea, TextInput } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import type { StudioAssets } from '@/lib/studio-types';
import type { DesignInput, QuoteKind } from '@/lib/types';
import { heightFor, useStudio } from '@/stores/studio-store';

const KINDS: { value: Exclude<QuoteKind, 'LOGO'>; label: string }[] = [
  { value: 'LARGE', label: 'A sign bigger than 8 feet' },
  { value: 'BULK', label: 'Many signs, for an event or a chain of stores' },
  { value: 'CUSTOM', label: 'Something else' },
];

export function QuoteRequestForm({
  assets,
  initialKind,
  fromStudio,
}: {
  assets: StudioAssets;
  initialKind: QuoteKind;
  fromStudio: boolean;
}) {
  const router = useRouter();
  const studio = useStudio();
  const [hydrated, setHydrated] = useState(false);
  const [kind, setKind] = useState<Exclude<QuoteKind, 'LOGO'>>(
    initialKind === 'LOGO' ? 'LARGE' : initialKind,
  );
  const [includeDesign, setIncludeDesign] = useState(fromStudio);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => setHydrated(true), []);

  const product = assets.products.find((p) => p.type === 'TEXT_NEON');
  const colors = new Map(assets.colors.map((c) => [c.id, c]));
  const lines = studio.lines
    .filter((line) => line.text.trim())
    .map((line) => ({ text: line.text.trim(), color: colors.get(line.colorId) ?? assets.colors[0]! }));
  const studioDesign: DesignInput | null =
    hydrated && product && lines.length
      ? {
          productId: product.id,
          config: {
            mode: 'TEXT',
            lines: lines.map(({ text, color }) => ({
              text,
              colorName: color.name,
              glowHex: color.glowHex,
              tubeHex: color.tubeHex,
            })),
            fontFamily: studio.fontFamily,
          },
          widthIn: studio.widthIn,
          heightIn: heightFor(studio.widthIn, studio.aspect),
          backboardCode: studio.backboardCode,
          addonCodes: studio.addonCodes,
        }
      : null;
  const design = includeDesign ? studioDesign : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = (key: string) => (form.get(key) ? Number(form.get(key)) : undefined);
    setPending(true);
    setErrors({});
    setError(null);

    try {
      const quote = await api.request<{ id: string }>('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          design: design ?? undefined,
          widthIn: design ? undefined : number('widthIn'),
          heightIn: design ? undefined : number('heightIn'),
          qty: number('qty') ?? 1,
          pincode: String(form.get('pincode') ?? '').trim(),
          installation: form.get('installation') === 'on',
          message: String(form.get('message') ?? '').trim() || undefined,
        }),
      });
      router.push(`/account/quotes/${quote.id}?requested=1`);
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.code === 'VALIDATION_FAILED') setErrors(fieldErrors(err.details));
      else setError(err instanceof ApiError ? err.title : 'Could not send your request. Please try again.');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="What do you need?">
        <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          {KINDS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <p className="-mt-2 flex items-center gap-2 text-sm text-muted">
        <ImageIcon className="size-4" /> For a logo,{' '}
        <Link href="/studio?mode=logo" className="font-semibold text-neon-cyan hover:underline">
          upload it in the logo studio
        </Link>
      </p>

      {studioDesign && (
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 p-3">
          <input
            type="checkbox"
            checked={includeDesign}
            onChange={(e) => setIncludeDesign(e.target.checked)}
            className="accent-pink-500"
          />
          <NeonBackdrop className="h-16 w-28 shrink-0 overflow-hidden rounded-lg">
            {studioDesign.config.mode === 'TEXT' && (
              <NeonText
                lines={studioDesign.config.lines}
                fontFamily={studioDesign.config.fontFamily}
                size="sm"
              />
            )}
          </NeonBackdrop>
          <span className="text-sm">
            <span className="block font-semibold">Include my studio design</span>
            <span className="text-muted">
              {studioDesign.widthIn}″ × {studioDesign.heightIn}″
            </span>
          </span>
        </label>
      )}

      {!design && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Width in inches" optional error={errors.widthIn}>
            <TextInput name="widthIn" type="number" min={4} max={600} step="0.5" />
          </Field>
          <Field label="Height in inches" optional error={errors.heightIn}>
            <TextInput name="heightIn" type="number" min={2} max={600} step="0.5" />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="How many signs" error={errors.qty}>
          <TextInput
            name="qty"
            type="number"
            min={1}
            max={1000}
            defaultValue={kind === 'BULK' ? 25 : 1}
            key={kind}
            required
          />
        </Field>
        <Field label="Delivery pincode" error={errors.pincode}>
          <TextInput name="pincode" inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" required />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="installation" className="accent-pink-500" />
        We need it installed
      </label>

      <Field
        label="Tell us about it"
        optional={Boolean(design)}
        error={errors.message}
        hint="The words, where it will hang, colours, and the date you need it by."
      >
        <TextArea name="message" rows={5} maxLength={2000} required={!design} />
      </Field>

      <FormError message={error} />
      <Button type="submit" pending={pending} className="w-full sm:w-auto">
        Request a quotation
      </Button>
    </form>
  );
}
