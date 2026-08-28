import {
  convertGlucoseMgPerDlToMmolPerL,
  DIABETES_SETTINGS_VALIDATION_BOUNDS,
  type GlucoseDisplayUnit,
} from '@diabetes-universe/medical-domain';

export type TargetEditorValidationIssue =
  | 'empty'
  | 'invalid_number'
  | 'low_equal_high'
  | 'low_greater_than_high'
  | 'out_of_bounds';

export interface TargetEditorValidationResult {
  readonly ok: true;
  readonly lowMmolPerL: number;
  readonly highMmolPerL: number;
}

export interface TargetEditorValidationFailure {
  readonly ok: false;
  readonly issue: TargetEditorValidationIssue;
}

export function parseTargetEditorNumericInput(
  rawValue: string,
  displayUnit: GlucoseDisplayUnit,
): number | null {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (displayUnit === 'mg_per_dl') {
    if (!Number.isInteger(parsed)) {
      return null;
    }

    return convertGlucoseMgPerDlToMmolPerL(parsed);
  }

  return parsed;
}

export function validateTargetEditorInput(
  lowInput: string,
  highInput: string,
  displayUnit: GlucoseDisplayUnit,
): TargetEditorValidationResult | TargetEditorValidationFailure {
  if (!lowInput.trim() || !highInput.trim()) {
    return { ok: false, issue: 'empty' };
  }

  const lowMmolPerL = parseTargetEditorNumericInput(lowInput, displayUnit);
  const highMmolPerL = parseTargetEditorNumericInput(highInput, displayUnit);

  if (lowMmolPerL === null || highMmolPerL === null) {
    return { ok: false, issue: 'invalid_number' };
  }

  const { GLUCOSE_MMOL_MIN, GLUCOSE_MMOL_MAX } =
    DIABETES_SETTINGS_VALIDATION_BOUNDS;

  if (
    lowMmolPerL < GLUCOSE_MMOL_MIN ||
    lowMmolPerL > GLUCOSE_MMOL_MAX ||
    highMmolPerL < GLUCOSE_MMOL_MIN ||
    highMmolPerL > GLUCOSE_MMOL_MAX
  ) {
    return { ok: false, issue: 'out_of_bounds' };
  }

  if (lowMmolPerL === highMmolPerL) {
    return { ok: false, issue: 'low_equal_high' };
  }

  if (lowMmolPerL > highMmolPerL) {
    return { ok: false, issue: 'low_greater_than_high' };
  }

  return {
    ok: true,
    lowMmolPerL,
    highMmolPerL,
  };
}
