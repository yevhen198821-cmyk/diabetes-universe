'use client';

import type { LocalizationPlatform } from '@diabetes-universe/i18n';

import { usePlatformRuntime } from './use-platform-runtime';

/**
 * Returns the localization platform from the current `PlatformRuntime`.
 */
export function useLocalization(): LocalizationPlatform {
  return usePlatformRuntime().localization;
}
