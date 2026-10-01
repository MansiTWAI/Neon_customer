import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SIZE_PRESETS = { S: 18, M: 24, L: 36, XL: 48 } as const;
export type SizePreset = keyof typeof SIZE_PRESETS | 'CUSTOM';

export const MAX_LINES = 3;
export const MAX_CHARS_PER_LINE = 30;
export const WIDTH_RANGE = { min: 12, max: 96 } as const;
/** Background code used while the customer's own wall photo is shown. */
export const WALL_PHOTO = 'PHOTO';

const EMOJI = /\p{Extended_Pictographic}/gu;

export interface DesignLine {
  text: string;
  colorId: string;
}

interface StudioState {
  lines: DesignLine[];
  fontFamily: string;
  colorId: string;
  multiColor: boolean;
  sizePreset: SizePreset;
  widthIn: number;
  /** Height ÷ width of the finished sign, measured from the rendered lettering. */
  aspect: number;
  backboardCode: string;
  backgroundCode: string;
  lightOn: boolean;
  addonCodes: string[];
  /** Object URL of the customer's own wall photo. Kept in memory only, never uploaded or persisted. */
  wallPhotoUrl: string | null;
}

export interface LoadableDesign {
  lines: DesignLine[];
  fontFamily?: string;
  widthIn?: number;
  backboardCode?: string;
  addonCodes?: string[];
}

interface StudioActions {
  setLineText: (index: number, text: string) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  startWith: (text: string) => void;
  load: (design: LoadableDesign) => void;
  setWallPhoto: (url: string | null) => void;
  setFont: (family: string) => void;
  setColor: (colorId: string, lineIndex?: number) => void;
  setMultiColor: (enabled: boolean) => void;
  setPreset: (preset: SizePreset) => void;
  setWidth: (widthIn: number) => void;
  setAspect: (aspect: number) => void;
  setBackboard: (code: string) => void;
  setBackground: (code: string) => void;
  toggleLight: () => void;
  toggleAddon: (code: string) => void;
  reconcile: (available: { fonts: string[]; colorIds: string[]; backboards: string[] }) => void;
}

/** Height follows the lettering's proportions and is quoted to the nearest half inch. */
export function heightFor(widthIn: number, aspect: number): number {
  return Math.max(4, Math.round(widthIn * aspect * 2) / 2);
}

export const useStudio = create<StudioState & StudioActions>()(
  persist(
    (set, get) => ({
      lines: [{ text: 'Riya', colorId: '' }],
      fontFamily: '',
      colorId: '',
      multiColor: false,
      sizePreset: 'M',
      widthIn: SIZE_PRESETS.M,
      aspect: 0.45,
      backboardCode: 'CLR_CUT',
      backgroundCode: 'BRICK',
      lightOn: true,
      addonCodes: [],
      wallPhotoUrl: null,

      setLineText: (index, text) =>
        set((s) => ({
          lines: s.lines.map((line, i) =>
            i === index ? { ...line, text: text.replace(EMOJI, '').slice(0, MAX_CHARS_PER_LINE) } : line,
          ),
        })),
      addLine: () =>
        set((s) =>
          s.lines.length >= MAX_LINES ? s : { lines: [...s.lines, { text: '', colorId: s.colorId }] },
        ),
      removeLine: (index) =>
        set((s) => (s.lines.length <= 1 ? s : { lines: s.lines.filter((_, i) => i !== index) })),
      startWith: (text) =>
        set((s) => ({ lines: [{ text: text.slice(0, MAX_CHARS_PER_LINE), colorId: s.colorId }] })),
      load: (design) =>
        set((s) => {
          const lines = design.lines.slice(0, MAX_LINES).map((line) => ({
            text: line.text.slice(0, MAX_CHARS_PER_LINE),
            colorId: line.colorId || s.colorId,
          }));
          const widthIn = design.widthIn ?? s.widthIn;
          const preset = (Object.keys(SIZE_PRESETS) as (keyof typeof SIZE_PRESETS)[]).find(
            (key) => SIZE_PRESETS[key] === widthIn,
          );
          return {
            lines: lines.length ? lines : s.lines,
            colorId: lines[0]?.colorId ?? s.colorId,
            multiColor: new Set(lines.map((line) => line.colorId)).size > 1,
            fontFamily: design.fontFamily ?? s.fontFamily,
            widthIn,
            sizePreset: preset ?? 'CUSTOM',
            backboardCode: design.backboardCode ?? s.backboardCode,
            addonCodes: design.addonCodes ?? s.addonCodes,
          };
        }),
      setWallPhoto: (wallPhotoUrl) =>
        set((s) => {
          if (s.wallPhotoUrl) URL.revokeObjectURL(s.wallPhotoUrl);
          return wallPhotoUrl
            ? { wallPhotoUrl, backgroundCode: WALL_PHOTO }
            : {
                wallPhotoUrl: null,
                backgroundCode: s.backgroundCode === WALL_PHOTO ? 'BRICK' : s.backgroundCode,
              };
        }),
      setFont: (fontFamily) => set({ fontFamily }),
      setColor: (colorId, lineIndex) =>
        set((s) =>
          s.multiColor && lineIndex !== undefined
            ? { lines: s.lines.map((line, i) => (i === lineIndex ? { ...line, colorId } : line)) }
            : { colorId, lines: s.lines.map((line) => ({ ...line, colorId })) },
        ),
      setMultiColor: (multiColor) =>
        set((s) =>
          multiColor
            ? { multiColor }
            : { multiColor, lines: s.lines.map((l) => ({ ...l, colorId: s.colorId })) },
        ),
      setPreset: (sizePreset) =>
        set(sizePreset === 'CUSTOM' ? { sizePreset } : { sizePreset, widthIn: SIZE_PRESETS[sizePreset] }),
      setWidth: (widthIn) =>
        set({ widthIn: Math.min(120, Math.max(6, Math.round(widthIn))), sizePreset: 'CUSTOM' }),
      setAspect: (aspect) => {
        if (Math.abs(get().aspect - aspect) > 0.001) set({ aspect });
      },
      setBackboard: (backboardCode) => set({ backboardCode }),
      setBackground: (backgroundCode) => set({ backgroundCode }),
      toggleLight: () => set((s) => ({ lightOn: !s.lightOn })),
      toggleAddon: (code) =>
        set((s) => ({
          addonCodes: s.addonCodes.includes(code)
            ? s.addonCodes.filter((c) => c !== code)
            : [...s.addonCodes, code],
        })),

      /** Repairs a design restored from storage whose fonts or colours have since been retired. */
      reconcile: ({ fonts, colorIds, backboards }) =>
        set((s) => {
          const colorId = colorIds.includes(s.colorId) ? s.colorId : (colorIds[0] ?? '');
          return {
            fontFamily: fonts.includes(s.fontFamily) ? s.fontFamily : (fonts[0] ?? ''),
            colorId,
            backboardCode: backboards.includes(s.backboardCode) ? s.backboardCode : (backboards[0] ?? ''),
            // The photo itself is not persisted, so a restored design goes back to a stock wall.
            backgroundCode: s.backgroundCode === WALL_PHOTO && !s.wallPhotoUrl ? 'BRICK' : s.backgroundCode,
            lines: s.lines.map((line) => ({
              ...line,
              colorId: colorIds.includes(line.colorId) ? line.colorId : colorId,
            })),
          };
        }),
    }),
    {
      name: 'neon-adda.studio',
      version: 1,
      partialize: ({ lightOn: _lightOn, wallPhotoUrl: _wallPhotoUrl, ...design }) => design,
    },
  ),
);
