import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

import { AUTH_COOKIE_PREFIX } from '@diabetes-universe/identity';

import {
  SECURITY_HEADER_NAMES,
  SECURITY_NONCE_HEADER,
  buildContentSecurityPolicy,
  resolveContentSecurityPolicyRuntime,
} from './lib/security/security-headers';

const AUTH_ENTRY_PATH = '/auth';

function createRequestNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

function attachContentSecurityPolicy(
  response: NextResponse,
  nonce: string,
): NextResponse {
  response.headers.set(
    SECURITY_HEADER_NAMES.contentSecurityPolicy,
    buildContentSecurityPolicy({
      nonce,
      ...resolveContentSecurityPolicyRuntime(),
    }),
  );
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  });
  const nonce = createRequestNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SECURITY_NONCE_HEADER, nonce);

  if (pathname.startsWith('/account') && !sessionCookie) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = AUTH_ENTRY_PATH;
    signInUrl.searchParams.set('callback', pathname);
    return attachContentSecurityPolicy(NextResponse.redirect(signInUrl), nonce);
  }

  return attachContentSecurityPolicy(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    nonce,
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|webmanifest)$).*)',
  ],
};
