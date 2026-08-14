import { randomUUID } from 'node:crypto';

import { and, desc, eq, lt, or, sql } from 'drizzle-orm';

import {
  INITIAL_MEDICAL_REVISION,
  incrementMedicalRevision,
  mapRowToMedicalEventResource,
  projectEventKind,
  projectEventObservedAt,
  projectSchemaVersion,
  projectSourceLabel,
  toServerSemanticEvent,
  type MedicalEventResource,
  type MedicalEventResourceInsert,
  type MedicalEventResourcePatch,
  type MedicalRevision,
} from '@diabetes-universe/medical-domain';

import type { MedicalDatabase } from '../database/create-medical-database';
import { medicalEventResources } from '../database/medical-schema';

export interface KeysetListCursor {
  readonly eventObservedAt: Date;
  readonly resourceId: string;
}

export interface KeysetListQuery {
  readonly subjectId: string;
  readonly limit: number;
  readonly traversalStartedAt: Date;
  readonly cursor?: KeysetListCursor;
}

export interface MedicalEventRepository {
  getByResourceId(
    subjectId: string,
    resourceId: string,
  ): Promise<MedicalEventResource | null>;
  listKeyset(query: KeysetListQuery): Promise<readonly MedicalEventResource[]>;
  insert(
    subjectId: string,
    input: MedicalEventResourceInsert,
  ): Promise<MedicalEventResource>;
  updateWithRevision(
    subjectId: string,
    resourceId: string,
    expectedRevision: MedicalRevision,
    patch: MedicalEventResourcePatch,
  ): Promise<MedicalEventResource | null>;
  markDeletedWithRevision(
    subjectId: string,
    resourceId: string,
    expectedRevision: MedicalRevision,
    actorAccountId: string,
  ): Promise<MedicalEventResource | null>;
}

export function createMedicalEventRepository(
  database: MedicalDatabase,
): MedicalEventRepository {
  return {
    async getByResourceId(subjectId, resourceId) {
      const rows = await database
        .select()
        .from(medicalEventResources)
        .where(
          and(
            eq(medicalEventResources.subjectId, subjectId),
            eq(medicalEventResources.resourceId, resourceId),
            eq(medicalEventResources.lifecycleState, 'active'),
          ),
        )
        .limit(1);

      const row = rows[0];
      return row ? mapRowToMedicalEventResource(row) : null;
    },

    async listKeyset(query) {
      const predicates = [
        eq(medicalEventResources.subjectId, query.subjectId),
        eq(medicalEventResources.lifecycleState, 'active'),
        sql`${medicalEventResources.updatedAt} <= ${query.traversalStartedAt}`,
      ];

      if (query.cursor) {
        predicates.push(
          or(
            lt(
              medicalEventResources.eventObservedAt,
              query.cursor.eventObservedAt,
            ),
            and(
              eq(
                medicalEventResources.eventObservedAt,
                query.cursor.eventObservedAt,
              ),
              lt(medicalEventResources.resourceId, query.cursor.resourceId),
            ),
          )!,
        );
      }

      const rows = await database
        .select()
        .from(medicalEventResources)
        .where(and(...predicates))
        .orderBy(
          desc(medicalEventResources.eventObservedAt),
          desc(medicalEventResources.resourceId),
        )
        .limit(query.limit);

      return rows.map((row) => mapRowToMedicalEventResource(row));
    },

    async insert(subjectId, input) {
      const semanticEvent = toServerSemanticEvent(input.semanticEvent);
      const now = new Date();
      const resourceId = randomUUID();

      const [row] = await database
        .insert(medicalEventResources)
        .values({
          resourceId,
          subjectId,
          lifecycleState: 'active',
          revision: INITIAL_MEDICAL_REVISION,
          eventObservedAt: projectEventObservedAt(semanticEvent),
          eventKind: projectEventKind(semanticEvent),
          schemaVersion: projectSchemaVersion(semanticEvent),
          semanticEvent,
          sourceLabel: projectSourceLabel(semanticEvent),
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          createdByAccountId: input.createdByAccountId,
          updatedByAccountId: input.createdByAccountId,
        })
        .returning();

      return mapRowToMedicalEventResource(row);
    },

    async updateWithRevision(subjectId, resourceId, expectedRevision, patch) {
      const semanticEvent = toServerSemanticEvent(patch.semanticEvent);
      const now = new Date();

      const rows = await database
        .update(medicalEventResources)
        .set({
          semanticEvent,
          eventObservedAt: projectEventObservedAt(semanticEvent),
          eventKind: projectEventKind(semanticEvent),
          schemaVersion: projectSchemaVersion(semanticEvent),
          sourceLabel: projectSourceLabel(semanticEvent),
          revision: incrementMedicalRevision(expectedRevision),
          updatedAt: now,
          updatedByAccountId: patch.updatedByAccountId,
        })
        .where(
          and(
            eq(medicalEventResources.subjectId, subjectId),
            eq(medicalEventResources.resourceId, resourceId),
            eq(medicalEventResources.revision, expectedRevision),
            eq(medicalEventResources.lifecycleState, 'active'),
          ),
        )
        .returning();

      return rows[0] ? mapRowToMedicalEventResource(rows[0]) : null;
    },

    async markDeletedWithRevision(
      subjectId,
      resourceId,
      expectedRevision,
      actorAccountId,
    ) {
      const now = new Date();

      const rows = await database
        .update(medicalEventResources)
        .set({
          lifecycleState: 'deleted',
          deletedAt: now,
          updatedAt: now,
          updatedByAccountId: actorAccountId,
          revision: incrementMedicalRevision(expectedRevision),
        })
        .where(
          and(
            eq(medicalEventResources.subjectId, subjectId),
            eq(medicalEventResources.resourceId, resourceId),
            eq(medicalEventResources.revision, expectedRevision),
            eq(medicalEventResources.lifecycleState, 'active'),
          ),
        )
        .returning();

      return rows[0] ? mapRowToMedicalEventResource(rows[0]) : null;
    },
  };
}
