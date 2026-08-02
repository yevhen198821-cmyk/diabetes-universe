import type {
  LocaleRegistry,
  LocaleRegistryLoader,
} from '@diabetes-universe/i18n';

import { buildLocaleRegistryFromMetadata } from './build-locale-registry';

/**
 * In-memory locale registry loader backed by @diabetes-universe/locales metadata.
 */
export class InMemoryLocaleRegistryLoader implements LocaleRegistryLoader {
  async load(): Promise<LocaleRegistry> {
    return buildLocaleRegistryFromMetadata();
  }
}
