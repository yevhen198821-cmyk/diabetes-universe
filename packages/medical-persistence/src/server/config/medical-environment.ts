export type MedicalDatabaseMode = 'pglite' | 'postgres';

export interface MedicalEnvironment {
  readonly databaseMode: MedicalDatabaseMode;
  readonly databaseUrl?: string;
  readonly revisionTokenSecret: string;
  readonly listCursorSecret: string;
  readonly idempotencyRetentionHours: number;
}

function readTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function resolveMedicalEnvironment(
  env: Record<string, string | undefined> = process.env,
): MedicalEnvironment {
  const explicitMode = readTrimmed(env.MEDICAL_DATABASE_MODE);
  const databaseUrl = readTrimmed(env.MEDICAL_DATABASE_URL);
  const usePglite =
    explicitMode === 'pglite' ||
    readTrimmed(env.MEDICAL_USE_PGLITE) === 'true' ||
    env.NODE_ENV === 'test';

  if (usePglite && explicitMode !== 'postgres') {
    const revisionTokenSecret =
      readTrimmed(env.MEDICAL_REVISION_TOKEN_SECRET) ??
      'test-medical-revision-token-secret';
    const listCursorSecret =
      readTrimmed(env.MEDICAL_LIST_CURSOR_SECRET) ??
      'test-medical-list-cursor-secret';

    return {
      databaseMode: 'pglite',
      revisionTokenSecret,
      listCursorSecret,
      idempotencyRetentionHours: readRetentionHours(env),
    };
  }

  if (!databaseUrl) {
    throw new Error(
      'Medical database is not configured. Set MEDICAL_DATABASE_URL or MEDICAL_DATABASE_MODE=pglite for local/test runs.',
    );
  }

  const revisionTokenSecret = readTrimmed(env.MEDICAL_REVISION_TOKEN_SECRET);
  if (!revisionTokenSecret) {
    throw new Error(
      'MEDICAL_REVISION_TOKEN_SECRET is required when MEDICAL_DATABASE_URL is configured.',
    );
  }

  const listCursorSecret = readTrimmed(env.MEDICAL_LIST_CURSOR_SECRET);
  if (!listCursorSecret) {
    throw new Error(
      'MEDICAL_LIST_CURSOR_SECRET is required when MEDICAL_DATABASE_URL is configured.',
    );
  }

  return {
    databaseMode: 'postgres',
    databaseUrl,
    revisionTokenSecret,
    listCursorSecret,
    idempotencyRetentionHours: readRetentionHours(env),
  };
}

function readRetentionHours(env: Record<string, string | undefined>): number {
  const raw = readTrimmed(env.MEDICAL_IDEMPOTENCY_RETENTION_HOURS);
  if (!raw) {
    return 72;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      'MEDICAL_IDEMPOTENCY_RETENTION_HOURS must be a positive number.',
    );
  }

  return parsed;
}
