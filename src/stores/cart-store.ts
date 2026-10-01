import type { LineInput, ProductType } from '@neon-adda/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesignInput } from '@/lib/types';

export interface CartDisplay {
  title: string;
  productName: string;
  productType: ProductType;
  backboardName: string;
}

export interface CartItem {
  id: string;
  design: DesignInput;
  display: CartDisplay;
  /** JPEG data URL captured from the studio canvas, if the sign was designed there. */
  previewUrl: string | null;
  qty: number;
  addedAt: string;
}

export const MAX_QTY = 20;
const MAX_ITEMS = 10;

interface CartState {
  items: CartItem[];
  add: (design: DesignInput, display: CartDisplay, previewUrl: string | null, qty?: number) => boolean;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const clampQty = (qty: number) => Math.min(MAX_QTY, Math.max(1, Math.round(qty)));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (design, display, previewUrl, qty = 1) => {
        if (get().items.length >= MAX_ITEMS) return false;
        set((s) => ({
          items: [
            ...s.items,
            {
              id: crypto.randomUUID(),
              design,
              display,
              previewUrl,
              qty: clampQty(qty),
              addedAt: new Date().toISOString(),
            },
          ],
        }));
        return true;
      },
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((item) => (item.id === id ? { ...item, qty: clampQty(qty) } : item)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'neon-adda.cart',
      version: 2,
      // Version 1 carts held display data only and cannot be checked out, so they are dropped.
      migrate: () => ({ items: [] }),
    },
  ),
);

export function colorCountOf(design: DesignInput): number {
  return design.config.mode === 'TEXT'
    ? new Set(design.config.lines.map((line) => line.glowHex.toUpperCase())).size
    : 1;
}

/** The pricing engine's view of a cart item. */
export function toLineInput(item: CartItem): LineInput {
  return {
    productType: item.display.productType,
    backboardCode: item.design.backboardCode,
    widthIn: item.design.widthIn,
    heightIn: item.design.heightIn,
    colorCount: colorCountOf(item.design),
    addonCodes: item.design.addonCodes,
    qty: item.qty,
  };
}
