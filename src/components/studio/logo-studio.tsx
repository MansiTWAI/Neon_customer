'use client';

import { calculatePrice, formatINR } from '@neon-adda/shared';
import { Check, ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, Field, FormError, TextArea, TextInput } from '@/components/ui/form';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { LogoTraceError, traceLogo, type TracedLogo } from '@/lib/logo-trace';
import type { StorefrontData } from '@/lib/studio-types';
import { useStudio, WALL_PHOTO } from '@/stores/studio-store';
import type { Snapshot } from './neon-canvas';
import { LightSwitch } from './light-switch';

const LogoCanvas = dynamic(() => import('./logo-canvas'), {
  ssr: false,
  loading: () => <div className="aspect-[1.6] w-full animate-pulse rounded-2xl bg-night-800" />,
});

const ACCEPTED = 'image/png,image/jpeg,image/webp';
const MAX_BYTES = 10 * 1024 * 1024;
const WIDTHS = { min: 12, max: 96 };

type Session = 'checking' | 'signed-in' | 'signed-out';

export function LogoStudio({ data }: { data: StorefrontData }) {
  const { assets, rules, offline } = data;
  const router = useRouter();
  const { backgroundCode, setBackground, wallPhotoUrl } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef<Snapshot | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [traced, setTraced] = useState<TracedLogo | null>(null);
  const [tracing, setTracing] = useState(false);
  const [colorId, setColorId] = useState(assets.colors[1]?.id ?? assets.colors[0]!.id);
  const [widthIn, setWidthIn] = useState(24);
  const [backboardCode, setBackboardCode] = useState('BLK_ACR');
  const [lightOn, setLightOn] = useState(true);
  const [session, setSession] = useState<Session>('checking');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = assets.products.find((p) => p.type === 'LOGO_NEON');
  const color = assets.colors.find((c) => c.id === colorId) ?? assets.colors[0]!;
  const heightIn = traced
    ? Math.max(4, Math.round(widthIn * traced.aspect * 2) / 2)
    : Math.round(widthIn * 0.6);

  useEffect(() => {
    api
      .request('/auth/customer/me')
      .then(() => setSession('signed-in'))
      .catch(() => setSession('signed-out'));
  }, []);

  async function chooseFile(chosen: File | undefined) {
    if (!chosen) return;
    setError(null);
    if (!ACCEPTED.split(',').includes(chosen.type))
      return setError('Upload a PNG, JPG or WebP image of your logo.');
    if (chosen.size > MAX_BYTES) return setError('Logos can be up to 10 MB.');

    setTracing(true);
    try {
      setTraced(await traceLogo(chosen));
      setFile(chosen);
    } catch (err) {
      setError(
        err instanceof LogoTraceError ? err.message : 'We could not read this image. Try another file.',
      );
    } finally {
      setTracing(false);
    }
  }

  const estimate = useMemo(() => {
    if (!traced) return null;
    const price = calculatePrice(
      {
        productType: 'LOGO_NEON',
        backboardCode,
        widthIn,
        heightIn,
        colorCount: 1,
        addonCodes: [],
        qty: 1,
        installation: false,
      },
      rules,
    );
    return price.status === 'OK' ? price.payablePaise : null;
  }, [traced, backboardCode, widthIn, heightIn, rules]);

  async function requestQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !product) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.append('file', file);
      const upload = await api.request<{ id: string }>('/uploads/logo', { method: 'POST', body });

      const quote = await api.request<{ id: string }>('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'LOGO',
          design: {
            productId: product.id,
            config: {
              mode: 'LOGO',
              uploadId: upload.id,
              colorName: color.name,
              glowHex: color.glowHex,
              tubeHex: color.tubeHex,
            },
            widthIn,
            heightIn,
            backboardCode,
            addonCodes: [],
          },
          preview: snapshotRef.current?.() ?? undefined,
          qty: Number(form.get('qty')) || 1,
          pincode: String(form.get('pincode') ?? '').trim(),
          installation: form.get('installation') === 'on',
          message: String(form.get('message') ?? '').trim() || undefined,
        }),
      });
      router.push(`/account/quotes/${quote.id}?requested=1`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setSession('signed-out');
      setError(err instanceof ApiError ? err.title : 'We could not send your request. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section aria-label="Preview" className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative">
          {traced ? (
            <LogoCanvas
              outline={traced.outline}
              color={color}
              widthIn={widthIn}
              heightIn={heightIn}
              backboardCode={backboardCode}
              backgroundCode={backgroundCode}
              wallPhotoUrl={wallPhotoUrl}
              lightOn={lightOn}
              snapshotRef={snapshotRef}
            />
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void chooseFile(e.dataTransfer.files[0]);
              }}
              className="grid aspect-[1.6] w-full place-items-center rounded-2xl border border-dashed border-white/15 bg-night-800 text-center transition hover:border-white/40"
            >
              <span className="px-6">
                {tracing ? (
                  <LoaderCircle className="mx-auto size-8 animate-spin text-muted" />
                ) : (
                  <Upload className="mx-auto size-8 text-muted" />
                )}
                <span className="mt-3 block font-semibold">
                  {tracing ? 'Tracing your logo' : 'Upload your logo'}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  PNG, JPG or WebP up to 10 MB. A plain or transparent background works best.
                </span>
              </span>
            </button>
          )}
          {traced && <LightSwitch on={lightOn} onToggle={() => setLightOn((on) => !on)} />}
        </div>
        <p className="mt-2 text-xs text-muted">
          This preview traces the outline of your logo. Our designers draw the final tube layout by hand and
          send it to you with the quotation.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => {
            void chooseFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </section>

      <section aria-labelledby="logo-title" className="space-y-4">
        <div>
          <h1 id="logo-title" className="font-display text-2xl font-bold">
            Your logo in neon
          </h1>
          <p className="mt-1 text-sm text-muted">
            Upload it, pick a colour and size, and we will send a quotation within one working day.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/5 bg-night-800 p-4">
          {traced && (
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-neon-cyan hover:underline"
            >
              <ImagePlus className="size-4" /> Use a different logo
            </button>
          )}

          <fieldset>
            <legend className="mb-2 text-sm text-muted">Colour</legend>
            <div className="flex flex-wrap gap-2.5">
              {assets.colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColorId(c.id)}
                  aria-label={c.name}
                  aria-pressed={colorId === c.id}
                  title={c.name}
                  className={`grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-night-800 transition ${
                    colorId === c.id ? 'ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ background: c.glowHex, boxShadow: `0 0 12px ${c.glowHex}` }}
                >
                  {colorId === c.id && <Check className="size-4 text-black/70" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="logo-width" className="text-sm text-muted">
              Width in inches
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="logo-width"
                type="range"
                min={WIDTHS.min}
                max={WIDTHS.max}
                value={widthIn}
                onChange={(e) => setWidthIn(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
              <span className="w-24 text-right text-sm font-semibold tabular-nums">
                {widthIn}″ × {heightIn}″
              </span>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm text-muted">Backboard</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {assets.backboards.map((board) => (
                <button
                  key={board.code}
                  onClick={() => setBackboardCode(board.code)}
                  aria-pressed={backboardCode === board.code}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    backboardCode === board.code
                      ? 'border-neon-pink bg-neon-pink/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {board.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm text-muted">Wall</legend>
            <div className="flex flex-wrap gap-2">
              {assets.backgrounds.map((wall) => (
                <button
                  key={wall.code}
                  onClick={() => setBackground(wall.code)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    backgroundCode === wall.code
                      ? 'border-neon-pink bg-neon-pink/15'
                      : 'border-white/15 text-muted hover:text-ink'
                  }`}
                >
                  {wall.name}
                </button>
              ))}
              {wallPhotoUrl && (
                <button
                  onClick={() => setBackground(WALL_PHOTO)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    backgroundCode === WALL_PHOTO
                      ? 'border-neon-pink bg-neon-pink/15'
                      : 'border-white/15 text-muted hover:text-ink'
                  }`}
                >
                  Your wall
                </button>
              )}
            </div>
          </fieldset>
        </div>

        {traced && (
          <form
            onSubmit={requestQuote}
            className="space-y-4 rounded-2xl border border-white/5 bg-night-800 p-4"
          >
            {estimate !== null && (
              <p className="text-sm">
                <span className="text-muted">Estimated </span>
                <span className="font-display text-xl font-bold tabular-nums">{formatINR(estimate)}</span>
                <span className="text-muted"> incl. GST. Your quotation confirms the final price.</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Delivery pincode">
                <TextInput
                  name="pincode"
                  inputMode="numeric"
                  pattern="[1-9][0-9]{5}"
                  maxLength={6}
                  required
                />
              </Field>
              <Field label="How many">
                <TextInput name="qty" type="number" min={1} max={1000} defaultValue={1} required />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="installation" className="accent-pink-500" />I would like it
              installed
            </label>
            <Field label="Anything we should know" optional>
              <TextArea
                name="message"
                rows={3}
                maxLength={2000}
                placeholder="Where it will go, the date you need it by"
              />
            </Field>
            <FormError message={error} />
            {session === 'signed-out' ? (
              <p className="text-sm text-muted">
                <Link
                  href={`/login?next=${encodeURIComponent('/studio?mode=logo')}`}
                  className="font-semibold text-neon-cyan hover:underline"
                >
                  Sign in
                </Link>{' '}
                to send your logo. You will need to choose the file again afterwards.
              </p>
            ) : (
              <Button
                type="submit"
                pending={submitting}
                disabled={offline || !product || session === 'checking'}
                className="w-full"
              >
                Request a quotation
              </Button>
            )}
          </form>
        )}
        {!traced && <FormError message={error} />}
      </section>
    </div>
  );
}
