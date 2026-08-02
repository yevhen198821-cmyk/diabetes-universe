import type { PlatformRuntime } from './platform-runtime';
import type { PlatformRuntimeCreateInput } from './platform-runtime-create-input';

/**
 * Canonical platform runtime entry point type.
 */
export type createPlatformRuntime = (
  input: PlatformRuntimeCreateInput,
) => PlatformRuntime;

/**
 * Factory contract for creating platform runtime instances.
 */
export interface PlatformRuntimeFactory {
  readonly createPlatformRuntime: createPlatformRuntime;
}
