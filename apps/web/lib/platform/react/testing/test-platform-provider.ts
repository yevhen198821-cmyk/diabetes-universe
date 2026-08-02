'use client';

import type { PlatformRuntime } from '@diabetes-universe/platform';
import { createElement, type ReactNode } from 'react';

import { PlatformProvider } from '../platform-provider';

export interface TestPlatformProviderProps {
  readonly runtime: PlatformRuntime;
  readonly children: ReactNode;
}

/**
 * Test helper that wraps children with `PlatformProvider`.
 */
export function TestPlatformProvider({
  runtime,
  children,
}: TestPlatformProviderProps) {
  // eslint-disable-next-line react/no-children-prop -- createElement props mirror component props in tests
  return createElement(PlatformProvider, { runtime, children });
}
