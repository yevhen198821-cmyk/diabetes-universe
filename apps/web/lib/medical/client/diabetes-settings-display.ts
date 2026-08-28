import type { PlatformFormatter } from '@diabetes-universe/formatting';
import {
  mapGlucoseDisplayUnitToDisplaySymbol,
  toGlucoseDisplayNumericValue,
  type GlucoseDisplayUnit,
} from '@diabetes-universe/medical-domain';

const GLUCOSE_MMOL_FRACTION_DIGITS = {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
} as const;

const GLUCOSE_MG_FRACTION_DIGITS = {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
} as const;

export function formatGlucoseValueForDisplay(
  mmolPerL: number,
  displayUnit: GlucoseDisplayUnit,
): string {
  const displayValue = toGlucoseDisplayNumericValue(mmolPerL, displayUnit);

  if (displayUnit === 'mg_per_dl') {
    return String(displayValue);
  }

  return displayValue.toFixed(1);
}

export function formatGlucoseValueForLocalizedDisplay(
  formatter: PlatformFormatter,
  mmolPerL: number,
  displayUnit: GlucoseDisplayUnit,
): string {
  const displayValue = toGlucoseDisplayNumericValue(mmolPerL, displayUnit);

  if (displayUnit === 'mg_per_dl') {
    return formatter.formatNumber(displayValue, GLUCOSE_MG_FRACTION_DIGITS);
  }

  return formatter.formatNumber(displayValue, GLUCOSE_MMOL_FRACTION_DIGITS);
}

export function formatTargetRangeForDisplay(
  lowMmolPerL: number,
  highMmolPerL: number,
  displayUnit: GlucoseDisplayUnit | null,
): string {
  const unit = displayUnit ?? 'mmol_per_l';
  const symbol = mapGlucoseDisplayUnitToDisplaySymbol(unit);
  const low = formatGlucoseValueForDisplay(lowMmolPerL, unit);
  const high = formatGlucoseValueForDisplay(highMmolPerL, unit);

  return `${low}–${high} ${symbol}`;
}

export function toTargetEditorDisplayValue(
  mmolPerL: number,
  displayUnit: GlucoseDisplayUnit,
): string {
  const displayValue = toGlucoseDisplayNumericValue(mmolPerL, displayUnit);

  if (displayUnit === 'mg_per_dl') {
    return String(displayValue);
  }

  return displayValue.toFixed(1);
}
