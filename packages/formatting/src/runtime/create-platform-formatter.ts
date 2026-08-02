import type { FormattingContext } from '../contracts/formatting-context';
import type { PlatformFormatter } from '../contracts/platform-formatter';
import { PlatformFormatterImpl } from './platform-formatter-impl';
import { validateLocale, validateTimeZone } from './validation';

export function createPlatformFormatter(
  context: FormattingContext,
): PlatformFormatter {
  validateLocale(context.locale);
  validateTimeZone(context.timeZone);

  return new PlatformFormatterImpl(context);
}
