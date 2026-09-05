/**
 * Options for time-only presentation formatting.
 *
 * Use `timeStyle` for preset presentation, or the field options for a
 * narrow time shape. Do not mix `timeStyle` with field options.
 */
export interface TimeFormatOptions {
  readonly timeStyle?: 'full' | 'long' | 'medium' | 'short';
  readonly hour?: 'numeric' | '2-digit';
  readonly minute?: 'numeric' | '2-digit';
  readonly second?: 'numeric' | '2-digit';
  readonly hour12?: boolean;
}
