import type { HourCycle } from '../types/hour-cycle';
import type { LanguageCode, LocaleCode } from '../types';

/**
 * Immutable runtime context describing the active locale formatting state.
 *
 * Language, locale, and time zone are independent dimensions. This contract
 * does not derive time zone from language or locale.
 */
export interface LocaleContext {
  readonly language: LanguageCode;
  readonly locale: LocaleCode;
  readonly timeZone: string;
  readonly hourCycle: HourCycle;
  readonly numberingSystem?: string;
  readonly calendar?: string;
}
