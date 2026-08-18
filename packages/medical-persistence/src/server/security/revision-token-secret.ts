const MIN_SECRET_LENGTH = 32;
const TEST_DEFAULT_SECRET = 'test-medical-revision-token-secret';

const WEAK_SECRETS = new Set([
  TEST_DEFAULT_SECRET,
  'medical-revision-token-secret',
  'change-me',
  'secret',
  'password',
]);

export class WeakRevisionTokenSecretError extends Error {
  readonly code = 'WEAK_REVISION_TOKEN_SECRET';
}

export function validateRevisionTokenSecret(
  secret: string,
  options: { allowTestDefault?: boolean } = {},
): void {
  const trimmed = secret.trim();

  if (!trimmed) {
    throw new WeakRevisionTokenSecretError(
      'MEDICAL_REVISION_TOKEN_SECRET must not be empty.',
    );
  }

  if (options.allowTestDefault && trimmed === TEST_DEFAULT_SECRET) {
    return;
  }

  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new WeakRevisionTokenSecretError(
      `MEDICAL_REVISION_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  if (WEAK_SECRETS.has(trimmed)) {
    throw new WeakRevisionTokenSecretError(
      'MEDICAL_REVISION_TOKEN_SECRET is a known weak placeholder.',
    );
  }

  if (/^(.)\1+$/.test(trimmed)) {
    throw new WeakRevisionTokenSecretError(
      'MEDICAL_REVISION_TOKEN_SECRET has insufficient entropy.',
    );
  }
}
