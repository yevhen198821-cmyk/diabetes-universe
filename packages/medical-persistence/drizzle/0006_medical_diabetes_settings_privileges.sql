-- Wave 2 diabetes settings privilege deployment (mandatory for production Neon).
-- PGlite/local CI intentionally skips this script during test bootstrap.

BEGIN;

DO $verify_roles$
DECLARE
  role_name text;
  required_roles text[] := ARRAY[
    'medical_app',
    'medical_outbox_worker',
    'medical_idempotency_maintenance',
    'medical_maintenance_owner',
    'medical_migrator'
  ];
BEGIN
  FOREACH role_name IN ARRAY required_roles
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      RAISE EXCEPTION
        'Required role "%" does not exist. Create Neon medical roles before applying diabetes settings privileges.',
        role_name;
    END IF;
  END LOOP;

  IF current_user <> 'medical_migrator' THEN
    RAISE EXCEPTION
      '0006_medical_diabetes_settings_privileges.sql must execute as medical_migrator; current_user is "%".',
      current_user;
  END IF;
END $verify_roles$;

REVOKE ALL ON TABLE medical.diabetes_settings FROM PUBLIC;
REVOKE ALL ON TABLE medical.glucose_target_profiles FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE ON TABLE medical.diabetes_settings TO medical_app;
GRANT SELECT, INSERT, UPDATE ON TABLE medical.glucose_target_profiles TO medical_app;

COMMIT;
