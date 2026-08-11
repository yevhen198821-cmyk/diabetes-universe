import { AUTH_FRESH_AUTH_WINDOW_SECONDS } from '../config/auth-constants';

export function isSessionFreshForPasskeyMutation(
  createdAt: Date | string,
  now: Date = new Date(),
): boolean {
  const createdAtMs =
    createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();

  if (!Number.isFinite(createdAtMs)) {
    return false;
  }

  const ageMs = now.getTime() - createdAtMs;
  return (
    ageMs >= 0 && ageMs <= AUTH_FRESH_AUTH_WINDOW_SECONDS * 1000
  );
}

export function isPasskeyFreshSessionPath(path: string): boolean {
  return (
    path.includes('generate-register-options') ||
    path.includes('verify-registration') ||
    path.includes('add-passkey') ||
    path.includes('delete-passkey')
  );
}
