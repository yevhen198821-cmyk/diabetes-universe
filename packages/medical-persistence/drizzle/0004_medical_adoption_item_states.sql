-- P10 durable per-source adoption item outcome state (recoverable failure accounting)

CREATE TABLE IF NOT EXISTS medical.medical_adoption_item_states (
  adoption_item_state_id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES medical.medical_subjects (subject_id) ON DELETE RESTRICT,
  adoption_session_id uuid NOT NULL REFERENCES medical.medical_adoption_sessions (adoption_session_id) ON DELETE RESTRICT,
  source_namespace text NOT NULL,
  local_event_id text NOT NULL,
  payload_fingerprint text NOT NULL,
  state text NOT NULL CHECK (state IN ('failed', 'adopted', 'reconciled')),
  failure_code text,
  canonical_resource_id uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_adoption_item_states_session_source_identity
  ON medical.medical_adoption_item_states (
    subject_id,
    adoption_session_id,
    source_namespace,
    local_event_id
  );

CREATE INDEX IF NOT EXISTS medical_adoption_item_states_session_unresolved
  ON medical.medical_adoption_item_states (subject_id, adoption_session_id)
  WHERE state = 'failed';
