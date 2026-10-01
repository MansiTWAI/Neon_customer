'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/form';
import { handoffFromDesign, openInStudio } from '@/lib/studio-handoff';
import type { DesignInput } from '@/lib/types';

export function OpenSharedDesign({ design }: { design: DesignInput }) {
  const router = useRouter();
  const handoff = handoffFromDesign(design);
  if (!handoff) return null;

  return <Button onClick={() => router.push(openInStudio(handoff))}>Make it yours in the studio</Button>;
}
