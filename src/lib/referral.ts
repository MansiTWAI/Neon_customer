const KEY = 'na_referral';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CODE = /^[A-Za-z0-9]{3,12}$/;

/** Remembers the partner code from a franchise standee link (`?ref=CODE`) for 30 days. */
export function rememberReferral(search: string) {
  const code = new URLSearchParams(search).get('ref');
  if (!code || !CODE.test(code)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() }));
  } catch {
    // Storage can be unavailable in private browsing; the order then goes to the local franchise.
  }
}

export function currentReferral(): string | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { code: string; at: number } | null;
    return saved && Date.now() - saved.at < TTL_MS ? saved.code : undefined;
  } catch {
    return undefined;
  }
}
