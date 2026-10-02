'use client';

import { calculatePrice } from '@neon-adda/shared';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { takeHandoff } from '@/lib/studio-handoff';
import type { StorefrontData } from '@/lib/studio-types';
import type { DesignInput } from '@/lib/types';
import { heightFor, useStudio } from '@/stores/studio-store';
import { DesignAssistant } from './design-assistant';
import { DesignControls } from './design-controls';
import { LightSwitch } from './light-switch';
import { LogoStudio } from './logo-studio';
import type { Snapshot } from './neon-canvas';
import { PriceBar } from './price-bar';

const NeonCanvas = dynamic(() => import('./neon-canvas'), {
  ssr: false,
  loading: () => <div className="aspect-[1.6] w-full animate-pulse rounded-2xl bg-night-800" />,
});

export type StudioMode = 'TEXT' | 'LOGO';

interface StudioProps {
  data: StorefrontData;
  mode: StudioMode;
  initialText?: string;
  /** Pick up a design handed over from a product page, a saved design or a shared link. */
  openHandoff?: boolean;
}

export function Studio({ data, mode, initialText, openHandoff }: StudioProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-40 lg:pb-12">
      {data.offline && process.env.NODE_ENV !== 'production' && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          The API is unreachable, so launch prices are shown and adding to cart is disabled.
        </p>
      )}

      <div
        role="tablist"
        aria-label="Sign type"
        className="mb-5 inline-flex rounded-full border border-white/10 p-1"
      >
        {(['TEXT', 'LOGO'] as const).map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={mode === option}
            onClick={() =>
              router.replace(option === 'LOGO' ? '/studio?mode=logo' : '/studio', { scroll: false })
            }
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              mode === option ? 'bg-white text-night-900' : 'text-muted hover:text-ink'
            }`}
          >
            {option === 'TEXT' ? 'Text sign' : 'Logo sign'}
          </button>
        ))}
      </div>

      {mode === 'LOGO' ? (
        <LogoStudio data={data} />
      ) : (
        <TextStudio data={data} initialText={initialText} openHandoff={openHandoff} />
      )}
    </div>
  );
}

function TextStudio({ data, initialText, openHandoff }: Omit<StudioProps, 'mode'>) {
  const { assets, rules, offline } = data;
  const studio = useStudio();
  const [ready, setReady] = useState(false);
  const [fontRevision, setFontRevision] = useState(0);
  const snapshotRef = useRef<Snapshot | null>(null);

  const product = assets.products.find((p) => p.type === 'TEXT_NEON') ?? assets.products[0]!;

  useEffect(() => {
    const state = useStudio.getState();
    state.reconcile({
      fonts: assets.fonts.map((f) => f.family),
      colorIds: assets.colors.map((c) => c.id),
      backboards: assets.backboards.map((b) => b.code),
    });

    const handoff = openHandoff ? takeHandoff() : null;
    if (handoff) {
      const colorFor = (hex: string) =>
        assets.colors.find((c) => c.glowHex.toUpperCase() === hex.toUpperCase())?.id ?? '';
      state.load({
        lines: handoff.lines.map((line) => ({ text: line.text, colorId: colorFor(line.glowHex) })),
        fontFamily: assets.fonts.some((f) => f.family === handoff.fontFamily)
          ? handoff.fontFamily
          : undefined,
        widthIn: handoff.widthIn,
        backboardCode: assets.backboards.some((b) => b.code === handoff.backboardCode)
          ? handoff.backboardCode
          : undefined,
        addonCodes: handoff.addonCodes?.filter((code) => assets.addons.some((a) => a.code === code)),
      });
    } else if (initialText) {
      state.startWith(initialText);
    }
    setReady(true);
  }, [assets, initialText, openHandoff]);

  useEffect(() => {
    if (!studio.fontFamily) return;
    let cancelled = false;
    document.fonts.load(`100px "${studio.fontFamily}"`).then(() => {
      if (!cancelled) setFontRevision((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [studio.fontFamily]);

  const colorsById = useMemo(() => new Map(assets.colors.map((c) => [c.id, c])), [assets.colors]);
  const canvasLines = studio.lines.map((line) => ({
    text: line.text,
    color: colorsById.get(line.colorId) ?? assets.colors[0]!,
  }));
  const filledLines = canvasLines.filter((line) => line.text.trim());

  const heightIn = heightFor(studio.widthIn, studio.aspect);
  const colorCount = studio.multiColor ? new Set(filledLines.map((l) => l.color.id)).size || 1 : 1;

  const price = useMemo(
    () =>
      calculatePrice(
        {
          productType: product.type,
          backboardCode: studio.backboardCode,
          widthIn: studio.widthIn,
          heightIn,
          colorCount,
          addonCodes: studio.addonCodes,
          qty: 1,
          installation: false,
          sizeLimits: product,
        },
        rules,
      ),
    [product, studio.backboardCode, studio.widthIn, heightIn, colorCount, studio.addonCodes, rules],
  );

  const onAspectChange = useCallback((aspect: number) => useStudio.getState().setAspect(aspect), []);
  const backboard = assets.backboards.find((b) => b.code === studio.backboardCode);

  const design: DesignInput | null =
    filledLines.length && !offline
      ? {
          productId: product.id,
          config: {
            mode: 'TEXT',
            lines: filledLines.map(({ text, color }) => ({
              text: text.trim(),
              colorName: color.name,
              glowHex: color.glowHex,
              tubeHex: color.tubeHex,
            })),
            fontFamily: studio.fontFamily,
            backgroundCode: studio.backgroundCode === 'PHOTO' ? undefined : studio.backgroundCode,
          },
          widthIn: studio.widthIn,
          heightIn,
          backboardCode: studio.backboardCode,
          addonCodes: studio.addonCodes,
        }
      : null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Preview" className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative">
            {ready && (
              <NeonCanvas
                lines={canvasLines}
                fontFamily={studio.fontFamily}
                fontRevision={fontRevision}
                widthIn={studio.widthIn}
                heightIn={heightIn}
                backboardCode={studio.backboardCode}
                backgroundCode={studio.backgroundCode}
                wallPhotoUrl={studio.wallPhotoUrl}
                lightOn={studio.lightOn}
                onAspectChange={onAspectChange}
                snapshotRef={snapshotRef}
              />
            )}
            <LightSwitch on={studio.lightOn} onToggle={studio.toggleLight} />
          </div>
          <p className="mt-2 text-xs text-muted">
            Previews are a close likeness. We send a final design proof for your approval before we start
            making it.
          </p>
        </section>

        <section aria-labelledby="studio-title">
          <h1 id="studio-title" className="font-display text-2xl font-bold">
            Design your neon sign
          </h1>
          <p className="mt-1 mb-4 text-sm text-muted">
            Priced by size. What you see is what you pay, GST included.
          </p>
          {!offline && <DesignAssistant />}
          <DesignControls assets={assets} heightIn={heightIn} />
        </section>
      </div>

      <PriceBar
        price={price}
        design={design}
        display={{
          title: filledLines.map((l) => l.text.trim()).join(' / '),
          productName: product.name,
          productType: product.type,
          backboardName: backboard?.name ?? studio.backboardCode,
        }}
        request={{
          productId: offline ? undefined : product.id,
          productType: product.type,
          backboardCode: studio.backboardCode,
          widthIn: studio.widthIn,
          heightIn,
          colorCount,
          addonCodes: studio.addonCodes,
          qty: 1,
          installation: false,
        }}
        snapshotRef={snapshotRef}
      />
    </>
  );
}
