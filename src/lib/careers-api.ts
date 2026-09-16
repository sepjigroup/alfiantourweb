import { API_BASE_URL, apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client';

export type CareerJobItem = {
  id: number;
  slug: string;
  title: string;
  department?: string | null;
  location?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  salaryRange?: string | null;
  summary?: string | null;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
  coverImageUrl?: string | null;
  applyUrl?: string | null;
  applyEmail?: string | null;
  publishedAt?: string | null;
  expiredAt?: string | null;
  status?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type PagedResp<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ApiWrap<T> = { data?: T };

export function toCareerAssetUrl(raw?: string | null): string {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return val;
  return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
}

export async function fetchPublicCareers(page = 1, pageSize = 20, search = ''): Promise<PagedResp<CareerJobItem>> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) q.set('search', search.trim());
  const res = await fetch(`${API_BASE_URL}/api/careers/public?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<PagedResp<CareerJobItem>>;
}

export async function fetchPublicCareerDetail(slugOrId: string): Promise<CareerJobItem> {
  const res = await fetch(`${API_BASE_URL}/api/careers/public/${encodeURIComponent(slugOrId)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<CareerJobItem>;
}

export async function fetchAdminCareers(page = 1, pageSize = 50, search = '', status = ''): Promise<PagedResp<CareerJobItem>> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) q.set('search', search.trim());
  if (status.trim()) q.set('status', status.trim());
  const json = await apiGet<ApiWrap<PagedResp<CareerJobItem>>>(`/api/careers/admin?${q.toString()}`);
  return json.data ?? { items: [], page, pageSize, totalCount: 0, totalPages: 1 };
}

export async function createCareer(payload: Record<string, unknown>) {
  return apiPost('/api/careers/admin', payload);
}

export async function updateCareer(id: number, payload: Record<string, unknown>) {
  return apiPut(`/api/careers/admin/${id}`, payload);
}

export async function deleteCareer(id: number) {
  return apiDelete(`/api/careers/admin/${id}`);
}

export type CareerApplicantItem = {
  id: number;
  careerJobId: number;
  jobTitle: string;
  fullName: string;
  gender: string;
  whatsAppNumber: string;
  email: string;
  age: number;
  lastEducation: string;
  cvUrl: string;
  motivation?: string | null;
  goal?: string | null;
  isWillingToConsiderOtherPositions: boolean;
  whyInterested?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  hasOwnVehicle: boolean;
  infoSource?: string | null;
  startDate?: string | null;
  consentKualifikasi: boolean;
  consentKebenaranData: boolean;
  createdAt: string;
};

export type ApplicantStats = {
  totalApplicants: number;
  byJob: Array<{ jobId: number; jobTitle: string; count: number }>;
  byEducation: Array<{ education: string; count: number }>;
};

export async function submitCareerApplication(slugOrId: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/api/careers/public/${encodeURIComponent(slugOrId)}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(json?.message || `Gagal mengirim lamaran (${res.status})`));
  return json;
}

export async function fetchAdminApplicants(page = 1, pageSize = 20, search = '', jobId?: number): Promise<PagedResp<CareerApplicantItem>> {
  const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) q.set('search', search.trim());
  if (jobId) q.set('jobId', String(jobId));
  const json = await apiGet<ApiWrap<PagedResp<CareerApplicantItem>>>(`/api/careers/admin/applicants?${q.toString()}`);
  return json.data ?? { items: [], page, pageSize, totalCount: 0, totalPages: 1 };
}

export async function fetchAdminApplicantStats(): Promise<ApplicantStats> {
  const json = await apiGet<ApiWrap<ApplicantStats>>('/api/careers/admin/applicants/stats');
  return json.data ?? { totalApplicants: 0, byJob: [], byEducation: [] };
}
