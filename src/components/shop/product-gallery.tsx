'use client';

import Image from 'next/image';
import { useState } from 'react';
import { NeonBackdrop, NeonBoard, NeonText } from '@/components/ui/neon-text';
import type { SignPhotos } from '@/content/sign-photos';
import type { ReadymadeDesign } from '@/lib/types';

/**
 * The product's pictures: the sign on a plain wall, hung in a room, and a close-up of the tubes
 * and board. Falls back to an uploaded photo, or the lettering drawn in CSS.
 */
export function ProductGallery({
  name,
  photos,
  imageUrl,
  design,
}: {
  name: string;
  photos: SignPhotos | null;
  imageUrl: string | null;
  design: ReadymadeDesign;
}) {
  const views = photos
    ? [
        { src: photos.front, label: 'The sign', alt: `${name} LED neon sign, lit, on a plain wall` },
        { src: photos.room, label: 'In a room', alt: `${name} neon sign hung in a room` },
        {
          src: photos.detail,
          label: 'Close-up',
          alt: `Close-up of the ${name} sign: neon tubes on an acrylic board with standoffs`,
        },
      ]
    : [];
  const [current, setCurrent] = useState(0);

  if (imageUrl || !views.length) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-night-950">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded photo from the API
          <img src={imageUrl} alt={`${name} neon sign`} className="size-full object-cover" />
        ) : (
          <NeonBackdrop className="size-full" glowHex={design.lines[0]?.glowHex}>
            <NeonBoard>
              <NeonText lines={design.lines} fontFamily={design.fontFamily} size="lg" />
            </NeonBoard>
          </NeonBackdrop>
        )}
      </div>
    );
  }

  const view = views[current]!;
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-night-950">
        <Image
          key={view.src}
          src={view.src}
          alt={view.alt}
          fill
          priority={current === 0}
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="animate-[fade-in_300ms_ease-out] object-cover"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3" role="group" aria-label="Pictures">
        {views.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setCurrent(index)}
            aria-pressed={index === current}
            aria-label={`Show ${item.label.toLowerCase()}`}
            className={`group text-left ${index === current ? '' : 'opacity-60 hover:opacity-100'}`}
          >
            <span
              className={`relative block aspect-[4/3] overflow-hidden rounded-lg border ${
                index === current ? 'border-white/70' : 'border-transparent'
              }`}
            >
              <Image src={item.src} alt="" fill sizes="20vw" className="object-cover" />
            </span>
            <span className="mt-1.5 block text-xs text-muted">{item.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Pictures are 3D renders of this design. The room is for illustration; you receive the sign.
      </p>
    </div>
  );
}
