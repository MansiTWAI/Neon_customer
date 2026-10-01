import type { Metadata } from 'next';
import { DesignGallery } from '@/components/account/design-gallery';
import { serverApi } from '@/lib/server-api';
import type { SavedDesign } from '@/lib/types';

export const metadata: Metadata = { title: 'Saved designs' };

export default async function DesignsPage() {
  const designs = await serverApi.request<SavedDesign[]>('/designs');
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Saved designs</h1>
      <DesignGallery initial={designs} />
    </>
  );
}
