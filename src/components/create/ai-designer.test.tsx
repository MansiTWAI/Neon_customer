import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import type * as ApiModule from '@/lib/api';
import type * as ArtworkModule from '@/lib/artwork';
import type { Artwork } from '@/lib/artwork';
import { AiDesigner } from './ai-designer';

// Public calls (the status) and signed-in calls (making pictures) share one fake server.
const publicRequest = vi.fn();
const signedInRequest = vi.fn();
const composeArtwork = vi.fn(async () => undefined);

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof ApiModule>()),
  publicRequest: (...args: unknown[]) => publicRequest(...args),
}));
vi.mock('@/lib/browser-api', () => ({
  api: { request: (...args: unknown[]) => signedInRequest(...args) },
}));
vi.mock('@/lib/artwork', async (importOriginal) => ({
  ...(await importOriginal<typeof ArtworkModule>()),
  composeArtwork: (...args: unknown[]) => composeArtwork(...(args as [])),
}));

const ARTWORK: Artwork = {
  image: 'data:image/svg+xml;base64,PHN2Zy8+',
  title: 'Rahul & Priya Romantic Roses',
  overlay: {
    lines: [{ text: 'Rahul ❤️ Priya', size: 'lg' }],
    font: 'Great Vibes',
    color: '#fff0f5',
    glow: '#ff1744',
    placement: 'center',
  },
  style: 'romantic',
  provider: 'gemini-svg',
  seed: 7,
};

/** Answers the API calls the page makes, in the order it makes them. */
function api(routes: Record<string, (init?: RequestInit) => unknown>) {
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
  // jsdom does not lay out pages.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  publicRequest.mockReset();
  signedInRequest.mockReset();
  sessionStorage.clear();
  composeArtwork.mockClear();
});

describe('AiDesigner', () => {
  it('says so when the AI designer is switched off', async () => {
    api({ '/artwork/status': () => ({ enabled: false }) });
    render(<AiDesigner />);
    expect(await screen.findByText('The AI designer is resting')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Create my design/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    // The ready-made backgrounds still work.
    expect(screen.getByRole('button', { name: /Rose romance/ })).toBeTruthy();
  });

  it('adds emojis to the line being edited', async () => {
    api({ '/artwork/status': () => ({ enabled: true }) });
    render(<AiDesigner />);
    const line = screen.getByLabelText('Line 1') as HTMLInputElement;
    fireEvent.change(line, { target: { value: 'Ananya ' } });
    fireEvent.focus(line);
    fireEvent.click(screen.getByLabelText('Add 🎂'));
    expect(line.value).toBe('Ananya 🎂');
  });

  it('asks for a picture, waits for it, and draws the exact words on it', async () => {
    let polls = 0;
    api({
      '/artwork/status': () => ({ enabled: true }),
      '/artwork/jobs/': () => (++polls < 2 ? { status: 'pending' } : { status: 'done', artwork: ARTWORK }),
      '/artwork': (init) => {
        expect(JSON.parse(String(init?.body))).toMatchObject({
          prompt: 'Rahul ❤️ Priya with roses',
          aspect: 'square',
        });
        return { id: '0199a3c4-5b6e-7f80-9a1b-2c3d4e5f6a7c', remaining: 4 };
      },
    });
    render(<AiDesigner />);
    fireEvent.change(screen.getByLabelText(/Describe your design/), {
      target: { value: 'Rahul ❤️ Priya with roses' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create my design/ }));

    expect(await screen.findByRole('status')).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(4500));

    const picture = await screen.findByRole('img', { name: /Rahul & Priya Romantic Roses: Rahul ❤️ Priya/ });
    expect(picture.tagName).toBe('CANVAS');
    await waitFor(() =>
      expect(composeArtwork).toHaveBeenLastCalledWith(
        picture,
        ARTWORK.image,
        expect.objectContaining({ lines: [{ text: 'Rahul ❤️ Priya', size: 'lg' }], font: 'Great Vibes' }),
      ),
    );
    expect(screen.getByText('4 AI designs left today')).toBeTruthy();
    for (const action of [/Regenerate/, /Variation/, /Download/, /Get it made/]) {
      expect(screen.getByRole('button', { name: action })).toBeTruthy();
    }

    // Editing the words redraws the picture without asking the API again.
    const calls = signedInRequest.mock.calls.length;
    fireEvent.change(screen.getByLabelText('Line 1'), { target: { value: 'Rahul ❤️ Priya forever' } });
    await waitFor(() =>
      expect(composeArtwork).toHaveBeenLastCalledWith(
        picture,
        ARTWORK.image,
        expect.objectContaining({ lines: [{ text: 'Rahul ❤️ Priya forever', size: 'lg' }] }),
      ),
    );
    expect(signedInRequest.mock.calls.length).toBe(calls);
  });

  it('shows the reason when the picture cannot be made', async () => {
    api({
      '/artwork/status': () => ({ enabled: true }),
      '/artwork/jobs/': () => ({
        status: 'failed',
        error: { status: 429, code: 'ARTWORK_QUOTA', title: "Today's free AI drawing allowance is used up." },
      }),
      '/artwork': () => ({ id: '0199a3c4-5b6e-7f80-9a1b-2c3d4e5f6a7c' }),
    });
    render(<AiDesigner />);
    fireEvent.change(screen.getByLabelText(/Describe your design/), { target: { value: 'roses' } });
    fireEvent.click(screen.getByRole('button', { name: /Create my design/ }));
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect((await screen.findByRole('alert')).textContent).toContain('allowance is used up');
  });

  it('asks a signed-out customer to sign in and keeps what they typed', async () => {
    api({
      '/artwork/status': () => ({ enabled: true, perCustomerDaily: 5 }),
      '/artwork': () => {
        throw new ApiError({ status: 401, code: 'UNAUTHENTICATED', title: 'Sign in', details: {} });
      },
    });
    render(<AiDesigner />);
    fireEvent.change(screen.getByLabelText(/Describe your design/), { target: { value: 'Golden birthday' } });
    fireEvent.click(screen.getByRole('button', { name: /Create my design/ }));
    const link = await screen.findByRole('link', { name: /Sign in/ });
    expect(link.getAttribute('href')).toBe('/login?next=%2Fcreate');
    expect(screen.getByText(/and gives you 5 free AI designs a day/)).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem('neon-adda.ai-draft')!)).toMatchObject({
      prompt: 'Golden birthday',
    });
  });

  it('puts back the draft after signing in', async () => {
    sessionStorage.setItem(
      'neon-adda.ai-draft',
      JSON.stringify({
        prompt: 'Golden birthday',
        style: 'festive',
        aspect: 'portrait',
        lines: [{ text: 'Ananya 🎂', size: 'lg' }],
      }),
    );
    api({ '/artwork/status': () => ({ enabled: true }) });
    render(<AiDesigner />);
    expect((screen.getByLabelText(/Describe your design/) as HTMLTextAreaElement).value).toBe(
      'Golden birthday',
    );
    expect((screen.getByLabelText('Line 1') as HTMLInputElement).value).toBe('Ananya 🎂');
  });

  it('uses a ready-made background without the API or a sign-in', async () => {
    api({ '/artwork/status': () => ({ enabled: true }) });
    render(<AiDesigner />);
    fireEvent.click(screen.getByRole('button', { name: /Golden birthday/ }));
    const picture = await screen.findByRole('img', { name: /Golden birthday: Happy Birthday, Ananya 🎂/ });
    await waitFor(() =>
      expect(composeArtwork).toHaveBeenLastCalledWith(
        picture,
        expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        expect.objectContaining({ font: 'Pacifico' }),
      ),
    );
    expect(signedInRequest).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Regenerate/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Download/ })).toBeTruthy();
  });

  it('refuses an empty description without calling the API', async () => {
    api({ '/artwork/status': () => ({ enabled: true }) });
    render(<AiDesigner />);
    fireEvent.click(await screen.findByRole('button', { name: /Create my design/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('Describe the design');
    expect(signedInRequest).not.toHaveBeenCalled();
  });
});
