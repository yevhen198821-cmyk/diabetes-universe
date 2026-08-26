import type { DiabetesTypeCategory } from '../types/diabetes-settings-enums';
import type { DiabetesTypeClassification } from '../types/diabetes-type-classification';
import type { GlucoseDisplayUnit } from '../types/diabetes-settings-enums';
import type { GlucoseTargetRange } from '../types/glucose-target-range';
import type { TargetRangeSource } from '../types/diabetes-settings-enums';
import { DIABETES_SETTINGS_VALIDATION_BOUNDS } from './diabetes-settings-bounds';

export class DiabetesSettingsValidationError extends Error {
  readonly name = 'DiabetesSettingsValidationError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertFiniteNumber(
  value: unknown,
  fieldName: string,
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new DiabetesSettingsValidationError(
      `${fieldName} must be a finite number.`,
    );
  }
}

export function isGlucoseDisplayUnit(
  value: unknown,
): value is GlucoseDisplayUnit {
  return value === 'mmol_per_l' || value === 'mg_per_dl';
}

export function assertGlucoseDisplayUnit(
  value: unknown,
): asserts value is GlucoseDisplayUnit {
  if (!isGlucoseDisplayUnit(value)) {
    throw new DiabetesSettingsValidationError(
      'glucoseDisplayUnit must be mmol_per_l or mg_per_dl.',
    );
  }
}

export function isDiabetesTypeCategory(
  value: unknown,
): value is DiabetesTypeCategory {
  return (
    value === 'type_1' ||
    value === 'type_2' ||
    value === 'gestational' ||
    value === 'other' ||
    value === 'unknown'
  );
}

export function assertDiabetesTypeCategory(
  value: unknown,
): asserts value is DiabetesTypeCategory {
  if (!isDiabetesTypeCategory(value)) {
    throw new DiabetesSettingsValidationError(
      'diabetesType.category is not supported.',
    );
  }
}

export function isTargetRangeSource(
  value: unknown,
): value is TargetRangeSource {
  return (
    value === 'user_defined' ||
    value === 'clinician_defined' ||
    value === 'imported' ||
    value === 'system_reference'
  );
}

export function assertTargetRangeSource(
  value: unknown,
): asserts value is TargetRangeSource {
  if (!isTargetRangeSource(value)) {
    throw new DiabetesSettingsValidationError(
      'targetRange.source is not supported.',
    );
  }
}

export function validateGlucoseTargetRange(value: unknown): GlucoseTargetRange {
  if (!isRecord(value)) {
    throw new DiabetesSettingsValidationError(
      'Glucose target range must be an object.',
    );
  }

  assertFiniteNumber(value.lowMmolPerL, 'lowMmolPerL');
  assertFiniteNumber(value.highMmolPerL, 'highMmolPerL');
  assertTargetRangeSource(value.source);

  const { GLUCOSE_MMOL_MIN, GLUCOSE_MMOL_MAX } =
    DIABETES_SETTINGS_VALIDATION_BOUNDS;

  if (
    value.lowMmolPerL < GLUCOSE_MMOL_MIN ||
    value.lowMmolPerL > GLUCOSE_MMOL_MAX
  ) {
    throw new DiabetesSettingsValidationError(
      'lowMmolPerL is outside supported medical bounds.',
    );
  }

  if (
    value.highMmolPerL < GLUCOSE_MMOL_MIN ||
    value.highMmolPerL > GLUCOSE_MMOL_MAX
  ) {
    throw new DiabetesSettingsValidationError(
      'highMmolPerL is outside supported medical bounds.',
    );
  }

  if (value.lowMmolPerL >= value.highMmolPerL) {
    throw new DiabetesSettingsValidationError(
      'lowMmolPerL must be less than highMmolPerL.',
    );
  }

  return {
    lowMmolPerL: value.lowMmolPerL,
    highMmolPerL: value.highMmolPerL,
    source: value.source,
  };
}

export function validateDiabetesTypeClassification(
  value: unknown,
): DiabetesTypeClassification {
  if (!isRecord(value)) {
    throw new DiabetesSettingsValidationError(
      'Diabetes type classification must be an object.',
    );
  }

  assertDiabetesTypeCategory(value.category);

  if (value.source !== 'self_reported') {
    throw new DiabetesSettingsValidationError(
      'diabetesType.source must be self_reported in Wave 2.',
    );
  }

  const otherDescriptor =
    value.otherDescriptor === undefined || value.otherDescriptor === null
      ? null
      : value.otherDescriptor;

  if (otherDescriptor !== null) {
    if (typeof otherDescriptor !== 'string') {
      throw new DiabetesSettingsValidationError(
        'diabetesType.otherDescriptor must be a string when provided.',
      );
    }

    if (
      otherDescriptor.length >
      DIABETES_SETTINGS_VALIDATION_BOUNDS.DIABETES_TYPE_OTHER_DESCRIPTOR_MAX_LENGTH
    ) {
      throw new DiabetesSettingsValidationError(
        'diabetesType.otherDescriptor exceeds maximum length.',
      );
    }
  }

  if (value.category !== 'other' && otherDescriptor !== null) {
    throw new DiabetesSettingsValidationError(
      'diabetesType.otherDescriptor is allowed only when category is other.',
    );
  }

  return {
    category: value.category,
    otherDescriptor,
    source: 'self_reported',
  };
}

/** Presentation symbol aligned with `@diabetes-universe/formatting` MeasurementUnit. */
export type GlucoseDisplayUnitSymbol = 'mmol/L' | 'mg/dL';

export function mapGlucoseDisplayUnitToDisplaySymbol(
  unit: GlucoseDisplayUnit,
): GlucoseDisplayUnitSymbol {
  return unit === 'mmol_per_l' ? 'mmol/L' : 'mg/dL';
}
