import { sql } from 'drizzle-orm';

import type { MedicalDatabase } from '../database/create-medical-database';

const MAX_BATCH = 10000;

export async function purgeExpiredIdempotencyRecords(
  database: MedicalDatabase,
  batchLimit: number,
): Promise<number> {
  const clamped = Math.min(Math.max(batchLimit, 1), MAX_BATCH);
  const result = await database.execute(
    sql`SELECT medical.purge_expired_idempotency_records(${clamped}) AS deleted_count`,
  );

  const rows = Array.isArray(result)
    ? result
    : ((result as { rows?: readonly { deleted_count?: number }[] }).rows ?? []);
  const row = rows[0];
  return Number(row?.deleted_count ?? 0);
}
