import { NEON_FONT_FAMILIES } from '@neon-adda/shared';

/** Font families the 3D preview can bend into tubes: their outlines are served from /neon-fonts. */
export const RENDERABLE_FONTS = NEON_FONT_FAMILIES.map((family) => family.split(':')[0]!);

const QUOTE_KEY = 'neon-adda.ai-design';

export interface QuoteHandoff {
  image: string;
  title: string;
  prompt: string;
}

/** Keeps a preview picture for the quotation form. Quietly does nothing if the browser will not store it. */
export function saveForQuote(handoff: QuoteHandoff) {
  try {
    sessionStorage.setItem(QUOTE_KEY, JSON.stringify(handoff));
  } catch {
    // Private mode or storage full: the quotation is sent without the picture.
  }
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
