import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type {
  AdoptionSessionLifecycleState,
  CreateAdoptionSessionInput,
  MedicalAdoptionSession,
} from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalAdoptionSessions } from '../database/medical-schema';

function mapSessionRow(
  row: typeof medicalAdoptionSessions.$inferSelect,
): MedicalAdoptionSession {
  return {
    adoptionSessionId: row.adoptionSessionId,
    subjectId: row.subjectId,
    actorAccountId: row.actorAccountId,
    clientAdoptionRunId: row.clientAdoptionRunId,
    sourcePlatform: row.sourcePlatform,
    sourceAppVersion: row.sourceAppVersion,
    sourceSchemaMin: row.sourceSchemaMin,
    sourceSchemaMax: row.sourceSchemaMax,
    lifecycleState: row.lifecycleState as AdoptionSessionLifecycleState,
    eligibleCount: row.eligibleCount,
    adoptedCount: row.adoptedCount,
    skippedCount: row.skippedCount,
    failedCount: row.failedCount,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt,
  };
}

export interface AdoptionSessionRepository {
  create(input: CreateAdoptionSessionInput): Promise<MedicalAdoptionSession>;
  findByIdForSubject(
    subjectId: string,
    adoptionSessionId: string,
  ): Promise<MedicalAdoptionSession | null>;
  findByClientRunId(
    actorAccountId: string,
    clientAdoptionRunId: string,
  ): Promise<MedicalAdoptionSession | null>;
  updateLifecycle(
    adoptionSessionId: string,
    lifecycleState: AdoptionSessionLifecycleState,
    updates?: {
      adoptedCount?: number;
      skippedCount?: number;
      failedCount?: number;
      eligibleCount?: number;
      completedAt?: Date | null;
      startedAt?: Date | null;
    },
  ): Promise<MedicalAdoptionSession | null>;
  incrementCounters(
    adoptionSessionId: string,
    deltas: {
      adoptedCount?: number;
      skippedCount?: number;
      failedCount?: number;
    },
  ): Promise<MedicalAdoptionSession | null>;
}

export function createAdoptionSessionRepository(
  database: MedicalDatabase,
): AdoptionSessionRepository {
  return {
    async create(input) {
      const now = new Date();
      const adoptionSessionId = randomUUID();

      const [row] = await database
        .insert(medicalAdoptionSessions)
        .values({
          adoptionSessionId,
          subjectId: input.subjectId,
          actorAccountId: input.actorAccountId,
          clientAdoptionRunId: input.clientAdoptionRunId,
          sourcePlatform: input.sourcePlatform,
          sourceAppVersion: input.sourceAppVersion,
          sourceSchemaMin: input.sourceSchemaMin,
          sourceSchemaMax: input.sourceSchemaMax,
          lifecycleState: 'open',
          eligibleCount: input.eligibleCount ?? 0,
          adoptedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          createdAt: now,
          startedAt: now,
          completedAt: null,
          updatedAt: now,
        })
        .returning();

      return mapSessionRow(row);
    },

    async findByIdForSubject(subjectId, adoptionSessionId) {
      const rows = await database
        .select()
        .from(medicalAdoptionSessions)
        .where(
          and(
            eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId),
            eq(medicalAdoptionSessions.subjectId, subjectId),
          ),
        )
        .limit(1);

      return rows[0] ? mapSessionRow(rows[0]) : null;
    },

    async findByClientRunId(actorAccountId, clientAdoptionRunId) {
      const rows = await database
        .select()
        .from(medicalAdoptionSessions)
        .where(
          and(
            eq(medicalAdoptionSessions.actorAccountId, actorAccountId),
            eq(
              medicalAdoptionSessions.clientAdoptionRunId,
              clientAdoptionRunId,
            ),
          ),
        )
        .limit(1);

      return rows[0] ? mapSessionRow(rows[0]) : null;
    },

    async updateLifecycle(adoptionSessionId, lifecycleState, updates = {}) {
      const now = new Date();
      const [row] = await database
        .update(medicalAdoptionSessions)
        .set({
          lifecycleState,
          updatedAt: now,
          ...(updates.adoptedCount !== undefined
            ? { adoptedCount: updates.adoptedCount }
            : {}),
          ...(updates.skippedCount !== undefined
            ? { skippedCount: updates.skippedCount }
            : {}),
          ...(updates.failedCount !== undefined
            ? { failedCount: updates.failedCount }
            : {}),
          ...(updates.eligibleCount !== undefined
            ? { eligibleCount: updates.eligibleCount }
            : {}),
          ...(updates.completedAt !== undefined
            ? { completedAt: updates.completedAt }
            : {}),
          ...(updates.startedAt !== undefined
            ? { startedAt: updates.startedAt }
            : {}),
        })
        .where(eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId))
        .returning();

      return row ? mapSessionRow(row) : null;
    },

    async incrementCounters(adoptionSessionId, deltas) {
      const session = await database
        .select()
        .from(medicalAdoptionSessions)
        .where(eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId))
        .limit(1);

      const current = session[0];
      if (!current) {
        return null;
      }

      const now = new Date();
      const [row] = await database
        .update(medicalAdoptionSessions)
        .set({
          adoptedCount: current.adoptedCount + (deltas.adoptedCount ?? 0),
          skippedCount: current.skippedCount + (deltas.skippedCount ?? 0),
          failedCount: current.failedCount + (deltas.failedCount ?? 0),
          updatedAt: now,
        })
        .where(eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId))
        .returning();

      return row ? mapSessionRow(row) : null;
    },
  };
}
