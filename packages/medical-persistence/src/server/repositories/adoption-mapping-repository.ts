import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { MedicalAdoptionMapping } from '@diabetes-universe/medical-domain';
import { AdoptionSourceConflictError } from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalAdoptionMappings } from '../database/medical-schema';

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('code' in error && error.code === '23505') {
    return true;
  }

  if (
    'cause' in error &&
    error.cause &&
    typeof error.cause === 'object' &&
    'code' in error.cause &&
    error.cause.code === '23505'
  ) {
    return true;
  }

  return false;
}

function mapMappingRow(
  row: typeof medicalAdoptionMappings.$inferSelect,
): MedicalAdoptionMapping {
  return {
    adoptionMappingId: row.adoptionMappingId,
    subjectId: row.subjectId,
    sourceNamespace: row.sourceNamespace,
    localEventId: row.localEventId,
    canonicalResourceId: row.canonicalResourceId,
    canonicalRevision: row.canonicalRevision,
    sourceSchemaVersion: row.sourceSchemaVersion,
    payloadFingerprint: row.payloadFingerprint,
    adoptedAt: row.adoptedAt,
    adoptionSessionId: row.adoptionSessionId,
  };
}

export interface AdoptionMappingInsert {
  readonly subjectId: string;
  readonly sourceNamespace: string;
  readonly localEventId: string;
  readonly canonicalResourceId: string;
  readonly canonicalRevision: bigint;
  readonly sourceSchemaVersion: number;
  readonly payloadFingerprint: string;
  readonly adoptionSessionId: string;
}

export interface AdoptionMappingRepository {
  findBySourceIdentity(
    subjectId: string,
    sourceNamespace: string,
    localEventId: string,
  ): Promise<MedicalAdoptionMapping | null>;
  insertMapping(input: AdoptionMappingInsert): Promise<MedicalAdoptionMapping>;
}

export function createAdoptionMappingRepository(
  database: MedicalDatabase,
): AdoptionMappingRepository {
  return {
    async findBySourceIdentity(subjectId, sourceNamespace, localEventId) {
      const rows = await database
        .select()
        .from(medicalAdoptionMappings)
        .where(
          and(
            eq(medicalAdoptionMappings.subjectId, subjectId),
            eq(medicalAdoptionMappings.sourceNamespace, sourceNamespace),
            eq(medicalAdoptionMappings.localEventId, localEventId),
          ),
        )
        .limit(1);

      return rows[0] ? mapMappingRow(rows[0]) : null;
    },

    async insertMapping(input) {
      const now = new Date();

      try {
        const [row] = await database
          .insert(medicalAdoptionMappings)
          .values({
            adoptionMappingId: randomUUID(),
            subjectId: input.subjectId,
            sourceNamespace: input.sourceNamespace,
            localEventId: input.localEventId,
            canonicalResourceId: input.canonicalResourceId,
            canonicalRevision: input.canonicalRevision,
            sourceSchemaVersion: input.sourceSchemaVersion,
            payloadFingerprint: input.payloadFingerprint,
            adoptedAt: now,
            adoptionSessionId: input.adoptionSessionId,
          })
          .returning();

        return mapMappingRow(row);
      } catch (error) {
        if (isUniqueViolation(error)) {
          const existing = await this.findBySourceIdentity(
            input.subjectId,
            input.sourceNamespace,
            input.localEventId,
          );
          if (
            existing &&
            existing.payloadFingerprint !== input.payloadFingerprint
          ) {
            throw new AdoptionSourceConflictError(
              'Adoption source identity already mapped with different payload.',
            );
          }
          if (existing) {
            return existing;
          }
        }
        throw error;
      }
    },
  };
}
