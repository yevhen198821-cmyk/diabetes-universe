'use client';

import type { PlatformRuntime } from '@diabetes-universe/platform';

import { useRequiredPlatformRuntime } from './use-required-platform-runtime';

/**
 * Returns the immutable `PlatformRuntime` supplied by `PlatformProvider`.
 */
export function usePlatformRuntime(): PlatformRuntime {
  return useRequiredPlatformRuntime();
}
