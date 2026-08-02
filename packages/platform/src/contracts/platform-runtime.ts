import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type { PlatformFormatter } from '@diabetes-universe/formatting';

/**
 * Immutable assembled platform surface consumed by the Application layer.
 *
 * Created by `createPlatformRuntime()` after upstream Composition Root wiring
 * has prepared the injected platform services.
 */
export interface PlatformRuntime {
  readonly localization: LocalizationPlatform;
  readonly formatter: PlatformFormatter;
}
