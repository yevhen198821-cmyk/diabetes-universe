import { createLocalizationPlatformWithRegistry } from '../create-localization-platform.ts';

/**
 * Minimal Composition Root wiring for runtime tests only.
 */
export async function createReadyLocalizationPlatform(input) {
  const registry = await input.localeRegistryLoader.load();
  const platform = createLocalizationPlatformWithRegistry(input, registry);

  const namespaces = registry.namespaces ?? [];
  const locales = uniqueLocales([
    input.localeContext.locale,
    ...input.fallbackPolicy.localeFallbackChain,
    registry.platformDefaultLocale,
  ]);

  for (const locale of locales) {
    for (const namespace of namespaces) {
      await platform.getBundle({ locale, namespace });
    }
  }

  return platform;
}

function uniqueLocales(locales) {
  return [...new Set(locales)];
}
