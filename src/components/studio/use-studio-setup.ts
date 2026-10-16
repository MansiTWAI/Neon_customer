'use client';

import { useEffect, useState } from 'react';
import { takeHandoff } from '@/lib/studio-handoff';
import type { StudioAssets } from '@/lib/studio-types';
import { useStudio } from '@/stores/studio-store';

/**
 * Gets the saved design ready for a designer page: repairs fonts, colours or backboards that have
 * since been retired, then loads a design handed over from a product page, a saved design or a
 * shared link. Returns true once the design can be drawn.
 */
export function useStudioSetup(
  assets: StudioAssets,
  { initialText, openHandoff }: { initialText?: string; openHandoff?: boolean },
): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const state = useStudio.getState();
    state.reconcile({
      fonts: assets.fonts.map((f) => f.family),
      colorIds: assets.colors.map((c) => c.id),
      backboards: assets.backboards.map((b) => b.code),
    });

    const handoff = openHandoff ? takeHandoff() : null;
    if (handoff) {
      const colorFor = (hex: string) =>
        assets.colors.find((c) => c.glowHex.toUpperCase() === hex.toUpperCase())?.id ?? '';
      state.load({
        lines: handoff.lines.map((line) => ({ text: line.text, colorId: colorFor(line.glowHex) })),
        fontFamily: assets.fonts.some((f) => f.family === handoff.fontFamily)
          ? handoff.fontFamily
          : undefined,
        widthIn: handoff.widthIn,
        backboardCode: assets.backboards.some((b) => b.code === handoff.backboardCode)
          ? handoff.backboardCode
          : undefined,
        addonCodes: handoff.addonCodes?.filter((code) => assets.addons.some((a) => a.code === code)),
      });
    } else if (initialText) {
      state.startWith(initialText);
    }
    setReady(true);
  }, [assets, initialText, openHandoff]);

  return ready;
}
