import { createHmac, timingSafeEqual } from 'node:crypto';

import { validateListCursorSecret } from './list-cursor-token-secret';

export interface ListCursorScope {
  readonly subjectId: string;
  readonly apiVersion: string;
  readonly limit: number;
  readonly traversalStartedAt: string;
}

export interface ListCursorPosition {
  readonly eventObservedAt: string;
  readonly resourceId: string;
}

export interface EncodedListCursor
  extends ListCursorScope, ListCursorPosition {}

export interface ListCursorTokenService {
  encode(scope: ListCursorScope, position: ListCursorPosition): string;
  decode(token: string, expectedScope: ListCursorScope): EncodedListCursor;
}

export class MalformedListCursorError extends Error {
  readonly code = 'MALFORMED_LIST_CURSOR';
}

export class InvalidListCursorError extends Error {
  readonly code = 'INVALID_LIST_CURSOR';
}

const TOKEN_VERSION = 'v1';
const TOKEN_PREFIX = `${TOKEN_VERSION}.`;
const MAC_LENGTH = 32;

function canonicalPayload(
  scope: ListCursorScope,
  position: ListCursorPosition,
): string {
  return [
    TOKEN_VERSION,
    scope.subjectId,
    scope.apiVersion,
    String(scope.limit),
    scope.traversalStartedAt,
    position.eventObservedAt,
    position.resourceId,
  ].join('|');
}

function createMac(secret: Buffer, payload: string): Buffer {
  return createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest()
    .subarray(0, MAC_LENGTH);
}

export function createListCursorTokenService(
  secret: string,
  options: { allowTestDefault?: boolean } = {},
): ListCursorTokenService {
  validateListCursorSecret(secret, options);
  const key = Buffer.from(secret, 'utf8');

  return {
    encode(scope, position) {
      const payload = canonicalPayload(scope, position);
      const mac = createMac(key, payload);
      const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
      const encodedMac = mac.toString('base64url');
      return `${TOKEN_PREFIX}${encodedPayload}.${encodedMac}`;
    },

    decode(token, expectedScope) {
      if (!token.startsWith(TOKEN_PREFIX)) {
        throw new MalformedListCursorError(
          'List cursor version is unsupported.',
        );
      }

      const body = token.slice(TOKEN_PREFIX.length);
      const separatorIndex = body.lastIndexOf('.');
      if (separatorIndex <= 0) {
        throw new MalformedListCursorError('List cursor payload is invalid.');
      }

      const encodedPayload = body.slice(0, separatorIndex);
      const encodedMac = body.slice(separatorIndex + 1);
      if (!encodedPayload || !encodedMac) {
        throw new MalformedListCursorError('List cursor payload is invalid.');
      }

      let payload: string;
      let providedMac: Buffer;
      try {
        payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
        providedMac = Buffer.from(encodedMac, 'base64url');
      } catch {
        throw new MalformedListCursorError('List cursor payload is invalid.');
      }

      if (providedMac.length !== MAC_LENGTH) {
        throw new MalformedListCursorError('List cursor payload is invalid.');
      }

      const expectedMac = createMac(key, payload);
      if (!timingSafeEqual(providedMac, expectedMac)) {
        throw new InvalidListCursorError(
          'List cursor MAC verification failed.',
        );
      }

      const parts = payload.split('|');
      if (parts.length !== 7 || parts[0] !== TOKEN_VERSION) {
        throw new MalformedListCursorError('List cursor payload is invalid.');
      }

      const decoded: EncodedListCursor = {
        subjectId: parts[1]!,
        apiVersion: parts[2]!,
        limit: Number(parts[3]),
        traversalStartedAt: parts[4]!,
        eventObservedAt: parts[5]!,
        resourceId: parts[6]!,
      };

      if (
        !Number.isInteger(decoded.limit) ||
        decoded.limit <= 0 ||
        decoded.subjectId !== expectedScope.subjectId ||
        decoded.apiVersion !== expectedScope.apiVersion ||
        decoded.limit !== expectedScope.limit
      ) {
        throw new InvalidListCursorError(
          'List cursor scope does not match the current request.',
        );
      }

      return decoded;
    },
  };
}
