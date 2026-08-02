import { createPlatformRuntime } from '@diabetes-universe/platform';
import type { PlatformRuntime } from '@diabetes-universe/platform';
import type { WebPlatformConfig } from '../contracts/web-platform-config';
import { createFormattingRuntime } from './create-formatting-runtime';
import { createLocalizationRuntime } from './create-localization-runtime';
import { preparePlatformReadiness } from './prepare-platform-readiness';
import { assertValidWebPlatformConfig } from './validation';

/**
 * Environment-specific Web Composition Root entry point.
 *
 * Creates adapters, platform services, ensures Platform Readiness, and returns
 * an isolated `PlatformRuntime` aggregate.
 */
export async function createWebPlatformRuntime(
  config: WebPlatformConfig,
): Promise<PlatformRuntime> {
  assertValidWebPlatformConfig(config);

  const { localization } = createLocalizationRuntime(config);
  const formatter = createFormattingRuntime(config.formattingContext);

  await preparePlatformReadiness(localization, config.preload);

  return createPlatformRuntime({
    localization,
    formatter,
  });
}
