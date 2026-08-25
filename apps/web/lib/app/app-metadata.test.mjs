import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAppBuildMetadata } from './app-metadata.ts';

test('resolveAppBuildMetadata hides placeholder version and exposes short commit', () => {
  const previousVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const previousCommit = process.env.VERCEL_GIT_COMMIT_SHA;

  process.env.NEXT_PUBLIC_APP_VERSION = '0.0.0';
  process.env.VERCEL_GIT_COMMIT_SHA = 'abcdef1234567890';

  try {
    assert.deepEqual(resolveAppBuildMetadata(), {
      buildLabel: 'abcdef1',
      version: null,
    });
  } finally {
    if (previousVersion === undefined) {
      delete process.env.NEXT_PUBLIC_APP_VERSION;
    } else {
      process.env.NEXT_PUBLIC_APP_VERSION = previousVersion;
    }

    if (previousCommit === undefined) {
      delete process.env.VERCEL_GIT_COMMIT_SHA;
    } else {
      process.env.VERCEL_GIT_COMMIT_SHA = previousCommit;
    }
  }
});

test('resolveAppBuildMetadata returns release version when configured', () => {
  const previousVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  process.env.NEXT_PUBLIC_APP_VERSION = '1.4.2';

  try {
    assert.equal(resolveAppBuildMetadata().version, '1.4.2');
  } finally {
    if (previousVersion === undefined) {
      delete process.env.NEXT_PUBLIC_APP_VERSION;
    } else {
      process.env.NEXT_PUBLIC_APP_VERSION = previousVersion;
    }
  }
});
