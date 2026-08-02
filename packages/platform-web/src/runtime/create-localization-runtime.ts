import { createLocalizationPlatform } from '@diabetes-universe/i18n';
import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import {
  InMemoryLocaleRegistryLoader,
  InMemoryTranslationBundleLoader,
} from '@diabetes-universe/i18n-locales';
import type { WebPlatformConfig } from '../contracts/web-platform-config';

export type LocalizationRuntimeArtifacts = {
  readonly localization: LocalizationPlatform;
  readonly localeRegistryLoader: InMemoryLocaleRegistryLoader;
};

/**
 * Creates Localization Infrastructure Adapters and Localization Platform.
 */
export function createLocalizationRuntime(
  config: WebPlatformConfig,
): LocalizationRuntimeArtifacts {
  const bundleLoader = new InMemoryTranslationBundleLoader(
    config.fallbackPolicy,
  );
  const localeRegistryLoader = new InMemoryLocaleRegistryLoader();

  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader,
    localeRegistryLoader,
  });

  return {
    localization,
    localeRegistryLoader,
  };
}
