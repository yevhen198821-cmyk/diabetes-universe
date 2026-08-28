import type { GlucoseDisplayUnit } from '../types/diabetes-settings-enums';
import { convertGlucoseMmolPerLToMgPerDl } from './glucose-conversion';

/**
 * Converts canonical mmol/L to a presentation numeric value without mutating input.
 *
 * Precision contract:
 * - mmol/L: one fractional digit
 * - mg/dL: integer
 */
export function toGlucoseDisplayNumericValue(
  mmolPerL: number,
  displayUnit: GlucoseDisplayUnit,
): number {
  if (displayUnit === 'mg_per_dl') {
    return Math.round(convertGlucoseMmolPerLToMgPerDl(mmolPerL));
  }

  return Math.round(mmolPerL * 10) / 10;
}
