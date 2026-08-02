import type {
  LocaleRegistryLoader,
  TranslationBundleLoader,
} from '../contracts';
import type { FallbackPolicy, LocaleContext } from '../contracts';

/**
 * Dependencies required to construct a localization platform instance.
 *
 * Resource origin is abstracted behind loader contracts. The platform does not
 * know whether bundles come from memory, build artifacts, or remote storage.
 */
export interface LocalizationPlatformCreateInput {
  readonly localeContext: LocaleContext;
  readonly fallbackPolicy: FallbackPolicy;
  readonly bundleLoader: TranslationBundleLoader;
  readonly localeRegistryLoader: LocaleRegistryLoader;
}
