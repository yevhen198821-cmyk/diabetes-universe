/**
 * Manual insulin dose input policy shared by Quick Add and Timeline Edit.
 *
 * This is the web manual-input boundary: syntax, a two-fraction-digit limit,
 * and a UI typo ceiling. It is not a clinical rule. `100` is typo protection
 * only — it is not a safe, recommended, or therapeutic maximum, and the
 * canonical domain transport bound stays at 500.
 *
 * The parsed number is returned exactly as entered. No rounding is applied.
 */
export const INSULIN_MANUAL_DOSE_UI_MAXIMUM = 100;

/** Manual entry accepts at most two fractional digits, dot or comma. */
export const INSULIN_MANUAL_DOSE_MAXIMUM_FRACTION_DIGITS = 2;

const MANUAL_DOSE_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export function parseInsulinManualDoseInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (!MANUAL_DOSE_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed.replace(',', '.'));

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > INSULIN_MANUAL_DOSE_UI_MAXIMUM
  ) {
    return null;
  }

  return value;
}
