import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';

import {
  DiabetesSettingsClientError,
  type DiabetesSettingsResource,
} from './diabetes-settings-types';

const GLUCOSE_DISPLAY_UNITS = new Set<GlucoseDisplayUnit>([
  'mmol_per_l',
  'mg_per_dl',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGlucoseDisplayUnit(value: unknown): value is GlucoseDisplayUnit {
  return (
    typeof value === 'string' &&
    GLUCOSE_DISPLAY_UNITS.has(value as GlucoseDisplayUnit)
  );
}

export function parseDiabetesSettingsResource(
  value: unknown,
): DiabetesSettingsResource {
  if (!isRecord(value)) {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  if (typeof value.configured !== 'boolean') {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  if (typeof value.subjectId !== 'string' || value.subjectId.length === 0) {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  if (typeof value.revision !== 'string' || value.revision.length === 0) {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  if (
    value.glucoseDisplayUnit !== null &&
    !isGlucoseDisplayUnit(value.glucoseDisplayUnit)
  ) {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  if (value.settingsId !== null && typeof value.settingsId !== 'string') {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  if (!isRecord(value.diabetesType)) {
    throw new DiabetesSettingsClientError(
      'validation',
      'Malformed diabetes settings response.',
    );
  }

  return {
    configured: value.configured,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
    diabetesType:
      value.diabetesType as DiabetesSettingsResource['diabetesType'],
    glucoseDisplayUnit: value.glucoseDisplayUnit,
    revision: value.revision,
    settingsId: typeof value.settingsId === 'string' ? value.settingsId : null,
    subjectId: value.subjectId,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

function isDiabetesSettingsClientError(
  value: unknown,
): value is DiabetesSettingsClientError {
  return (
    value instanceof DiabetesSettingsClientError ||
    (typeof value === 'object' &&
      value !== null &&
      'kind' in value &&
      (value as { name?: unknown }).name === 'DiabetesSettingsClientError')
  );
}

export function interpretDiabetesSettingsLoadFailure(
  caughtError: unknown,
):
  | { readonly type: 'unconfigured' }
  | { readonly type: 'error'; readonly error: DiabetesSettingsClientError } {
  if (
    isDiabetesSettingsClientError(caughtError) &&
    caughtError.kind === 'unauthorized'
  ) {
    return { type: 'unconfigured' };
  }

  return {
    type: 'error',
    error: isDiabetesSettingsClientError(caughtError)
      ? caughtError
      : new DiabetesSettingsClientError('network', 'Network request failed.'),
  };
}
