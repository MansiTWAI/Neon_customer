import type { Metadata } from 'next';
import { PhoneSignIn } from '@/components/auth/phone-sign-in';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only same-site paths: "//host" would send the user to another site after signing in.
  const destination = next && /^\/(?!\/)/.test(next) ? next : '/account';

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Sign in</h1>
      <p className="mt-2 mb-8 text-muted">Track orders, approve design proofs and check out faster.</p>
      <PhoneSignIn next={destination} />
    </div>
  );
}
