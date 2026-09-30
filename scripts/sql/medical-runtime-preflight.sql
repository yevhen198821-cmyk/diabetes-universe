-- Read-only platform preflight. No clinical/authentication records are queried.
-- This checks role prerequisites, not the full table-grant/DDL denial matrix.
WITH required(name) AS (
  VALUES ('medical_app'),('medical_migrator'),('medical_deployer'),
         ('medical_maintenance_owner'),('medical_outbox_worker'),
         ('medical_idempotency_maintenance')
), roles AS (
  SELECT wanted.name,role.oid,role.rolcreaterole,role.rolcreatedb,
         role.rolsuper,role.rolbypassrls
  FROM required wanted LEFT JOIN pg_roles role ON role.rolname=wanted.name
), checks(name,passed) AS (
  SELECT 'medical_schema_exists',EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='medical')
  UNION ALL
  SELECT 'required_roles_exist',bool_and(oid IS NOT NULL) FROM roles
  UNION ALL
  SELECT 'runtime_role_not_admin',coalesce(NOT(rolcreaterole OR rolcreatedb OR rolsuper OR rolbypassrls),false)
  FROM roles WHERE name='medical_app'
  UNION ALL
  SELECT 'runtime_cannot_inherit_or_set_privileged_role',NOT EXISTS(
    SELECT 1 FROM roles app JOIN pg_roles target ON target.rolname IN
      ('neon_superuser','medical_migrator','medical_deployer','medical_maintenance_owner')
    WHERE app.name='medical_app' AND app.oid IS NOT NULL
      AND (pg_has_role(app.oid,target.oid,'USAGE') OR pg_has_role(app.oid,target.oid,'SET'))
  )
  UNION ALL
  SELECT 'approved_migrator_can_transfer_ownership',EXISTS(
    SELECT 1 FROM roles actor JOIN roles owner ON owner.name='medical_maintenance_owner'
    WHERE actor.name IN ('medical_migrator','medical_deployer')
      AND actor.oid IS NOT NULL AND owner.oid IS NOT NULL
      AND pg_has_role(actor.oid,owner.oid,'SET')
  )
)
SELECT name,passed FROM checks ORDER BY name;
