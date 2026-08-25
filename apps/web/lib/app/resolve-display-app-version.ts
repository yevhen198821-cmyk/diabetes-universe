const PLACEHOLDER_APP_VERSION = '0.0.0';

export function resolveDisplayAppVersion(
  rawVersion: string | null | undefined,
): string | null {
  const normalized = rawVersion?.trim();

  if (!normalized || normalized === PLACEHOLDER_APP_VERSION) {
    return null;
  }

  return normalized;
}
