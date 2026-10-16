'use client';

import { calculatePrice, formatINR } from '@neon-adda/shared';
import {
  ArrowRight,
  ChevronDown,
  Download,
  Hammer,
  Hand,
  ImagePlus,
  Lightbulb,
  LoaderCircle,
  LogIn,
  PenLine,
  Plus,
  Power,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  BackboardStep,
  ColourStep,
  ExtrasStep,
  FontStep,
  SizeStep,
} from '@/components/studio/design-controls';
import type { Snapshot } from '@/components/studio/neon-canvas';
import { PriceBar } from '@/components/studio/price-bar';
import { NeonBackdrop, NeonBoard, NeonText } from '@/components/ui/neon-text';
import { useStudioSetup } from '@/components/studio/use-studio-setup';
import { ApiError, publicRequest } from '@/lib/api';
import { RENDERABLE_FONTS, saveForQuote } from '@/lib/artwork';
import { api } from '@/lib/browser-api';
import type { Backboard, Lighting, NeonDesign, WallId } from '@/lib/neon-renderer';
import { NEON_SYMBOLS, SYMBOL_CHARACTERS } from '@/lib/neon-symbols';
import type { StorefrontData, StudioBackboard } from '@/lib/studio-types';
import type { DesignInput } from '@/lib/types';
import { heightFor, MAX_CHARS_PER_LINE, MAX_LINES, useStudio } from '@/stores/studio-store';
import type { NeonSign3DHandle } from './neon-sign-3d';

// Three.js is large, so the 3D view loads only in the browser and only on this page.
const NeonSign3D = dynamic(() => import('./neon-sign-3d').then((module) => module.NeonSign3D), {
  ssr: false,
  // The words are shown in CSS over the canvas until the first 3D frame, so nothing is needed here.
  loading: () => null,
});

/** Built-in walls, named for where signs like this usually hang. The swatch is a CSS stand-in. */
const WALLS: { id: WallId; label: string; swatch: string }[] = [
  {
    id: 'brick',
    label: 'Brick · café',
    swatch: 'repeating-linear-gradient(0deg,#7a3f30 0 9px,#3a3633 9px 11px)',
  },
  { id: 'plaster', label: 'White · living room', swatch: '#e9e4dc' },
  { id: 'pastel', label: 'Pastel · bedroom', swatch: '#e8c9cf' },
  {
    id: 'wood',
    label: 'Wood · cosy',
    swatch: 'repeating-linear-gradient(90deg,#8a5a34 0 10px,#6d4527 10px 12px)',
  },
  {
    id: 'slats',
    label: 'Slats · office',
    swatch: 'repeating-linear-gradient(90deg,#7c5233 0 5px,#1d140e 5px 7px)',
  },
  {
    id: 'tiles',
    label: 'Tiles · bar',
    swatch: 'repeating-linear-gradient(0deg,#e6e5df 0 6px,#b9b6ae 6px 7px)',
  },
  {
    id: 'drapes',
    label: 'Drapes · wedding',
    swatch: 'repeating-linear-gradient(90deg,#f2e7da 0 4px,#c9b9a6 6px,#f2e7da 9px)',
  },
  { id: 'panels', label: 'Panels · gaming', swatch: '#24242c' },
  { id: 'concrete', label: 'Concrete · studio', swatch: '#7d7d7a' },
  { id: 'dark', label: 'Dark', swatch: '#16161a' },
];

const ROOM_IDEAS = [
  'A cosy bedroom with fairy lights',
  'A café with exposed brick and plants',
  'A gaming room with an RGB desk setup',
  'A wedding stage with white flowers and drapes',
  'A modern office reception',
  'A beauty salon with mirrors',
];

const TUBES: { value: number; label: string }[] = [
  { value: 0.8, label: 'Slim' },
  { value: 1, label: 'Classic' },
  { value: 1.35, label: 'Bold' },
];

/** Only what the shop actually offers: see the FAQ and the warranty policy. */
const PROMISES = [
  { icon: ShieldCheck, label: '1-year warranty' },
  { icon: Hammer, label: 'Handmade, tested' },
  { icon: PenLine, label: '3 free proof changes' },
];

const TIMELINE = [
  { icon: ShoppingBag, label: 'Order, pay on delivery' },
  { icon: PenLine, label: 'Approve your proof' },
  { icon: Hammer, label: 'Made in about a week' },
  { icon: Truck, label: 'Delivered or installed' },
];

const DETAILS = [
  {
    title: 'What is in the box?',
    body: 'The sign on its backboard, a 12 V adapter with a 2 m clear cable, wall screws and standoffs, and a mounting guide. A remote dimmer if you chose one.',
  },
  {
    title: 'How do I install it?',
    body: 'Mark the position, drill the pre-drilled holes into the wall, fix the standoffs with the screws and plug in the adapter. In cities with installation partners, a technician can mount and test it for you.',
  },
  {
    title: 'Will it look like the preview?',
    body: 'Very close. Before anything is made our designers send a final proof with exact tube placement, with three rounds of changes included, and we only start once you approve.',
  },
  {
    title: 'Care and warranty',
    body: 'LED neon runs cool on 12 V. Wipe it with a dry cloth. The LED neon, adapter and dimmer are covered for one year from delivery against defects.',
  },
];

type AiWall = { id: string; prompt: string; image: string };
type WallChoice = { kind: 'built-in'; id: WallId } | { kind: 'ai'; id: string };
type Job =
  | { status: 'pending' }
  | { status: 'done'; backdrop: { image: string; provider: string; cached: boolean } }
  | { status: 'failed'; error: { status: number; code: string; title: string } };

const ROOM_KEY = 'neon-adda.room-prompt';

/** How the 3D view draws a catalogue backboard: black boards look black, everything else clear. */
function boardLook(board: StudioBackboard | undefined): Backboard {
  if (!board) return 'clear';
  return /black/i.test(`${board.name} ${board.material}`) ? 'black' : 'clear';
}

/**
 * The 3D neon sign designer. The sign is drawn in the browser from the customer's exact words, in
 * the catalogue's fonts, colours and backboards, and priced by the same rules as the studio and the
 * server. AI is only ever asked for an optional wall to preview it on.
 */
export function NeonDesigner({
  data,
  openHandoff,
  initialText,
}: {
  data: StorefrontData;
  openHandoff?: boolean;
  initialText?: string;
}) {
  const { rules, offline } = data;
  // Only fonts the 3D view can bend; the catalogue and the renderer share the same families.
  const assets = useMemo(() => {
    const fonts = data.assets.fonts.filter((font) => RENDERABLE_FONTS.includes(font.family));
    return { ...data.assets, fonts: fonts.length ? fonts : data.assets.fonts };
  }, [data.assets]);
  const ready = useStudioSetup(assets, { openHandoff, initialText });
  const studio = useStudio();

  const [thickness, setThickness] = useState(1);
  const [align, setAlign] = useState<NeonDesign['align']>('center');
  const [lighting, setLighting] = useState<Lighting>(SCENE_LIGHTS[1]!.lighting);
  const [wall, setWall] = useState<WallChoice>({ kind: 'built-in', id: 'brick' });
  const [aiWalls, setAiWalls] = useState<AiWall[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  // Until the 3D view has drawn once, the words are shown in CSS so the preview is never empty.
  const [drawn, setDrawn] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const handle = useRef<NeonSign3DHandle | null>(null);
  const snapshotRef = useRef<Snapshot | null>(() => handle.current?.snapshot(720) ?? null);

  const product = assets.products.find((p) => p.type === 'TEXT_NEON') ?? assets.products[0]!;
  const colorsById = useMemo(() => new Map(assets.colors.map((c) => [c.id, c])), [assets.colors]);
  const backboard = assets.backboards.find((b) => b.code === studio.backboardCode);
  const filled = studio.lines
    .map((line) => ({ text: line.text.trim(), color: colorsById.get(line.colorId) ?? assets.colors[0]! }))
    .filter((line) => line.text);

  const wallImage = wall.kind === 'ai' ? aiWalls.find((item) => item.id === wall.id)?.image : undefined;
  const design: NeonDesign = {
    // Every line is made at the same letter height, as in the studio and on the finished sign.
    lines: (filled.length ? filled : [{ text: 'Your name', color: assets.colors[0]! }]).map((line) => ({
      text: line.text,
      size: 'lg',
      color: line.color.glowHex,
    })),
    thickness,
    align,
    backboard: boardLook(backboard),
    wall: wallImage ? { image: wallImage } : wall.kind === 'built-in' ? wall.id : 'brick',
    lighting,
  };

  const heightIn = heightFor(studio.widthIn, studio.aspect);
  const colorCount = studio.multiColor ? new Set(filled.map((l) => l.color.id)).size || 1 : 1;
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

  // What goes to the cart, a saved design or a quotation: everything needed to make the sign.
  const order: DesignInput | null =
    filled.length && !offline
      ? {
          productId: product.id,
          config: {
            mode: 'TEXT',
            lines: filled.map(({ text, color }) => ({
              text,
              colorName: color.name,
              glowHex: color.glowHex,
              tubeHex: color.tubeHex,
            })),
            fontFamily: studio.fontFamily,
          },
          widthIn: studio.widthIn,
          heightIn,
          backboardCode: studio.backboardCode,
          addonCodes: studio.addonCodes,
        }
      : null;
  const title = filled.map((line) => line.text).join(' / ');

  async function download() {
    if (!handle.current) return;
    setExporting(true);
    setExportError(null);
    try {
      const blob = await handle.current.exportPng(2400);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `neon-adda-${slugify(title) || 'sign'}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {
      setExportError('The picture could not be saved. Try again.');
    } finally {
      setExporting(false);
    }
  }

  function attachPreview() {
    const image = handle.current?.snapshot(1280);
    if (!image || !title) return;
    saveForQuote({
      image,
      title: `3D preview: ${title}`,
      prompt: `${title} in ${studio.fontFamily}, ${studio.widthIn}″ × ${heightIn}″, ${backboard?.name ?? studio.backboardCode}`,
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 pb-36 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:pb-0">
        {/* On phones the preview stays in view under the header while the controls scroll. */}
        <section
          aria-label="Preview"
          className="sticky top-16 z-10 -mx-4 min-w-0 bg-night-900/95 px-4 pt-2 pb-3 backdrop-blur lg:top-20 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        >
          <div className="relative h-[42vh] min-h-52 overflow-hidden rounded-2xl border border-white/10 bg-night-950 lg:aspect-[4/3] lg:h-auto">
            {ready && !unavailable && (
              <NeonSign3D
                design={design}
                fontFamily={studio.fontFamily || assets.fonts[0]!.family}
                handle={handle}
                label={`3D preview of your neon sign: ${title || 'Your name'}`}
                onReport={(report) => {
                  setDrawn(true);
                  setSkipped(report.skipped);
                  if (!report.empty && filled.length) studio.setAspect(report.aspect);
                }}
                onUnavailable={setUnavailable}
              />
            )}
            {unavailable && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-amber-200">{unavailable}</p>
                <Link
                  href="/studio"
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                >
                  Use the 2D studio instead
                </Link>
              </div>
            )}
            {!drawn && !unavailable && (
              <NeonBackdrop className="pointer-events-none absolute inset-0" glowHex={design.lines[0]?.color}>
                <NeonBoard>
                  <NeonText
                    lines={design.lines.map((line) => ({ text: line.text, glowHex: line.color }))}
                    fontFamily={studio.fontFamily || assets.fonts[0]!.family}
                    size="md"
                  />
                </NeonBoard>
                <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-muted">
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> Preparing the 3D preview
                </span>
              </NeonBackdrop>
            )}
            <AiWallStatus />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 lg:mt-3 lg:items-start">
            <p className="max-w-md text-xs text-muted">
              <Hand className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
              <span className="lg:hidden">Drag to turn it. The wall is only a preview.</span>
              <span className="hidden lg:inline">
                Drag to turn it. The wall is only a preview: you receive the neon sign
                {backboard ? ` on ${backboard.name.toLowerCase()}` : ''}, made to your exact words. We send a
                design proof before we make it.
              </span>
            </p>
            <button
              type="button"
              onClick={() => void download()}
              disabled={exporting || Boolean(unavailable)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold transition hover:border-white/40 disabled:opacity-50 lg:px-4 lg:py-2 lg:text-sm"
            >
              {exporting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              Download PNG
            </button>
          </div>
          <LightingControls lighting={lighting} onChange={setLighting} />
          {exportError && (
            <p role="alert" className="mt-2 text-sm text-red-300">
              {exportError}
            </p>
          )}
          {skipped.length > 0 && (
            <p className="mt-2 text-sm text-amber-300">
              Not made in neon in this font: {skipped.join(' ')}. Try another font or remove them.
            </p>
          )}
        </section>

        <section aria-labelledby="designer-title" className="min-w-0">
          <h1 id="designer-title" className="font-display text-2xl font-bold sm:text-3xl">
            Customise your neon sign
          </h1>
          <p className="mt-1 text-sm text-muted">
            See it lit in 3D as you type. Handmade to your exact words.
          </p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums" aria-live="polite">
              {price.status === 'OK' ? formatINR(price.payablePaise) : 'Quoted'}
            </span>
            <span className="text-sm text-muted">incl. GST</span>
          </p>

          <div className="mt-5 divide-y divide-white/5 rounded-2xl border border-white/5 bg-night-800">
            <Step number={1} title="Type your text">
              <WordsStep thickness={thickness} onThickness={setThickness} align={align} onAlign={setAlign} />
            </Step>
            <Step number={2} title="Pick your font">
              <FontStep assets={assets} />
            </Step>
            <Step number={3} title="Select your colour">
              <ColourStep assets={assets} />
            </Step>
            <Step number={4} title="Select your size">
              <SizeStep heightIn={heightIn} />
            </Step>
            <Step number={5} title="Choose the backboard">
              <BackboardStep assets={assets} />
            </Step>
            <Step number={6} title="Add-ons">
              <ExtrasStep addons={assets.addons} />
            </Step>
            <Step
              number={7}
              title="Preview it on a wall"
              note="For the preview only. Not included with the sign."
            >
              <WallStep
                wall={wall}
                onWall={setWall}
                aiWalls={aiWalls}
                onAiWall={(made) => {
                  setAiWalls((current) =>
                    [made, ...current.filter((item) => item.prompt !== made.prompt)].slice(0, 4),
                  );
                  setWall({ kind: 'ai', id: made.id });
                }}
              />
            </Step>
          </div>

          <PriceBar
            price={price}
            design={order}
            display={{
              title,
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
            minimumPaise={rules.minOrderValuePaise}
            returnTo="/create"
            onQuote={attachPreview}
          />

          <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="rounded-xl border border-white/5 bg-night-800 px-2 py-3">
                <Icon className="mx-auto size-5 text-ink/70" aria-hidden />
                <span className="mt-1.5 block font-medium">{label}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/studio?mode=logo"
            className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 p-4 transition hover:border-white/30"
          >
            <ImagePlus className="size-5 shrink-0 text-ink/70" aria-hidden />
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-semibold">Have your own logo or design?</span>
              <span className="text-muted">Upload it and our team sends a quotation within a day.</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
          </Link>

          <ol className="mt-5 grid grid-cols-4 gap-1 text-center text-xs" aria-label="What happens next">
            {TIMELINE.map(({ icon: Icon, label }, index) => (
              <li key={label} className="relative">
                {index > 0 && (
                  <span className="absolute top-4 right-1/2 h-px w-full bg-white/15" aria-hidden />
                )}
                <span className="relative mx-auto grid size-8 place-items-center rounded-full border border-white/15 bg-night-900">
                  <Icon className="size-4 text-ink/70" aria-hidden />
                </span>
                <span className="mt-1.5 block text-muted">{label}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 divide-y divide-white/5 rounded-2xl border border-white/5">
            {DETAILS.map(({ title: heading, body }) => (
              <details key={heading} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  {heading}
                  <ChevronDown className="size-4 text-muted transition group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </details>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            Prefer a flat preview, or want to try it on a photo of your own wall?{' '}
            <Link href="/studio" className="font-semibold link">
              Open the 2D studio
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}

/** Ready-made lighting, from a dark room where the sign carries the picture to daylight. */
const SCENE_LIGHTS: { label: string; lighting: Lighting }[] = [
  { label: 'Night', lighting: { sign: 1, room: 0.55 } },
  { label: 'Evening', lighting: { sign: 1, room: 1 } },
  { label: 'Daylight', lighting: { sign: 1, room: 2.8 } },
];

/**
 * How bright the sign and the room are in the preview. Turning the room up shows the wall, the
 * board and the standoffs clearly; switching the sign off shows the tubes as they look unlit.
 */
function LightingControls({
  lighting,
  onChange,
}: {
  lighting: Lighting;
  onChange: (lighting: Lighting) => void;
}) {
  const on = lighting.sign > 0;
  const [lastSign, setLastSign] = useState(1);
  return (
    <div className="mt-4 rounded-xl border border-white/10 p-3" role="group" aria-label="Lighting">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="group" aria-label="Scene">
          {SCENE_LIGHTS.map((scene) => {
            const active = scene.lighting.room === lighting.room && scene.lighting.sign === lighting.sign;
            return (
              <button
                key={scene.label}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(scene.lighting)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? 'border-white bg-white text-night-900'
                    : 'border-white/15 text-muted hover:text-ink'
                }`}
              >
                {scene.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => {
            if (on) setLastSign(lighting.sign);
            onChange({ ...lighting, sign: on ? 0 : lastSign || 1 });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold transition hover:border-white/40"
        >
          <Power className={`size-3.5 ${on ? 'text-emerald-300' : 'text-muted'}`} aria-hidden />
          {on ? 'Sign on' : 'Sign off'}
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          <span className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="size-3.5" aria-hidden /> Sign brightness
            </span>
            <span className="tabular-nums">{Math.round(lighting.sign * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={lighting.sign}
            onChange={(event) => onChange({ ...lighting, sign: Number(event.target.value) })}
            className="mt-1.5 block w-full accent-white"
          />
        </label>
        <label className="block text-xs text-muted">
          <span className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Sun className="size-3.5" aria-hidden /> Room light
            </span>
            <span className="tabular-nums">{Math.round(lighting.room * 100)}%</span>
          </span>
          <input
            type="range"
            min={0.4}
            max={3}
            step={0.05}
            value={lighting.room}
            onChange={(event) => onChange({ ...lighting, room: Number(event.target.value) })}
            className="mt-1.5 block w-full accent-white"
          />
        </label>
      </div>
    </div>
  );
}

/** One numbered step of the designer, all open at once so nothing is hidden behind a tab. */
function Step({
  number,
  title,
  note,
  children,
}: {
  number: number;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="p-4 sm:p-5">
      <h2 className="flex items-center gap-2.5 font-semibold">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-ink">
          {number}
        </span>
        {title}
      </h2>
      {note && <p className="mt-1 pl-8.5 text-xs text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** The words, with neon symbols, how they line up and how bold the tube is. */
function WordsStep({
  thickness,
  onThickness,
  align,
  onAlign,
}: {
  thickness: number;
  onThickness: (value: number) => void;
  align: NeonDesign['align'];
  onAlign: (value: NeonDesign['align']) => void;
}) {
  const { lines, setLineText, addLine, removeLine } = useStudio();
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const [target, setTarget] = useState(0);

  function insert(symbol: string) {
    const index = Math.min(target, lines.length - 1);
    const field = fields.current[index];
    const current = lines[index]?.text ?? '';
    const start = field?.selectionStart ?? current.length;
    const end = field?.selectionEnd ?? current.length;
    const next = current.slice(0, start) + symbol + current.slice(end);
    if (next.length > MAX_CHARS_PER_LINE) return;
    setLineText(index, next);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <input
              ref={(element) => {
                fields.current[i] = element;
              }}
              aria-label={`Line ${i + 1}`}
              value={line.text}
              maxLength={MAX_CHARS_PER_LINE}
              onFocus={() => setTarget(i)}
              onChange={(e) => setLineText(i, e.target.value)}
              placeholder={i === 0 ? 'Type your name or words' : `Line ${i + 1}`}
              className="w-full min-w-0 rounded-xl border border-white/10 bg-night-900 px-3 py-2.5 text-base outline-none focus:border-neon-cyan"
            />
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(i)}
                aria-label={`Remove line ${i + 1}`}
                className="rounded-xl border border-white/10 px-3 text-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            Up to {MAX_LINES} lines of {MAX_CHARS_PER_LINE} characters
          </span>
          {lines.length < MAX_LINES && (
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 font-semibold link"
            >
              <Plus className="size-3.5" /> Add a line
            </button>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Neon symbols</legend>
        <p className="mt-0.5 text-xs text-muted">
          Adds to line {Math.min(target, lines.length - 1) + 1}. Each one is bent in neon like your letters.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {NEON_SYMBOLS.map((symbol) => {
            const character = SYMBOL_CHARACTERS[symbol.id];
            if (!character) return null;
            return (
              <button
                key={symbol.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insert(character)}
                aria-label={`Add ${symbol.name}`}
                title={symbol.name}
                className="grid size-10 place-items-center rounded-lg text-lg transition hover:bg-white/10 active:scale-90"
              >
                {character}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          label="Line up"
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Right' },
          ]}
          value={align}
          onChange={onAlign}
        />
        <Segmented
          label="Tube"
          options={TUBES.map((tube) => ({ value: String(tube.value), label: tube.label }))}
          value={String(thickness)}
          onChange={(value) => onThickness(Number(value))}
        />
      </div>
    </div>
  );
}

/**
 * Where the sign hangs in the preview: a built-in wall straight away, or an AI picture of the
 * customer's own kind of room. The sign stays on screen while the AI works.
 */
function WallStep({
  wall,
  onWall,
  aiWalls,
  onAiWall,
}: {
  wall: WallChoice;
  onWall: (wall: WallChoice) => void;
  aiWalls: AiWall[];
  onAiWall: (wall: AiWall) => void;
}) {
  const ai = useAiWall(onAiWall);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ROOM_KEY);
      if (saved) setPrompt(saved);
    } catch {
      // Private mode: nothing was kept.
    }
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      sessionStorage.setItem(ROOM_KEY, prompt);
    } catch {
      // Private mode: the prompt is simply not kept for after signing in.
    }
    void ai.make(prompt.trim());
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {WALLS.map((option) => {
          const active = wall.kind === 'built-in' && wall.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onWall({ kind: 'built-in', id: option.id })}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                active ? 'border-white/70 bg-white/[0.06]' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <span
                className="size-6 shrink-0 rounded-md border border-white/10"
                style={{ background: option.swatch }}
                aria-hidden
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>

      {aiWalls.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Your AI rooms</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {aiWalls.map((item) => {
              const active = wall.kind === 'ai' && wall.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onWall({ kind: 'ai', id: item.id })}
                  aria-pressed={active}
                  aria-label={`Use ${item.prompt}`}
                  title={item.prompt}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    active ? 'border-white/70' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the API */}
                  <img src={item.image} alt="" className="size-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ai.enabled !== false && (
        <form onSubmit={submit} className="rounded-xl border border-white/10 bg-night-900/60 p-3">
          <label htmlFor="room-prompt" className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-ink/70" aria-hidden /> See it in your kind of room
          </label>
          <p className="mt-0.5 text-xs text-muted">
            Optional. AI paints only the room; your sign stays exactly as you designed it.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id="room-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={300}
              placeholder="e.g. A café with exposed brick and plants"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-night-900 px-3 py-2 text-sm outline-none focus:border-neon-pink"
            />
            <button
              type="submit"
              disabled={ai.pending || prompt.trim().length < 3}
              className="shrink-0 rounded-xl bg-neon-pink px-4 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {ai.pending ? 'Painting…' : 'Paint'}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ROOM_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setPrompt(idea)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted transition hover:border-white/30 hover:text-ink"
              >
                {idea.replace(/^An? /, '')}
              </button>
            ))}
          </div>
          {ai.error && (
            <p role="alert" className="mt-2 text-sm text-amber-300">
              {ai.error}
            </p>
          )}
          {ai.needsSignIn && (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/15 bg-night-800 p-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm">
                Sign in with your mobile number to paint rooms
                {ai.perCustomer ? ` (${ai.perCustomer} free a day)` : ''}. Your design is kept.
              </p>
              <Link
                href="/login?next=%2Fcreate"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-neon-pink px-4 py-2 text-sm font-semibold text-white"
              >
                <LogIn className="size-4" /> Sign in
              </Link>
            </div>
          )}
          {ai.remaining !== null && !ai.error && (
            <p className="mt-2 text-xs text-muted" aria-live="polite">
              {ai.remaining > 0
                ? `${ai.remaining} AI ${ai.remaining === 1 ? 'room' : 'rooms'} left today`
                : 'No AI rooms left today. The built-in walls are always free.'}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The AI room is made in the background: the status sits on the preview, so customers can keep
// designing on the tabs while it works, and can cancel it.

type AiState = {
  enabled: boolean | null;
  perCustomer: number | null;
  remaining: number | null;
  pending: boolean;
  startedAt: number;
  error: string | null;
  needsSignIn: boolean;
};

const aiState: AiState = {
  enabled: null,
  perCustomer: null,
  remaining: null,
  pending: false,
  startedAt: 0,
  error: null,
  needsSignIn: false,
};
const listeners = new Set<() => void>();
let controller: AbortController | null = null;
let statusRequested = false;

function setAi(change: Partial<AiState>) {
  Object.assign(aiState, change);
  for (const listener of listeners) listener();
}

function useAiState(): AiState {
  const [, rerender] = useState(0);
  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return aiState;
}

function useAiWall(onDone: (wall: AiWall) => void) {
  const state = useAiState();
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (statusRequested) return;
    statusRequested = true;
    publicRequest<{ enabled: boolean; perCustomerDaily?: number }>('/artwork/status')
      .then((status) => setAi({ enabled: status.enabled, perCustomer: status.perCustomerDaily ?? null }))
      .catch(() => setAi({ enabled: false }));
  }, []);

  async function make(prompt: string) {
    // One room at a time: a second click while painting does nothing.
    if (aiState.pending || prompt.length < 3) return;
    controller = new AbortController();
    const { signal } = controller;
    setAi({ pending: true, startedAt: Date.now(), error: null, needsSignIn: false });
    try {
      const started = await api.request<{ id: string; remaining: number | null }>('/artwork/backdrops', {
        method: 'POST',
        body: JSON.stringify({ prompt, aspect: 'landscape' }),
        signal,
      });
      if (typeof started.remaining === 'number') setAi({ remaining: started.remaining });
      const image = await waitForBackdrop(started.id, signal);
      done.current({ id: crypto.randomUUID(), prompt, image });
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) {
        setAi({ needsSignIn: true });
      } else if (error instanceof ApiError) {
        setAi({
          error:
            error.code === 'ARTWORK_LIMIT'
              ? 'You have painted all your AI rooms for today. The built-in walls above are always free.'
              : ['ARTWORK_QUOTA', 'ARTWORK_BUSY'].includes(error.code)
                ? 'The free AI painter is resting for today. The built-in walls above are always free.'
                : error.title,
          ...(error.code === 'ARTWORK_LIMIT' ? { remaining: 0 } : {}),
        });
      } else {
        setAi({
          error: 'The room could not be painted just now. Your sign is fine; try again or pick a wall.',
        });
      }
    } finally {
      if (!signal.aborted) setAi({ pending: false });
    }
  }

  return { ...state, make };
}

function cancelAiWall() {
  controller?.abort();
  setAi({ pending: false });
}

/** A small badge on the preview while a room is being painted. */
function AiWallStatus() {
  const state = useAiState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.pending) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.pending]);
  if (!state.pending) return null;
  const seconds = Math.max(0, Math.round((now - state.startedAt) / 1000));
  return (
    <div
      role="status"
      className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 py-1.5 pr-1.5 pl-3 text-xs backdrop-blur"
    >
      <LoaderCircle className="size-3.5 animate-spin text-neon-pink" aria-hidden />
      Painting your room · {seconds}s
      <button
        type="button"
        onClick={cancelAiWall}
        className="rounded-full bg-white/10 px-2 py-0.5 font-semibold hover:bg-white/20"
      >
        Cancel
      </button>
    </div>
  );
}

/** Rooms take longer than a request may stay open, so the API makes them as a job to poll. */
async function waitForBackdrop(id: string, signal: AbortSignal): Promise<string> {
  const deadline = Date.now() + 90_000;
  let delay = 1200;
  while (Date.now() < deadline) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, delay);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Cancelled', 'AbortError'));
        },
        { once: true },
      );
    });
    delay = 2000;
    const job = await api.request<Job>(`/artwork/jobs/${id}`, { cache: 'no-store', signal });
    if (job.status === 'done') return job.backdrop.image;
    if (job.status === 'failed') throw new ApiError(job.error);
  }
  throw new Error('timed out');
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="text-sm text-muted">{label}</span>
      <div
        className="mt-1 grid w-full rounded-full border border-white/10 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-2 py-1.5 text-sm transition ${
              value === option.value ? 'bg-white/15 text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}
