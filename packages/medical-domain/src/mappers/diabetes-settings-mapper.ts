import type { DiabetesSettings } from '../types/diabetes-settings';
import type { GlucoseTargetProfile } from '../types/glucose-target-profile';
import type {
  DiabetesTypeCategory,
  GlucoseDisplayUnit,
  TargetRangeSource,
} from '../types/diabetes-settings-enums';
import { medicalRevisionFromDb } from '../types/medical-revision';

export interface DiabetesSettingsRow {
  readonly settingsId: string;
  readonly subjectId: string;
  readonly glucoseDisplayUnit: GlucoseDisplayUnit | null;
  readonly diabetesTypeCategory: DiabetesTypeCategory;
  readonly diabetesTypeOtherText: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly revision: bigint | number;
}

export interface GlucoseTargetProfileRow {
  readonly profileId: string;
  readonly subjectId: string;
  readonly lowMmolPerL: number | null;
  readonly highMmolPerL: number | null;
  readonly source: TargetRangeSource | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly revision: bigint | number;
}

export function mapRowToDiabetesSettings(
  row: DiabetesSettingsRow,
): DiabetesSettings {
  return {
    settingsId: row.settingsId,
    subjectId: row.subjectId,
    glucoseDisplayUnit: row.glucoseDisplayUnit,
    diabetesType: {
      category: row.diabetesTypeCategory,
      otherDescriptor: row.diabetesTypeOtherText,
      source: 'self_reported',
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revision: medicalRevisionFromDb(row.revision),
  };
}

export function mapRowToGlucoseTargetProfile(
  row: GlucoseTargetProfileRow,
): GlucoseTargetProfile {
  const hasConfiguredRange =
    row.lowMmolPerL !== null &&
    row.highMmolPerL !== null &&
    row.source !== null;

  return {
    profileId: row.profileId,
    subjectId: row.subjectId,
    defaultRange: hasConfiguredRange
      ? {
          lowMmolPerL: row.lowMmolPerL!,
          highMmolPerL: row.highMmolPerL!,
          source: row.source!,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revision: medicalRevisionFromDb(row.revision),
  };
}
