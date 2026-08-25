export type AvatarMutationCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AVATAR_INVALID_TYPE'
  | 'AVATAR_TOO_LARGE'
  | 'AVATAR_PROCESSING_FAILED'
  | 'AVATAR_NOT_FOUND'
  | 'SUCCESS';

export interface AvatarMutationResult {
  readonly avatarUrl: string | null;
  readonly code: AvatarMutationCode;
  readonly ok: boolean;
}

export interface UserAvatarContent {
  readonly byteSize: number;
  readonly content: Buffer;
  readonly contentType: string;
  readonly updatedAt: Date;
}
