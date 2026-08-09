import type { GlucoseMeasurementContext } from '@diabetes-universe/types';

const quickAddGlucoseContextMap: Readonly<
  Record<string, GlucoseMeasurementContext>
> = {
  другое: 'other',
  натощак: 'fasting',
  'перед едой': 'before_meal',
  'перед сном': 'bedtime',
  'после еды': 'after_meal',
};

function normalizeQuickAddLabel(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function mapQuickAddGlucoseContext(
  context: string,
): GlucoseMeasurementContext | undefined {
  const normalized = normalizeQuickAddLabel(context);

  if (normalized.length === 0) {
    return undefined;
  }

  return quickAddGlucoseContextMap[normalized];
}
