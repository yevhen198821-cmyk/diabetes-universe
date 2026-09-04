/**
 * Options for date-only presentation formatting.
 *
 * Use `dateStyle` for preset presentation, or the field options for a
 * narrow date shape. Do not mix `dateStyle` with field options.
 */
export interface DateFormatOptions {
  readonly dateStyle?: 'full' | 'long' | 'medium' | 'short';
  readonly day?: 'numeric' | '2-digit';
  readonly month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  readonly year?: 'numeric' | '2-digit';
}
