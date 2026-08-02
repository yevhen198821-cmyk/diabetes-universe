'use client';

import type { PlatformFormatter } from '@diabetes-universe/formatting';

import { usePlatformRuntime } from './use-platform-runtime';

/**
 * Returns the platform formatter from the current `PlatformRuntime`.
 */
export function useFormatter(): PlatformFormatter {
  return usePlatformRuntime().formatter;
}
