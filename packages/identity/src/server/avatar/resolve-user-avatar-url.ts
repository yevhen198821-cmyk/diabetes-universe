import { USER_AVATAR_API_PATH } from './avatar-constants';

export function buildUserAvatarReferenceUrl(updatedAt: Date): string {
  return `${USER_AVATAR_API_PATH}?v=${updatedAt.getTime()}`;
}

export function resolveUserAvatarUrlFromImageField(
  image: string | null | undefined,
): string | null {
  const normalized = image?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith(USER_AVATAR_API_PATH)) {
    return normalized;
  }

  return normalized;
}
