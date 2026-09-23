/**
 * Recover omitted session accountId using the server's canonical owner.
 * The resolver validates the session and reads its user's stored accountId.
 */
export async function normalizeSessionOwnerResponse(
  response: Response,
  resolveOwner: () => Promise<{ readonly accountId: string } | null>,
): Promise<Response> {
  if (!response.ok) {
    return response;
  }

  try {
    const payload = await response.clone().json();
    if (payload === null || !payload?.session || !payload?.user) {
      return response;
    }
    if (
      typeof payload.user.accountId === 'string' &&
      payload.user.accountId.trim().length > 0
    ) {
      return response;
    }

    const owner = await resolveOwner();
    if (!owner?.accountId?.trim()) {
      throw new Error('CANONICAL_ACCOUNT_ID_UNAVAILABLE');
    }

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('Cache-Control', 'private, no-store');
    return Response.json(
      {
        ...payload,
        user: { ...payload.user, accountId: owner.accountId },
      },
      { headers, status: response.status },
    );
  } catch {
    // No session values or identifiers are included in this diagnostic.
    console.error('[auth.session] canonical owner resolution failed');
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('Cache-Control', 'private, no-store');
    return Response.json(
      { error: 'SESSION_OWNER_UNAVAILABLE' },
      { headers, status: 503 },
    );
  }
}
