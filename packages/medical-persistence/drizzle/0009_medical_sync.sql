-- Dedicated commit-ordered subject feed. Row-locking the subject counter makes
-- sequence allocation and publication atomic with every event mutation.
BEGIN;
CREATE TABLE IF NOT EXISTS medical.sync_subject_heads (
  subject_id UUID PRIMARY KEY REFERENCES medical.medical_subjects(subject_id),
  sequence BIGINT NOT NULL DEFAULT 0 CHECK(sequence >= 0)
);
CREATE TABLE IF NOT EXISTS medical.sync_changes (
  subject_id UUID NOT NULL REFERENCES medical.medical_subjects(subject_id),
  sequence BIGINT NOT NULL,
  resource_id UUID NOT NULL,
  revision BIGINT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  lifecycle_state TEXT NOT NULL CHECK(lifecycle_state IN ('active','deleted')),
  PRIMARY KEY(subject_id,sequence)
);
CREATE TABLE IF NOT EXISTS medical.sync_mutation_outcomes (
  account_id TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES medical.medical_subjects(subject_id),
  mutation_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  outcome JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,subject_id,mutation_id)
);
CREATE OR REPLACE FUNCTION medical.record_sync_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, medical AS $$
DECLARE next_sequence BIGINT;
BEGIN
  INSERT INTO medical.sync_subject_heads(subject_id,sequence) VALUES(NEW.subject_id,1)
  ON CONFLICT(subject_id) DO UPDATE SET sequence=medical.sync_subject_heads.sequence+1
  RETURNING sequence INTO next_sequence;
  INSERT INTO medical.sync_changes(subject_id,sequence,resource_id,revision,changed_at,lifecycle_state)
  VALUES(NEW.subject_id,next_sequence,NEW.resource_id,NEW.revision,NEW.updated_at,NEW.lifecycle_state);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION medical.record_sync_change() FROM PUBLIC;
DROP TRIGGER IF EXISTS medical_event_sync_change ON medical.medical_event_resources;
CREATE TRIGGER medical_event_sync_change AFTER INSERT OR UPDATE ON medical.medical_event_resources
FOR EACH ROW EXECUTE FUNCTION medical.record_sync_change();
-- Seed the existing canonical state once; never expose an active-only bootstrap.
INSERT INTO medical.sync_subject_heads(subject_id,sequence)
SELECT subject_id,count(*) FROM medical.medical_event_resources GROUP BY subject_id
ON CONFLICT(subject_id) DO NOTHING;
INSERT INTO medical.sync_changes(subject_id,sequence,resource_id,revision,changed_at,lifecycle_state)
SELECT subject_id,row_number() OVER(PARTITION BY subject_id ORDER BY created_at,resource_id),resource_id,revision,updated_at,lifecycle_state
FROM medical.medical_event_resources e
WHERE NOT EXISTS(SELECT 1 FROM medical.sync_changes c WHERE c.subject_id=e.subject_id)
ON CONFLICT DO NOTHING;
COMMIT;
