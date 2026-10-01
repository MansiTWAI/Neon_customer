import { createSessionMiddleware } from '@neon-adda/shared/web/server';
import { API_URL } from './lib/env';

const PROTECTED = ['/account', '/checkout', '/orders', '/quote'];

export const middleware = createSessionMiddleware({
  audience: 'customer',
  apiUrl: API_URL,
  protectedPaths: PROTECTED,
});

export const config = {
  matcher: ['/account/:path*', '/checkout', '/orders/:path*', '/quote'],
};
