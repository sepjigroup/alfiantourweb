import { NextRequest, NextResponse } from 'next/server';
import { getMemoryAnalyticsStore } from '@/server/analytics/memory-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = String(body?.sessionId ?? '').trim();
    const currentPage = String(body?.currentPage ?? '/').trim() || '/';
    if (!sessionId) {
      return NextResponse.json({ ok: false, message: 'sessionId required' }, { status: 400 });
    }

    const xff = request.headers.get('x-forwarded-for') || '';
    const ip = xff.split(',')[0]?.trim() || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const store = getMemoryAnalyticsStore();
    store.trackSession({ sessionId, currentPage, userAgent, ip });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

