import { readAccountIdFromSessionPayload } from './timeline-local-ownership';

export type TimelineSessionAccountResolution =
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticated'; readonly accountId: string }
  | { readonly status: 'blocked' }
  | { readonly status: 'indeterminate' };

/**
 * Resolve Timeline ownership identity from Better Auth get-session.
 *
 * Only a successful 2xx payload that is null/no session is signed-out.
 * HTTP 5xx, 429, other non-success, and network failures are indeterminate.
 * Do not infer logout from generic !response.ok.
 */
export async function readTimelineSessionAccountResolution(
  fetchImpl: typeof fetch = fetch,
): Promise<TimelineSessionAccountResolution> {
  try {
    const response = await fetchImpl('/api/auth/get-session', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { status: 'indeterminate' };
    }

    const payload: unknown = await response.json();

    if (payload === null) {
      return { status: 'anonymous' };
    }

    const accountId = readAccountIdFromSessionPayload(payload);

    if (accountId) {
      return { accountId, status: 'authenticated' };
    }

    return { status: 'blocked' };
  } catch {
    return { status: 'indeterminate' };
  }
}
