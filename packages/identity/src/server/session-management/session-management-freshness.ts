import { isSessionFreshForPasskeyMutation } from '../passkey-freshness';

export function isSessionFreshForSessionManagement(
  createdAt: Date | string,
  now: Date = new Date(),
): boolean {
  return isSessionFreshForPasskeyMutation(createdAt, now);
}
