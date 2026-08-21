const MIN_SECRET_LENGTH = 32;
const TEST_DEFAULT_SECRET = 'test-medical-list-cursor-secret';

const WEAK_SECRETS = new Set([
  TEST_DEFAULT_SECRET,
  'medical-list-cursor-secret',
  'change-me',
  'secret',
  'password',
]);

export class WeakListCursorSecretError extends Error {
  readonly code = 'WEAK_LIST_CURSOR_SECRET';
}

export function validateListCursorSecret(
  secret: string,
  options: { allowTestDefault?: boolean } = {},
): void {
  const trimmed = secret.trim();

  if (!trimmed) {
    throw new WeakListCursorSecretError(
      'MEDICAL_LIST_CURSOR_SECRET must not be empty.',
    );
  }

  if (options.allowTestDefault && trimmed === TEST_DEFAULT_SECRET) {
    return;
  }

  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new WeakListCursorSecretError(
      `MEDICAL_LIST_CURSOR_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  if (WEAK_SECRETS.has(trimmed)) {
    throw new WeakListCursorSecretError(
      'MEDICAL_LIST_CURSOR_SECRET is a known weak placeholder.',
    );
  }

  if (/^(.)\1+$/.test(trimmed)) {
    throw new WeakListCursorSecretError(
      'MEDICAL_LIST_CURSOR_SECRET has insufficient entropy.',
    );
  }
}
