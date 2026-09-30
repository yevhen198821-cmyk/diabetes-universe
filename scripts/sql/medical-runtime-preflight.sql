-- Read-only catalog preflight. No clinical/authentication records are queried.
-- Default: original role names, post-deployment runtime checks.
-- For SQL-created Neon roles, SET du.medical_role_profile = 'neon-sql' in this session.
-- During ownership transfer only, SET du.medical_preflight_phase = 'deployment'.
-- The default runtime phase requires temporary SET access to be removed.
WITH config AS (
  SELECT coalesce(nullif(current_setting('du.medical_role_profile',true),''),'standard') AS profile,
         coalesce(nullif(current_setting('du.medical_preflight_phase',true),''),'runtime') AS phase
), required(key) AS (
  VALUES ('medical_app'),('medical_migrator'),('medical_deployer'),
         ('medical_maintenance_owner'),('medical_outbox_worker'),
         ('medical_idempotency_maintenance')
), bound AS (
  SELECT key,CASE WHEN config.profile='neon-sql' AND key NOT IN ('medical_migrator','medical_deployer')
    THEN 'du_'||key ELSE key END AS name
  FROM required CROSS JOIN config
), roles AS (
  SELECT wanted.key,wanted.name,role.oid,role.rolcreaterole,role.rolcreatedb,
         role.rolsuper,role.rolbypassrls,role.rolcanlogin
  FROM bound wanted LEFT JOIN pg_roles role ON role.rolname=wanted.name
), checks(name,passed) AS (
  SELECT 'known_role_profile_and_phase',profile IN ('standard','neon-sql') AND phase IN ('runtime','deployment') FROM config
  UNION ALL
  SELECT 'medical_schemas_exist',to_regnamespace('medical') IS NOT NULL AND to_regnamespace('medical_ops') IS NOT NULL
  UNION ALL
  SELECT 'required_roles_exist',bool_and(oid IS NOT NULL) FROM roles
  UNION ALL
  SELECT 'used_roles_not_admin',bool_and(coalesce(NOT(rolcreaterole OR rolcreatedb OR rolsuper OR rolbypassrls),false))
  FROM roles CROSS JOIN config WHERE NOT(config.profile='neon-sql' AND key='medical_migrator')
  UNION ALL
  SELECT 'used_roles_cannot_inherit_or_set_admin',NOT EXISTS(
    SELECT 1 FROM roles source CROSS JOIN config JOIN pg_roles target
      ON target.rolsuper OR target.rolcreaterole OR target.rolcreatedb OR target.rolbypassrls OR target.rolname='neon_superuser'
    WHERE NOT(config.profile='neon-sql' AND source.key='medical_migrator') AND source.oid IS NOT NULL
      AND (pg_has_role(source.oid,target.oid,'USAGE') OR pg_has_role(source.oid,target.oid,'SET'))
  )
  UNION ALL
  SELECT 'runtime_cannot_assume_medical_privileged_roles',NOT EXISTS(
    SELECT 1 FROM roles app JOIN roles target ON target.key <> 'medical_app'
    WHERE app.key='medical_app' AND app.oid IS NOT NULL AND target.oid IS NOT NULL
      AND (pg_has_role(app.oid,target.oid,'USAGE') OR pg_has_role(app.oid,target.oid,'SET'))
  )
  UNION ALL
  SELECT 'runtime_login_and_maintenance_nologin',coalesce(bool_and(CASE
    WHEN key IN ('medical_app','medical_deployer') THEN rolcanlogin
    WHEN key='medical_maintenance_owner' THEN NOT rolcanlogin ELSE true END),false) FROM roles
  UNION ALL
  SELECT 'ownership_transfer_authority_matches_phase',CASE WHEN phase='deployment' THEN EXISTS(
    SELECT 1 FROM roles actor JOIN roles owner ON owner.key='medical_maintenance_owner'
    WHERE actor.key='medical_deployer' AND actor.oid IS NOT NULL AND owner.oid IS NOT NULL
      AND pg_has_role(actor.oid,owner.oid,'SET')
  ) ELSE NOT EXISTS(
    SELECT 1 FROM roles actor JOIN roles owner ON owner.key='medical_maintenance_owner'
    WHERE actor.key IN ('medical_migrator','medical_deployer') AND actor.oid IS NOT NULL AND owner.oid IS NOT NULL
      AND (pg_has_role(actor.oid,owner.oid,'SET') OR pg_has_role(actor.oid,owner.oid,'USAGE'))
  ) END FROM config
)
SELECT name,passed FROM checks ORDER BY name;
