'use client';

import { Bookmark, Check, Link2, PenTool, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/card';
import { FormError } from '@/components/ui/form';
import { SignThumb } from '@/components/ui/sign-thumb';
import { ApiError } from '@/lib/api';
import { api } from '@/lib/browser-api';
import { formatDate, formatSize } from '@/lib/format';
import { handoffFromDesign, openInStudio } from '@/lib/studio-handoff';
import { letteringOf, type SavedDesign } from '@/lib/types';

export function DesignGallery({ initial }: { initial: SavedDesign[] }) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initial);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function share(design: SavedDesign) {
    setError(null);
    try {
      const { slug } = await api.request<{ slug: string }>(`/designs/${design.id}/share`, { method: 'POST' });
      const url = `${window.location.origin}/d/${slug}`;
      if (navigator.share) {
        await navigator.share({ title: design.name, url }).catch(() => undefined);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(design.id);
        setTimeout(() => setCopied(null), 2500);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'Could not create a link.');
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.request(`/designs/${id}`, { method: 'DELETE' });
      setDesigns((current) => current.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.title : 'Could not delete the design.');
    }
  }

  function edit(design: SavedDesign) {
    const handoff = handoffFromDesign(design.design);
    if (handoff) router.push(openInStudio(handoff));
  }

  if (!designs.length) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No saved designs"
        body="Use the bookmark button in the studio to keep a design for later or share it with someone."
        action={{ href: '/studio', label: 'Open the studio' }}
      />
    );
  }

  return (
    <>
      <FormError message={error} />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {designs.map((design) => (
          <li key={design.id} className="overflow-hidden rounded-2xl border border-white/5 bg-night-800">
            <SignThumb
              previewUrl={design.previewUrl}
              lettering={letteringOf(design.design)}
              alt={`Preview of ${design.name}`}
              className="aspect-[1.6] w-full rounded-none"
              textSize="sm"
            />
            <div className="p-4">
              <p className="truncate font-semibold">{design.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatSize(design.design.widthIn, design.design.heightIn)} · Saved{' '}
                {formatDate(design.createdAt)}
              </p>
              <div className="mt-4 flex items-center gap-1">
                {design.design.config.mode === 'TEXT' && (
                  <>
                    <button
                      onClick={() => edit(design)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/15"
                    >
                      <PenTool className="size-3.5" /> Open
                    </button>
                    <button
                      onClick={() => share(design)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted transition hover:text-ink"
                    >
                      {copied === design.id ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
                      {copied === design.id ? 'Link copied' : 'Share'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => remove(design.id)}
                  aria-label={`Delete ${design.name}`}
                  className="ml-auto rounded-full p-2 text-muted transition hover:text-red-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
