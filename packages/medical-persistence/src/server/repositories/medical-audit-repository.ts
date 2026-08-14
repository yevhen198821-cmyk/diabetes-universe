import { randomUUID } from 'node:crypto';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalAuditEvents } from '../database/medical-schema';

export interface AuditInsert {
  readonly actorAccountId: string;
  readonly subjectId: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly outcome: 'success' | 'denied' | 'error';
  readonly correlationId: string;
  readonly detail?: Record<string, unknown> | null;
}

export interface MedicalAuditRepository {
  insert(entry: AuditInsert): Promise<void>;
}

export function createMedicalAuditRepository(
  database: MedicalDatabase,
): MedicalAuditRepository {
  return {
    async insert(entry) {
      await database.insert(medicalAuditEvents).values({
        auditId: randomUUID(),
        occurredAt: new Date(),
        actorAccountId: entry.actorAccountId,
        subjectId: entry.subjectId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        outcome: entry.outcome,
        correlationId: entry.correlationId,
        detail: entry.detail ?? null,
      });
    },
  };
}
