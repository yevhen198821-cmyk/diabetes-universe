import type { AccountSessionSummary } from '../../contracts/session-management-contracts';
import { mapUserAgentLabel } from '../../presentation/map-user-agent-label';
import type { OwnedSessionRow } from './owned-sessions-repository';

function toIsoTimestamp(value: Date): string {
  return value.toISOString();
}

export function mapAccountSessionSummary(
  row: OwnedSessionRow,
  currentSessionId: string,
): AccountSessionSummary {
  const { clientLabel, clientKind } = mapUserAgentLabel(row.userAgent);

  return {
    sessionId: row.id,
    isCurrentSession: row.id === currentSessionId,
    createdAt: toIsoTimestamp(row.createdAt),
    expiresAt: toIsoTimestamp(row.expiresAt),
    clientLabel,
    clientKind,
  };
}

export function mapAccountSessionSummaries(
  rows: readonly OwnedSessionRow[],
  currentSessionId: string,
): readonly AccountSessionSummary[] {
  return rows.map((row) => mapAccountSessionSummary(row, currentSessionId));
}
