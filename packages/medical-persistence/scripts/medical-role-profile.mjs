// Fixed deployment bindings; migration actor names and their allowlist stay unchanged.
export const NEON_SQL_ROLES = Object.freeze({
  medical_app: 'du_medical_app',
  medical_outbox_worker: 'du_medical_outbox_worker',
  medical_idempotency_maintenance: 'du_medical_idempotency_maintenance',
  medical_maintenance_owner: 'du_medical_maintenance_owner',
});

export function medicalRoleProfile(name = 'standard') {
  if (name === 'standard') return Object.freeze({});
  if (name === 'neon-sql') return NEON_SQL_ROLES;
  throw new Error(`Unknown medical role profile: ${name}`);
}

export function bindMedicalRoles(sql, profile) {
  return sql.replace(
    /\bmedical_(?:app|outbox_worker|idempotency_maintenance|maintenance_owner)\b/g,
    (name) => profile[name] ?? name,
  );
}

export function stripMigrationTransaction(sql) {
  return sql.replace(/^(?:BEGIN|COMMIT);\s*$/gm, '');
}

export function roleSecurityFailure(role) {
  if (
    role.rolsuper ||
    role.rolcreaterole ||
    role.rolcreatedb ||
    role.rolbypassrls
  ) {
    return `${role.rolname} has administrative role attributes`;
  }
  if (role.can_assume_privileged_role) {
    return `${role.rolname} can inherit or SET an administrative role`;
  }
  return null;
}
