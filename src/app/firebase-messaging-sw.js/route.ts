import { firebaseServiceWorkerSource } from '@neon-adda/shared/web/server';
import { FIREBASE_CONFIG } from '@/lib/firebase';

export const dynamic = 'force-static';

export function GET() {
  return new Response(firebaseServiceWorkerSource(FIREBASE_CONFIG), {
    headers: { 'content-type': 'application/javascript; charset=utf-8', 'service-worker-allowed': '/' },
  });
}
