BEGIN;
DO $$ BEGIN
  IF current_user NOT IN ('medical_migrator','medical_deployer') THEN
    RAISE EXCEPTION 'Medical sync privileges require an approved migration actor';
  END IF;
END $$;
REVOKE ALL ON medical.sync_subject_heads,medical.sync_changes,medical.sync_mutation_outcomes FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON medical.sync_subject_heads TO medical_app;
GRANT SELECT,INSERT ON medical.sync_changes,medical.sync_mutation_outcomes TO medical_app;
GRANT EXECUTE ON FUNCTION medical.record_sync_change() TO medical_app;
COMMIT;
