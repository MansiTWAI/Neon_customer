import { NEON_FONT_FAMILIES } from '@neon-adda/shared';

export const ARTWORK_FONTS = NEON_FONT_FAMILIES.map((family) => family.split(':')[0]!);

export type ArtworkStyle =
  | 'auto'
  | 'neon'
  | 'romantic'
  | 'realistic'
  | '3d'
  | 'anime'
  | 'cartoon'
  | 'minimalist'
  | 'festive'
  | 'luxury'
  | 'watercolor';
export type ArtworkAspect = 'square' | 'portrait' | 'landscape';
export type LineSize = 'lg' | 'md' | 'sm';

export interface ArtworkOverlay {
  lines: { text: string; size: LineSize }[];
  font: string;
  color: string;
  glow: string;
  placement: 'top' | 'center' | 'bottom';
}

export interface Artwork {
  image: string;
  title: string;
  overlay: ArtworkOverlay;
  style: Exclude<ArtworkStyle, 'auto'>;
  provider: string;
  seed: number;
}

const SIZES: Record<LineSize, number> = { lg: 0.13, md: 0.07, sm: 0.048 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not open the picture'));
    image.src = src;
  });
}

/**
 * Draws the painted scene and writes the words over it with a neon glow. The words are drawn
 * here, not by the image model, so names and emojis are always exactly what the customer typed.
 */
export async function composeArtwork(canvas: HTMLCanvasElement, image: string, overlay: ArtworkOverlay) {
  const picture = await loadImage(image);
  const width = picture.naturalWidth;
  const height = picture.naturalHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(picture, 0, 0, width, height);

  const lines = overlay.lines.filter((line) => line.text.trim());
  if (!lines.length) return;

  const font = (px: number) =>
    `${Math.round(px)}px "${overlay.font}", "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  await Promise.all(
    lines.map((line) => document.fonts.load(font(width * SIZES[line.size]), line.text).catch(() => [])),
  );

  // Shrink any line that would run off the edge.
  const laid = lines.map((line) => {
    let px = width * SIZES[line.size];
    ctx.font = font(px);
    const measured = ctx.measureText(line.text).width;
    if (measured > width * 0.86) px *= (width * 0.86) / measured;
    return { text: line.text, px };
  });
  const gap = 0.28;
  const total = laid.reduce((sum, line) => sum + line.px * (1 + gap), 0) - laid.at(-1)!.px * gap;
  const top =
    overlay.placement === 'top'
      ? height * 0.1
      : overlay.placement === 'bottom'
        ? height * 0.9 - total
        : (height - total) / 2;

  // A soft band behind the words so they read on a busy picture: dark on dark pictures, and a
  // white veil with deeper lettering on light ones, where a dark band would look muddy.
  const bandTop = Math.max(0, top - height * 0.12);
  const bandHeight = Math.min(height - bandTop, total + height * 0.24);
  const light = brightness(ctx, bandTop, width, bandTop + bandHeight) > 0.62;
  const shade = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandHeight);
  const tint = light ? '255,255,255' : '0,0,0';
  shade.addColorStop(0, `rgba(${tint},0)`);
  shade.addColorStop(0.5, `rgba(${tint},${light ? 0.55 : 0.38})`);
  shade.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandTop, width, bandHeight);

  // Dark letters vanish on a dark picture (red names on red roses): lighten them, keeping the
  // colour in the glow around them.
  const fill = light ? deepest(overlay.color, overlay.glow) : brightest(overlay.color);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let y = top;
  for (const line of laid) {
    ctx.font = font(line.px);
    ctx.shadowColor = overlay.glow;
    for (const blur of light ? [line.px * 0.25] : [line.px * 0.6, line.px * 0.3, line.px * 0.12]) {
      ctx.shadowBlur = blur;
      ctx.fillStyle = light ? fill : overlay.glow;
      ctx.fillText(line.text, width / 2, y);
    }
    ctx.shadowBlur = light ? 0 : line.px * 0.06;
    ctx.fillStyle = fill;
    ctx.fillText(line.text, width / 2, y);
    y += line.px * (1 + gap);
  }
  ctx.shadowBlur = 0;
}

/** Average brightness (0 to 1) of a horizontal band of the canvas. */
function brightness(ctx: CanvasRenderingContext2D, from: number, width: number, to: number): number {
  try {
    const { data } = ctx.getImageData(0, Math.round(from), width, Math.max(1, Math.round(to - from)));
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4 * 16) {
      sum += (0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) / 255;
      count += 1;
    }
    return count ? sum / count : 0;
  } catch {
    return 0;
  }
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return (0.2126 * ((value >> 16) & 255) + 0.7152 * ((value >> 8) & 255) + 0.0722 * (value & 255)) / 255;
}

/** The colour itself when it is light enough to read on a dark picture, otherwise a pale tint of it. */
function brightest(hex: string): string {
  if (luminance(hex) >= 0.5) return hex;
  const value = Number.parseInt(hex.replace('#', ''), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * 0.65);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(mix);
  return `#${((r! << 16) | (g! << 8) | b!).toString(16).padStart(6, '0')}`;
}

/** The darker of two colours, or a deep slate when both are too pale to read on white. */
function deepest(a: string, b: string): string {
  const darker = luminance(a) <= luminance(b) ? a : b;
  return luminance(darker) < 0.55 ? darker : '#1e293b';
}

/** A JPEG small enough to attach to a quotation request (the API takes up to 1.5 MB). */
export function canvasForUpload(canvas: HTMLCanvasElement): string | null {
  const scale = Math.min(1, 1280 / Math.max(canvas.width, canvas.height));
  const copy = document.createElement('canvas');
  copy.width = Math.round(canvas.width * scale);
  copy.height = Math.round(canvas.height * scale);
  copy.getContext('2d')?.drawImage(canvas, 0, 0, copy.width, copy.height);
  for (const quality of [0.88, 0.75, 0.6]) {
    const data = copy.toDataURL('image/jpeg', quality);
    if (data.length < 1_400_000) return data;
  }
  return null;
}

const QUOTE_KEY = 'neon-adda.ai-design';

export interface QuoteHandoff {
  image: string;
  title: string;
  prompt: string;
}

export function saveForQuote(handoff: QuoteHandoff) {
  sessionStorage.setItem(QUOTE_KEY, JSON.stringify(handoff));
}

export function readQuoteHandoff(): QuoteHandoff | null {
  try {
    const raw = sessionStorage.getItem(QUOTE_KEY);
    return raw ? (JSON.parse(raw) as QuoteHandoff) : null;
  } catch {
    return null;
  }
}

export function clearQuoteHandoff() {
  try {
    sessionStorage.removeItem(QUOTE_KEY);
  } catch {
    // Private mode: nothing was stored.
  }
}
