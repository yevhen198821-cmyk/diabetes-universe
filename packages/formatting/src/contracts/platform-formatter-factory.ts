import type { FormattingContext } from './formatting-context';
import type { PlatformFormatter } from './platform-formatter';

/**
 * Factory contract for creating platform formatter instances.
 *
 * Concrete implementations are created by Composition Root via Infrastructure
 * Adapters. The canonical {@link createPlatformFormatter} function implements
 * this contract.
 */
export interface PlatformFormatterFactory {
  readonly createPlatformFormatter: (
    context: FormattingContext,
  ) => PlatformFormatter;
}
