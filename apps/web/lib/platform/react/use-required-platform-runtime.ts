'use client';

import type { PlatformRuntime } from '@diabetes-universe/platform';
import { useContext } from 'react';

import { PlatformRuntimeContext } from './platform-context';

const MISSING_PROVIDER_MESSAGE =
  'PlatformProvider is required to use the platform React integration.';

/**
 * Internal guard used by all platform hooks.
 */
export function useRequiredPlatformRuntime(): PlatformRuntime {
  const runtime = useContext(PlatformRuntimeContext);

  if (runtime === null) {
    throw new Error(MISSING_PROVIDER_MESSAGE);
  }

  return runtime;
}
