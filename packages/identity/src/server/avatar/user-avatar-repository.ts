import { eq } from 'drizzle-orm';

import type { UserAvatarContent } from '../../contracts/avatar-contracts';
import type { AuthDatabase } from '../database/create-auth-database';
import { userAvatarObject } from '../database/auth-schema';

export interface UserAvatarRepository {
  deleteForUser(userId: string): Promise<void>;
  getForUser(userId: string): Promise<UserAvatarContent | null>;
  upsertForUser(input: {
    readonly byteSize: number;
    readonly content: Buffer;
    readonly contentType: string;
    readonly updatedAt: Date;
    readonly userId: string;
  }): Promise<void>;
}

export function createUserAvatarRepository(
  database: AuthDatabase,
): UserAvatarRepository {
  return {
    async deleteForUser(userId) {
      await database
        .delete(userAvatarObject)
        .where(eq(userAvatarObject.userId, userId));
    },
    async getForUser(userId) {
      const rows = await database
        .select()
        .from(userAvatarObject)
        .where(eq(userAvatarObject.userId, userId))
        .limit(1);

      const row = rows[0];

      if (!row) {
        return null;
      }

      return {
        byteSize: row.byteSize,
        content: Buffer.isBuffer(row.content)
          ? row.content
          : Buffer.from(row.content),
        contentType: row.contentType,
        updatedAt: row.updatedAt,
      };
    },
    async upsertForUser({ byteSize, content, contentType, updatedAt, userId }) {
      await database
        .insert(userAvatarObject)
        .values({
          byteSize,
          content,
          contentType,
          updatedAt,
          userId,
        })
        .onConflictDoUpdate({
          set: {
            byteSize,
            content,
            contentType,
            updatedAt,
          },
          target: userAvatarObject.userId,
        });
    },
  };
}
