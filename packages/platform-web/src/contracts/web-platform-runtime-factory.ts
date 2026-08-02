import type { PlatformRuntime } from '@diabetes-universe/platform';
import type { WebPlatformConfig } from './web-platform-config';

/**
 * Factory contract for creating Web platform runtime instances.
 */
export interface WebPlatformRuntimeFactory {
  readonly createWebPlatformRuntime: (
    config: WebPlatformConfig,
  ) => Promise<PlatformRuntime>;
}
