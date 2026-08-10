import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

import { AUTH_COOKIE_PREFIX } from '@diabetes-universe/identity';

const AUTH_ENTRY_PATH = '/auth';
const ACCOUNT_PATH = '/account';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  });

  if (pathname.startsWith('/account') && !sessionCookie) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = AUTH_ENTRY_PATH;
    signInUrl.searchParams.set('callback', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (
    (pathname === AUTH_ENTRY_PATH ||
      pathname.startsWith(`${AUTH_ENTRY_PATH}/`)) &&
    pathname !== '/auth/error' &&
    pathname !== '/auth/check-email' &&
    sessionCookie
  ) {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = ACCOUNT_PATH;
    accountUrl.search = '';
    return NextResponse.redirect(accountUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/auth', '/auth/check-email'],
};
