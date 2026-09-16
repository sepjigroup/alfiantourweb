export type WishlistItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
  duration?: string;
  priceFrom?: number;
  savedAt: string;
};

const KEY = 'travelapp_wishlist_v1';
export const WISHLIST_EVENT = 'travelapp:wishlist:changed';

function safeParse(raw: string | null): WishlistItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as WishlistItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  const items = safeParse(window.localStorage.getItem(KEY));
  return items.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

export function saveWishlist(items: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function isInWishlist(id: string): boolean {
  return getWishlist().some((x) => x.id === id);
}

export function addToWishlist(item: WishlistItem): void {
  const items = getWishlist();
  const next = [item, ...items.filter((x) => x.id !== item.id)];
  saveWishlist(next);
}

export function removeFromWishlist(id: string): void {
  const next = getWishlist().filter((x) => x.id !== id);
  saveWishlist(next);
}
