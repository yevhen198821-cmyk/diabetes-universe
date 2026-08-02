import type { FallbackPolicy, LocaleContext } from '../contracts';
import type { LocalizationService } from './localization-service';

/**
 * Public localization platform entry point.
 *
 * Exposes runtime operations and the immutable platform state snapshot used to
 * create the instance.
 */
export interface LocalizationPlatform extends LocalizationService {
  readonly localeContext: LocaleContext;
  readonly fallbackPolicy: FallbackPolicy;
}
