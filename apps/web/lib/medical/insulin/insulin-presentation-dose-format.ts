/**
 * Intl fraction-digit policy for insulin dose presentation.
 *
 * Owned by the web presentation adapter. Preserves stored finite precision
 * without rounding. Manual entry may use at most two fractional digits
 * (Wave 4C); device/import values with more digits are displayed as stored
 * up to this bound.
 */
export const INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS = {
  maximumFractionDigits: 20,
  minimumFractionDigits: 0,
} as const;
