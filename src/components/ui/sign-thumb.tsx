import type { Lettering } from '@/lib/types';
import { NeonBackdrop, NeonText } from './neon-text';

/** A small picture of a sign: the studio snapshot when there is one, otherwise the lettering drawn in CSS. */
export function SignThumb({
  previewUrl,
  lettering,
  alt,
  className = 'size-24',
  textSize = 'xs',
}: {
  previewUrl: string | null;
  lettering?: Lettering | null;
  alt: string;
  className?: string;
  /** Lettering size for the CSS fallback; small thumbnails need the smallest. */
  textSize?: 'xs' | 'sm' | 'md';
}) {
  if (previewUrl) {
    return (
      // Snapshots are data URLs or API file URLs of a few kilobytes; next/image would add nothing.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={previewUrl}
        alt={alt}
        className={`shrink-0 rounded-xl bg-night-950 object-cover ${className}`}
      />
    );
  }
  if (lettering) {
    return (
      <NeonBackdrop className={`shrink-0 overflow-hidden rounded-xl ${className}`}>
        <NeonText lines={lettering.lines} fontFamily={lettering.fontFamily} size={textSize} />
      </NeonBackdrop>
    );
  }
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-xl bg-night-950 text-xs text-muted ${className}`}
    >
      Neon
    </div>
  );
}
