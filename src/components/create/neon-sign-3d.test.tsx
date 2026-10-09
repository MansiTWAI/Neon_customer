import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as RendererModule from '@/lib/neon-renderer';
import { NeonSign3D } from './neon-sign-3d';

const webgl = vi.hoisted(() => ({ available: false, builds: 0 }));

vi.mock('@/lib/neon-renderer', async (importOriginal) => ({
  ...(await importOriginal<typeof RendererModule>()),
  webglAvailable: () => webgl.available,
  // A stand-in for the WebGL renderer, which jsdom cannot run.
  NeonRenderer: class {
    resize() {}
    dispose() {}
    async build() {
      webgl.builds += 1;
      return { skipped: [], empty: false };
    }
  },
}));

const design = {
  lines: [{ text: 'Priya', size: 'lg' as const, color: '#ff2e88' }],
  thickness: 1,
  align: 'center' as const,
  backboard: 'clear' as const,
  wall: 'brick' as const,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  webgl.builds = 0;
});

describe('NeonSign3D', () => {
  it('falls back without crashing when the browser has no WebGL', () => {
    webgl.available = false;
    const onUnavailable = vi.fn();
    render(
      <NeonSign3D
        design={design}
        fontFamily="Great Vibes"
        label="sign"
        handle={{ current: null }}
        onUnavailable={onUnavailable}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain('cannot show 3D');
    expect(onUnavailable).toHaveBeenCalledOnce();
  });

  it('says which font failed instead of showing a blank picture', async () => {
    webgl.available = true;
    globalThis.ResizeObserver ??= class {
      observe() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 502 })),
    );
    render(<NeonSign3D design={design} fontFamily="Lobster" label="sign" handle={{ current: null }} />);
    expect((await screen.findByRole('alert', {}, { timeout: 3000 })).textContent).toContain(
      'The Lobster font could not be loaded',
    );
    expect(webgl.builds).toBe(0);
  });
});
