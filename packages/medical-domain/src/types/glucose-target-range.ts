import type { TargetRangeSource } from './diabetes-settings-enums';

/**
 * Canonical glucose target band stored in mmol/L regardless of display preference.
 */
export interface GlucoseTargetRange {
  readonly lowMmolPerL: number;
  readonly highMmolPerL: number;
  readonly source: TargetRangeSource;
}
