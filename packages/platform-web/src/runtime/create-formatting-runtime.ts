import { createPlatformFormatter } from '@diabetes-universe/formatting';
import type { PlatformFormatter } from '@diabetes-universe/formatting';
import type { FormattingContext } from '@diabetes-universe/formatting';

/**
 * Creates Platform Formatter from the provided formatting context.
 */
export function createFormattingRuntime(
  formattingContext: FormattingContext,
): PlatformFormatter {
  return createPlatformFormatter(formattingContext);
}
