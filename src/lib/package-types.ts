import { API_BASE_URL } from '@/lib/api-client';

export type PackageTypeItem = {
  id: number;
  name: string;
  code?: string;
  slug?: string;
  isActive?: boolean;
  parentCategoryId?: number | null;
};

type PackageTypeResponse = {
  items?: PackageTypeItem[];
  data?: { items?: PackageTypeItem[] };
};

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeServiceSlug(value: string): string {
  return toSlug(value);
}

export function getPackageTypeSlug(item: PackageTypeItem): string {
  return normalizeServiceSlug(item.slug || item.name || '');
}

export async function fetchPackageTypes(): Promise<PackageTypeItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/master/packagecategories?page=1&pageSize=200`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as PackageTypeResponse;
    const rows = Array.isArray(json.items) ? json.items : Array.isArray(json.data?.items) ? json.data.items : [];
    return rows.filter((x) => x && x.name && (x.isActive ?? true));
  } catch {
    return [];
  }
}
