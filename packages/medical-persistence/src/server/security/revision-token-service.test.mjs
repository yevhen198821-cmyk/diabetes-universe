import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';

import {
  createRevisionTokenService,
  InvalidRevisionTokenError,
  MalformedRevisionTokenError,
} from './revision-token-service.ts';

const service = createRevisionTokenService('test-secret-key-material');

test('revision token round trip for same resource and revision', () => {
  const token = service.createToken('11111111-1111-4111-8111-111111111111', 3);
  const parsed = service.verifyAndParse(
    token,
    '11111111-1111-4111-8111-111111111111',
  );

  assert.equal(parsed.revision, 3);
  assert.match(token, /^v1\./);
});

test('tampered revision token is rejected', () => {
  const token = service.createToken('11111111-1111-4111-8111-111111111111', 2);
  const payload = Buffer.from(token.slice('v1.'.length), 'base64url');
  payload[payload.length - 1] ^= 0xff;
  const tampered = `v1.${payload.toString('base64url')}`;

  assert.throws(
    () =>
      service.verifyAndParse(tampered, '11111111-1111-4111-8111-111111111111'),
    InvalidRevisionTokenError,
  );
});

test('token for resource A is invalid when verified for resource B', () => {
  const token = service.createToken('11111111-1111-4111-8111-111111111111', 2);

  assert.throws(
    () => service.verifyAndParse(token, '22222222-2222-4222-8222-222222222222'),
    InvalidRevisionTokenError,
  );
});

test('different revisions produce different tokens', () => {
  const resourceId = '11111111-1111-4111-8111-111111111111';
  const tokenOne = service.createToken(resourceId, 1);
  const tokenTwo = service.createToken(resourceId, 2);

  assert.notEqual(tokenOne, tokenTwo);
});

test('malformed revision token is rejected', () => {
  assert.throws(
    () =>
      service.verifyAndParse(
        'not-a-token',
        '11111111-1111-4111-8111-111111111111',
      ),
    MalformedRevisionTokenError,
  );
});
