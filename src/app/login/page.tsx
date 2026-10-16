import type { Metadata } from 'next';
import { AccountSignIn } from '@/components/auth/account-sign-in';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next, mode } = await searchParams;
  // Only same-site paths: "//host" and "/\host" would send the user to another site after signing in.
  const destination = next && /^\/(?![/\\])/.test(next) ? next : '/account';

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <AccountSignIn next={destination} initialMode={mode === 'register' ? 'register' : 'sign-in'} />
    </div>
  );
}
