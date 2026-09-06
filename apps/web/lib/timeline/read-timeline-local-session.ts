import { readAccountIdFromSessionPayload } from './timeline-local-ownership';

export type TimelineSessionAccountResolution =
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticated'; readonly accountId: string }
  | { readonly status: 'blocked' }
  | { readonly status: 'indeterminate' };

export async function readTimelineSessionAccountResolution(
  fetchImpl: typeof fetch = fetch,
): Promise<TimelineSessionAccountResolution> {
  try {
    const response = await fetchImpl('/api/auth/get-session', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { status: 'anonymous' };
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
