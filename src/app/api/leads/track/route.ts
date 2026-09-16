import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    return NextResponse.json(
      { ok: false, message: 'NEXT_PUBLIC_API_URL belum di-set, tracking dilewati' },
      { status: 202 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Body JSON tidak valid' }, { status: 400 });
  }

  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const targetUrl = `${apiBaseUrl.replace(/\/+$/, '')}/api/leads/track`;

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Upstream tracking tidak tersedia, event dilewati' },
      { status: 202 },
    );
  }
}
