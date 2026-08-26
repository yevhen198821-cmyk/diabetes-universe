import {
  convertGlucoseMmolPerLToMgPerDl,
  mapGlucoseDisplayUnitToDisplaySymbol,
  type GlucoseDisplayUnit,
} from '@diabetes-universe/medical-domain';

export function formatGlucoseValueForDisplay(
  mmolPerL: number,
  displayUnit: GlucoseDisplayUnit,
): string {
  if (displayUnit === 'mg_per_dl') {
    return String(Math.round(convertGlucoseMmolPerLToMgPerDl(mmolPerL)));
  }

  const rounded = Math.round(mmolPerL * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toFixed(1)
    : rounded.toFixed(1).replace(/\.0$/, '.0');
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
  if (displayUnit === 'mg_per_dl') {
    return String(Math.round(convertGlucoseMmolPerLToMgPerDl(mmolPerL)));
  }

  const rounded = Math.round(mmolPerL * 10) / 10;
  return rounded.toFixed(1);
}
