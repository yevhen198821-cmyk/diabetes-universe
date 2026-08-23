-- P10 medical adoption foundation (sessions + mappings)

CREATE TABLE IF NOT EXISTS medical.medical_adoption_sessions (
  adoption_session_id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES medical.medical_subjects (subject_id) ON DELETE RESTRICT,
  actor_account_id text NOT NULL,
  client_adoption_run_id text NOT NULL,
  source_platform text NOT NULL,
  source_app_version text NOT NULL,
  source_schema_min smallint NOT NULL,
  source_schema_max smallint NOT NULL,
  lifecycle_state text NOT NULL CHECK (
    lifecycle_state IN ('open', 'failed', 'completed', 'cancelled')
  ),
  eligible_count integer NOT NULL DEFAULT 0 CHECK (eligible_count >= 0),
  adopted_count integer NOT NULL DEFAULT 0 CHECK (adopted_count >= 0),
  skipped_count integer NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  created_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_adoption_sessions_account_run
  ON medical.medical_adoption_sessions (actor_account_id, client_adoption_run_id);

CREATE INDEX IF NOT EXISTS medical_adoption_sessions_subject_updated
  ON medical.medical_adoption_sessions (subject_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS medical.medical_adoption_mappings (
  adoption_mapping_id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES medical.medical_subjects (subject_id) ON DELETE RESTRICT,
  source_namespace text NOT NULL,
  local_event_id text NOT NULL,
  canonical_resource_id uuid NOT NULL REFERENCES medical.medical_event_resources (resource_id) ON DELETE RESTRICT,
  canonical_revision bigint NOT NULL,
  source_schema_version smallint NOT NULL,
  payload_fingerprint text NOT NULL,
  adopted_at timestamptz NOT NULL,
  adoption_session_id uuid NOT NULL REFERENCES medical.medical_adoption_sessions (adoption_session_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_adoption_mappings_source_identity
  ON medical.medical_adoption_mappings (subject_id, source_namespace, local_event_id);

CREATE INDEX IF NOT EXISTS medical_adoption_mappings_session
  ON medical.medical_adoption_mappings (adoption_session_id);

CREATE INDEX IF NOT EXISTS medical_adoption_mappings_canonical_resource
  ON medical.medical_adoption_mappings (canonical_resource_id);
