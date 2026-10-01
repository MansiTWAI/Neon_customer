import type { DesignInput, ReadymadeDesign } from './types';

const KEY = 'neon-adda.open-in-studio';

/** A design to open in the studio. Colours travel by glow colour and are matched to the palette there. */
export interface StudioHandoff {
  lines: { text: string; glowHex: string }[];
  fontFamily: string;
  widthIn?: number;
  backboardCode?: string;
  addonCodes?: string[];
}

/** Stores the design for the studio to pick up and returns the URL to navigate to. */
export function openInStudio(design: StudioHandoff): string {
  sessionStorage.setItem(KEY, JSON.stringify(design));
  return '/studio?open=1';
}

export function takeHandoff(): StudioHandoff | null {
  const raw = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  try {
    return raw ? (JSON.parse(raw) as StudioHandoff) : null;
  } catch {
    return null;
  }
}

export function handoffFromDesign(design: DesignInput): StudioHandoff | null {
  if (design.config.mode !== 'TEXT') return null;
  return {
    lines: design.config.lines.map(({ text, glowHex }) => ({ text, glowHex })),
    fontFamily: design.config.fontFamily,
    widthIn: design.widthIn,
    backboardCode: design.backboardCode,
    addonCodes: design.addonCodes,
  };
}

export function handoffFromReadymade(design: ReadymadeDesign, widthIn?: number): StudioHandoff {
  return {
    lines: design.lines.map(({ text, glowHex }) => ({ text, glowHex })),
    fontFamily: design.fontFamily,
    widthIn,
    backboardCode: design.backboardCode,
  };
}
