import postgres from 'postgres';

const connectionString = process.env.MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL;

if (!connectionString) {
  console.error('MEDICAL_PRIVILEGE_SMOKE_DATABASE_URL is required.');
  process.exit(2);
}

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  idle_timeout: 2,
  connect_timeout: 10,
});

const expectedRoles = [
  'medical_app',
  'medical_outbox_worker',
  'medical_idempotency_maintenance',
  'medical_maintenance_owner',
  'medical_migrator',
];

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

try {
  const [environment] = await sql`
    SELECT
      current_database() AS database_name,
      current_user AS current_user,
      to_regnamespace('medical') IS NOT NULL AS medical_schema_exists
  `;

  assert(environment.medical_schema_exists, 'medical schema is missing');

  const roles = await sql`
    SELECT rolname
    FROM pg_roles
    WHERE rolname = ANY(${expectedRoles})
    ORDER BY rolname
  `;
  const roleNames = new Set(roles.map((row) => row.rolname));
  for (const role of expectedRoles) {
    assert(roleNames.has(role), `required role is missing: ${role}`);
  }

  if (environment.medical_schema_exists && roleNames.size === expectedRoles.length) {
    const [checks] = await sql`
      SELECT
        has_schema_privilege('medical_app', 'medical', 'USAGE') AS app_schema_usage,
        has_schema_privilege('medical_app', 'medical', 'CREATE') AS app_schema_create,
        has_table_privilege('medical_app', 'medical.medical_subjects', 'SELECT') AS app_subject_select,
        has_table_privilege('medical_app', 'medical.medical_subjects', 'INSERT') AS app_subject_insert,
        has_table_privilege('medical_app', 'medical.medical_subjects', 'UPDATE') AS app_subject_update,
        has_table_privilege('medical_app', 'medical.medical_subjects', 'DELETE') AS app_subject_delete,
        has_table_privilege('medical_app', 'medical.medical_audit_events', 'INSERT') AS app_audit_insert,
        has_table_privilege('medical_app', 'medical.medical_audit_events', 'SELECT') AS app_audit_select,
        has_table_privilege('medical_app', 'medical.medical_outbox_events', 'INSERT') AS app_outbox_insert,
        has_table_privilege('medical_app', 'medical.medical_outbox_events', 'SELECT') AS app_outbox_select,
        has_table_privilege('medical_outbox_worker', 'medical.medical_outbox_events', 'SELECT') AS worker_outbox_select,
        has_column_privilege('medical_outbox_worker', 'medical.medical_outbox_events', 'status', 'UPDATE') AS worker_status_update,
        has_column_privilege('medical_outbox_worker', 'medical.medical_outbox_events', 'published_at', 'UPDATE') AS worker_published_update,
        has_column_privilege('medical_outbox_worker', 'medical.medical_outbox_events', 'payload', 'UPDATE') AS worker_payload_update,
        has_table_privilege('medical_idempotency_maintenance', 'medical.medical_idempotency_records', 'SELECT') AS maintenance_direct_select,
        has_table_privilege('medical_idempotency_maintenance', 'medical.medical_idempotency_records', 'DELETE') AS maintenance_direct_delete,
        has_function_privilege('medical_idempotency_maintenance', 'medical.purge_expired_idempotency_records(integer)', 'EXECUTE') AS maintenance_execute,
        has_table_privilege('medical_maintenance_owner', 'medical.medical_idempotency_records', 'SELECT') AS owner_idempotency_select,
        has_table_privilege('medical_maintenance_owner', 'medical.medical_idempotency_records', 'DELETE') AS owner_idempotency_delete,
        has_table_privilege('medical_maintenance_owner', 'medical.medical_event_resources', 'SELECT') AS owner_event_select,
        has_schema_privilege('medical_maintenance_owner', 'medical', 'CREATE') AS owner_schema_create,
        pg_has_role('medical_migrator', 'medical_maintenance_owner', 'SET') AS migrator_can_set_maintenance_owner,
        has_function_privilege('public', 'medical.purge_expired_idempotency_records(integer)', 'EXECUTE') AS public_purge_execute
    `;

    assert(checks.app_schema_usage, 'medical_app lacks schema USAGE');
    assert(!checks.app_schema_create, 'medical_app unexpectedly has schema CREATE');
    assert(checks.app_subject_select, 'medical_app lacks subject SELECT');
    assert(checks.app_subject_insert, 'medical_app lacks subject INSERT');
    assert(checks.app_subject_update, 'medical_app lacks subject UPDATE');
    assert(!checks.app_subject_delete, 'medical_app unexpectedly has subject DELETE');
    assert(checks.app_audit_insert, 'medical_app lacks audit INSERT');
    assert(!checks.app_audit_select, 'medical_app unexpectedly has audit SELECT');
    assert(checks.app_outbox_insert, 'medical_app lacks outbox INSERT');
    assert(!checks.app_outbox_select, 'medical_app unexpectedly has outbox SELECT');
    assert(checks.worker_outbox_select, 'medical_outbox_worker lacks outbox SELECT');
    assert(checks.worker_status_update, 'medical_outbox_worker lacks status UPDATE');
    assert(checks.worker_published_update, 'medical_outbox_worker lacks published_at UPDATE');
    assert(!checks.worker_payload_update, 'medical_outbox_worker unexpectedly has payload UPDATE');
    assert(!checks.maintenance_direct_select, 'maintenance caller unexpectedly has direct SELECT');
    assert(!checks.maintenance_direct_delete, 'maintenance caller unexpectedly has direct DELETE');
    assert(checks.maintenance_execute, 'maintenance caller lacks purge EXECUTE');
    assert(checks.owner_idempotency_select, 'maintenance owner lacks idempotency SELECT');
    assert(checks.owner_idempotency_delete, 'maintenance owner lacks idempotency DELETE');
    assert(!checks.owner_event_select, 'maintenance owner unexpectedly has event SELECT');
    assert(!checks.owner_schema_create, 'maintenance owner unexpectedly retains schema CREATE');
    assert(
      !checks.migrator_can_set_maintenance_owner,
      'medical_migrator still has temporary maintenance-owner SET-role capability',
    );
    assert(!checks.public_purge_execute, 'PUBLIC unexpectedly has purge EXECUTE');

    const [functionSecurity] = await sql`
      SELECT
        r.rolname AS owner_name,
        p.prosecdef AS security_definer,
        p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE n.nspname = 'medical'
        AND p.proname = 'purge_expired_idempotency_records'
        AND pg_get_function_identity_arguments(p.oid) = 'p_batch_limit integer'
    `;

    assert(functionSecurity, 'purge function is missing');
    if (functionSecurity) {
      assert(functionSecurity.owner_name === 'medical_maintenance_owner', 'purge function has wrong owner');
      assert(functionSecurity.security_definer === true, 'purge function is not SECURITY DEFINER');
      assert(
        Array.isArray(functionSecurity.proconfig) &&
          functionSecurity.proconfig.includes('search_path=medical, pg_temp'),
        'purge function search_path is not hardened',
      );
    }
  }

  if (failures.length > 0) {
    console.error('Medical live privilege smoke FAILED:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Medical live privilege smoke PASS (${environment.database_name}, connected as ${environment.current_user}).`,
    );
  }
} finally {
  await sql.end({ timeout: 1 });
}
