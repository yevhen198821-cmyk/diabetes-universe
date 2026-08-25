import {
  USER_AVATAR_ALLOWED_INPUT_MIME_TYPES,
  type UserAvatarAllowedInputMimeType,
} from './avatar-constants';

const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const WEBP_RIFF_SIGNATURE = Buffer.from('RIFF', 'ascii');
const WEBP_FORMAT_SIGNATURE = Buffer.from('WEBP', 'ascii');

function startsWithBuffer(source: Buffer, prefix: Buffer): boolean {
  return (
    source.length >= prefix.length &&
    source.subarray(0, prefix.length).equals(prefix)
  );
}

export function detectAvatarInputMimeType(
  source: Buffer,
): UserAvatarAllowedInputMimeType | null {
  if (startsWithBuffer(source, JPEG_SIGNATURE)) {
    return 'image/jpeg';
  }

  if (startsWithBuffer(source, PNG_SIGNATURE)) {
    return 'image/png';
  }

  if (
    source.length >= 12 &&
    startsWithBuffer(source, WEBP_RIFF_SIGNATURE) &&
    source.subarray(8, 12).equals(WEBP_FORMAT_SIGNATURE)
  ) {
    return 'image/webp';
  }

  return null;
}

export function isAllowedAvatarInputMimeType(
  mimeType: string | null | undefined,
): mimeType is UserAvatarAllowedInputMimeType {
  if (!mimeType) {
    return false;
  }

  return USER_AVATAR_ALLOWED_INPUT_MIME_TYPES.includes(
    mimeType as UserAvatarAllowedInputMimeType,
  );
}

export function normalizeAvatarDeclaredMimeType(
  declaredMimeType: string | null | undefined,
): string | null {
  const normalized = declaredMimeType?.trim().toLowerCase() ?? '';

  if (!normalized) {
    return null;
  }

  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }

  return normalized;
}
