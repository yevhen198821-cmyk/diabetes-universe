import type { MeasurementDisplayPolicy } from '../types/measurement-display-policy';
import type { MeasurementUnit } from '../types/measurement-unit';
import type { MeasurementFormatOptions } from '../contracts/options/measurement-format-options';

const KNOWN_MEASUREMENT_UNITS = new Set<MeasurementUnit>(['mmol/L', 'mg/dL']);

export function assertKnownMeasurementUnit(
  unit: string,
): asserts unit is MeasurementUnit {
  if (!KNOWN_MEASUREMENT_UNITS.has(unit as MeasurementUnit)) {
    throw new Error(`Measurement unit "${unit}" is not supported.`);
  }
}

export function resolveMeasurementPrecision(
  unit: MeasurementUnit,
  precision?: MeasurementDisplayPolicy,
): MeasurementDisplayPolicy {
  if (precision !== undefined) {
    return precision;
  }

  if (unit === 'mmol/L') {
    return {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    };
  }

  return {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
}

/**
 * Canonical glucose unit symbols are used because Intl.NumberFormat does not
 * support mmol/L or mg/dL as ICU units in the project runtime.
 *
 * unitDisplay affects spacing only:
 * - long/short -> single ASCII space before the symbol
 * - narrow -> no separator
 */
export function composeMeasurementDisplay(
  formattedValue: string,
  unit: MeasurementUnit,
  options?: MeasurementFormatOptions,
): string {
  const unitDisplay = options?.unitDisplay ?? 'short';

  if (unitDisplay === 'narrow') {
    return `${formattedValue}${unit}`;
  }

  return `${formattedValue} ${unit}`;
}
