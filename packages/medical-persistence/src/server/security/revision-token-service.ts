import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  assertMedicalRevision,
  type MedicalRevision,
} from '@diabetes-universe/medical-domain';

import { validateRevisionTokenSecret } from './revision-token-secret';

export type RevisionTokenErrorCode =
  | 'MALFORMED_REVISION_TOKEN'
  | 'REVISION_TOKEN_RESOURCE_MISMATCH'
  | 'REVISION_TOKEN_INVALID';

export interface ParsedRevisionToken {
  readonly tokenVersion: string;
  readonly resourceId: string;
  readonly revision: MedicalRevision;
}

export interface RevisionTokenService {
  createToken(resourceId: string, revision: MedicalRevision): string;
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
  revision: MedicalRevision,
): Buffer {
  return createHmac('sha256', secret)
    .update(`${TOKEN_VERSION}|${resourceId}|${revision.toString()}`, 'utf8')
    .digest()
    .subarray(0, MAC_LENGTH);
}

function encodeRevision(revision: MedicalRevision): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(revision);
  return buffer;
}

function decodeRevision(buffer: Buffer): MedicalRevision {
  if (buffer.length !== 8) {
    throw new MalformedRevisionTokenError('Revision token payload is invalid.');
  }

  try {
    return assertMedicalRevision(buffer.readBigUInt64BE());
  } catch {
    throw new MalformedRevisionTokenError('Revision token payload is invalid.');
  }
}

export function createRevisionTokenService(
  secret: string,
  options: { allowTestDefault?: boolean } = {},
): RevisionTokenService {
  validateRevisionTokenSecret(secret, options);
  const key = Buffer.from(secret, 'utf8');

  return {
    createToken(resourceId: string, revision: MedicalRevision): string {
      const normalizedRevision = assertMedicalRevision(revision);
      const revisionBytes = encodeRevision(normalizedRevision);
      const mac = createMac(key, resourceId, normalizedRevision);
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
): MedicalRevision {
  return service.verifyAndParse(token, resourceId).revision;
}
