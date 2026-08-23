import assert from 'node:assert/strict';
import test from 'node:test';

import { createListCursorTokenService } from './list-cursor-token-service.ts';

const SECRET = 'test-medical-list-cursor-secret';

test('list cursor token round trip preserves scope and position', () => {
  const service = createListCursorTokenService(SECRET, {
    allowTestDefault: true,
  });
  const scope = {
    subjectId: 'subject-1',
    apiVersion: 'v1',
    limit: 25,
    traversalStartedAt: '2026-08-21T10:00:00.000Z',
  };
  const position = {
    eventObservedAt: '2026-08-21T09:00:00.000Z',
    resourceId: '11111111-1111-4111-8111-111111111111',
  };

  const token = service.encode(scope, position);
  const decoded = service.decode(token, scope);

  assert.equal(decoded.eventObservedAt, position.eventObservedAt);
  assert.equal(decoded.resourceId, position.resourceId);
  assert.equal(decoded.traversalStartedAt, scope.traversalStartedAt);
});

test('list cursor token rejects tampered MAC', () => {
  const service = createListCursorTokenService(SECRET, {
    allowTestDefault: true,
  });
  const scope = {
    subjectId: 'subject-1',
    apiVersion: 'v1',
    limit: 25,
    traversalStartedAt: '2026-08-21T10:00:00.000Z',
  };
  const token = service.encode(scope, {
    eventObservedAt: '2026-08-21T09:00:00.000Z',
    resourceId: '11111111-1111-4111-8111-111111111111',
  });

  const tampered = `${token}x`;

  assert.throws(() => service.decode(tampered, scope));
});

test('list cursor token rejects wrong subject scope', () => {
  const service = createListCursorTokenService(SECRET, {
    allowTestDefault: true,
  });
  const scope = {
    subjectId: 'subject-1',
    apiVersion: 'v1',
    limit: 25,
    traversalStartedAt: '2026-08-21T10:00:00.000Z',
  };
  const token = service.encode(scope, {
    eventObservedAt: '2026-08-21T09:00:00.000Z',
    resourceId: '11111111-1111-4111-8111-111111111111',
  });

  assert.throws(() =>
    service.decode(token, {
      ...scope,
      subjectId: 'subject-2',
    }),
  );
});
