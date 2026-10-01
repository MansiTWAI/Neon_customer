import type { Metadata } from 'next';
import { Studio } from '@/components/studio/studio';
import { loadStorefrontData } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Design your neon sign',
  description:
    'Type your words or upload your logo, pick a colour and size, and watch your LED neon sign light up, with the price shown as you go.',
};

interface StudioPageProps {
  searchParams: Promise<{ text?: string; mode?: string; open?: string }>;
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  // Reading searchParams first marks the page dynamic before any data is requested.
  const { text, mode, open } = await searchParams;
  const data = await loadStorefrontData();
  return (
    <Studio
      data={data}
      mode={mode === 'logo' ? 'LOGO' : 'TEXT'}
      initialText={text?.trim() || undefined}
      openHandoff={open === '1'}
    />
  );
}
