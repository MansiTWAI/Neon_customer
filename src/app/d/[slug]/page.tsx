import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OpenSharedDesign } from '@/components/studio/open-shared-design';
import { SignThumb } from '@/components/ui/sign-thumb';
import { fetchSharedDesign } from '@/lib/api';
import { formatSize } from '@/lib/format';
import { letteringOf } from '@/lib/types';

interface SharedDesignPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SharedDesignPageProps): Promise<Metadata> {
  const shared = await fetchSharedDesign((await params).slug);
  if (!shared) return {};
  return {
    title: `${shared.name} in neon`,
    description: 'A custom neon sign designed on Neon Adda. Open it in the studio to make it yours.',
    openGraph: shared.previewUrl ? { images: [shared.previewUrl] } : undefined,
    robots: { index: false },
  };
}

export default async function SharedDesignPage({ params }: SharedDesignPageProps) {
  const shared = await fetchSharedDesign((await params).slug);
  if (!shared || shared.design.config.mode !== 'TEXT') notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-sm font-semibold tracking-widest text-neon-cyan uppercase">Shared design</p>
      <h1 className="mt-2 font-display text-3xl font-bold">{shared.name}</h1>
      <p className="mt-2 text-muted">{formatSize(shared.design.widthIn, shared.design.heightIn)}</p>
      <SignThumb
        previewUrl={shared.previewUrl}
        lettering={letteringOf(shared.design)}
        alt={`Neon sign reading ${shared.name}`}
        className="mt-8 aspect-[1.6] w-full"
        textSize="md"
      />
      <div className="mt-8">
        <OpenSharedDesign design={shared.design} />
      </div>
    </div>
  );
}
