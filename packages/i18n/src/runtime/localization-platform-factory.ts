import type { LocalizationPlatform } from './localization-platform';
import type { LocalizationPlatformCreateInput } from './localization-platform-create-input';

/**
 * Canonical localization platform entry point type.
 */
export type createLocalizationPlatform = (
  input: LocalizationPlatformCreateInput,
) => LocalizationPlatform;

/**
 * @deprecated Use {@link createLocalizationPlatform} as the canonical entry point name.
 */
export type CreateLocalizationPlatform = createLocalizationPlatform;

/**
 * Factory contract for creating localization platform instances.
 */
export interface LocalizationPlatformFactory {
  readonly createLocalizationPlatform: createLocalizationPlatform;
}
