import sharp from 'sharp';

import {
  USER_AVATAR_OUTPUT_CONTENT_TYPE,
  USER_AVATAR_OUTPUT_MAX_DIMENSION,
} from './avatar-constants';
import { detectAvatarInputMimeType } from './detect-avatar-input-mime';

export interface ProcessAvatarImageResult {
  readonly byteSize: number;
  readonly content: Buffer;
  readonly contentType: typeof USER_AVATAR_OUTPUT_CONTENT_TYPE;
}

export async function processAvatarImage(
  source: Buffer,
): Promise<ProcessAvatarImageResult | null> {
  const detectedMimeType = detectAvatarInputMimeType(source);

  if (!detectedMimeType) {
    return null;
  }

  try {
    const processed = await sharp(source, { failOn: 'error' })
      .rotate()
      .resize(
        USER_AVATAR_OUTPUT_MAX_DIMENSION,
        USER_AVATAR_OUTPUT_MAX_DIMENSION,
        {
          fit: 'cover',
          position: 'centre',
        },
      )
      .webp({ quality: 85 })
      .toBuffer();

    if (processed.byteLength === 0) {
      return null;
    }

    return {
      byteSize: processed.byteLength,
      content: processed,
      contentType: USER_AVATAR_OUTPUT_CONTENT_TYPE,
    };
  } catch {
    return null;
  }
}
