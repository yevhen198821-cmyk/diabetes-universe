import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skeletonSource = readFileSync(
  fileURLToPath(new URL('./skeleton.tsx', import.meta.url)),
  'utf8',
);

test('Skeleton respects reduced motion preferences', () => {
  assert.match(skeletonSource, /motion-reduce:animate-none/);
  assert.match(skeletonSource, /bg-surface-subtle/);
});
