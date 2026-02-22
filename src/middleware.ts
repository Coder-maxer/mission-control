import { NextRequest, NextResponse } from 'next/server';

const MONITOR_USER = process.env.MONITOR_USER;
const MONITOR_PASSWORD = process.env.MONITOR_PASSWORD;
const MC_API_TOKEN = process.env.MC_API_TOKEN;

function checkBasicAuth(request: NextRequest): NextResponse | null {
  if (!MONITOR_USER || !MONITOR_PASSWORD) return null;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Mission Control Monitor"' },
    });
  }

  const decoded = atob(authHeader.slice(6));
  const [user, pass] = decoded.split(':');
  if (user !== MONITOR_USER || pass !== MONITOR_PASSWORD) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Mission Control Monitor"' },
    });
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /monitor pages and /api/monitor endpoints with Basic Auth
  if (pathname.startsWith('/monitor') || pathname.startsWith('/api/monitor')) {
    const authResponse = checkBasicAuth(request);
    if (authResponse) return authResponse;
    return NextResponse.next();
  }

  // SSE stream: allow token as query param or Basic Auth
  if (pathname === '/api/events/stream') {
    if (MC_API_TOKEN) {
      const queryToken = request.nextUrl.searchParams.get('token');
      if (queryToken && queryToken === MC_API_TOKEN) {
        return NextResponse.next();
      }
    }
    const authResponse = checkBasicAuth(request);
    if (authResponse) return authResponse;
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/monitor/:path*', '/api/:path*'],
};
