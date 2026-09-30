import { toServerSemanticEvent } from '@diabetes-universe/medical-domain';
import type { TimelineAdoptionTransport } from '@diabetes-universe/timeline-web';

/** Bound to the account whose local data the user explicitly chose to transfer. */
export function createTimelineAdoptionClient(
  accountId: string,
): TimelineAdoptionTransport {
  async function post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(
      `/api/v1/medical/me/adoption-sessions${path}`,
      {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
        headers: {
          'Content-Type': 'application/json',
          'x-du-expected-account-id': accountId,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    if (!response.ok) throw new Error('ADOPTION_UNAVAILABLE');
    return (await response.json()) as T;
  }
  return {
    createOrResumeSession: (input) => post('', input),
    adoptBatch: (id, items) =>
      post(`/${encodeURIComponent(id)}/items`, {
        items: items.map((item) => ({
          ...item,
          event: toServerSemanticEvent(item.event),
        })),
      }),
    completeSession: (id) => post(`/${encodeURIComponent(id)}/complete`),
  };
}
