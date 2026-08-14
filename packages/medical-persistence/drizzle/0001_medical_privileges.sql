-- P9 medical privilege deployment (mandatory for production Neon).
-- PGlite/local CI intentionally skips this script during test bootstrap.
-- Prerequisites: create Neon roles before apply; script fails if roles are missing.

DO $verify_roles$
DECLARE
  role_name text;
  required_roles text[] := ARRAY[
    'medical_app',
    'medical_outbox_worker',
    'medical_idempotency_maintenance',
    'medical_maintenance_owner'
  ];
BEGIN
  FOREACH role_name IN ARRAY required_roles
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      RAISE EXCEPTION
        'Required role "%" does not exist. Create Neon medical roles before applying medical privileges (0001_medical_privileges.sql).',
        role_name;
    END IF;
  END LOOP;
END $verify_roles$;

-- Baseline PUBLIC lockdown on medical schema
REVOKE ALL ON SCHEMA medical FROM PUBLIC;
REVOKE CREATE ON SCHEMA medical FROM PUBLIC;

REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA medical FROM PUBLIC;

-- SECURITY DEFINER purge function: isolated owner, no PUBLIC execute
ALTER FUNCTION medical.purge_expired_idempotency_records(integer)
  OWNER TO medical_maintenance_owner;

REVOKE ALL ON FUNCTION medical.purge_expired_idempotency_records(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION medical.purge_expired_idempotency_records(integer)
  TO medical_idempotency_maintenance;

-- medical_maintenance_owner: narrow DELETE for definer function only (not a caller role)
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_maintenance_owner;
GRANT USAGE ON SCHEMA medical TO medical_maintenance_owner;
GRANT DELETE ON TABLE medical.medical_idempotency_records TO medical_maintenance_owner;

-- medical_app: table-specific runtime grants; no DELETE, no DDL
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_app;
GRANT USAGE ON SCHEMA medical TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_subjects TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.account_subject_relationships TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_event_resources TO medical_app;
GRANT INSERT ON TABLE medical.medical_audit_events TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_idempotency_records TO medical_app;
GRANT INSERT ON TABLE medical.medical_outbox_events TO medical_app;

-- medical_outbox_worker: narrow outbox publication access only
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_outbox_worker;
GRANT USAGE ON SCHEMA medical TO medical_outbox_worker;
GRANT SELECT ON TABLE medical.medical_outbox_events TO medical_outbox_worker;
GRANT UPDATE (status, published_at) ON TABLE medical.medical_outbox_events
  TO medical_outbox_worker;

-- medical_idempotency_maintenance: EXECUTE on purge function only
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_idempotency_maintenance;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM medical_idempotency_maintenance;

-- medical_migrator is deploy/CI-only: objects are owned by the migrator connection user.
-- Do not grant blanket ALL ON SCHEMA to medical_migrator for runtime convenience.
DO $migrator_default_privileges$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'medical_migrator') THEN
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON TABLES FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON FUNCTIONS FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON SEQUENCES FROM PUBLIC;

    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON TABLES FROM medical_app;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON FUNCTIONS FROM medical_app;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON TABLES FROM medical_outbox_worker;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON FUNCTIONS FROM medical_outbox_worker;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON TABLES FROM medical_idempotency_maintenance;
    ALTER DEFAULT PRIVILEGES FOR ROLE medical_migrator IN SCHEMA medical
      REVOKE ALL ON FUNCTIONS FROM medical_idempotency_maintenance;
  END IF;
END $migrator_default_privileges$;
