-- P9 medical database privilege model (deployment prerequisite).
-- PGlite/local CI may not apply role grants; production Neon must run this after migrations.

-- Runtime application role (request-serving)
-- REVOKE ALL ON SCHEMA medical FROM PUBLIC;

-- GRANT USAGE ON SCHEMA medical TO medical_app;
-- GRANT SELECT, INSERT, UPDATE ON medical.medical_subjects TO medical_app;
-- GRANT SELECT, INSERT, UPDATE ON medical.account_subject_relationships TO medical_app;
-- GRANT SELECT, INSERT, UPDATE ON medical.medical_event_resources TO medical_app;
-- GRANT INSERT ON medical.medical_audit_events TO medical_app;
-- GRANT SELECT, INSERT, UPDATE ON medical.medical_idempotency_records TO medical_app;
-- GRANT INSERT ON medical.medical_outbox_events TO medical_app;

-- Outbox worker (narrow)
-- GRANT SELECT, UPDATE (status, published_at) ON medical.medical_outbox_events TO medical_outbox_worker;

-- Idempotency maintenance (EXECUTE only)
-- GRANT EXECUTE ON FUNCTION medical.purge_expired_idempotency_records(integer) TO medical_idempotency_maintenance;

-- Migrator (deploy/CI only — not granted to runtime roles)
-- GRANT ALL ON SCHEMA medical TO medical_migrator;
