import { NextResponse } from 'next/server';
import { getMemoryAnalyticsStore } from '@/server/analytics/memory-analytics';

export async function GET() {
  const store = getMemoryAnalyticsStore();
  const data = store.getSnapshot();
  return NextResponse.json({ ok: true, data });
}

