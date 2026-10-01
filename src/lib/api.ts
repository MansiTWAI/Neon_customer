import { sampleRules, type PriceResult, type PricingRules, type ProductType } from '@neon-adda/shared';
import { ApiError, toApiError } from '@neon-adda/shared/web/client';
import { API_URL } from './env';
import { fallbackAssets } from './fallback-assets';
import type { StorefrontData, StudioAssets } from './studio-types';
import type { Category, ProductCard, ProductDetail, SavedDesign } from './types';

export { ApiError };

type FetchInit = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

/** Unauthenticated API calls, usable from server components and the browser alike. */
export async function publicRequest<T>(path: string, init?: FetchInit): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** Studio assets and the published rate card. Falls back to bundled launch data if the API is down. */
export async function loadStorefrontData(): Promise<StorefrontData> {
  try {
    const [assets, rules] = await Promise.all([
      publicRequest<StudioAssets>('/studio/assets', { next: { revalidate: 60 } }),
      publicRequest<PricingRules>('/pricing/rate-card/current', { next: { revalidate: 60 } }),
    ]);
    return { assets, rules, offline: false };
  } catch {
    return { assets: fallbackAssets, rules: sampleRules, offline: true };
  }
}

export interface PriceRequest {
  productId?: string;
  productType?: ProductType;
  backboardCode: string;
  widthIn: number;
  heightIn: number;
  colorCount: number;
  addonCodes: string[];
  qty: number;
  installation: boolean;
  pincode?: string;
}

export function fetchPrice(body: PriceRequest): Promise<PriceResult> {
  return publicRequest<PriceResult>('/pricing/calculate', { method: 'POST', body: JSON.stringify(body) });
}

const catalogCache = { next: { revalidate: 60 } };

export const fetchCategories = () => publicRequest<Category[]>('/catalog/categories', catalogCache);

export function fetchProducts(query: { category?: string; tag?: string; q?: string; sort?: string } = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  return publicRequest<ProductCard[]>(`/catalog/products${params.size ? `?${params}` : ''}`, catalogCache);
}

/** Null when the product does not exist, so pages can render their own not-found. */
export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await publicRequest<ProductDetail>(`/catalog/products/${encodeURIComponent(slug)}`, catalogCache);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function fetchSharedDesign(slug: string): Promise<Omit<SavedDesign, 'id'> | null> {
  try {
    return await publicRequest<Omit<SavedDesign, 'id'>>(`/designs/shared/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}
