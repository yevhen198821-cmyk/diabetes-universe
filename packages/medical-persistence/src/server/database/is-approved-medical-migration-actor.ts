/**
 * Deploy-only medical migration actor policy.
 *
 * Exact allowlist. Not a prefix match, not PUBLIC, not an environment-selected
 * role, and not a runtime principal. Medical API request paths must never call
 * this helper to choose a database role.
 */
export const APPROVED_MEDICAL_MIGRATION_ACTORS = [
  'medical_migrator',
  'medical_deployer',
] as const;

export type ApprovedMedicalMigrationActor =
  (typeof APPROVED_MEDICAL_MIGRATION_ACTORS)[number];

export function isApprovedMedicalMigrationActor(
  currentUser: string | null | undefined,
): boolean {
  return (
    currentUser === 'medical_migrator' || currentUser === 'medical_deployer'
  );
}
