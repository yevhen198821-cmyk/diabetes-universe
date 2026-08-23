import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const buttonSource = readFileSync(
  fileURLToPath(new URL('./button.tsx', import.meta.url)),
  'utf8',
);

test('Button exposes primary, secondary, ghost, and destructive variants', () => {
  assert.match(buttonSource, /primary:/);
  assert.match(buttonSource, /secondary:/);
  assert.match(buttonSource, /ghost:/);
  assert.match(buttonSource, /destructive:/);
  assert.match(buttonSource, /bg-interactive-primary/);
  assert.match(buttonSource, /focus-visible:outline/);
});

test('Button enforces minimum touch target on md and icon sizes', () => {
  assert.match(buttonSource, /min-h-11/);
  assert.match(buttonSource, /size-11 min-h-11 min-w-11/);
});
