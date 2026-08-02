import type { PlatformRuntime } from '../contracts/platform-runtime';
import type { PlatformRuntimeCreateInput } from '../contracts/platform-runtime-create-input';
import { PlatformRuntimeImpl } from './platform-runtime-impl';

/**
 * Assembles a `PlatformRuntime` from dependency-injected platform services.
 *
 * Upstream environment-specific Composition Root wiring is responsible for
 * creating adapters and platform services. This factory only binds the injected
 * instances into an immutable runtime surface.
 */
export function createPlatformRuntime(
  input: PlatformRuntimeCreateInput,
): PlatformRuntime {
  return new PlatformRuntimeImpl(input);
}
