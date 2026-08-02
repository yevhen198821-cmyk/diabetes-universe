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

  /**
   * Resolves when the runtime locale registry has been loaded into the internal
   * cache. Rejects when registry loading fails. Repeated calls share the same
   * lifecycle promise and do not trigger another registry load.
   */
  whenReady(): Promise<void>;
}
