'use client';

import {
  Download,
  ImageOff,
  Lightbulb,
  LogIn,
  Palette,
  Plus,
  RefreshCw,
  Send,
  Shuffle,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, FormError } from '@/components/ui/form';
import { ApiError, publicRequest } from '@/lib/api';
import {
  ARTWORK_FONTS,
  canvasForUpload,
  composeArtwork,
  saveForQuote,
  type Artwork,
  type ArtworkAspect,
  type ArtworkOverlay,
  type ArtworkStyle,
  type LineSize,
} from '@/lib/artwork';
import { BACKGROUNDS, backgroundDataUrl, type Background } from '@/lib/backgrounds';
import { api } from '@/lib/browser-api';
import type { Backboard, NeonDesign, WallId } from '@/lib/neon-renderer';
import { SYMBOL_CHARACTERS } from '@/lib/neon-symbols';
import type { NeonSign3DHandle } from './neon-sign-3d';

// Three.js is large, so the 3D view loads only in the browser and only on this page.
const NeonSign3D = dynamic(() => import('./neon-sign-3d').then((module) => module.NeonSign3D), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center text-sm text-muted" role="status">
      Loading the 3D view…
    </div>
  ),
});
import { openInStudio } from '@/lib/studio-handoff';

const STYLES: { value: ArtworkStyle; label: string; emoji: string }[] = [
  { value: 'auto', label: 'Surprise me', emoji: '✨' },
  { value: 'neon', label: 'Neon', emoji: '💡' },
  { value: 'romantic', label: 'Romantic', emoji: '💖' },
  { value: 'festive', label: 'Festive', emoji: '🎉' },
  { value: 'luxury', label: 'Luxury', emoji: '👑' },
  { value: 'realistic', label: 'Realistic', emoji: '📷' },
  { value: '3d', label: '3D', emoji: '🧊' },
  { value: 'anime', label: 'Anime', emoji: '🌸' },
  { value: 'cartoon', label: 'Cartoon', emoji: '🎈' },
  { value: 'watercolor', label: 'Watercolour', emoji: '🎨' },
  { value: 'minimalist', label: 'Minimal', emoji: '◻️' },
];

const ASPECTS: { value: ArtworkAspect; label: string; box: string }[] = [
  { value: 'square', label: 'Square', box: 'aspect-square' },
  { value: 'portrait', label: 'Portrait', box: 'aspect-[3/4]' },
  { value: 'landscape', label: 'Landscape', box: 'aspect-[4/3]' },
];

const EXAMPLES = [
  {
    label: 'Rahul ❤️ Priya',
    prompt:
      'A romantic design with the name Rahul ❤️ Priya, glowing red hearts, roses and elegant typography',
    style: 'romantic' as const,
  },
  {
    label: 'Birthday for Ananya 🎂',
    prompt: 'A birthday poster for Ananya 🎂 with a pink-and-gold theme, balloons and confetti',
    style: 'festive' as const,
  },
  {
    label: 'Neon gaming logo 🔥',
    prompt: 'A neon gaming logo with my name 🔥, electric purple and cyan, dark arena background',
    style: 'neon' as const,
  },
  {
    label: 'Anniversary card 💐',
    prompt: 'An anniversary card with two names and a date on a luxury floral background',
    style: 'luxury' as const,
  },
];

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Neon', emojis: Object.values(SYMBOL_CHARACTERS) },
  { label: 'Love', emojis: ['❤️', '💖', '💕', '💘', '😍', '🌹', '💍', '💐'] },
  { label: 'Celebrate', emojis: ['🎂', '🎉', '🎈', '🎁', '🥳', '✨', '🎊', '🍾'] },
  { label: 'Festive', emojis: ['🪔', '🎆', '🌙', '⭐', '🌸', '🪷', '🎇', '🕉️'] },
  { label: 'Fun', emojis: ['🔥', '⚡', '🎮', '👑', '😎', '💯', '🚀', '🌈'] },
];

const PLACEMENTS: ArtworkOverlay['placement'][] = ['top', 'center', 'bottom'];
const NEON_COLORS = ['#ff2e88', '#22d3ee', '#ffd166', '#a855f7', '#39ff88', '#ff5a36', '#fff4e0', '#3b82f6'];
const WALLS: { value: WallId | 'picture'; label: string }[] = [
  { value: 'brick', label: 'Brick' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'plaster', label: 'White wall' },
  { value: 'wood', label: 'Wood' },
  { value: 'dark', label: 'Dark' },
  { value: 'picture', label: 'My picture' },
];
const BACKBOARDS: { value: Backboard; label: string }[] = [
  { value: 'clear', label: 'Clear acrylic' },
  { value: 'black', label: 'Black' },
  { value: 'none', label: 'None' },
];
const SIZE_LABELS: Record<LineSize, string> = { lg: 'Large', md: 'Medium', sm: 'Small' };
const WAIT_HINTS = [
  'Reading your idea…',
  'Sketching the scene…',
  'Mixing the colours…',
  'Adding the glow…',
  'Almost there…',
];

type Line = ArtworkOverlay['lines'][number];
type Result = Artwork & { aspect: ArtworkAspect };

/** Pictures made from a ready-made background rather than by AI. */
const READY_MADE = 'ready-made';
const DRAFT_KEY = 'neon-adda.ai-draft';

interface Draft {
  prompt: string;
  style: ArtworkStyle;
  aspect: ArtworkAspect;
  lines: Line[];
}

/**
 * Describe a design in words and get an AI-painted picture with your names written on it, or start
 * from a ready-made background. AI pictures come from the API (which holds the keys) and need a
 * sign-in, a few a day per customer; the words are drawn here so they are always exact.
 */
export function AiDesigner() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ArtworkStyle>('auto');
  const [aspect, setAspect] = useState<ArtworkAspect>('square');
  const [lines, setLines] = useState<Line[]>([{ text: '', size: 'lg' }]);
  const [linesTouched, setLinesTouched] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [overlay, setOverlay] = useState<Omit<ArtworkOverlay, 'lines'> | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [perCustomer, setPerCustomer] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  // The 3D neon sign is drawn from the words alone, so it is the default view and needs no AI.
  const [mode, setMode] = useState<'neon' | 'flat'>('neon');
  const [neonFont, setNeonFont] = useState('Great Vibes');
  const [lineColors, setLineColors] = useState<string[]>([]);
  const [thickness, setThickness] = useState(1);
  const [backboard, setBackboard] = useState<Backboard>('clear');
  const [wall, setWall] = useState<WallId | 'picture'>('brick');
  const [align, setAlign] = useState<NeonDesign['align']>('center');
  const [neonSkipped, setNeonSkipped] = useState<string[]>([]);
  const [neonUnavailable, setNeonUnavailable] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const neonHandle = useRef<NeonSign3DHandle | null>(null);
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drawError, setDrawError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const promptField = useRef<HTMLTextAreaElement>(null);
  const lineFields = useRef<(HTMLInputElement | null)[]>([]);
  // Where the emoji picker types: the prompt or one of the lines, whichever was used last.
  const [emojiTarget, setEmojiTarget] = useState<'prompt' | number>(0);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicRequest<{ enabled: boolean; perCustomerDaily?: number }>('/artwork/status')
      .then((status) => {
        setEnabled(status.enabled);
        setPerCustomer(status.perCustomerDaily ?? null);
      })
      .catch(() => setEnabled(false));
    // Back from signing in: put back what the customer had typed.
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
      if (draft) {
        const saved = JSON.parse(draft) as Draft;
        setPrompt(saved.prompt);
        setStyle(saved.style);
        setAspect(saved.aspect);
        if (saved.lines.some((line) => line.text.trim())) {
          setLines(saved.lines);
          setLinesTouched(true);
        }
      }
    } catch {
      // Private mode or a damaged draft: start fresh.
    }
  }, []);

  // Drawn in the browser only: it keeps the page's HTML small, and the server's floating-point
  // maths can differ in the last digit from the browser's, which would break hydration.
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    setThumbnails(
      new Map(BACKGROUNDS.map((background) => [background.id, backgroundDataUrl(background, 'square')])),
    );
  }, []);

  useEffect(() => {
    if (!pending) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [pending]);

  // Redraw whenever the picture or any of the words, colours or placement change.
  useEffect(() => {
    if (!result || !overlay || !canvas.current) return;
    setDrawError(false);
    composeArtwork(canvas.current, result.image, { ...overlay, lines }).catch(() => setDrawError(true));
  }, [result, overlay, lines]);

  async function generate(options: { variation?: boolean } = {}) {
    if (prompt.trim().length < 3) {
      setError('Describe the design you want in a few words.');
      return;
    }
    setPending(true);
    setError(null);
    setNeedsSignIn(false);
    const text = lines.map((line) => line.text.trim()).filter(Boolean);
    try {
      const started = await api.request<{ id: string; remaining?: number }>('/artwork', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: options.variation && result ? result.style : style,
          aspect,
          text: (linesTouched || options.variation) && text.length ? text : undefined,
          colors: overlay && options.variation ? [overlay.color, overlay.glow] : undefined,
        }),
      });
      if (typeof started.remaining === 'number') setRemaining(started.remaining);
      const made = await waitForArtwork(started.id);
      const artwork = { ...made, aspect };
      const { lines: planned, ...look } = artwork.overlay;
      setResult(artwork);
      setOverlay(look);
      setWall('picture');
      if (!linesTouched || !text.length) setLines(planned.length ? planned : [{ text: '', size: 'lg' }]);
      setHistory((previous) => [artwork, ...previous].slice(0, 6));
      if (window.matchMedia('(max-width: 1023px)').matches) {
        preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        saveDraft({ prompt, style, aspect, lines });
        setNeedsSignIn(true);
      } else {
        setError(
          err instanceof ApiError
            ? err.title
            : 'We could not reach the AI designer. Check your connection and try again.',
        );
        if (err instanceof ApiError && err.code === 'ARTWORK_LIMIT') setRemaining(0);
      }
    } finally {
      setPending(false);
    }
  }

  /** Uses a ready-made background: no AI, so it works without signing in and without limits. */
  function pickBackground(background: Background) {
    const picked: Result = {
      image: backgroundDataUrl(background, aspect),
      title: background.name,
      overlay: { ...background.look, lines: [] },
      style: background.style,
      provider: READY_MADE,
      seed: 0,
      aspect,
    };
    setResult(picked);
    setOverlay(background.look);
    setWall('picture');
    setError(null);
    if (!lines.some((line) => line.text.trim())) {
      setLines(
        background.sample.map((text, index) => ({
          text,
          size: index === background.sample.length - 1 ? 'lg' : 'md',
        })),
      );
    }
    setHistory((previous) => [picked, ...previous.filter((item) => item.title !== picked.title)].slice(0, 6));
    preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void generate();
  }

  function updateLine(index: number, change: Partial<Line>) {
    setLinesTouched(true);
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...change } : line)));
  }

  function insertEmoji(emoji: string) {
    const field = emojiTarget === 'prompt' ? promptField.current : lineFields.current[emojiTarget];
    const current = emojiTarget === 'prompt' ? prompt : (lines[emojiTarget]?.text ?? '');
    const limit = emojiTarget === 'prompt' ? 600 : 40;
    const start = field?.selectionStart ?? current.length;
    const end = field?.selectionEnd ?? current.length;
    const next = (current.slice(0, start) + emoji + current.slice(end)).slice(0, limit);
    if (emojiTarget === 'prompt') setPrompt(next);
    else updateLine(emojiTarget, { text: next });
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  const neonLines = lines.filter((line) => line.text.trim());
  const neonDesign: NeonDesign = {
    lines: (neonLines.length ? neonLines : [{ text: 'Your name ❤️', size: 'lg' as const }]).map(
      (line, index) => ({
        text: line.text.trim(),
        size: line.size,
        color: lineColors[index] ?? NEON_COLORS[0]!,
      }),
    ),
    thickness,
    align,
    backboard,
    wall: wall === 'picture' && result ? { image: result.image } : wall === 'picture' ? 'brick' : wall,
  };
  const showNeon = mode === 'neon' && !neonUnavailable;

  function save(blob: Blob, name: string) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function download() {
    if (showNeon) {
      if (!neonHandle.current) return;
      setExporting(true);
      try {
        const blob = await neonHandle.current.exportPng(2400);
        save(blob, `neon-adda-${slugify(neonDesign.lines[0]!.text) || 'sign'}-3d.png`);
      } catch {
        setError('The picture could not be saved. Try again.');
      } finally {
        setExporting(false);
      }
      return;
    }
    if (!canvas.current || !result) return;
    canvas.current.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `neon-adda-${slugify(result.title) || 'design'}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, 'image/png');
  }

  function requestQuote() {
    if (showNeon) {
      const image = neonHandle.current?.snapshot();
      if (!image) return;
      const words = neonDesign.lines.map((line) => line.text).join(' / ');
      saveForQuote({ image, title: `Neon sign: ${words}`, prompt: `3D neon sign "${words}" in ${neonFont}` });
      router.push('/quote?from=ai');
      return;
    }
    if (!canvas.current || !result) return;
    const image = canvasForUpload(canvas.current);
    if (!image) {
      setError('This picture is too large to attach. Download it and describe it in your request instead.');
      return;
    }
    saveForQuote({ image, title: result.title, prompt: prompt.trim() });
    router.push('/quote?from=ai');
  }

  function lightItUp() {
    const words = lines.filter((line) => line.text.trim()).slice(0, 3);
    if (!words.length) return;
    router.push(
      openInStudio({
        lines: words.map((line, index) => ({
          text: line.text.trim(),
          glowHex: showNeon || !overlay ? (lineColors[index] ?? NEON_COLORS[0]!) : overlay.glow,
        })),
        fontFamily: showNeon || !overlay ? neonFont : overlay.font,
      }),
    );
  }

  function setLineColor(index: number, color: string) {
    setLineColors((current) => {
      const next = [...current];
      for (let i = 0; i <= index; i++) next[i] ??= NEON_COLORS[0]!;
      next[index] = color;
      return next;
    });
  }

  const box = ASPECTS.find((a) => a.value === (result && !pending ? result.aspect : aspect))!.box;
  const hasWords = lines.some((line) => line.text.trim());

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <form onSubmit={submit} className="min-w-0 space-y-6" aria-describedby="designer-help">
          {enabled === false && (
            <div className="flex gap-3 rounded-xl border border-white/10 bg-night-800 p-4 text-sm">
              <ImageOff className="size-5 shrink-0 text-muted" aria-hidden />
              <p>
                <span className="block font-semibold">The AI designer is resting</span>
                <span className="text-muted">
                  Pick a ready-made background below and add your words, or{' '}
                  <Link href="/studio" className="font-semibold text-neon-cyan hover:underline">
                    design a neon sign in the studio
                  </Link>
                  .
                </span>
              </p>
            </div>
          )}
          <section>
            <label htmlFor="designer-prompt" className="flex items-center gap-2 font-semibold">
              <Wand2 className="size-4 text-neon-pink" aria-hidden /> Describe your design
            </label>
            <textarea
              id="designer-prompt"
              ref={promptField}
              onFocus={() => setEmojiTarget('prompt')}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              maxLength={600}
              placeholder="e.g. A romantic design for Rahul ❤️ Priya with glowing red hearts and roses"
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-night-900 px-4 py-3 text-base transition outline-none placeholder:text-muted/60 focus:border-neon-pink"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span id="designer-help">Mention names, the occasion, colours and mood. Emojis welcome.</span>
              <span aria-live="polite">{prompt.length}/600</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Example ideas">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => {
                    setPrompt(example.prompt);
                    setStyle(example.style);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted transition hover:border-neon-pink/50 hover:text-ink"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </section>

          <fieldset className="min-w-0">
            <legend className="font-semibold">Style</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {STYLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={style === option.value}
                  onClick={() => setStyle(option.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm transition ${
                    style === option.value
                      ? 'border-neon-pink bg-neon-pink/15 text-ink'
                      : 'border-white/10 text-muted hover:border-white/25 hover:text-ink'
                  }`}
                >
                  <span aria-hidden>{option.emoji}</span> {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="font-semibold">Shape</legend>
            <div className="mt-2 grid w-full max-w-xs grid-cols-3 rounded-full border border-white/10 p-1">
              {ASPECTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={aspect === option.value}
                  onClick={() => setAspect(option.value)}
                  className={`rounded-full px-2 py-1.5 text-sm transition ${
                    aspect === option.value ? 'bg-white/15 text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="font-semibold">Words on the design</legend>
            <p className="mt-1 text-sm text-muted">
              {result
                ? 'Edit the words here; the picture updates instantly.'
                : 'Optional. Leave empty and we will pick the names from your description.'}
            </p>
            <div className="mt-3 space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    ref={(element) => {
                      lineFields.current[index] = element;
                    }}
                    onFocus={() => setEmojiTarget(index)}
                    value={line.text}
                    onChange={(event) => updateLine(index, { text: event.target.value })}
                    maxLength={40}
                    aria-label={`Line ${index + 1}`}
                    placeholder={index === 0 ? 'e.g. Rahul ❤️ Priya' : 'e.g. 14 · 02 · 2026'}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-night-900 px-3 py-2.5 outline-none focus:border-neon-pink"
                  />
                  <select
                    value={line.size}
                    onChange={(event) => updateLine(index, { size: event.target.value as LineSize })}
                    aria-label={`Line ${index + 1} size`}
                    className="rounded-xl border border-white/10 bg-night-900 px-2 text-sm"
                  >
                    {Object.entries(SIZE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLinesTouched(true);
                        setEmojiTarget(0);
                        setLines((current) => current.filter((_, i) => i !== index));
                      }}
                      aria-label={`Remove line ${index + 1}`}
                      className="rounded-xl px-2 text-muted hover:bg-white/5 hover:text-ink"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {lines.length < 4 && (
                <button
                  type="button"
                  onClick={() => setLines((current) => [...current, { text: '', size: 'md' }])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-neon-cyan hover:underline"
                >
                  <Plus className="size-4" /> Add a line
                </button>
              )}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="font-semibold">Emojis and neon symbols</legend>
            <p className="mt-1 text-sm text-muted">
              Tap to add to{' '}
              <span className="text-ink">
                {emojiTarget === 'prompt' ? 'your description' : `line ${emojiTarget + 1}`}
              </span>
              . Click a field first to choose where they go.
            </p>
            <div className="mt-2 space-y-1.5">
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label} className="flex items-center gap-1">
                  <span className="w-20 shrink-0 text-xs text-muted">{group.label}</span>
                  <div className="flex min-w-0 flex-wrap gap-0.5">
                    {group.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => insertEmoji(emoji)}
                        aria-label={`Add ${emoji}`}
                        className="grid size-9 place-items-center rounded-lg text-lg transition hover:bg-white/10 active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {showNeon && (
            <fieldset className="min-w-0 space-y-4">
              <legend className="mb-2 font-semibold">Neon sign</legend>
              <label className="block text-sm text-muted">
                Font
                <select
                  value={neonFont}
                  onChange={(event) => setNeonFont(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-900 px-3 py-2.5 text-ink"
                  style={{ fontFamily: `"${neonFont}"` }}
                >
                  {ARTWORK_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: `"${font}"` }}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="text-sm text-muted">Colours</span>
                <div className="mt-1 space-y-2">
                  {neonDesign.lines.map((line, index) => (
                    <div key={index} className="flex min-w-0 items-center gap-2">
                      <input
                        type="color"
                        value={lineColors[index] ?? NEON_COLORS[0]}
                        onChange={(event) => setLineColor(index, event.target.value)}
                        aria-label={`Colour of line ${index + 1}`}
                        className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-night-900 p-1"
                      />
                      <div className="flex min-w-0 flex-wrap gap-1">
                        {NEON_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setLineColor(index, color)}
                            aria-label={`Use ${color} for line ${index + 1}`}
                            aria-pressed={(lineColors[index] ?? NEON_COLORS[0]) === color}
                            className="size-6 rounded-full border-2 border-transparent aria-pressed:border-white"
                            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                          />
                        ))}
                      </div>
                      <span className="hidden truncate text-xs text-muted sm:inline">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <label className="block text-sm text-muted">
                Tube thickness
                <input
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.1}
                  value={thickness}
                  onChange={(event) => setThickness(Number(event.target.value))}
                  className="mt-2 block w-full accent-pink-500"
                />
              </label>
              <Segmented label="Backboard" options={BACKBOARDS} value={backboard} onChange={setBackboard} />
              <Segmented
                label="Align"
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Centre' },
                  { value: 'right', label: 'Right' },
                ]}
                value={align}
                onChange={setAlign}
              />
              <div>
                <span className="text-sm text-muted">Wall</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {WALLS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={wall === option.value}
                      disabled={option.value === 'picture' && !result}
                      title={
                        option.value === 'picture' && !result
                          ? 'Make an AI picture or pick a ready-made background first'
                          : undefined
                      }
                      onClick={() => setWall(option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        wall === option.value
                          ? 'border-neon-pink bg-neon-pink/15 text-ink'
                          : 'border-white/10 text-muted hover:text-ink'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          {mode === 'flat' && result && overlay && (
            <fieldset className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
              <legend className="mb-2 font-semibold">Lettering</legend>
              <label className="col-span-2 text-sm text-muted">
                Font
                <select
                  value={overlay.font}
                  onChange={(event) => setOverlay({ ...overlay, font: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-night-900 px-3 py-2.5 text-ink"
                  style={{ fontFamily: `"${overlay.font}"` }}
                >
                  {ARTWORK_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: `"${font}"` }}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-muted">
                Letters
                <input
                  type="color"
                  value={overlay.color}
                  onChange={(event) => setOverlay({ ...overlay, color: event.target.value })}
                  className="mt-1 block h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-night-900 p-1"
                />
              </label>
              <label className="text-sm text-muted">
                Glow
                <input
                  type="color"
                  value={overlay.glow}
                  onChange={(event) => setOverlay({ ...overlay, glow: event.target.value })}
                  className="mt-1 block h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-night-900 p-1"
                />
              </label>
              <div className="col-span-2 sm:col-span-4">
                <span className="text-sm text-muted">Position</span>
                <div className="mt-1 grid w-full max-w-xs grid-cols-3 rounded-full border border-white/10 p-1">
                  {PLACEMENTS.map((placement) => (
                    <button
                      key={placement}
                      type="button"
                      aria-pressed={overlay.placement === placement}
                      onClick={() => setOverlay({ ...overlay, placement })}
                      className={`rounded-full px-2 py-1.5 text-sm capitalize transition ${
                        overlay.placement === placement ? 'bg-white/15 text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {placement}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          <FormError message={error} />

          {needsSignIn && (
            <div className="flex flex-col gap-3 rounded-xl border border-neon-pink/40 bg-neon-pink/10 p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm">
                <span className="block font-semibold">Sign in to create AI designs</span>
                <span className="text-muted">
                  It takes a few seconds with your mobile number
                  {perCustomer ? `, and gives you ${perCustomer} free AI designs a day` : ''}. What you typed
                  is kept.
                </span>
              </p>
              <Link
                href="/login?next=%2Fcreate"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-neon-pink px-5 py-2.5 text-sm font-semibold text-white"
              >
                <LogIn className="size-4" /> Sign in
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="submit" pending={pending} disabled={enabled === false} className="w-full sm:w-auto">
              {!pending && <Sparkles className="size-4" />}
              {result && result.provider !== READY_MADE ? 'Create a new design' : 'Create my design'}
            </Button>
            <p className="text-xs text-muted" aria-live="polite">
              {remaining !== null
                ? remaining > 0
                  ? `${remaining} AI ${remaining === 1 ? 'design' : 'designs'} left today`
                  : 'No AI designs left today'
                : perCustomer && enabled
                  ? `${perCustomer} free AI designs a day when signed in`
                  : ''}
            </p>
          </div>
        </form>

        <div ref={preview} className="min-w-0 scroll-mt-20 lg:sticky lg:top-20">
          <div
            className="mb-3 grid w-full max-w-sm grid-cols-2 rounded-full border border-white/10 p-1"
            role="group"
            aria-label="Preview"
          >
            {(
              [
                ['neon', '💡 3D neon sign'],
                ['flat', '🖼️ Flat poster'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                disabled={value === 'neon' && Boolean(neonUnavailable)}
                onClick={() => setMode(value)}
                className={`rounded-full px-3 py-1.5 text-sm transition disabled:opacity-40 ${
                  mode === value ? 'bg-white/15 text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {neonUnavailable && (
            <p role="alert" className="mb-3 text-sm text-amber-300">
              {neonUnavailable}
            </p>
          )}
          <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-night-800 ${showNeon ? ASPECTS.find((a) => a.value === aspect)!.box : box}`}
            aria-busy={pending}
          >
            {showNeon && (
              <NeonSign3D
                design={neonDesign}
                fontFamily={neonFont}
                handle={neonHandle}
                label={`3D neon sign: ${neonDesign.lines.map((line) => line.text).join(', ')}`}
                onReport={(report) => setNeonSkipped(report.skipped)}
                onUnavailable={(reason) => {
                  setNeonUnavailable(reason);
                  setMode('flat');
                }}
              />
            )}
            {!showNeon && result && (
              <canvas
                ref={canvas}
                role="img"
                aria-label={`${result.title}: ${lines.map((line) => line.text).join(', ')}`}
                className={`size-full object-contain transition ${pending ? 'scale-[1.02] opacity-30 blur-sm' : ''}`}
              />
            )}
            {!showNeon && !result && !pending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <Lightbulb className="size-10 text-neon-pink drop-shadow-[0_0_12px_#ff2e88]" aria-hidden />
                <p className="mt-4 font-display text-lg font-semibold">Your design appears here</p>
                <p className="mt-1 max-w-xs text-sm text-muted">
                  Describe it, pick a style, and we will paint it with your words written exactly as typed.
                </p>
              </div>
            )}
            {pending && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
                role="status"
              >
                {!result && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neon-pink/10 via-transparent to-neon-cyan/10" />
                )}
                <Sparkles className="relative size-8 animate-spin text-neon-pink [animation-duration:3s]" />
                <p className="relative font-semibold">
                  {WAIT_HINTS[Math.min(WAIT_HINTS.length - 1, Math.floor(elapsed / 5))]}
                </p>
                <p className="relative text-xs text-muted">{elapsed}s · usually 10 to 40 seconds</p>
              </div>
            )}
          </div>

          {drawError && (
            <p role="alert" className="mt-2 text-sm text-amber-300">
              The picture arrived but could not be drawn. Try regenerating it.
            </p>
          )}

          {showNeon && (
            <>
              <div className="mt-3">
                <p className="font-display font-semibold">Your neon sign in 3D</p>
                <p className="text-xs text-muted">
                  Drag to turn it. Words and symbols are bent exactly as typed; no AI is used for the sign.
                </p>
              </div>
              {neonSkipped.length > 0 && (
                <p className="mt-2 text-xs text-amber-300">
                  Left out, as neon cannot show them in this font: {neonSkipped.join(' ')}
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void download()}
                  pending={exporting}
                >
                  {!exporting && <Download className="size-4" />} Download PNG
                </Button>
                <Button type="button" size="sm" onClick={requestQuote}>
                  <Send className="size-4" /> Get it made
                </Button>
              </div>
              {hasWords && (
                <button
                  type="button"
                  onClick={lightItUp}
                  className="mt-3 flex w-full items-center gap-3 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 p-3 text-left text-sm transition hover:border-neon-cyan/60"
                >
                  <Lightbulb className="size-5 shrink-0 text-neon-cyan" aria-hidden />
                  <span>
                    <span className="block font-semibold">See the price for this sign</span>
                    <span className="text-muted">Open these words in the studio with instant pricing.</span>
                  </span>
                </button>
              )}
            </>
          )}

          {!showNeon && result && (
            <>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{result.title}</p>
                  <p className="text-xs text-muted">
                    {result.provider === READY_MADE
                      ? 'Ready-made background · your words added by Neon Adda'
                      : `${STYLES.find((s) => s.value === result.style)?.label} · painted by AI, words added by Neon Adda`}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {result.provider !== READY_MADE && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void generate()}
                      disabled={pending}
                    >
                      <RefreshCw className="size-4" /> Regenerate
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void generate({ variation: true })}
                      disabled={pending}
                    >
                      <Shuffle className="size-4" /> Variation
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void download()}
                  disabled={pending}
                >
                  <Download className="size-4" /> Download
                </Button>
                <Button type="button" size="sm" onClick={requestQuote} disabled={pending}>
                  <Send className="size-4" /> Get it made
                </Button>
              </div>
              {hasWords && (
                <button
                  type="button"
                  onClick={lightItUp}
                  className="mt-3 flex w-full items-center gap-3 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 p-3 text-left text-sm transition hover:border-neon-cyan/60"
                >
                  <Lightbulb className="size-5 shrink-0 text-neon-cyan" aria-hidden />
                  <span>
                    <span className="block font-semibold">Turn these words into a real neon sign</span>
                    <span className="text-muted">Open them in the studio with instant pricing.</span>
                  </span>
                </button>
              )}
            </>
          )}

          {history.length > 1 && (
            <div className="mt-5">
              <p className="text-sm font-semibold">Earlier versions</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {history.map((item) => (
                  <button
                    key={`${item.seed}-${item.provider}-${item.title}`}
                    type="button"
                    onClick={() => {
                      const { lines: planned, ...look } = item.overlay;
                      setResult(item);
                      setOverlay(look);
                      setWall('picture');
                      if (!linesTouched) setLines(planned.length ? planned : lines);
                    }}
                    aria-label={`Show ${item.title}`}
                    aria-current={item === result}
                    className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      item === result ? 'border-neon-pink' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the API */}
                    <img src={item.image} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="mt-14" aria-labelledby="backgrounds-heading">
        <h2 id="backgrounds-heading" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Palette className="size-5 text-neon-cyan" aria-hidden /> Ready-made backgrounds
        </h2>
        <p className="mt-1 text-sm text-muted">
          Free and unlimited, no sign-in needed. Pick one, then type your words above.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BACKGROUNDS.map((background) => {
            const chosen = result?.provider === READY_MADE && result.title === background.name;
            return (
              <button
                key={background.id}
                type="button"
                onClick={() => pickBackground(background)}
                aria-pressed={chosen}
                className={`group overflow-hidden rounded-xl border-2 bg-night-800 text-left transition ${
                  chosen ? 'border-neon-pink' : 'border-white/10 hover:border-white/30'
                }`}
              >
                {thumbnails.has(background.id) ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- drawn in the browser */
                  <img
                    src={thumbnails.get(background.id)}
                    alt=""
                    className="aspect-square w-full object-cover transition group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="block aspect-square w-full animate-pulse bg-white/5" aria-hidden />
                )}
                <span className="block truncate px-3 py-2 text-sm font-medium">{background.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
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
        className="mt-1 grid w-full max-w-xs rounded-full border border-white/10 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
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

function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private mode: the customer types it again after signing in.
  }
}

type Job =
  | { status: 'pending' }
  | { status: 'done'; artwork: Artwork }
  | { status: 'failed'; error: { status: number; code: string; title: string } };

/** Pictures take longer than a request may stay open, so the API makes them as a job to poll. */
async function waitForArtwork(id: string): Promise<Artwork> {
  const deadline = Date.now() + 3 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const job = await api.request<Job>(`/artwork/jobs/${id}`, { cache: 'no-store' });
    if (job.status === 'done') return job.artwork;
    if (job.status === 'failed') throw new ApiError(job.error);
  }
  throw new Error('timed out');
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}
