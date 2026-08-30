import type { GlucoseMeasurementContext } from '@diabetes-universe/types';

export interface GlucoseContextOption {
  readonly id: GlucoseMeasurementContext;
  readonly label: string;
}

export const glucoseMeasurementContextIds: readonly GlucoseMeasurementContext[] =
  ['fasting', 'before_meal', 'after_meal', 'bedtime', 'other'];
