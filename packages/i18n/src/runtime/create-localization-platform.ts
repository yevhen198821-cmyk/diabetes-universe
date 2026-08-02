import type { LocaleRegistry } from '../registry';
import type { LocalizationPlatform } from './localization-platform';
import type { LocalizationPlatformCreateInput } from './localization-platform-create-input';

import { LocalizationPlatformImpl } from './localization-platform-impl';

export type createLocalizationPlatform = (
  input: LocalizationPlatformCreateInput,
) => LocalizationPlatform;

export function createLocalizationPlatform(
  input: LocalizationPlatformCreateInput,
): LocalizationPlatform {
  return new LocalizationPlatformImpl(input);
}

/**
 * Test-only factory helper with a pre-resolved locale registry snapshot.
 *
 * Not part of the public package API.
 */
export function createLocalizationPlatformWithRegistry(
  input: LocalizationPlatformCreateInput,
  registry: LocaleRegistry,
): LocalizationPlatform {
  return new LocalizationPlatformImpl(input, registry);
}
