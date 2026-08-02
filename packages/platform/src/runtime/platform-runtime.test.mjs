import assert from 'node:assert/strict';
import test from 'node:test';

import { createPlatformRuntime } from './create-platform-runtime.ts';
import { createStubPlatformRuntimeInput } from '../testing/create-stub-platform-runtime-input.mjs';

test('createPlatformRuntime returns a PlatformRuntime with injected services', () => {
  const input = createStubPlatformRuntimeInput();
  const runtime = createPlatformRuntime(input);

  assert.equal(runtime.localization, input.localization);
  assert.equal(runtime.formatter, input.formatter);
  assert.equal(typeof runtime.localization.translate, 'function');
  assert.equal(typeof runtime.formatter.formatDate, 'function');
});

test('createPlatformRuntime does not mutate the provided input', () => {
  const input = createStubPlatformRuntimeInput();
  const snapshot = {
    localization: input.localization,
    formatter: input.formatter,
  };

  createPlatformRuntime(input);

  assert.equal(input.localization, snapshot.localization);
  assert.equal(input.formatter, snapshot.formatter);
});

test('createPlatformRuntime rejects a missing localization service', () => {
  const input = createStubPlatformRuntimeInput();

  assert.throws(
    () =>
      createPlatformRuntime({
        ...input,
        localization: undefined,
      }),
    /requires an injected localization platform service/,
  );
});

test('createPlatformRuntime rejects a missing formatter service', () => {
  const input = createStubPlatformRuntimeInput();

  assert.throws(
    () =>
      createPlatformRuntime({
        ...input,
        formatter: undefined,
      }),
    /requires an injected formatter platform service/,
  );
});

test('createPlatformRuntime rejects a null localization service', () => {
  const input = createStubPlatformRuntimeInput();

  assert.throws(
    () =>
      createPlatformRuntime({
        ...input,
        localization: null,
      }),
    /requires an injected localization platform service/,
  );
});

test('createPlatformRuntime rejects a null formatter service', () => {
  const input = createStubPlatformRuntimeInput();

  assert.throws(
    () =>
      createPlatformRuntime({
        ...input,
        formatter: null,
      }),
    /requires an injected formatter platform service/,
  );
});
