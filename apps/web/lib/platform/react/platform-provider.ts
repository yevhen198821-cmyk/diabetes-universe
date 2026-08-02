'use client';

import type { PlatformRuntime } from '@diabetes-universe/platform';
import { createElement, type ReactNode } from 'react';

import { PlatformRuntimeContext } from './platform-context';

export interface PlatformProviderProps {
  readonly runtime: PlatformRuntime;
  readonly children: ReactNode;
}

/**
 * Supplies an already assembled `PlatformRuntime` to the React tree.
 *
 * The context value is exactly the `runtime` prop reference. The provider does
 * not create, clone, transform, or persist runtime state.
 */
export function PlatformProvider({ runtime, children }: PlatformProviderProps) {
  return createElement(
    PlatformRuntimeContext.Provider,
    { value: runtime },
    children,
  );
}
