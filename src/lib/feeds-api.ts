import { API_BASE_URL, apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';

export type FeedPostItem = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  likes?: number;
  comments?: number;
  shares?: number;
  tags?: string | null;
  isActive?: boolean;
};

export type FeedCommentItem = {
  id: number | string;
  name?: string | null;
  text?: string | null;
  createdAt?: string | null;
};

type PagedResp<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ApiWrap<T> = { data?: T };

export async function fetchPublicFeeds(page = 1, pageSize = 12, search = ''): Promise<PagedResp<FeedPostItem>> {
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search.trim()) q.set('search', search.trim());
  const res = await fetch(`${API_BASE_URL}/api/feeds/public?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<PagedResp<FeedPostItem>>;
}

export async function fetchPublicFeedDetail(slugOrId: string): Promise<FeedPostItem> {
  const res = await fetch(`${API_BASE_URL}/api/feeds/public/${encodeURIComponent(slugOrId)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<FeedPostItem>;
}

export async function fetchPublicFeedComments(slugOrId: string, page = 1, pageSize = 20): Promise<PagedResp<FeedCommentItem>> {
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const res = await fetch(`${API_BASE_URL}/api/feeds/public/${encodeURIComponent(slugOrId)}/comments?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<PagedResp<FeedCommentItem>>;
}

export async function createPublicFeedComment(
  slugOrId: string,
  payload: { name: string; commentText: string; email?: string | null }
): Promise<FeedCommentItem> {
  const json = await apiPost<{ data?: FeedCommentItem }>(`/api/feeds/public/${encodeURIComponent(slugOrId)}/comments`, payload);
  return (json as { data?: FeedCommentItem })?.data ?? (json as unknown as FeedCommentItem);
}

export async function deleteAdminFeedComment(feedId: number, commentId: number) {
  return apiDelete(`/api/feeds/admin/${feedId}/comments/${commentId}`);
}

export async function fetchAdminFeeds(page = 1, pageSize = 20, search = ''): Promise<PagedResp<FeedPostItem>> {
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search.trim()) q.set('search', search.trim());
  const json = await apiGet<ApiWrap<PagedResp<FeedPostItem>>>(`/api/feeds/admin?${q.toString()}`);
  return json.data ?? { items: [], page, pageSize, totalCount: 0, totalPages: 1 };
}

export async function createFeed(payload: Record<string, unknown>) {
  return apiPost('/api/feeds/admin', payload);
}

export async function bulkCreateFeeds(payload: Array<Record<string, unknown>>) {
  return apiPost('/api/feeds/admin/bulk', payload);
}

export async function updateFeed(id: number, payload: Record<string, unknown>) {
  return apiPut(`/api/feeds/admin/${id}`, payload);
}

export async function deleteFeed(id: number) {
  return apiDelete(`/api/feeds/admin/${id}`);
}
