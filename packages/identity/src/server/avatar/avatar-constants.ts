export const USER_AVATAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const USER_AVATAR_OUTPUT_MAX_DIMENSION = 512;
export const USER_AVATAR_OUTPUT_CONTENT_TYPE = 'image/webp';
export const USER_AVATAR_API_PATH = '/api/v1/identity/me/avatar';

export const USER_AVATAR_ALLOWED_INPUT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type UserAvatarAllowedInputMimeType =
  (typeof USER_AVATAR_ALLOWED_INPUT_MIME_TYPES)[number];
