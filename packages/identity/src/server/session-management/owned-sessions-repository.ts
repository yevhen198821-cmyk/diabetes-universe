import { and, eq, gt } from 'drizzle-orm';

import type { AuthDatabase } from '../database/create-auth-database';
import { session } from '../database/auth-schema';

export interface OwnedSessionRow {
  readonly id: string;
  readonly token: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly userAgent: string | null;
  readonly userId: string;
}

export interface OwnedSessionsRepository {
  listActiveSessions(
    userId: string,
    now?: Date,
  ): Promise<readonly OwnedSessionRow[]>;
  findActiveSessionToken(
    userId: string,
    sessionId: string,
    now?: Date,
  ): Promise<string | null>;
}

export function createOwnedSessionsRepository(
  database: AuthDatabase,
): OwnedSessionsRepository {
  return {
    async listActiveSessions(userId, now = new Date()) {
      const rows = await database
        .select({
          id: session.id,
          token: session.token,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          userAgent: session.userAgent,
          userId: session.userId,
        })
        .from(session)
        .where(and(eq(session.userId, userId), gt(session.expiresAt, now)));

      return rows;
    },
    async findActiveSessionToken(userId, sessionId, now = new Date()) {
      const rows = await database
        .select({ token: session.token })
        .from(session)
        .where(
          and(
            eq(session.id, sessionId),
            eq(session.userId, userId),
            gt(session.expiresAt, now),
          ),
        );

      return rows[0]?.token ?? null;
    },
  };
}
