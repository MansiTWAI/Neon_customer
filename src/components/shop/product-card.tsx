import { formatINR } from '@neon-adda/shared';
import Image from 'next/image';
import Link from 'next/link';
import { NeonBackdrop, NeonBoard, NeonText } from '@/components/ui/neon-text';
import { signPhotos } from '@/content/sign-photos';
import type { ProductCard as Product } from '@/lib/types';

/**
 * A ready-made sign in a listing: the sign on a plain wall, and hung in a room on hover. Signs
 * without pictures show their lettering drawn in CSS.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const photos = signPhotos(product.slug);
  const colours = [...new Set(product.design?.lines.map((line) => line.glowHex) ?? [])];

  return (
    <Link href={`/p/${product.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-night-950">
        {product.imageUrl ? (
          // Uploaded photos come from the API's own storage, at any size.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={`${product.name} neon sign`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : photos ? (
          <>
            <Image
              src={photos.front}
              alt={`${product.name} neon sign`}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition duration-500 group-hover:opacity-0"
            />
            <Image
              src={photos.room}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            />
          </>
        ) : (
          product.design && (
            <NeonBackdrop className="size-full" glowHex={product.design.lines[0]?.glowHex}>
              <NeonBoard>
                <NeonText lines={product.design.lines} fontFamily={product.design.fontFamily} size="sm" />
              </NeonBoard>
            </NeonBackdrop>
          )
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold group-hover:underline group-hover:underline-offset-4">
            {product.name}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted">{product.category.name}</p>
        </div>
        {colours.length > 0 && (
          <span className="mt-1.5 flex shrink-0 gap-1" aria-hidden>
            {colours.map((hex) => (
              <span key={hex} className="size-2.5 rounded-full" style={{ background: hex }} />
            ))}
          </span>
        )}
      </div>
      {product.fromPricePaise ? (
        <p className="mt-1 text-sm">
          <span className="text-muted">From </span>
          <span className="font-semibold tabular-nums">{formatINR(product.fromPricePaise)}</span>
        </p>
      ) : null}
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} priority={index < 4} />
      ))}
    </div>
  );
}
