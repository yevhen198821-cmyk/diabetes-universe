import {
  convertGlucoseMgPerDlToMmolPerL,
  convertGlucoseMmolPerLToMgPerDl,
  type GlucoseDisplayUnit,
} from '@diabetes-universe/medical-domain';

export const GLUCOSE_QUICK_ADD_MMOL_MIN = 0.1;
export const GLUCOSE_QUICK_ADD_MMOL_MAX = 40;

export function getGlucoseQuickAddBoundsForDisplayUnit(
  displayUnit: GlucoseDisplayUnit,
): { readonly max: number; readonly min: number } {
  if (displayUnit === 'mg_per_dl') {
    return {
      min: Math.round(
        convertGlucoseMmolPerLToMgPerDl(GLUCOSE_QUICK_ADD_MMOL_MIN),
      ),
      max: Math.round(
        convertGlucoseMmolPerLToMgPerDl(GLUCOSE_QUICK_ADD_MMOL_MAX),
      ),
    };
  }

  return {
    min: GLUCOSE_QUICK_ADD_MMOL_MIN,
    max: GLUCOSE_QUICK_ADD_MMOL_MAX,
  };
}

export function parseGlucoseInput(
  raw: string,
  displayUnit: GlucoseDisplayUnit,
): number | null {
  const normalized = raw.trim().replace(',', '.');

  if (!normalized) {
    return null;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (displayUnit === 'mg_per_dl') {
    if (!Number.isInteger(value)) {
      return null;
    }

    const bounds = getGlucoseQuickAddBoundsForDisplayUnit('mg_per_dl');

    if (value < bounds.min || value > bounds.max) {
      return null;
    }

    return convertGlucoseMgPerDlToMmolPerL(value);
  }

  const bounds = getGlucoseQuickAddBoundsForDisplayUnit('mmol_per_l');

  if (value < bounds.min || value > bounds.max) {
    return null;
  }

  return value;
}

export function getCurrentTimeString(): string {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}
