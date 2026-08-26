import {
  assertGlucoseDisplayUnit,
  DiabetesSettingsValidationError,
  validateDiabetesTypeClassification,
  validateGlucoseTargetRange,
  type DiabetesSettings,
  type DiabetesTypeClassification,
  type GlucoseDisplayUnit,
  type GlucoseTargetProfile,
  type GlucoseTargetRange,
} from '@diabetes-universe/medical-domain';

import { MedicalApiValidationError } from './medical-api-validation';

export interface DiabetesSettingsPatchBody {
  readonly glucoseDisplayUnit?: GlucoseDisplayUnit | null;
  readonly diabetesType?: DiabetesTypeClassification;
}

export interface GlucoseTargetProfilePutBody {
  readonly defaultRange: GlucoseTargetRange;
}

function rejectUnknownTopLevelFields(
  record: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      throw new MedicalApiValidationError(`Unknown field: ${key}.`, {
        field: key,
      });
    }
  }
}

function mapDomainValidationError(error: unknown): never {
  if (error instanceof DiabetesSettingsValidationError) {
    throw new MedicalApiValidationError(error.message);
  }
  throw error;
}

export function validateDiabetesSettingsPatchBody(
  body: unknown,
): DiabetesSettingsPatchBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MedicalApiValidationError('Request body must be an object.');
  }

  const record = body as Record<string, unknown>;
  rejectUnknownTopLevelFields(record, ['glucoseDisplayUnit', 'diabetesType']);

  if (!('glucoseDisplayUnit' in record) && !('diabetesType' in record)) {
    throw new MedicalApiValidationError(
      'At least one of glucoseDisplayUnit or diabetesType is required.',
    );
  }

  const patch: {
    glucoseDisplayUnit?: GlucoseDisplayUnit | null;
    diabetesType?: DiabetesTypeClassification;
  } = {};

  if ('glucoseDisplayUnit' in record) {
    if (record.glucoseDisplayUnit === null) {
      patch.glucoseDisplayUnit = null;
    } else {
      try {
        assertGlucoseDisplayUnit(record.glucoseDisplayUnit);
        patch.glucoseDisplayUnit = record.glucoseDisplayUnit;
      } catch (error) {
        mapDomainValidationError(error);
      }
    }
  }

  if ('diabetesType' in record) {
    try {
      patch.diabetesType = validateDiabetesTypeClassification(
        record.diabetesType,
      );
    } catch (error) {
      mapDomainValidationError(error);
    }
  }

  return patch satisfies DiabetesSettingsPatchBody;
}

export function validateGlucoseTargetProfilePutBody(
  body: unknown,
): GlucoseTargetProfilePutBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MedicalApiValidationError('Request body must be an object.');
  }

  const record = body as Record<string, unknown>;
  rejectUnknownTopLevelFields(record, ['defaultRange']);

  if (!('defaultRange' in record)) {
    throw new MedicalApiValidationError('defaultRange is required.');
  }

  if (!record.defaultRange || typeof record.defaultRange !== 'object') {
    throw new MedicalApiValidationError('defaultRange must be an object.');
  }

  const rangeRecord = record.defaultRange as Record<string, unknown>;
  rejectUnknownTopLevelFields(rangeRecord, [
    'lowMmolPerL',
    'highMmolPerL',
    'source',
  ]);

  if ('source' in rangeRecord && rangeRecord.source !== 'user_defined') {
    throw new MedicalApiValidationError(
      'defaultRange.source must be user_defined when provided.',
    );
  }

  try {
    return {
      defaultRange: validateGlucoseTargetRange({
        ...rangeRecord,
        source: 'user_defined',
      }),
    };
  } catch (error) {
    mapDomainValidationError(error);
  }
}

export function toPublicDiabetesSettingsResponse(
  configured: boolean,
  settings: DiabetesSettings,
  revisionToken: string,
) {
  return {
    configured,
    settingsId: configured ? settings.settingsId : null,
    subjectId: settings.subjectId,
    glucoseDisplayUnit: settings.glucoseDisplayUnit,
    diabetesType: settings.diabetesType,
    createdAt: configured ? settings.createdAt : null,
    updatedAt: configured ? settings.updatedAt : null,
    revision: revisionToken,
  };
}

export function toPublicGlucoseTargetProfileResponse(
  configured: boolean,
  profile: GlucoseTargetProfile,
  revisionToken: string,
) {
  return {
    configured,
    profileId:
      profile.profileId === '00000000-0000-0000-0000-000000000000'
        ? null
        : profile.profileId,
    subjectId: profile.subjectId,
    defaultRange: profile.defaultRange,
    createdAt:
      profile.createdAt === new Date(0).toISOString()
        ? null
        : profile.createdAt,
    updatedAt:
      profile.updatedAt === new Date(0).toISOString()
        ? null
        : profile.updatedAt,
    revision: revisionToken,
  };
}
