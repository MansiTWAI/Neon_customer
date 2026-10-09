'use client';

import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { parse, type Font } from 'opentype.js';
import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import { NeonRenderer, webglAvailable, type BuildReport, type NeonDesign } from '@/lib/neon-renderer';

export interface NeonSign3DHandle {
  /** A high-resolution PNG of the current view. */
  exportPng: (longSide?: number) => Promise<Blob>;
  /** A JPEG data URL small enough to attach to a quotation. */
  snapshot: () => string | null;
}

const fonts = new Map<string, Promise<Font>>();

/** The font's TrueType file, read once per visit. */
function loadFont(family: string): Promise<Font> {
  let font = fonts.get(family);
  if (!font) {
    font = fetch(`/neon-fonts/${encodeURIComponent(family)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`font ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => parse(buffer));
    font.catch(() => fonts.delete(family));
    fonts.set(family, font);
  }
  return font;
}

type State = { phase: 'loading' } | { phase: 'ready' } | { phase: 'error'; message: string };

/**
 * The customer's sign as a lit 3D neon sign. Drag to look at it from the side. Rebuilt a moment
 * after the words, font or settings change.
 */
export function NeonSign3D({
  design,
  fontFamily,
  label,
  handle,
  onReport,
  onUnavailable,
}: {
  design: NeonDesign;
  fontFamily: string;
  label: string;
  /** Filled with export functions once the view is ready (next/dynamic does not pass refs on). */
  handle: RefObject<NeonSign3DHandle | null>;
  onReport?: (report: BuildReport) => void;
  onUnavailable?: (reason: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<NeonRenderer | null>(null);
  const [state, setState] = useState<State>({ phase: 'loading' });
  const build = useRef(0);

  useImperativeHandle(handle, () => ({
    exportPng: (longSide) => {
      if (!renderer.current) return Promise.reject(new Error('The 3D view is not ready'));
      return renderer.current.exportPng(longSide);
    },
    snapshot: () => renderer.current?.snapshot() ?? null,
  }));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    if (!webglAvailable()) {
      const message = 'This browser cannot show 3D. Showing the flat design instead.';
      setState({ phase: 'error', message });
      onUnavailable?.(message);
      return;
    }
    let instance: NeonRenderer;
    try {
      instance = new NeonRenderer(element);
    } catch {
      const message = 'The 3D view could not start on this device. Showing the flat design instead.';
      setState({ phase: 'error', message });
      onUnavailable?.(message);
      return;
    }
    renderer.current = instance;
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) instance.resize(width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      instance.dispose();
      renderer.current = null;
    };
    // Starting the renderer once is enough; the callbacks only report problems.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!renderer.current) return;
    const id = ++build.current;
    const timer = setTimeout(() => {
      setState((current) => (current.phase === 'ready' ? current : { phase: 'loading' }));
      loadFont(fontFamily)
        .then(async (font) => {
          if (id !== build.current || !renderer.current) return;
          const report = await renderer.current.build(design, font);
          if (id !== build.current) return;
          setState({ phase: 'ready' });
          onReport?.(report);
        })
        .catch(() => {
          if (id === build.current) {
            setState({
              phase: 'error',
              message: `The ${fontFamily} font could not be loaded. Try another font.`,
            });
          }
        });
    }, 150);
    return () => clearTimeout(timer);
    // `design` is rebuilt by the parent on every change; compare it by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(design), fontFamily]);

  return (
    <div className="relative size-full">
      <canvas ref={canvas} role="img" aria-label={label} className="size-full touch-none" />
      {state.phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-night-900/60" role="status">
          <LoaderCircle className="size-6 animate-spin text-neon-pink" aria-hidden />
          <span className="ml-2 text-sm">Bending the neon…</span>
        </div>
      )}
      {state.phase === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
          role="alert"
        >
          <TriangleAlert className="size-6 text-amber-300" aria-hidden />
          <p className="text-sm text-amber-200">{state.message}</p>
        </div>
      )}
    </div>
  );
}
