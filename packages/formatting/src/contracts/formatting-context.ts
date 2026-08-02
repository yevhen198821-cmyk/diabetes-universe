/**
 * Immutable runtime context describing the active locale formatting state.
 *
 * Formatting and localization are neighboring presentation subsystems. This
 * contract carries value-formatting dimensions only and does not derive time
 * zone from locale.
 */
export interface FormattingContext {
  readonly locale: string;
  readonly timeZone: string;
  readonly hourCycle?: 'h12' | 'h23';
  readonly numberingSystem?: string;
  readonly currency?: string;
}
