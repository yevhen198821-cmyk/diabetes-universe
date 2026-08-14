import { randomUUID } from 'node:crypto';

import { and, eq, sql } from 'drizzle-orm';

import type { AccountSubjectRelationship } from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import {
  accountSubjectRelationships,
  medicalSubjects,
} from '../database/medical-schema';

export interface MedicalSubjectRepository {
  findActiveSelfRelationship(
    accountId: string,
  ): Promise<AccountSubjectRelationship | null>;
  provisionSelfSubject(accountId: string): Promise<AccountSubjectRelationship>;
}

function mapRelationship(
  row: typeof accountSubjectRelationships.$inferSelect,
): AccountSubjectRelationship {
  return {
    relationshipId: row.relationshipId,
    accountId: row.accountId,
    subjectId: row.subjectId,
    relationshipType: 'self',
    status: row.status as 'active' | 'revoked',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createMedicalSubjectRepository(
  database: MedicalDatabase,
): MedicalSubjectRepository {
  return {
    async findActiveSelfRelationship(accountId: string) {
      const rows = await database
        .select()
        .from(accountSubjectRelationships)
        .where(
          and(
            eq(accountSubjectRelationships.accountId, accountId),
            eq(accountSubjectRelationships.relationshipType, 'self'),
            eq(accountSubjectRelationships.status, 'active'),
          ),
        )
        .limit(1);

      const row = rows[0];
      return row ? mapRelationship(row) : null;
    },

    async provisionSelfSubject(accountId: string) {
      return database.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${accountId}))`,
        );

        const existing = await tx
          .select()
          .from(accountSubjectRelationships)
          .where(
            and(
              eq(accountSubjectRelationships.accountId, accountId),
              eq(accountSubjectRelationships.relationshipType, 'self'),
              eq(accountSubjectRelationships.status, 'active'),
            ),
          )
          .limit(1);

        if (existing[0]) {
          return mapRelationship(existing[0]);
        }

        const now = new Date();
        const subjectId = randomUUID();
        const relationshipId = randomUUID();

        try {
          await tx.insert(medicalSubjects).values({
            subjectId,
            subjectKind: 'person',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });

          await tx.insert(accountSubjectRelationships).values({
            relationshipId,
            accountId,
            subjectId,
            relationshipType: 'self',
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        } catch (error) {
          const reconciled = await tx
            .select()
            .from(accountSubjectRelationships)
            .where(
              and(
                eq(accountSubjectRelationships.accountId, accountId),
                eq(accountSubjectRelationships.relationshipType, 'self'),
                eq(accountSubjectRelationships.status, 'active'),
              ),
            )
            .limit(1);

          if (reconciled[0]) {
            return mapRelationship(reconciled[0]);
          }

          throw error;
        }

        return {
          relationshipId,
          accountId,
          subjectId,
          relationshipType: 'self',
          status: 'active',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      });
    },
  };
}
