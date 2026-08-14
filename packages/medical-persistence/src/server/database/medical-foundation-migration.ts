/**
 * Medical persistence foundation migration (P9).
 *
 * Applied automatically for PGlite test/runtime bootstrap.
 * Production postgres applies `drizzle/0000_medical_foundation.sql` via migrator role.
 */
export const MEDICAL_FOUNDATION_MIGRATION_SQL = `
CREATE SCHEMA IF NOT EXISTS medical;

CREATE TABLE IF NOT EXISTS medical.medical_subjects (
  subject_id UUID PRIMARY KEY,
  subject_kind TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'retired')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS medical.account_subject_relationships (
  relationship_id UUID PRIMARY KEY,
  account_id TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES medical.medical_subjects(subject_id) ON DELETE RESTRICT,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS account_subject_one_active_self
  ON medical.account_subject_relationships (account_id)
  WHERE relationship_type = 'self' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS account_subject_one_active_self_subject
  ON medical.account_subject_relationships (subject_id)
  WHERE relationship_type = 'self' AND status = 'active';

CREATE INDEX IF NOT EXISTS account_subject_relationships_subject_status
  ON medical.account_subject_relationships (subject_id, status);

CREATE TABLE IF NOT EXISTS medical.medical_event_resources (
  resource_id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES medical.medical_subjects(subject_id) ON DELETE RESTRICT,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'deleted')),
  revision BIGINT NOT NULL CHECK (revision > 0),
  event_observed_at TIMESTAMPTZ NOT NULL,
  event_kind TEXT NOT NULL,
  schema_version SMALLINT NOT NULL,
  semantic_event JSONB NOT NULL,
  source_label TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_by_account_id TEXT NOT NULL,
  updated_by_account_id TEXT NOT NULL,
  CHECK (
  (lifecycle_state = 'active' AND deleted_at IS NULL)
  OR (lifecycle_state = 'deleted' AND deleted_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_event_resources_subject_resource
  ON medical.medical_event_resources (subject_id, resource_id);

CREATE INDEX IF NOT EXISTS medical_event_resources_subject_active_list
  ON medical.medical_event_resources (subject_id, event_observed_at DESC, resource_id DESC)
  WHERE lifecycle_state = 'active';

CREATE INDEX IF NOT EXISTS medical_event_resources_subject_active_updated
  ON medical.medical_event_resources (subject_id, updated_at)
  WHERE lifecycle_state = 'active';

CREATE TABLE IF NOT EXISTS medical.medical_idempotency_records (
  idempotency_record_id UUID PRIMARY KEY,
  account_id TEXT NOT NULL,
  subject_id UUID NOT NULL,
  api_version TEXT NOT NULL,
  operation_scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  result_resource_id UUID NOT NULL,
  result_revision BIGINT NOT NULL,
  result_etag_token TEXT NOT NULL,
  stored_http_status SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_idempotency_scope_key
  ON medical.medical_idempotency_records (
    account_id, subject_id, api_version, operation_scope, idempotency_key
  );

CREATE INDEX IF NOT EXISTS medical_idempotency_records_expires_at
  ON medical.medical_idempotency_records (expires_at);

CREATE TABLE IF NOT EXISTS medical.medical_audit_events (
  audit_id UUID PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_account_id TEXT NOT NULL,
  subject_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  outcome TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  detail JSONB
);

CREATE INDEX IF NOT EXISTS medical_audit_events_subject_occurred
  ON medical.medical_audit_events (subject_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS medical_audit_events_actor_occurred
  ON medical.medical_audit_events (actor_account_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS medical_audit_events_correlation
  ON medical.medical_audit_events (correlation_id);

CREATE TABLE IF NOT EXISTS medical.medical_outbox_events (
  outbox_id UUID PRIMARY KEY,
  subject_id UUID NOT NULL,
  resource_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'published', 'failed')),
  created_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS medical_outbox_events_status_created
  ON medical.medical_outbox_events (status, created_at);

CREATE OR REPLACE FUNCTION medical.purge_expired_idempotency_records(p_batch_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = medical, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_deleted integer;
BEGIN
  v_limit := LEAST(GREATEST(p_batch_limit, 1), 10000);
  WITH doomed AS (
    SELECT idempotency_record_id
    FROM medical.medical_idempotency_records
    WHERE expires_at < NOW()
    ORDER BY expires_at
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM medical.medical_idempotency_records r
  USING doomed d
  WHERE r.idempotency_record_id = d.idempotency_record_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
`;
