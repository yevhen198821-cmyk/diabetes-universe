import { toServerSemanticEvent } from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import type { TimelineSyncTransport } from '@diabetes-universe/timeline-web';
import { createWebTimelineSemanticEventValidator } from '../../timeline/validate-web-timeline-semantic-event';

export function createTimelineSyncClient(
  accountId: string,
): TimelineSyncTransport {
  async function request(path: string, body?: unknown) {
    const response = await fetch(`/api/v1/medical/me/sync/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      headers: {
        'Content-Type': 'application/json',
        'x-du-expected-account-id': accountId,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new Error('SYNC_UNAVAILABLE');
    return await response.json();
  }
  return {
    async push(mutation) {
      const body = await request('push', {
        protocolVersion: 1,
        mutations: [
          {
            ...mutation,
            ...(mutation.event
              ? {
                  event: toServerSemanticEvent(
                    mutation.event as SemanticTimelineEvent,
                  ),
                }
              : {}),
          },
        ],
      });
      const result = body?.results?.[0];
      if (
        !Array.isArray(body?.results) ||
        body.results.length !== 1 ||
        !result ||
        result.mutationId !== mutation.mutationId ||
        !['acknowledged', 'retryable', 'conflict', 'blocked'].includes(
          result.status,
        )
      )
        throw new Error('SYNC_RESPONSE_INVALID');
      if (
        result.status === 'acknowledged' &&
        (typeof result.resourceId !== 'string' ||
          typeof result.revision !== 'string')
      )
        throw new Error('SYNC_RESPONSE_INVALID');
      return result;
    },
    async pull(cursor) {
      const body = await request(
        `pull?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      );
      if (
        !Array.isArray(body?.changes) ||
        body.changes.length > 25 ||
        typeof body.nextCursor !== 'string' ||
        body.nextCursor.length > 1024 ||
        typeof body.hasMore !== 'boolean'
      )
        throw new Error('SYNC_RESPONSE_INVALID');
      const validate = createWebTimelineSemanticEventValidator();
      for (const change of body.changes) {
        if (
          !change ||
          typeof change.resourceId !== 'string' ||
          !/^[a-f0-9-]{36}$/i.test(change.resourceId) ||
          typeof change.revision !== 'string' ||
          !['active', 'deleted'].includes(change.lifecycleState) ||
          !Number.isFinite(Date.parse(change.createdAt)) ||
          !Number.isFinite(Date.parse(change.updatedAt)) ||
          !validate({
            ...change.event,
            id: change.resourceId,
            createdAt: change.createdAt,
            updatedAt: change.updatedAt,
          })
        )
          throw new Error('SYNC_RESPONSE_INVALID');
      }
      return body;
    },
  };
}
