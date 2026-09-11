-- P9 medical privilege deployment (mandatory for production Neon).
-- PGlite/local CI intentionally skips this script during test bootstrap.
-- Prerequisites:
--   1. create all required Neon roles, including LOGIN medical_deployer;
--   2. run this script as an approved medical migration actor
--      (medical_migrator or medical_deployer);
--   3. transfer SECURITY DEFINER function ownership with
--      ALTER FUNCTION ... OWNER TO medical_maintenance_owner
--      (requires temporary authority to SET ROLE to the new owner);
--   4. never use medical_deployer or medical_migrator at request runtime.
--
-- Schema/table ownership stays with the approved actor that created the
-- objects (medical_deployer on current Neon production). That is acceptable:
-- the actor is deploy-only, medical_app is not the owner and cannot
-- ALTER/DROP, and PUBLIC remains revoked.

BEGIN;

DO $verify_roles$
DECLARE
  role_name text;
  required_roles text[] := ARRAY[
    'medical_app',
    'medical_outbox_worker',
    'medical_idempotency_maintenance',
    'medical_maintenance_owner',
    'medical_migrator',
    'medical_deployer'
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

  -- isApprovedMedicalMigrationActor(current_user)
  -- Exact allowlist only: medical_migrator, medical_deployer.
  IF NOT (
    current_user = 'medical_migrator'
    OR current_user = 'medical_deployer'
  ) THEN
    RAISE EXCEPTION
      '0001_medical_privileges.sql must execute as an approved medical migration actor (medical_migrator or medical_deployer); current_user is "%".',
      current_user;
  END IF;
  -- ALTER FUNCTION OWNER requires SET authority even without executing SET ROLE.
  -- This is an additional prerequisite, never an alternative actor allowlist.
  IF NOT pg_has_role(current_user, 'medical_maintenance_owner', 'SET') THEN
    RAISE EXCEPTION
      'Ownership-transfer prerequisite missing: approved actor must have temporary SET authority for medical_maintenance_owner. Stop deployment and obtain platform-admin support; do not widen runtime privileges.';
  END IF;
END $verify_roles$;

-- Baseline PUBLIC lockdown on medical schema.
REVOKE ALL ON SCHEMA medical FROM PUBLIC;
REVOKE CREATE ON SCHEMA medical FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA medical FROM PUBLIC;

-- Reset caller privileges before granting the one approved maintenance capability.
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_idempotency_maintenance;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM medical_idempotency_maintenance;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA medical FROM medical_idempotency_maintenance;
REVOKE ALL ON SCHEMA medical FROM medical_idempotency_maintenance;

-- The definer function SELECTs/locks candidate rows and DELETEs them. Its owner therefore
-- needs SELECT + DELETE on this table only. No INSERT/UPDATE and no access to other tables.
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_maintenance_owner;
GRANT USAGE ON SCHEMA medical TO medical_maintenance_owner;
GRANT SELECT, DELETE ON TABLE medical.medical_idempotency_records
  TO medical_maintenance_owner;

-- Maintenance caller: no direct table access; schema USAGE + exactly one EXECUTE grant.
GRANT USAGE ON SCHEMA medical TO medical_idempotency_maintenance;
GRANT EXECUTE ON FUNCTION medical.purge_expired_idempotency_records(integer)
  TO medical_idempotency_maintenance;

-- medical_app: table-specific runtime grants; no DELETE, no DDL.
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_app;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM medical_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA medical FROM medical_app;
REVOKE ALL ON SCHEMA medical FROM medical_app;
GRANT USAGE ON SCHEMA medical TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_subjects TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.account_subject_relationships TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_event_resources TO medical_app;
GRANT INSERT ON TABLE medical.medical_audit_events TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_idempotency_records TO medical_app;
GRANT INSERT ON TABLE medical.medical_outbox_events TO medical_app;

-- medical_outbox_worker: narrow outbox publication access only.
REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM medical_outbox_worker;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM medical_outbox_worker;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA medical FROM medical_outbox_worker;
REVOKE ALL ON SCHEMA medical FROM medical_outbox_worker;
GRANT USAGE ON SCHEMA medical TO medical_outbox_worker;
GRANT SELECT ON TABLE medical.medical_outbox_events TO medical_outbox_worker;
GRANT UPDATE (status, published_at) ON TABLE medical.medical_outbox_events
  TO medical_outbox_worker;

-- Lock default privileges for the current approved actor only. Neon cannot
-- GRANT membership, so medical_deployer cannot ALTER DEFAULT PRIVILEGES FOR
-- ROLE medical_migrator (and the reverse). Do not grant blanket ALL ON SCHEMA
-- to either deploy actor for runtime convenience.
DO $lock_default_privileges$
BEGIN
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON TABLES FROM PUBLIC',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON FUNCTIONS FROM PUBLIC',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON SEQUENCES FROM PUBLIC',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON TABLES FROM medical_app',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON FUNCTIONS FROM medical_app',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON TABLES FROM medical_outbox_worker',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON FUNCTIONS FROM medical_outbox_worker',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON TABLES FROM medical_idempotency_maintenance',
    current_user
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA medical REVOKE ALL ON FUNCTIONS FROM medical_idempotency_maintenance',
    current_user
  );
END $lock_default_privileges$;

-- PostgreSQL requires the new function owner to have CREATE on the containing schema.
-- Grant it only inside this transaction, transfer ownership, then immediately revoke it.
-- No SET ROLE / persistent membership in medical_maintenance_owner is required.
GRANT CREATE ON SCHEMA medical TO medical_maintenance_owner;
ALTER FUNCTION medical.purge_expired_idempotency_records(integer)
  OWNER TO medical_maintenance_owner;
REVOKE CREATE ON SCHEMA medical FROM medical_maintenance_owner;

-- PUBLIC execute was revoked by 0000 while the migration actor owned the function and the ACL
-- survives ownership transfer. Keep the explicit assertion in the live privilege smoke.

COMMIT;
