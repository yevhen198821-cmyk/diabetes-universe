import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type {
  IdempotencyOutcomeReference,
  IdempotencyScope,
} from '@diabetes-universe/medical-domain';
import { createIdempotencyConflictError } from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalIdempotencyRecords } from '../database/medical-schema';

export interface MedicalIdempotencyRepository {
  findCommittedOutcome(
    scope: IdempotencyScope,
    fingerprint: string,
  ): Promise<IdempotencyOutcomeReference | null>;
  insertCommittedOutcome(
    scope: IdempotencyScope,
    fingerprint: string,
    outcome: IdempotencyOutcomeReference,
    expiresAt: Date,
  ): Promise<void>;
  assertNoConflictingOutcome(
    scope: IdempotencyScope,
    fingerprint: string,
  ): Promise<void>;
}

export function createMedicalIdempotencyRepository(
  database: MedicalDatabase,
): MedicalIdempotencyRepository {
  return {
    async findCommittedOutcome(scope, fingerprint) {
      const rows = await database
        .select()
        .from(medicalIdempotencyRecords)
        .where(
          and(
            eq(medicalIdempotencyRecords.accountId, scope.accountId),
            eq(medicalIdempotencyRecords.subjectId, scope.subjectId),
            eq(medicalIdempotencyRecords.apiVersion, scope.apiVersion),
            eq(medicalIdempotencyRecords.operationScope, scope.operationScope),
            eq(medicalIdempotencyRecords.idempotencyKey, scope.idempotencyKey),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        return null;
      }

      if (row.requestFingerprint !== fingerprint) {
        throw createIdempotencyConflictError();
      }

      return {
        resultResourceId: row.resultResourceId,
        resultRevision: row.resultRevision,
        resultEtagToken: row.resultEtagToken,
        storedHttpStatus: row.storedHttpStatus,
      };
    },

    async insertCommittedOutcome(scope, fingerprint, outcome, expiresAt) {
      const now = new Date();

      try {
        await database.insert(medicalIdempotencyRecords).values({
          idempotencyRecordId: randomUUID(),
          accountId: scope.accountId,
          subjectId: scope.subjectId,
          apiVersion: scope.apiVersion,
          operationScope: scope.operationScope,
          idempotencyKey: scope.idempotencyKey,
          requestFingerprint: fingerprint,
          resultResourceId: outcome.resultResourceId,
          resultRevision: outcome.resultRevision,
          resultEtagToken: outcome.resultEtagToken,
          storedHttpStatus: outcome.storedHttpStatus,
          createdAt: now,
          expiresAt,
        });
      } catch (error) {
        const existing = await this.findCommittedOutcome(scope, fingerprint);
        if (existing) {
          return;
        }

        throw error;
      }
    },

    async assertNoConflictingOutcome(scope, fingerprint) {
      const rows = await database
        .select()
        .from(medicalIdempotencyRecords)
        .where(
          and(
            eq(medicalIdempotencyRecords.accountId, scope.accountId),
            eq(medicalIdempotencyRecords.subjectId, scope.subjectId),
            eq(medicalIdempotencyRecords.apiVersion, scope.apiVersion),
            eq(medicalIdempotencyRecords.operationScope, scope.operationScope),
            eq(medicalIdempotencyRecords.idempotencyKey, scope.idempotencyKey),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (row && row.requestFingerprint !== fingerprint) {
        throw createIdempotencyConflictError();
      }
    },
  };
}
