import { sampleRules } from '@neon-adda/shared';
import type { StudioAssets } from './studio-types';

const fonts: [name: string, family: string, styleTag: string][] = [
  ['Neon Script', 'Neonderthaw', 'SCRIPT'],
  ['Tilt Neon', 'Tilt Neon', 'MODERN'],
  ['Pacifico', 'Pacifico', 'SCRIPT'],
  ['Great Vibes', 'Great Vibes', 'SCRIPT'],
  ['Dancing', 'Dancing Script', 'SCRIPT'],
  ['Satisfy', 'Satisfy', 'SCRIPT'],
  ['Yellowtail', 'Yellowtail', 'RETRO'],
  ['Lobster', 'Lobster', 'RETRO'],
  ['Monoton', 'Monoton', 'MARQUEE'],
  ['Righteous', 'Righteous', 'BLOCK'],
  ['Bungee', 'Bungee', 'BLOCK'],
  ['Sacramento', 'Sacramento', 'SCRIPT'],
];

const colors: [name: string, tubeHex: string, glowHex: string][] = [
  ['Hot Pink', '#FFD1EA', '#FF2E88'],
  ['Ice Blue', '#DDF8FF', '#22D3EE'],
  ['Cool White', '#FFFFFF', '#E6F0FF'],
  ['Warm White', '#FFF6E0', '#FFD89A'],
  ['Lemon Yellow', '#FFF9C4', '#FACC15'],
  ['Orange', '#FFE0C2', '#F97316'],
  ['Red', '#FFD6D6', '#EF4444'],
  ['Lime Green', '#EEFFD1', '#84CC16'],
  ['Green', '#D8FFE6', '#22C55E'],
  ['Blue', '#DCE6FF', '#3B82F6'],
  ['Purple', '#EEE0FF', '#8B5CF6'],
  ['Pink Lavender', '#FBE4FF', '#D946EF'],
];

/** Mirrors the database seed so the storefront keeps working while the API is unreachable. */
export const fallbackAssets: StudioAssets = {
  fonts: fonts.map(([name, family, styleTag]) => ({ id: family, name, family, styleTag })),
  colors: colors.map(([name, tubeHex, glowHex]) => ({ id: name, name, tubeHex, glowHex, isRgb: false })),
  backboards: [
    {
      code: 'CLR_CUT',
      name: 'Clear acrylic, cut to shape',
      material: 'Clear acrylic',
      shape: 'CUT_TO_SHAPE',
    },
    { code: 'CLR_RECT', name: 'Clear acrylic, rectangle', material: 'Clear acrylic', shape: 'RECTANGLE' },
    { code: 'BLK_ACR', name: 'Black acrylic, rectangle', material: 'Black acrylic', shape: 'RECTANGLE' },
    { code: 'PRINTED', name: 'Printed backboard', material: 'UV printed acrylic', shape: 'RECTANGLE' },
  ],
  backgrounds: [
    { code: 'BRICK', name: 'Brick wall' },
    { code: 'BEDROOM', name: 'Bedroom' },
    { code: 'CAFE', name: 'Café' },
    { code: 'DARK', name: 'Dark studio' },
  ],
  addons: sampleRules.addons.map(({ code, name, pricingType, value }) => ({
    code,
    name,
    pricingType,
    value,
  })),
  products: [
    {
      id: 'offline-text-neon',
      slug: 'custom-text-neon',
      name: 'Custom text neon sign',
      type: 'TEXT_NEON',
      pricingMode: 'INSTANT',
      minWidthIn: 12,
      maxWidthIn: 96,
      minHeightIn: 4,
      maxHeightIn: 60,
    },
  ],
};
