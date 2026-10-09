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

  // A soft shade behind the words so they read on a busy picture.
  const shade = ctx.createLinearGradient(0, top - height * 0.12, 0, top + total + height * 0.12);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(0.5, 'rgba(0,0,0,0.38)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, top - height * 0.12, width, total + height * 0.24);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let y = top;
  for (const line of laid) {
    ctx.font = font(line.px);
    ctx.shadowColor = overlay.glow;
    for (const blur of [line.px * 0.6, line.px * 0.3, line.px * 0.12]) {
      ctx.shadowBlur = blur;
      ctx.fillStyle = overlay.glow;
      ctx.fillText(line.text, width / 2, y);
    }
    ctx.shadowBlur = line.px * 0.06;
    ctx.fillStyle = overlay.color;
    ctx.fillText(line.text, width / 2, y);
    y += line.px * (1 + gap);
  }
  ctx.shadowBlur = 0;
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
