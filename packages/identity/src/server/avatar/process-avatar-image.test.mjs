import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  detectAvatarInputMimeType,
  isAllowedAvatarInputMimeType,
} from './detect-avatar-input-mime.ts';
import { processAvatarImage } from './process-avatar-image.ts';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));
const samplePng = readFileSync(
  join(
    currentDirectory,
    '../../../../../apps/web/e2e/fixtures/profile-avatar-sample.png',
  ),
);

test('detectAvatarInputMimeType accepts png/jpeg/webp signatures', () => {
  assert.equal(detectAvatarInputMimeType(samplePng), 'image/png');
  assert.equal(isAllowedAvatarInputMimeType('image/jpeg'), true);
  assert.equal(isAllowedAvatarInputMimeType('image/svg+xml'), false);
});

test('detectAvatarInputMimeType rejects svg and text payloads', () => {
  assert.equal(
    detectAvatarInputMimeType(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    ),
    null,
  );
  assert.equal(detectAvatarInputMimeType(Buffer.from('plain-text')), null);
});

test('processAvatarImage normalizes png into webp output', async () => {
  const processed = await processAvatarImage(samplePng);

  assert.ok(processed);
  assert.equal(processed.contentType, 'image/webp');
  assert.ok(processed.byteSize > 0);
});
