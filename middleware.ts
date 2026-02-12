import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Protect the root path - redirect to login if not authenticated
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect API routes
  if (pathname.startsWith('/api/workspaces') || pathname.startsWith('/api/articles')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  // Redirect authenticated users away from login/register
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/login',
    '/register',
  ],
};
