import { API_BASE_URL, getAuthToken } from '@/lib/api-client';

export function openMembershipExport(report: string, format: 'csv' | 'xlsx' | 'pdf') {
  const url = `${API_BASE_URL}/api/Membership/admin/export/${encodeURIComponent(report)}?format=${format}`;
  const token = getAuthToken();
  void fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    .then((r) => {
      if (!r.ok) throw new Error(`Export gagal (${r.status})`);
      return r.blob();
    })
    .then((blob) => {
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${report}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    });
}
