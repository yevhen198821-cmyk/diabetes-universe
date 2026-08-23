import { randomUUID } from 'node:crypto';

import { and, eq, inArray, sql } from 'drizzle-orm';

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
  transitionLifecycle(
    subjectId: string,
    adoptionSessionId: string,
    fromStates: readonly AdoptionSessionLifecycleState[],
    toState: AdoptionSessionLifecycleState,
    updates?: {
      completedAt?: Date | null;
      startedAt?: Date | null;
    },
  ): Promise<MedicalAdoptionSession | null>;
  incrementCounters(
    subjectId: string,
    adoptionSessionId: string,
    deltas: {
      adoptedCount?: number;
      skippedCount?: number;
      failedCount?: number;
    },
  ): Promise<MedicalAdoptionSession | null>;
  lockSessionLifecycleForUpdate(
    subjectId: string,
    adoptionSessionId: string,
  ): Promise<AdoptionSessionLifecycleState | null>;
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

    async transitionLifecycle(
      subjectId,
      adoptionSessionId,
      fromStates,
      toState,
      updates = {},
    ) {
      const now = new Date();
      const [row] = await database
        .update(medicalAdoptionSessions)
        .set({
          lifecycleState: toState,
          updatedAt: now,
          ...(updates.completedAt !== undefined
            ? { completedAt: updates.completedAt }
            : {}),
          ...(updates.startedAt !== undefined
            ? { startedAt: updates.startedAt }
            : {}),
        })
        .where(
          and(
            eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId),
            eq(medicalAdoptionSessions.subjectId, subjectId),
            inArray(medicalAdoptionSessions.lifecycleState, [...fromStates]),
          ),
        )
        .returning();

      return row ? mapSessionRow(row) : null;
    },

    async incrementCounters(subjectId, adoptionSessionId, deltas) {
      const adoptedDelta = deltas.adoptedCount ?? 0;
      const skippedDelta = deltas.skippedCount ?? 0;
      const failedDelta = deltas.failedCount ?? 0;

      if (adoptedDelta === 0 && skippedDelta === 0 && failedDelta === 0) {
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
      }

      const [row] = await database
        .update(medicalAdoptionSessions)
        .set({
          adoptedCount: sql`${medicalAdoptionSessions.adoptedCount} + ${adoptedDelta}`,
          skippedCount: sql`${medicalAdoptionSessions.skippedCount} + ${skippedDelta}`,
          failedCount: sql`${medicalAdoptionSessions.failedCount} + ${failedDelta}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId),
            eq(medicalAdoptionSessions.subjectId, subjectId),
          ),
        )
        .returning();

      return row ? mapSessionRow(row) : null;
    },

    async lockSessionLifecycleForUpdate(subjectId, adoptionSessionId) {
      const rows = await database
        .select({ lifecycleState: medicalAdoptionSessions.lifecycleState })
        .from(medicalAdoptionSessions)
        .where(
          and(
            eq(medicalAdoptionSessions.adoptionSessionId, adoptionSessionId),
            eq(medicalAdoptionSessions.subjectId, subjectId),
          ),
        )
        .for('update');

      return rows[0]
        ? (rows[0].lifecycleState as AdoptionSessionLifecycleState)
        : null;
    },
  };
}
