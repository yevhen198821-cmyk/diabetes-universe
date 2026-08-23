import { randomUUID } from 'node:crypto';

import { and, eq, sql } from 'drizzle-orm';

import type {
  AdoptionItemStateKind,
  MedicalAdoptionItemState,
} from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalAdoptionItemStates } from '../database/medical-schema';

export interface AdoptionItemCounterDelta {
  readonly adoptedCount: number;
  readonly skippedCount: number;
  readonly failedCount: number;
}

const ZERO_DELTA: AdoptionItemCounterDelta = {
  adoptedCount: 0,
  skippedCount: 0,
  failedCount: 0,
};

export function createAdoptionSourceIdentityLockKey(
  subjectId: string,
  sourceNamespace: string,
  localEventId: string,
): string {
  return [subjectId, sourceNamespace, localEventId].join('|');
}

function mapItemStateRow(
  row: typeof medicalAdoptionItemStates.$inferSelect,
): MedicalAdoptionItemState {
  return {
    adoptionItemStateId: row.adoptionItemStateId,
    subjectId: row.subjectId,
    adoptionSessionId: row.adoptionSessionId,
    sourceNamespace: row.sourceNamespace,
    localEventId: row.localEventId,
    payloadFingerprint: row.payloadFingerprint,
    state: row.state as AdoptionItemStateKind,
    failureCode: row.failureCode,
    canonicalResourceId: row.canonicalResourceId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function computeAdoptionItemCounterDelta(
  previous: AdoptionItemStateKind | null,
  next: AdoptionItemStateKind,
): AdoptionItemCounterDelta {
  if (previous === next) {
    return ZERO_DELTA;
  }

  if (previous === null) {
    if (next === 'failed') {
      return { adoptedCount: 0, skippedCount: 0, failedCount: 1 };
    }
    if (next === 'adopted') {
      return { adoptedCount: 1, skippedCount: 0, failedCount: 0 };
    }
    return { adoptedCount: 0, skippedCount: 1, failedCount: 0 };
  }

  if (previous === 'failed') {
    if (next === 'adopted') {
      return { adoptedCount: 1, skippedCount: 0, failedCount: -1 };
    }
    if (next === 'reconciled') {
      return { adoptedCount: 0, skippedCount: 1, failedCount: -1 };
    }
    return ZERO_DELTA;
  }

  return ZERO_DELTA;
}

export interface RecordAdoptionItemOutcomeInput {
  readonly subjectId: string;
  readonly adoptionSessionId: string;
  readonly sourceNamespace: string;
  readonly localEventId: string;
  readonly payloadFingerprint: string;
  readonly outcome: AdoptionItemStateKind;
  readonly failureCode?: string | null;
  readonly canonicalResourceId?: string | null;
}

export interface AdoptionItemStateRepository {
  countUnresolved(
    subjectId: string,
    adoptionSessionId: string,
  ): Promise<number>;
  recordOutcome(
    input: RecordAdoptionItemOutcomeInput,
  ): Promise<AdoptionItemCounterDelta>;
}

async function recordOutcomeWithinTransaction(
  database: MedicalDatabase,
  input: RecordAdoptionItemOutcomeInput,
): Promise<AdoptionItemCounterDelta> {
  const lockKey = createAdoptionSourceIdentityLockKey(
    input.subjectId,
    input.sourceNamespace,
    input.localEventId,
  );

  await database.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
  );

  const rows = await database
    .select()
    .from(medicalAdoptionItemStates)
    .where(
      and(
        eq(medicalAdoptionItemStates.subjectId, input.subjectId),
        eq(
          medicalAdoptionItemStates.adoptionSessionId,
          input.adoptionSessionId,
        ),
        eq(medicalAdoptionItemStates.sourceNamespace, input.sourceNamespace),
        eq(medicalAdoptionItemStates.localEventId, input.localEventId),
      ),
    )
    .for('update');

  const existing = rows[0] ? mapItemStateRow(rows[0]) : null;
  const previous = existing?.state ?? null;

  if (
    existing &&
    (previous === 'adopted' || previous === 'reconciled') &&
    input.outcome === 'failed'
  ) {
    return ZERO_DELTA;
  }

  const delta = computeAdoptionItemCounterDelta(previous, input.outcome);
  const now = new Date();

  if (existing) {
    if (previous === input.outcome) {
      await database
        .update(medicalAdoptionItemStates)
        .set({
          payloadFingerprint: input.payloadFingerprint,
          failureCode:
            input.outcome === 'failed'
              ? (input.failureCode ?? existing.failureCode)
              : null,
          canonicalResourceId:
            input.canonicalResourceId ?? existing.canonicalResourceId,
          updatedAt: now,
        })
        .where(
          eq(
            medicalAdoptionItemStates.adoptionItemStateId,
            existing.adoptionItemStateId,
          ),
        );
      return ZERO_DELTA;
    }

    await database
      .update(medicalAdoptionItemStates)
      .set({
        payloadFingerprint: input.payloadFingerprint,
        state: input.outcome,
        failureCode:
          input.outcome === 'failed' ? (input.failureCode ?? null) : null,
        canonicalResourceId: input.canonicalResourceId ?? null,
        updatedAt: now,
      })
      .where(
        eq(
          medicalAdoptionItemStates.adoptionItemStateId,
          existing.adoptionItemStateId,
        ),
      );

    return delta;
  }

  await database.insert(medicalAdoptionItemStates).values({
    adoptionItemStateId: randomUUID(),
    subjectId: input.subjectId,
    adoptionSessionId: input.adoptionSessionId,
    sourceNamespace: input.sourceNamespace,
    localEventId: input.localEventId,
    payloadFingerprint: input.payloadFingerprint,
    state: input.outcome,
    failureCode:
      input.outcome === 'failed' ? (input.failureCode ?? null) : null,
    canonicalResourceId: input.canonicalResourceId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return delta;
}

export function createAdoptionItemStateRepository(
  database: MedicalDatabase,
): AdoptionItemStateRepository {
  return {
    async countUnresolved(subjectId, adoptionSessionId) {
      const rows = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(medicalAdoptionItemStates)
        .where(
          and(
            eq(medicalAdoptionItemStates.subjectId, subjectId),
            eq(medicalAdoptionItemStates.adoptionSessionId, adoptionSessionId),
            eq(medicalAdoptionItemStates.state, 'failed'),
          ),
        );

      return rows[0]?.count ?? 0;
    },

    async recordOutcome(input) {
      return database.transaction(async (tx) =>
        recordOutcomeWithinTransaction(tx, input),
      );
    },
  };
}
