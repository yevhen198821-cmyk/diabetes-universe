import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import {
  INITIAL_MEDICAL_REVISION,
  incrementMedicalRevision,
  mapRowToGlucoseTargetProfile,
  type GlucoseTargetProfile,
  type GlucoseTargetRange,
  type MedicalRevision,
} from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { glucoseTargetProfiles } from '../database/medical-schema';

export interface GlucoseTargetProfileRepository {
  findBySubjectId(subjectId: string): Promise<GlucoseTargetProfile | null>;
  insertWithRange(
    subjectId: string,
    range: GlucoseTargetRange,
  ): Promise<GlucoseTargetProfile>;
  updateRangeWithRevision(
    subjectId: string,
    profileId: string,
    expectedRevision: MedicalRevision,
    range: GlucoseTargetRange,
  ): Promise<GlucoseTargetProfile | null>;
  clearRangeWithRevision(
    subjectId: string,
    profileId: string,
    expectedRevision: MedicalRevision,
  ): Promise<GlucoseTargetProfile | null>;
}

export function createGlucoseTargetProfileRepository(
  database: MedicalDatabase,
): GlucoseTargetProfileRepository {
  return {
    async findBySubjectId(subjectId) {
      const rows = await database
        .select()
        .from(glucoseTargetProfiles)
        .where(eq(glucoseTargetProfiles.subjectId, subjectId))
        .limit(1);

      const row = rows[0];
      return row ? mapRowToGlucoseTargetProfile(row) : null;
    },

    async insertWithRange(subjectId, range) {
      const now = new Date();

      const [row] = await database
        .insert(glucoseTargetProfiles)
        .values({
          profileId: randomUUID(),
          subjectId,
          lowMmolPerL: range.lowMmolPerL,
          highMmolPerL: range.highMmolPerL,
          source: range.source,
          revision: INITIAL_MEDICAL_REVISION,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return mapRowToGlucoseTargetProfile(row);
    },

    async updateRangeWithRevision(
      subjectId,
      profileId,
      expectedRevision,
      range,
    ) {
      const now = new Date();

      const rows = await database
        .update(glucoseTargetProfiles)
        .set({
          lowMmolPerL: range.lowMmolPerL,
          highMmolPerL: range.highMmolPerL,
          source: range.source,
          revision: incrementMedicalRevision(expectedRevision),
          updatedAt: now,
        })
        .where(
          and(
            eq(glucoseTargetProfiles.subjectId, subjectId),
            eq(glucoseTargetProfiles.profileId, profileId),
            eq(glucoseTargetProfiles.revision, expectedRevision),
          ),
        )
        .returning();

      return rows[0] ? mapRowToGlucoseTargetProfile(rows[0]) : null;
    },

    async clearRangeWithRevision(subjectId, profileId, expectedRevision) {
      const now = new Date();

      const rows = await database
        .update(glucoseTargetProfiles)
        .set({
          lowMmolPerL: null,
          highMmolPerL: null,
          source: null,
          revision: incrementMedicalRevision(expectedRevision),
          updatedAt: now,
        })
        .where(
          and(
            eq(glucoseTargetProfiles.subjectId, subjectId),
            eq(glucoseTargetProfiles.profileId, profileId),
            eq(glucoseTargetProfiles.revision, expectedRevision),
          ),
        )
        .returning();

      return rows[0] ? mapRowToGlucoseTargetProfile(rows[0]) : null;
    },
  };
}
