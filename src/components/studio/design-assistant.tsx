'use client';

import { LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, publicRequest } from '@/lib/api';
import { useStudio } from '@/stores/studio-store';

interface Suggestion {
  lines: { text: string; colorId: string }[];
  fontFamily: string;
  widthIn: number;
  backboardCode: string;
  addonCodes: string[];
  note: string;
}

const EXAMPLES = [
  'Pink “Oh Baby” for a baby shower, about 3 feet',
  'Our café name in warm white, cursive',
  'Gym wall: “No Pain No Gain” in red',
];

/** Describe the sign in words and get a starting design. Hidden when the assistant is switched off. */
export function DesignAssistant() {
  const [enabled, setEnabled] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    publicRequest<{ enabled: boolean }>('/assistant/status')
      .then((status) => setEnabled(status.enabled))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const suggestion = await publicRequest<Suggestion>('/assistant/suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      useStudio.getState().load(suggestion);
      setNote(suggestion.note || 'Here is a starting point. Change anything you like.');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.title : 'The assistant is not responding. Design it yourself below.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-2xl border border-neon-pink/30 bg-gradient-to-br from-neon-pink/10 to-transparent p-4"
    >
      <label htmlFor="assistant-prompt" className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-neon-pink" /> Describe your sign
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="assistant-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={500}
          minLength={3}
          required
          placeholder={EXAMPLES[0]}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-night-900 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-neon-pink"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-neon-pink px-4 py-2 text-sm font-semibold text-night-900 disabled:opacity-60"
        >
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Design it
        </button>
      </div>
      {!note && !error && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.slice(1).map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted hover:text-ink"
            >
              {example}
            </button>
          ))}
        </div>
      )}
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-amber-300">
          {error}
        </p>
      )}
    </form>
  );
}
