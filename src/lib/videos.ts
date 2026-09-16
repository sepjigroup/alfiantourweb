import { API_BASE_URL, getAuthToken } from './api-client';
import type { AdminVideoItem, PublicVideoDetailResponse, PublicVideoListResponse } from '@/types/video';

export async function fetchPublicVideos(page = 1, pageSize = 12): Promise<PublicVideoListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/videos/public?page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Gagal memuat video (${res.status})`);
  }
  return res.json() as Promise<PublicVideoListResponse>;
}

export async function fetchPublicVideoDetail(slug: string): Promise<PublicVideoDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/videos/public/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Gagal memuat detail video (${res.status})`);
  }
  return res.json() as Promise<PublicVideoDetailResponse>;
}

export async function trackVideoView(slug: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/videos/public/${slug}/view`, {
    method: 'POST',
    cache: 'no-store',
  });
}

export async function fetchAdminVideos(page = 1, pageSize = 20, search = ''): Promise<{
  items: AdminVideoItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}> {
  const token = getAuthToken();
  if (!token) throw new Error('Unauthorized');
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
  });
  const res = await fetch(`${API_BASE_URL}/api/videos/admin?${q.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Gagal memuat data admin (${res.status})`);
  const json = await res.json();
  return json.data as {
    items: AdminVideoItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
