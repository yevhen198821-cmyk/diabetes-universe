import assert from 'node:assert/strict';
import test from 'node:test';

import { MEDICAL_MAX_REQUEST_BYTES } from './constants.ts';
import { readBoundedRequestBody } from './read-bounded-request-body.ts';

function streamBody(content) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function streamRequest(body, headers = {}) {
  return new Request('http://localhost/', {
    method: 'POST',
    duplex: 'half',
    headers,
    body: streamBody(body),
  });
}

test('rejects oversized Content-Length before reading body', async () => {
  await assert.rejects(
    () =>
      readBoundedRequestBody(
        new Request('http://localhost/', {
          method: 'POST',
          headers: {
            'content-length': String(MEDICAL_MAX_REQUEST_BYTES + 1),
          },
          body: '{}',
        }),
      ),
    (error) =>
      error instanceof Error && error.message === 'Request body is too large.',
  );
});

test('rejects ASCII payload over byte limit during streaming', async () => {
  const oversized = 'a'.repeat(MEDICAL_MAX_REQUEST_BYTES + 1);

  await assert.rejects(
    () => readBoundedRequestBody(streamRequest(oversized)),
    (error) =>
      error instanceof Error && error.message === 'Request body is too large.',
  );
});

test('rejects multibyte UTF-8 payload over byte limit', async () => {
  const emoji = '🙂';
  const bytesPerEmoji = Buffer.byteLength(emoji, 'utf8');
  const count = Math.ceil((MEDICAL_MAX_REQUEST_BYTES + 1) / bytesPerEmoji);
  const oversized = emoji.repeat(count);

  await assert.rejects(
    () => readBoundedRequestBody(streamRequest(oversized)),
    (error) =>
      error instanceof Error && error.message === 'Request body is too large.',
  );
});

test('rejects misleading Content-Length when actual body exceeds limit', async () => {
  const actualBody = 'a'.repeat(MEDICAL_MAX_REQUEST_BYTES + 10);

  await assert.rejects(
    () =>
      readBoundedRequestBody(
        streamRequest(actualBody, {
          'content-length': '2',
        }),
      ),
    (error) =>
      error instanceof Error && error.message === 'Request body is too large.',
  );
});

test('accepts payload within byte limit', async () => {
  const body = '{"event":{"ok":true}}';
  const result = await readBoundedRequestBody(streamRequest(body));
  assert.equal(result, body);
});
