import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import {
  INITIAL_MEDICAL_REVISION,
  incrementMedicalRevision,
  mapRowToDiabetesSettings,
  type DiabetesSettings,
  type DiabetesTypeClassification,
  type GlucoseDisplayUnit,
  type MedicalRevision,
} from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { diabetesSettings } from '../database/medical-schema';

export interface DiabetesSettingsInsert {
  readonly glucoseDisplayUnit?: GlucoseDisplayUnit | null;
  readonly diabetesType?: DiabetesTypeClassification;
}

export interface DiabetesSettingsPatch {
  readonly glucoseDisplayUnit?: GlucoseDisplayUnit | null;
  readonly diabetesType?: DiabetesTypeClassification;
}

export interface DiabetesSettingsRepository {
  findBySubjectId(subjectId: string): Promise<DiabetesSettings | null>;
  insert(
    subjectId: string,
    input: DiabetesSettingsInsert,
  ): Promise<DiabetesSettings>;
  updateWithRevision(
    subjectId: string,
    settingsId: string,
    expectedRevision: MedicalRevision,
    patch: DiabetesSettingsPatch,
  ): Promise<DiabetesSettings | null>;
}

export function createDiabetesSettingsRepository(
  database: MedicalDatabase,
): DiabetesSettingsRepository {
  return {
    async findBySubjectId(subjectId) {
      const rows = await database
        .select()
        .from(diabetesSettings)
        .where(eq(diabetesSettings.subjectId, subjectId))
        .limit(1);

      const row = rows[0];
      return row ? mapRowToDiabetesSettings(row) : null;
    },

    async insert(subjectId, input) {
      const now = new Date();
      const diabetesType = input.diabetesType ?? {
        category: 'unknown' as const,
        otherDescriptor: null,
        source: 'self_reported' as const,
      };

      const [row] = await database
        .insert(diabetesSettings)
        .values({
          settingsId: randomUUID(),
          subjectId,
          glucoseDisplayUnit: input.glucoseDisplayUnit ?? null,
          diabetesTypeCategory: diabetesType.category,
          diabetesTypeOtherText: diabetesType.otherDescriptor ?? null,
          revision: INITIAL_MEDICAL_REVISION,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return mapRowToDiabetesSettings(row);
    },

    async updateWithRevision(subjectId, settingsId, expectedRevision, patch) {
      const now = new Date();
      const updates: Record<string, unknown> = {
        revision: incrementMedicalRevision(expectedRevision),
        updatedAt: now,
      };

      if ('glucoseDisplayUnit' in patch) {
        updates.glucoseDisplayUnit = patch.glucoseDisplayUnit ?? null;
      }

      if (patch.diabetesType) {
        updates.diabetesTypeCategory = patch.diabetesType.category;
        updates.diabetesTypeOtherText =
          patch.diabetesType.otherDescriptor ?? null;
      }

      const rows = await database
        .update(diabetesSettings)
        .set(updates)
        .where(
          and(
            eq(diabetesSettings.subjectId, subjectId),
            eq(diabetesSettings.settingsId, settingsId),
            eq(diabetesSettings.revision, expectedRevision),
          ),
        )
        .returning();

      return rows[0] ? mapRowToDiabetesSettings(rows[0]) : null;
    },
  };
}
