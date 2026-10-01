import type { AddonPricingType, PricingRules, ProductType } from '@neon-adda/shared';

export interface StudioFont {
  id: string;
  name: string;
  family: string;
  styleTag: string;
}

export interface StudioColor {
  id: string;
  name: string;
  tubeHex: string;
  glowHex: string;
  isRgb: boolean;
}

export interface StudioBackboard {
  code: string;
  name: string;
  material: string;
  shape: string;
}

export interface StudioBackground {
  code: string;
  name: string;
}

export interface StudioAddon {
  code: string;
  name: string;
  pricingType: AddonPricingType;
  value: number;
}

export interface StudioProduct {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  pricingMode: 'INSTANT' | 'QUOTE';
  minWidthIn: number;
  maxWidthIn: number;
  minHeightIn: number;
  maxHeightIn: number;
}

export interface StudioAssets {
  fonts: StudioFont[];
  colors: StudioColor[];
  backboards: StudioBackboard[];
  backgrounds: StudioBackground[];
  addons: StudioAddon[];
  products: StudioProduct[];
}

export interface StorefrontData {
  assets: StudioAssets;
  rules: PricingRules;
  /** True when the API could not be reached and the bundled launch data is being shown. */
  offline: boolean;
}
