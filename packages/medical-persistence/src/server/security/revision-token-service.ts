import { createHmac, timingSafeEqual } from 'node:crypto';

export type RevisionTokenErrorCode =
  | 'MALFORMED_REVISION_TOKEN'
  | 'REVISION_TOKEN_RESOURCE_MISMATCH'
  | 'REVISION_TOKEN_INVALID';

export interface ParsedRevisionToken {
  readonly tokenVersion: string;
  readonly resourceId: string;
  readonly revision: number;
}

export interface RevisionTokenService {
  createToken(resourceId: string, revision: number): string;
  verifyAndParse(
    token: string,
    expectedResourceId: string,
  ): ParsedRevisionToken;
}

export class MalformedRevisionTokenError extends Error {
  readonly code: RevisionTokenErrorCode = 'MALFORMED_REVISION_TOKEN';
}

export class InvalidRevisionTokenError extends Error {
  readonly code: RevisionTokenErrorCode = 'REVISION_TOKEN_INVALID';
}

const TOKEN_VERSION = 'v1';
const TOKEN_PREFIX = `${TOKEN_VERSION}.`;
const MAC_LENGTH = 32;

function createMac(
  secret: Buffer,
  resourceId: string,
  revision: number,
): Buffer {
  return createHmac('sha256', secret)
    .update(`${TOKEN_VERSION}|${resourceId}|${revision}`, 'utf8')
    .digest()
    .subarray(0, MAC_LENGTH);
}

function encodeRevision(revision: number): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(revision));
  return buffer;
}

function decodeRevision(buffer: Buffer): number {
  if (buffer.length !== 8) {
    throw new MalformedRevisionTokenError('Revision token payload is invalid.');
  }

  const revision = Number(buffer.readBigUInt64BE());
  if (!Number.isSafeInteger(revision) || revision <= 0) {
    throw new MalformedRevisionTokenError('Revision token payload is invalid.');
  }

  return revision;
}

export function createRevisionTokenService(
  secret: string,
): RevisionTokenService {
  const key = Buffer.from(secret, 'utf8');

  return {
    createToken(resourceId: string, revision: number): string {
      const revisionBytes = encodeRevision(revision);
      const mac = createMac(key, resourceId, revision);
      const payload = Buffer.concat([revisionBytes, mac]);
      return `${TOKEN_PREFIX}${payload.toString('base64url')}`;
    },

    verifyAndParse(
      token: string,
      expectedResourceId: string,
    ): ParsedRevisionToken {
      if (!token.startsWith(TOKEN_PREFIX)) {
        throw new MalformedRevisionTokenError(
          'Revision token version is unsupported.',
        );
      }

      const encoded = token.slice(TOKEN_PREFIX.length);
      if (!encoded) {
        throw new MalformedRevisionTokenError(
          'Revision token payload is missing.',
        );
      }

      const payload = Buffer.from(encoded, 'base64url');
      if (payload.length !== 8 + MAC_LENGTH) {
        throw new MalformedRevisionTokenError(
          'Revision token payload is invalid.',
        );
      }

      const revisionBytes = payload.subarray(0, 8);
      const providedMac = payload.subarray(8);
      const revision = decodeRevision(revisionBytes);
      const expectedMac = createMac(key, expectedResourceId, revision);

      if (
        providedMac.length !== expectedMac.length ||
        !timingSafeEqual(providedMac, expectedMac)
      ) {
        throw new InvalidRevisionTokenError(
          'Revision token MAC verification failed.',
        );
      }

      return {
        tokenVersion: TOKEN_VERSION,
        resourceId: expectedResourceId,
        revision,
      };
    },
  };
}

export function verifyRevisionTokenForResource(
  service: RevisionTokenService,
  token: string,
  resourceId: string,
): number {
  return service.verifyAndParse(token, resourceId).revision;
}
