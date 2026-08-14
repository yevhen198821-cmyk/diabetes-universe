import {
  bigint,
  jsonb,
  pgSchema,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export const medical = pgSchema('medical');

export const medicalSubjects = medical.table('medical_subjects', {
  subjectId: uuid('subject_id').primaryKey(),
  subjectKind: text('subject_kind').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const accountSubjectRelationships = medical.table(
  'account_subject_relationships',
  {
    relationshipId: uuid('relationship_id').primaryKey(),
    accountId: text('account_id').notNull(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => medicalSubjects.subjectId, { onDelete: 'restrict' }),
    relationshipType: text('relationship_type').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
);

export const medicalEventResources = medical.table('medical_event_resources', {
  resourceId: uuid('resource_id').primaryKey(),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => medicalSubjects.subjectId, { onDelete: 'restrict' }),
  lifecycleState: text('lifecycle_state').notNull(),
  revision: bigint('revision', { mode: 'number' }).notNull(),
  eventObservedAt: timestamp('event_observed_at', {
    withTimezone: true,
  }).notNull(),
  eventKind: text('event_kind').notNull(),
  schemaVersion: smallint('schema_version').notNull(),
  semanticEvent: jsonb('semantic_event')
    .$type<SemanticTimelineEvent>()
    .notNull(),
  sourceLabel: text('source_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdByAccountId: text('created_by_account_id').notNull(),
  updatedByAccountId: text('updated_by_account_id').notNull(),
});

export const medicalIdempotencyRecords = medical.table(
  'medical_idempotency_records',
  {
    idempotencyRecordId: uuid('idempotency_record_id').primaryKey(),
    accountId: text('account_id').notNull(),
    subjectId: uuid('subject_id').notNull(),
    apiVersion: text('api_version').notNull(),
    operationScope: text('operation_scope').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    requestFingerprint: text('request_fingerprint').notNull(),
    resultResourceId: uuid('result_resource_id').notNull(),
    resultRevision: bigint('result_revision', { mode: 'number' }).notNull(),
    resultEtagToken: text('result_etag_token').notNull(),
    storedHttpStatus: smallint('stored_http_status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
);

export const medicalAuditEvents = medical.table('medical_audit_events', {
  auditId: uuid('audit_id').primaryKey(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  actorAccountId: text('actor_account_id').notNull(),
  subjectId: uuid('subject_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  outcome: text('outcome').notNull(),
  correlationId: text('correlation_id').notNull(),
  detail: jsonb('detail'),
});

export const medicalOutboxEvents = medical.table('medical_outbox_events', {
  outboxId: uuid('outbox_id').primaryKey(),
  subjectId: uuid('subject_id').notNull(),
  resourceId: uuid('resource_id'),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const medicalSchema = {
  medicalSubjects,
  accountSubjectRelationships,
  medicalEventResources,
  medicalIdempotencyRecords,
  medicalAuditEvents,
  medicalOutboxEvents,
};
