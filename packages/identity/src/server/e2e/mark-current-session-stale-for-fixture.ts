import { eq } from 'drizzle-orm';

import { AUTH_FRESH_AUTH_WINDOW_SECONDS } from '../../config/auth-constants';
import type { AuthEnvironment } from '../../config/auth-environment';
import { session } from '../database/auth-schema';
import { createAuthDatabase } from '../database/create-auth-database';
import type { IdentityService } from '../identity-service';

/**
 * E2E-only helper: backdates the caller's current session below the fresh-auth window.
 * Must only be invoked from guarded auth test fixture routes.
 */
export async function markCurrentSessionStaleForE2eFixture(
  identityService: IdentityService,
  environment: AuthEnvironment,
  headers: Headers,
): Promise<'marked' | 'unauthenticated'> {
  const current = await identityService.auth.api.getSession({ headers });

  if (!current?.session) {
    return 'unauthenticated';
  }

  const staleCreatedAt = new Date(
    Date.now() - (AUTH_FRESH_AUTH_WINDOW_SECONDS + 60) * 1000,
  );
  const database = await createAuthDatabase(environment);

  await database
    .update(session)
    .set({
      createdAt: staleCreatedAt,
      updatedAt: staleCreatedAt,
    })
    .where(eq(session.id, current.session.id));

  return 'marked';
}
