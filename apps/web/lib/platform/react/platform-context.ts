import type { PlatformRuntime } from '@diabetes-universe/platform';
import { createContext } from 'react';

export const PlatformRuntimeContext = createContext<PlatformRuntime | null>(
  null,
);
