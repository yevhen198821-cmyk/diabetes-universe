import type { GlucoseDisplayUnit } from '../types/diabetes-settings-enums';
import { mapGlucoseDisplayUnitToDisplaySymbol } from '../validation/diabetes-settings-validation';

export type GlucoseMeasurementDisplayUnit = 'mmol/L' | 'mg/dL';

export function mapGlucoseDisplayUnitToMeasurementUnit(
  displayUnit: GlucoseDisplayUnit,
): GlucoseMeasurementDisplayUnit {
  return mapGlucoseDisplayUnitToDisplaySymbol(displayUnit);
}
