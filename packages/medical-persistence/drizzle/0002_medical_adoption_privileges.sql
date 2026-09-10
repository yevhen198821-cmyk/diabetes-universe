-- P10 medical adoption privilege deployment (mandatory for production Neon).
-- PGlite/local CI intentionally skips this script during test bootstrap.
-- Prerequisites: same approved medical migration actor policy as 0001.

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
        'Required role "%" does not exist. Create Neon medical roles before applying adoption privileges.',
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
      '0002_medical_adoption_privileges.sql must execute as an approved medical migration actor (medical_migrator or medical_deployer); current_user is "%".',
      current_user;
  END IF;
END $verify_roles$;

REVOKE ALL ON TABLE medical.medical_adoption_sessions FROM PUBLIC;
REVOKE ALL ON TABLE medical.medical_adoption_mappings FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON TABLE medical.medical_adoption_sessions TO medical_app;
GRANT SELECT, INSERT ON TABLE medical.medical_adoption_mappings TO medical_app;

COMMIT;
