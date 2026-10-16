import { calculatePrice, formatINR, sampleRules } from '@neon-adda/shared';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import type * as ApiModule from '@/lib/api';
import { fallbackAssets } from '@/lib/fallback-assets';
import type { NeonDesign } from '@/lib/neon-renderer';
import type { StorefrontData } from '@/lib/studio-types';
import { useCart } from '@/stores/cart-store';
import { useStudio } from '@/stores/studio-store';
import { NeonDesigner } from './neon-designer';

// Public calls (status, prices) and signed-in calls (AI rooms) share one fake server.
const publicRequest = vi.fn();
const signedInRequest = vi.fn();
const fetchPrice = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof ApiModule>()),
  publicRequest: (...args: unknown[]) => publicRequest(...args),
  fetchPrice: (...args: unknown[]) => fetchPrice(...args),
}));
vi.mock('@/lib/browser-api', () => ({
  api: { request: (...args: unknown[]) => signedInRequest(...args) },
}));
// The 3D view needs WebGL, which jsdom lacks; a stand-in records what it was asked to draw and
// reports the lettering's proportions as the real renderer does.
const drawn: (NeonDesign & { font: string })[] = [];
vi.mock('./neon-sign-3d', () => ({
  NeonSign3D: (props: {
    design: NeonDesign;
    fontFamily: string;
    label: string;
    onReport?: (report: { skipped: string[]; empty: boolean; aspect: number }) => void;
    handle: { current: unknown };
  }) => {
    drawn.push({ ...props.design, font: props.fontFamily });
    props.handle.current = { snapshot: () => 'data:image/jpeg;base64,AAAA', exportPng: vi.fn() };
    return (
      <button
        type="button"
        aria-label={props.label}
        onClick={() => props.onReport?.({ skipped: [], empty: false, aspect: 0.5 })}
      />
    );
  },
}));

const DATA: StorefrontData = { assets: fallbackAssets, rules: sampleRules, offline: false };
const last = () => drawn.at(-1)!;

function server(routes: Record<string, (init?: RequestInit) => unknown>) {
  const answer = async (path: string, init?: RequestInit) => {
    const route = Object.keys(routes).find((prefix) => path.startsWith(prefix));
    if (!route) throw new Error(`unexpected ${path}`);
    return routes[route]!(init);
  };
  publicRequest.mockImplementation(answer);
  signedInRequest.mockImplementation(answer);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  useStudio.setState({
    lines: [{ text: 'Riya', colorId: 'Hot Pink' }],
    fontFamily: 'Great Vibes',
    colorId: 'Hot Pink',
    multiColor: false,
    sizePreset: 'M',
    widthIn: 24,
    aspect: 0.45,
    backboardCode: 'CLR_CUT',
    addonCodes: [],
  });
  useCart.setState({ items: [] });
  server({ '/artwork/status': () => ({ enabled: true, perCustomerDaily: 5 }) });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  publicRequest.mockReset();
  signedInRequest.mockReset();
  fetchPrice.mockReset();
  sessionStorage.clear();
  drawn.length = 0;
});

describe('NeonDesigner', () => {
  it('draws the exact words in the catalogue font and colour, with no AI involved', async () => {
    render(<NeonDesigner data={DATA} />);
    await waitFor(() => expect(drawn.length).toBeGreaterThan(0));
    expect(last()).toMatchObject({
      font: 'Great Vibes',
      backboard: 'clear',
      wall: 'brick',
      lines: [{ text: 'Riya', color: '#FF2E88', size: 'lg' }],
    });

    fireEvent.change(screen.getByLabelText('Line 1'), { target: { value: 'Rahul ❤️ Priya' } });
    await waitFor(() => expect(last().lines[0]!.text).toBe('Rahul ❤️ Priya'));

    fireEvent.click(screen.getByRole('button', { name: 'Ice Blue' }));
    await waitFor(() => expect(last().lines[0]!.color).toBe('#22D3EE'));

    fireEvent.click(screen.getByRole('button', { name: /Black acrylic/ }));
    await waitFor(() => expect(last().backboard).toBe('black'));

    // Editing never asks the AI for anything.
    expect(signedInRequest).not.toHaveBeenCalled();
  });

  it('adds neon symbols to the line being edited and drops emojis that cannot be made', async () => {
    render(<NeonDesigner data={DATA} />);
    const line = screen.getByLabelText('Line 1');
    fireEvent.focus(line);
    fireEvent.click(screen.getByRole('button', { name: 'Add Crown' }));
    await waitFor(() => expect((line as HTMLInputElement).value).toBe('Riya👑'));
    fireEvent.change(line, { target: { value: 'Riya 🦄⭐' } });
    expect((line as HTMLInputElement).value).toBe('Riya ⭐');
    expect(screen.getByRole('status').textContent).toContain('🦄 cannot be made in neon');
  });

  it('prices the sign by the rate card, sized from the 3D lettering, and adds the full design to the cart', async () => {
    render(<NeonDesigner data={DATA} />);
    fireEvent.click(await screen.findByRole('button', { name: /3D preview of your neon sign/ }));
    await waitFor(() => expect(useStudio.getState().aspect).toBe(0.5));

    const product = fallbackAssets.products[0]!;
    const expected = calculatePrice(
      {
        productType: 'TEXT_NEON',
        backboardCode: 'CLR_CUT',
        widthIn: 24,
        heightIn: 12,
        colorCount: 1,
        addonCodes: [],
        qty: 1,
        installation: false,
        sizeLimits: product,
      },
      sampleRules,
    );
    if (expected.status !== 'OK') throw new Error('sample rules should price this');
    // Shown at the top of the steps and in the price bar.
    expect(await screen.findAllByText(formatINR(expected.payablePaise))).toHaveLength(2);

    fetchPrice.mockResolvedValue(expected);
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await screen.findByText(/Added to your cart/);
    // The server's price is checked before anything is added.
    expect(fetchPrice).toHaveBeenCalledWith(expect.objectContaining({ widthIn: 24, heightIn: 12 }));
    const [item] = useCart.getState().items;
    expect(item!.design).toMatchObject({
      productId: product.id,
      widthIn: 24,
      heightIn: 12,
      backboardCode: 'CLR_CUT',
      config: {
        mode: 'TEXT',
        fontFamily: 'Great Vibes',
        lines: [{ text: 'Riya', colorName: 'Hot Pink', glowHex: '#FF2E88', tubeHex: '#FFD1EA' }],
      },
    });
    expect(item!.previewUrl).toBe('data:image/jpeg;base64,AAAA');
  });

  it('does not add to the cart when the server price differs', async () => {
    render(<NeonDesigner data={DATA} />);
    await waitFor(() => expect(drawn.length).toBeGreaterThan(0));
    fetchPrice.mockResolvedValue({ status: 'OK', payablePaise: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));
    await screen.findByText(/Our prices were just updated/);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it('paints an AI room behind the sign while the sign stays on screen', async () => {
    let polls = 0;
    server({
      '/artwork/status': () => ({ enabled: true, perCustomerDaily: 5 }),
      '/artwork/backdrops': () => ({ id: 'job-1', remaining: 4 }),
      '/artwork/jobs/job-1': () =>
        ++polls < 2
          ? { status: 'pending' }
          : {
              status: 'done',
              backdrop: { image: 'data:image/jpeg;base64,ROOM', provider: 'cloudflare', cached: false },
            },
    });
    render(<NeonDesigner data={DATA} />);
    fireEvent.change(screen.getByLabelText(/See it in your kind of room/), {
      target: { value: 'A café with exposed brick' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Paint' }));
    // A second click while it paints does not start another.
    fireEvent.click(screen.getByRole('button', { name: 'Painting…' }));
    expect(await screen.findByText(/Painting your room/)).toBeTruthy();
    expect(last().lines[0]!.text).toBe('Riya');

    await act(() => vi.advanceTimersByTimeAsync(5000));
    await waitFor(() => expect(last().wall).toEqual({ image: 'data:image/jpeg;base64,ROOM' }));
    const starts = signedInRequest.mock.calls.filter(([path]) => path === '/artwork/backdrops');
    expect(starts).toHaveLength(1);
    expect(JSON.parse((starts[0]![1] as RequestInit).body as string)).toEqual({
      prompt: 'A café with exposed brick',
      aspect: 'landscape',
    });
    expect(screen.getByText('4 AI rooms left today')).toBeTruthy();
  });

  it('can cancel a room that is being painted', async () => {
    server({
      '/artwork/status': () => ({ enabled: true }),
      '/artwork/backdrops': () => ({ id: 'job-2', remaining: 3 }),
      '/artwork/jobs/job-2': () => ({ status: 'pending' }),
    });
    render(<NeonDesigner data={DATA} />);
    fireEvent.change(screen.getByLabelText(/See it in your kind of room/), {
      target: { value: 'A bedroom' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Paint' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText(/Painting your room/)).toBeNull());
    expect(screen.getByRole('button', { name: 'Paint' })).toBeTruthy();
    expect(last().wall).toBe('brick');
  });

  it('asks the customer to sign in for AI rooms and keeps the built-in walls free', async () => {
    server({
      '/artwork/status': () => ({ enabled: true, perCustomerDaily: 5 }),
      '/artwork/backdrops': () => {
        throw new ApiError({ status: 401, code: 'UNAUTHENTICATED', title: 'Sign in' });
      },
    });
    render(<NeonDesigner data={DATA} />);
    fireEvent.click(screen.getByRole('button', { name: /Drapes · wedding/ }));
    await waitFor(() => expect(last().wall).toBe('drapes'));
    fireEvent.change(screen.getByLabelText(/See it in your kind of room/), {
      target: { value: 'A wedding stage' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Paint' }));
    expect((await screen.findByRole('link', { name: /Sign in/ })).getAttribute('href')).toBe(
      '/login?next=%2Fcreate',
    );
    expect(sessionStorage.getItem('neon-adda.room-prompt')).toBe('A wedding stage');
  });

  it('shows every step at once, with what is in the box and the promises', async () => {
    render(<NeonDesigner data={DATA} />);
    for (const step of [
      'Type your text',
      'Pick your font',
      'Select your colour',
      'Select your size',
      'Choose the backboard',
      'Add-ons',
      'Preview it on a wall',
    ]) {
      expect(screen.getByRole('region', { name: step })).toBeTruthy();
    }
    expect(screen.getByText('1-year warranty')).toBeTruthy();
    expect(screen.getByText('What is in the box?')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Have your own logo/ }).getAttribute('href')).toBe(
      '/studio?mode=logo',
    );
  });

  it('changes the lighting without touching the design', async () => {
    render(<NeonDesigner data={DATA} />);
    await waitFor(() => expect(last().lighting).toEqual({ sign: 1, room: 1 }));
    fireEvent.click(screen.getByRole('button', { name: 'Daylight' }));
    await waitFor(() => expect(last().lighting).toEqual({ sign: 1, room: 2.8 }));
    fireEvent.change(screen.getByRole('slider', { name: /Sign brightness/ }), { target: { value: '0.5' } });
    await waitFor(() => expect(last().lighting?.sign).toBe(0.5));
    fireEvent.click(screen.getByRole('button', { name: 'Sign on' }));
    await waitFor(() => expect(last().lighting?.sign).toBe(0));
    // Switching it back on returns to the brightness the customer had chosen.
    fireEvent.click(screen.getByRole('button', { name: 'Sign off' }));
    await waitFor(() => expect(last().lighting?.sign).toBe(0.5));
    expect(last().lines[0]!.text).toBe('Riya');
  });

  it('explains when the free AI allowance is used up', async () => {
    server({
      '/artwork/status': () => ({ enabled: true }),
      '/artwork/backdrops': () => {
        throw new ApiError({ status: 429, code: 'ARTWORK_LIMIT', title: 'limit' });
      },
    });
    render(<NeonDesigner data={DATA} />);
    fireEvent.change(screen.getByLabelText(/See it in your kind of room/), {
      target: { value: 'An office' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Paint' }));
    expect(await screen.findByText(/painted all your AI rooms for today/)).toBeTruthy();
  });
});
