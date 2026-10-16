import type { Metadata } from 'next';
import { NeonDesigner } from '@/components/create/neon-designer';
import { loadStorefrontData } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Design your neon sign in 3D',
  description:
    'Type your name or words, add neon hearts, stars and crowns, and see your custom LED neon sign lit in 3D on a wall, with the price as you go.',
  alternates: { canonical: '/create' },
};

interface CreatePageProps {
  searchParams: Promise<{ open?: string; text?: string }>;
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  // Reading searchParams first marks the page dynamic before any data is requested.
  const { open, text } = await searchParams;
  const data = await loadStorefrontData();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      {data.offline && process.env.NODE_ENV !== 'production' && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          The API is unreachable, so launch prices are shown and adding to cart is disabled.
        </p>
      )}
      <NeonDesigner data={data} openHandoff={open === '1'} initialText={text?.trim() || undefined} />
    </div>
  );
}
