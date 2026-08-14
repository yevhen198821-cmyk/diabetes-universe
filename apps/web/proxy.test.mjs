import assert from 'node:assert/strict';
import test from 'node:test';

import { NextRequest } from 'next/server';

import { proxy } from './proxy.ts';

test('proxy redirects unauthenticated account access to auth with callback', () => {
  const request = new NextRequest('http://127.0.0.1:3010/account');
  const response = proxy(request);

  assert.equal(response.status, 307);
  assert.match(
    response.headers.get('location') ?? '',
    /\/auth\?callback=%2Faccount$/,
  );
});

test('proxy allows auth entry when a stale session cookie is still present', () => {
  const request = new NextRequest('http://127.0.0.1:3010/auth', {
    headers: {
      cookie: 'du-auth.session_token=stale-session-token',
    },
  });
  const response = proxy(request);

  assert.equal(response.status, 200);
});
