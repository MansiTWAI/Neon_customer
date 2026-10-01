import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-32 text-center">
      <p className="font-display text-6xl font-bold neon-text">404</p>
      <h1 className="mt-6 text-xl font-semibold">This page is switched off</h1>
      <p className="mt-2 text-muted">The page you were looking for does not exist or has moved.</p>
      <Link href="/" className="mt-6 font-semibold text-neon-cyan hover:underline">
        Back to the home page
      </Link>
    </div>
  );
}
