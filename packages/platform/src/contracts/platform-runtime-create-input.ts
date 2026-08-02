import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type { PlatformFormatter } from '@diabetes-universe/formatting';

/**
 * Dependency-injected inputs for assembling `PlatformRuntime`.
 *
 * A future environment-specific Composition Root prepares upstream platform
 * services and passes them here. This package does not create Localization or
 * Formatting runtime instances.
 */
export interface PlatformRuntimeCreateInput {
  readonly localization: LocalizationPlatform;
  readonly formatter: PlatformFormatter;
}
