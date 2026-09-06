import { TIMELINE_INDEXEDDB_DATABASE_NAME } from '@diabetes-universe/timeline-web';

/**
 * Local Timeline ownership (Remediation 0A).
 *
 * Persistence identity is never an email address. Authenticated ownership is
 * derived from Better Auth `accountId`. Anonymous ownership uses a
 * browser-local opaque key. The legacy unscoped database name is never
 * opened as an owned medical store.
 */

export const LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME =
  TIMELINE_INDEXEDDB_DATABASE_NAME;

export const TIMELINE_ANONYMOUS_OWNER_STORAGE_KEY =
  'du.timeline.anonymousOwnerKey';

const OWNER_TOKEN_MAX_LENGTH = 128;
const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;

export type TimelineLocalOwnershipKind =
  'pending' | 'blocked' | 'anonymous' | 'authenticated';

export interface PendingTimelineLocalOwnership {
  readonly kind: 'pending';
}

export interface BlockedTimelineLocalOwnership {
  readonly kind: 'blocked';
}

export interface AnonymousTimelineLocalOwnership {
  readonly kind: 'anonymous';
  readonly databaseName: string;
  readonly ownerKey: string;
}

export interface AuthenticatedTimelineLocalOwnership {
  readonly kind: 'authenticated';
  readonly accountId: string;
  readonly databaseName: string;
}

export type ResolvedTimelineLocalOwnership =
  AnonymousTimelineLocalOwnership | AuthenticatedTimelineLocalOwnership;

export type TimelineLocalOwnership =
  | PendingTimelineLocalOwnership
  | BlockedTimelineLocalOwnership
  | ResolvedTimelineLocalOwnership;

export function encodeTimelineOwnerToken(value: string): string {
  return Array.from(new TextEncoder().encode(value), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function parseTimelineAccountId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const accountId = value.trim();

  if (
    accountId.length === 0 ||
    accountId.length > OWNER_TOKEN_MAX_LENGTH ||
    !PRINTABLE_ASCII.test(accountId)
  ) {
    return null;
  }

  return accountId;
}

export function readAccountIdFromSessionPayload(
  payload: unknown,
): string | null {
  if (payload === null || typeof payload !== 'object') {
    return null;
  }

  const user = (payload as { readonly user?: unknown }).user;

  if (user === null || typeof user !== 'object') {
    return null;
  }

  const record = user as {
    readonly accountId?: unknown;
    readonly email?: unknown;
  };

  return parseTimelineAccountId(record.accountId);
}

export function createAuthenticatedTimelineDatabaseName(
  accountId: string,
): string {
  const parsed = parseTimelineAccountId(accountId);

  if (!parsed) {
    throw new Error(
      'Authenticated Timeline ownership requires a valid accountId.',
    );
  }

  return `du-timeline-acct-${encodeTimelineOwnerToken(parsed)}`;
}

export function createAnonymousTimelineDatabaseName(ownerKey: string): string {
  const parsed = parseTimelineAccountId(ownerKey);

  if (!parsed) {
    throw new Error('Anonymous Timeline ownership requires a valid owner key.');
  }

  return `du-timeline-anon-${encodeTimelineOwnerToken(parsed)}`;
}

export function isLegacyUnscopedTimelineDatabaseName(
  databaseName: string,
): boolean {
  return databaseName === LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME;
}

export function assertOwnedTimelineDatabaseName(databaseName: string): string {
  if (isLegacyUnscopedTimelineDatabaseName(databaseName)) {
    throw new Error(
      'Legacy unscoped Timeline database cannot be opened as an owned medical store.',
    );
  }

  if (
    !databaseName.startsWith('du-timeline-acct-') &&
    !databaseName.startsWith('du-timeline-anon-')
  ) {
    throw new Error('Timeline database name is not an owned namespace.');
  }

  return databaseName;
}

export function createAnonymousOwnerKey(): string {
  return crypto.randomUUID();
}

export function resolveAnonymousOwnerKey(storage: Storage): string {
  const existing = parseTimelineAccountId(
    storage.getItem(TIMELINE_ANONYMOUS_OWNER_STORAGE_KEY),
  );

  if (existing) {
    return existing;
  }

  const created = createAnonymousOwnerKey();
  storage.setItem(TIMELINE_ANONYMOUS_OWNER_STORAGE_KEY, created);
  return created;
}

export function createAnonymousTimelineOwnership(
  ownerKey: string,
): AnonymousTimelineLocalOwnership {
  return {
    databaseName: createAnonymousTimelineDatabaseName(ownerKey),
    kind: 'anonymous',
    ownerKey,
  };
}

export function createAuthenticatedTimelineOwnership(
  accountId: string,
): AuthenticatedTimelineLocalOwnership {
  const parsed = parseTimelineAccountId(accountId);

  if (!parsed) {
    throw new Error(
      'Authenticated Timeline ownership requires a valid accountId.',
    );
  }

  return {
    accountId: parsed,
    databaseName: createAuthenticatedTimelineDatabaseName(parsed),
    kind: 'authenticated',
  };
}

export function resolveTimelineOwnershipFromSession(input: {
  readonly accountId: string | null;
  readonly anonymousOwnerKey: string;
  readonly sessionPresentWithoutAccountId?: boolean;
}): TimelineLocalOwnership {
  if (input.sessionPresentWithoutAccountId) {
    return { kind: 'blocked' };
  }

  if (input.accountId) {
    return createAuthenticatedTimelineOwnership(input.accountId);
  }

  return createAnonymousTimelineOwnership(input.anonymousOwnerKey);
}
