import { randomUUID } from 'node:crypto';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalOutboxEvents } from '../database/medical-schema';

export interface OutboxInsert {
  readonly subjectId: string;
  readonly resourceId: string | null;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}

export interface MedicalOutboxRepository {
  insert(entry: OutboxInsert): Promise<void>;
}

export function createMedicalOutboxRepository(
  database: MedicalDatabase,
): MedicalOutboxRepository {
  return {
    async insert(entry) {
      await database.insert(medicalOutboxEvents).values({
        outboxId: randomUUID(),
        subjectId: entry.subjectId,
        resourceId: entry.resourceId,
        eventType: entry.eventType,
        payload: entry.payload,
        status: 'pending',
        createdAt: new Date(),
        publishedAt: null,
      });
    },
  };
}
