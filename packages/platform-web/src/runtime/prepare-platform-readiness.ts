import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type { LocaleCode, Namespace } from '@diabetes-universe/i18n';
import type { WebPlatformPreloadConfig } from '../contracts/web-platform-config';

function dedupeSorted<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/**
 * Ensures Platform Readiness through registry readiness and selective bundle
 * preload via the public Localization Platform API.
 */
export async function preparePlatformReadiness(
  localization: LocalizationPlatform,
  preload: WebPlatformPreloadConfig,
): Promise<void> {
  await localization.whenReady();

  const locales = dedupeSorted(preload.locales);
  const namespaces = dedupeSorted(preload.namespaces);

  for (const locale of locales) {
    for (const namespace of namespaces) {
      await localization.getBundle({
        locale: locale as LocaleCode,
        namespace: namespace as Namespace,
      });
    }
  }
}
