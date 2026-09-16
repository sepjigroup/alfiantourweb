import { API_BASE_URL } from '@/lib/api-client';

function pickAdsenseClient(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  const m = v.match(/ca-pub-\d{6,}/i);
  if (m?.[0]) return m[0];
  const m2 = v.match(/pub-\d{6,}/i);
  if (m2?.[0]) return m2[0].toLowerCase().startsWith('pub-') ? `ca-${m2[0]}` : '';
  return '';
}

export async function GET() {
  let publisher = 'pub-0000000000000000';
  try {
    const res = await fetch(`${API_BASE_URL}/api/BusinessInsights/settings/tracking/public`, { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as { data?: { googleAdsense?: string } };
      const client = pickAdsenseClient(String(json?.data?.googleAdsense || ''));
      if (client.startsWith('ca-pub-')) {
        publisher = client.replace(/^ca-/, '');
      }
    }
  } catch {
    // keep default publisher fallback
  }

  const content = [
    '# Alfian Tour ads.txt',
    '# Format: <ad-system-domain>, <publisher-id>, <relationship>, <cert-authority-id>',
    `google.com, ${publisher}, DIRECT, f08c47fec0942fa0`,
  ].join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
