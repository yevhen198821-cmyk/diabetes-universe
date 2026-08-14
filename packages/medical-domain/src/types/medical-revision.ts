/** Server-owned monotonic resource revision (PostgreSQL BIGINT). */
export type MedicalRevision = bigint;

export const MAX_MEDICAL_REVISION = BigInt(Number.MAX_SAFE_INTEGER);

export function assertMedicalRevision(value: bigint): MedicalRevision {
  if (value <= 0n) {
    throw new Error('Medical revision must be greater than zero.');
  }

  if (value > MAX_MEDICAL_REVISION) {
    throw new Error('Medical revision exceeds JavaScript safe integer range.');
  }

  return value;
}

export function medicalRevisionFromDb(value: bigint | number): MedicalRevision {
  const revision = typeof value === 'number' ? BigInt(value) : value;
  return assertMedicalRevision(revision);
}

export function incrementMedicalRevision(
  current: MedicalRevision,
): MedicalRevision {
  return assertMedicalRevision(current + 1n);
}

export const INITIAL_MEDICAL_REVISION = 1n;
