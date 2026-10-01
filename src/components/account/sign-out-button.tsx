'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/browser-api';

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await api.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-muted transition hover:text-ink disabled:opacity-50"
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}
