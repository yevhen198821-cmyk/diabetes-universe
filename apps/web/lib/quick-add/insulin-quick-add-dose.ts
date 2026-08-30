/**
 * Manual insulin dose input policy for Quick Add.
 *
 * This is the web manual-input boundary: it checks syntax, a two-fraction-digit
 * manual limit, and a UI typo ceiling. It is not a clinical rule. `100` is
 * typo protection only — it is not a safe, recommended, or therapeutic maximum,
 * and the canonical domain transport bound stays at 500.
 *
 * The parsed number is returned exactly as entered. No rounding is applied, so
 * `12.25` stays `12.25`.
 */
export const INSULIN_QUICK_ADD_UI_DOSE_MAXIMUM = 100;

/** Manual entry accepts at most two fractional digits, dot or comma. */
export const INSULIN_QUICK_ADD_MANUAL_DOSE_MAXIMUM_FRACTION_DIGITS = 2;

const MANUAL_DOSE_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export function parseInsulinQuickAddDoseInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (!MANUAL_DOSE_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed.replace(',', '.'));

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > INSULIN_QUICK_ADD_UI_DOSE_MAXIMUM
  ) {
    return null;
  }

  return value;
}
