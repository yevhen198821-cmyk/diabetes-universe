import type { OwnedSessionsRepository } from './owned-sessions-repository';

export async function resolveOwnedSessionToken(
  repository: OwnedSessionsRepository,
  input: {
    readonly userId: string;
    readonly sessionId: string;
    readonly now?: Date;
  },
): Promise<string | null> {
  return repository.findActiveSessionToken(
    input.userId,
    input.sessionId,
    input.now,
  );
}
