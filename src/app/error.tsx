'use client';

import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

/**
 * Shown when a page cannot load, most often while the API is waking up or briefly unreachable,
 * instead of the framework's bare error screen. The cart and designs are kept in the browser.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 font-display text-2xl font-bold">This page could not load</h1>
      <p className="mt-3 text-muted">
        Our server may be waking up. Your cart and designs are safe; try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          <RefreshCw className="size-4" aria-hidden /> Try again
        </button>
        <Link href="/" className="btn-outline">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
