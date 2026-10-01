'use client';

import { formatINR } from '@neon-adda/shared';
import { Check, ImagePlus, Plus, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { StudioAddon, StudioAssets } from '@/lib/studio-types';
import {
  heightFor,
  MAX_CHARS_PER_LINE,
  MAX_LINES,
  SIZE_PRESETS,
  useStudio,
  WALL_PHOTO,
  WIDTH_RANGE,
} from '@/stores/studio-store';

const STEPS = ['Text', 'Font', 'Colour', 'Size', 'Backboard', 'Wall', 'Extras'] as const;
type Step = (typeof STEPS)[number];

const pill = (active: boolean) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
    active
      ? 'border-neon-pink bg-neon-pink/15 text-white shadow-[0_0_12px_rgba(255,46,136,0.35)]'
      : 'border-white/15 text-muted hover:border-white/40 hover:text-ink'
  }`;

const card = (active: boolean) =>
  `rounded-xl border px-4 py-3 text-left transition ${
    active ? 'border-neon-pink bg-neon-pink/10' : 'border-white/10 hover:border-white/30'
  }`;

export function DesignControls({ assets, heightIn }: { assets: StudioAssets; heightIn: number }) {
  const [step, setStep] = useState<Step>('Text');
  const tabsId = useId();

  return (
    <div className="rounded-2xl border border-white/5 bg-night-800 p-4">
      <div
        role="tablist"
        aria-label="Design steps"
        className="-mx-1 mb-4 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {STEPS.map((s) => (
          <button
            key={s}
            role="tab"
            id={`${tabsId}-${s}`}
            aria-selected={step === s}
            aria-controls={`${tabsId}-panel`}
            onClick={() => setStep(s)}
            className={pill(step === s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${step}`}>
        {step === 'Text' && <TextStep />}
        {step === 'Font' && <FontStep assets={assets} />}
        {step === 'Colour' && <ColourStep assets={assets} />}
        {step === 'Size' && <SizeStep heightIn={heightIn} />}
        {step === 'Backboard' && <BackboardStep assets={assets} />}
        {step === 'Wall' && <WallStep assets={assets} />}
        {step === 'Extras' && <ExtrasStep addons={assets.addons} />}
      </div>
    </div>
  );
}

function TextStep() {
  const { lines, setLineText, addLine, removeLine } = useStudio();
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2">
          <input
            aria-label={`Line ${i + 1}`}
            value={line.text}
            maxLength={MAX_CHARS_PER_LINE}
            onChange={(e) => setLineText(i, e.target.value)}
            placeholder={i === 0 ? 'Type your text' : `Line ${i + 1}`}
            className="w-full rounded-xl border border-white/10 bg-night-900 px-3 py-2.5 text-base outline-none focus:border-neon-cyan"
          />
          {lines.length > 1 && (
            <button
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
            onClick={addLine}
            className="inline-flex items-center gap-1 font-semibold text-neon-cyan hover:underline"
          >
            <Plus className="size-3.5" /> Add a line
          </button>
        )}
      </div>
    </div>
  );
}

function FontStep({ assets }: { assets: StudioAssets }) {
  const { fontFamily, setFont, lines } = useStudio();
  const sample = lines[0]?.text.trim().slice(0, 10);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {assets.fonts.map((font) => (
        <button
          key={font.id}
          onClick={() => setFont(font.family)}
          aria-pressed={fontFamily === font.family}
          aria-label={font.name}
          className={`${card(fontFamily === font.family)} truncate px-2 text-center text-lg`}
          style={{ fontFamily: `"${font.family}", cursive` }}
        >
          {sample || font.name}
        </button>
      ))}
    </div>
  );
}

function ColourStep({ assets }: { assets: StudioAssets }) {
  const { lines, colorId, multiColor, setColor, setMultiColor } = useStudio();
  const targets = multiColor ? lines.map((_, i) => i) : [undefined];

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={multiColor}
          onChange={(e) => setMultiColor(e.target.checked)}
          className="accent-pink-500"
        />
        A different colour for each line
      </label>
      {targets.map((lineIndex) => {
        const selected = lineIndex === undefined ? colorId : lines[lineIndex]!.colorId;
        return (
          <fieldset key={lineIndex ?? 'all'}>
            {lineIndex !== undefined && (
              <legend className="mb-2 text-xs text-muted">
                Line {lineIndex + 1}: {lines[lineIndex]!.text || 'empty'}
              </legend>
            )}
            <div className="flex flex-wrap gap-2.5">
              {assets.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setColor(color.id, lineIndex)}
                  aria-label={color.name}
                  aria-pressed={selected === color.id}
                  title={color.name}
                  className={`grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-night-800 transition ${
                    selected === color.id ? 'ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ background: color.glowHex, boxShadow: `0 0 12px ${color.glowHex}` }}
                >
                  {selected === color.id && <Check className="size-4 text-black/70" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function SizeStep({ heightIn }: { heightIn: number }) {
  const { widthIn, aspect, sizePreset, setPreset, setWidth } = useStudio();
  const presets = Object.entries(SIZE_PRESETS) as [keyof typeof SIZE_PRESETS, number][];
  const cm = (inches: number) => Math.round(inches * 2.54);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {presets.map(([preset, width]) => (
          <button key={preset} onClick={() => setPreset(preset)} className={pill(sizePreset === preset)}>
            {preset} · {width}″ × {heightFor(width, aspect)}″
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="sign-width" className="text-sm text-muted">
          Width in inches. The height follows your lettering.
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={WIDTH_RANGE.min}
            max={WIDTH_RANGE.max}
            value={Math.min(WIDTH_RANGE.max, widthIn)}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full accent-pink-500"
            aria-label="Width"
          />
          <input
            id="sign-width"
            type="number"
            inputMode="numeric"
            min={WIDTH_RANGE.min}
            max={120}
            value={widthIn}
            onChange={(e) => setWidth(Number(e.target.value) || WIDTH_RANGE.min)}
            className="w-20 rounded-lg border border-white/10 bg-night-900 px-2 py-1.5 text-right"
          />
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">
            {widthIn}″ × {heightIn}″
          </span>{' '}
          <span className="text-muted">
            ({cm(widthIn)} × {cm(heightIn)} cm)
          </span>
        </p>
      </div>
    </div>
  );
}

function BackboardStep({ assets }: { assets: StudioAssets }) {
  const { backboardCode, setBackboard } = useStudio();
  return (
    <div className="grid gap-2">
      {assets.backboards.map((board) => (
        <button
          key={board.code}
          onClick={() => setBackboard(board.code)}
          aria-pressed={backboardCode === board.code}
          className={card(backboardCode === board.code)}
        >
          <span className="block font-semibold">{board.name}</span>
          <span className="text-xs text-muted">{board.material}</span>
        </button>
      ))}
    </div>
  );
}

function WallStep({ assets }: { assets: StudioAssets }) {
  const { backgroundCode, setBackground, wallPhotoUrl, setWallPhoto } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);

  function choosePhoto(file: File | undefined) {
    if (file && file.type.startsWith('image/')) setWallPhoto(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {assets.backgrounds.map((wall) => (
          <button
            key={wall.code}
            onClick={() => setBackground(wall.code)}
            className={pill(backgroundCode === wall.code)}
          >
            {wall.name}
          </button>
        ))}
        {wallPhotoUrl && (
          <button onClick={() => setBackground(WALL_PHOTO)} className={pill(backgroundCode === WALL_PHOTO)}>
            Your wall
          </button>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-white/15 p-4">
        <p className="text-sm font-semibold">See it on your own wall</p>
        <p className="mt-1 text-xs text-muted">
          Take a photo straight on, showing about 7 feet of wall. It stays on your device and is never
          uploaded.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15"
          >
            <ImagePlus className="size-4" />
            {wallPhotoUrl ? 'Use a different photo' : 'Add a photo'}
          </button>
          {wallPhotoUrl && (
            <button onClick={() => setWallPhoto(null)} className="px-2 text-sm text-muted hover:text-ink">
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            choosePhoto(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

function ExtrasStep({ addons }: { addons: StudioAddon[] }) {
  const { addonCodes, toggleAddon } = useStudio();
  const describe = (addon: StudioAddon) =>
    addon.pricingType === 'FLAT'
      ? formatINR(addon.value)
      : addon.pricingType === 'PER_SQFT'
        ? `${formatINR(addon.value)} per sq ft`
        : `${addon.value}%`;

  return (
    <div className="grid gap-2">
      {addons.map((addon) => (
        <label
          key={addon.code}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition hover:border-white/30"
        >
          <input
            type="checkbox"
            checked={addonCodes.includes(addon.code)}
            onChange={() => toggleAddon(addon.code)}
            className="accent-pink-500"
          />
          <span className="flex-1">{addon.name}</span>
          <span className="text-sm text-muted">{describe(addon)}</span>
        </label>
      ))}
    </div>
  );
}
