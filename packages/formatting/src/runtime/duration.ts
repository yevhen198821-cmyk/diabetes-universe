import type { DurationValue } from '../types/duration-value';
import type { DurationFormatOptions } from '../contracts/options/duration-format-options';
import {
  getCachedDurationListFormat,
  getCachedDurationUnitFormat,
} from './cache/intl-formatter-cache';

type DurationUnitName = 'hour' | 'minute' | 'second';
type DurationComponentKey = 'hours' | 'minutes' | 'seconds';

const DURATION_COMPONENTS: ReadonlyArray<{
  readonly key: DurationComponentKey;
  readonly unit: DurationUnitName;
}> = [
  { key: 'hours', unit: 'hour' },
  { key: 'minutes', unit: 'minute' },
  { key: 'seconds', unit: 'second' },
];

function hasDurationComponent(
  value: DurationValue,
  key: DurationComponentKey,
): boolean {
  return Object.hasOwn(value, key);
}

export function assertValidDurationComponent(
  value: number | undefined,
  componentName: DurationComponentKey,
): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value)) {
    throw new Error(`Duration ${componentName} must be a finite number.`);
  }

  if (!Number.isInteger(value)) {
    throw new Error(`Duration ${componentName} must be an integer.`);
  }

  if (value < 0) {
    throw new Error(`Duration ${componentName} must not be negative.`);
  }
}

function resolveDurationStyle(
  options?: DurationFormatOptions,
): 'long' | 'short' | 'narrow' {
  return options?.style ?? 'short';
}

export function formatDurationPresentation(
  value: DurationValue,
  locale: string,
  numberingSystem: string | undefined,
  options?: DurationFormatOptions,
): string {
  const style = resolveDurationStyle(options);
  const hasAnyComponent = DURATION_COMPONENTS.some(({ key }) =>
    hasDurationComponent(value, key),
  );

  const components = hasAnyComponent
    ? DURATION_COMPONENTS.flatMap(({ key, unit }) => {
        if (!hasDurationComponent(value, key)) {
          return [];
        }

        const amount = value[key];
        assertValidDurationComponent(amount, key);

        return [{ unit, amount: amount as number }];
      })
    : [{ unit: 'second' as const, amount: 0 }];

  const formattedParts = components.map(({ unit, amount }) => {
    const formatter = getCachedDurationUnitFormat(
      locale,
      numberingSystem,
      unit,
      style,
    );

    return formatter.format(amount);
  });

  if (formattedParts.length === 1) {
    return formattedParts[0] as string;
  }

  const listFormatter = getCachedDurationListFormat(locale, style);

  return listFormatter.format(formattedParts);
}
