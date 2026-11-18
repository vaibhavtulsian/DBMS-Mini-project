import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('b2b_auth_token')?.value;

  // Public paths
  if (
    pathname === '/login' ||
    pathname === '/' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // If no token exists on protected routes
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload without external heavy library in edge middleware
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedJson = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

    // Check expiration
    if (decodedJson.exp && Date.now() >= decodedJson.exp * 1000) {
      throw new Error('Token expired');
    }

    const userRole = decodedJson.role;

    // Role-based route boundary checks
    if (pathname.startsWith('/admin') && userRole !== 'DISTRIBUTOR') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/retailer') && userRole !== 'RETAILER') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Retailer role required' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('b2b_auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
