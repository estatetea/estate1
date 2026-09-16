import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function apiBaseUrl() {
  return (process.env.BREW_API_BASE_URL || '').trim().replace(/\/$/, '');
}

async function proxy(token, method, request) {
  const base = apiBaseUrl();
  if (!base) {
    return NextResponse.json(
      { detail: 'Sample service is temporarily unavailable.' },
      { status: 503 }
    );
  }

  const options = {
    method,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  };

  if (method === 'POST') {
    options.headers['Content-Type'] = 'application/json';
    options.body = await request.text();
  }

  try {
    const upstream = await fetch(`${base}/sample-details/${encodeURIComponent(token)}`, options);
    const text = await upstream.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { detail: upstream.ok ? 'Unexpected response from sample service.' : 'Sample service request failed.' };
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: 'Sample service is temporarily unavailable.' },
      { status: 503 }
    );
  }
}

export async function GET(request, { params }) {
  const { token } = await params;
  return proxy(token, 'GET', request);
}

export async function POST(request, { params }) {
  const { token } = await params;
  return proxy(token, 'POST', request);
}
