import { sql } from 'drizzle-orm';
import type { MedicalDatabase } from '../database/create-medical-database';

function rows<T>(result: unknown): T[] {
  return ((result as { rows?: T[] }).rows ?? result) as T[];
}
export interface SyncOutcome {
  readonly resourceId: string;
  readonly revision: string;
  readonly lifecycleState: 'active' | 'deleted';
}

export function createMedicalSyncRepository(database: MedicalDatabase) {
  return {
    async lock(accountId: string, subjectId: string, mutationId: string) {
      await database.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${JSON.stringify([accountId, subjectId, mutationId])}))`,
      );
    },
    async findOutcome(
      accountId: string,
      subjectId: string,
      mutationId: string,
    ) {
      const result = await database.execute(
        sql`SELECT fingerprint,outcome FROM medical.sync_mutation_outcomes WHERE account_id=${accountId} AND subject_id=${subjectId}::uuid AND mutation_id=${mutationId}`,
      );
      return (
        rows<{ fingerprint: string; outcome: SyncOutcome }>(result)[0] ?? null
      );
    },
    async saveOutcome(
      accountId: string,
      subjectId: string,
      mutationId: string,
      fingerprint: string,
      outcome: SyncOutcome,
    ) {
      await database.execute(
        sql`INSERT INTO medical.sync_mutation_outcomes(account_id,subject_id,mutation_id,fingerprint,outcome) VALUES(${accountId},${subjectId}::uuid,${mutationId},${fingerprint},${JSON.stringify(outcome)}::jsonb)`,
      );
    },
    async changes(subjectId: string, after: string, limit: number) {
      const result = await database.execute(
        sql`SELECT sequence::text,resource_id AS "resourceId",lifecycle_state AS "lifecycleState" FROM medical.sync_changes WHERE subject_id=${subjectId}::uuid AND sequence>${after}::bigint ORDER BY sequence LIMIT ${limit}`,
      );
      return rows<{
        sequence: string;
        resourceId: string;
        lifecycleState: 'active' | 'deleted';
      }>(result);
    },
  };
}
