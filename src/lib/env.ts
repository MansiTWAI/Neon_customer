/**
 * Browsers call the API through this app's own /v1 route (see next.config.ts), so the session
 * cookies belong to this site even when the API is hosted on another domain. Server code and
 * middleware call the API directly.
 */
export const API_URL = typeof window === 'undefined' ? (process.env.API_URL ?? 'http://localhost:4000') : '';
