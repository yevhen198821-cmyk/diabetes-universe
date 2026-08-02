import type { MeasurementDisplayPolicy } from './measurement-display-policy';
import type { MeasurementUnit } from './measurement-unit';

/**
 * Display-ready glucose measurement value for formatting.
 *
 * Medical conversion fields such as canonical values or conversion rates belong
 * to the Domain layer and are intentionally excluded from this contract.
 */
export interface DisplayMeasurement {
  readonly value: number;
  readonly unit: MeasurementUnit;
  readonly precision?: MeasurementDisplayPolicy;
}
