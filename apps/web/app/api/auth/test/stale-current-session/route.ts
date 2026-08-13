import { isAuthE2eFixtureEndpointEnabled } from '@diabetes-universe/identity';
import { resolveAuthEnvironment } from '@diabetes-universe/identity';
import {
  getIdentityService,
  markCurrentSessionStaleForE2eFixture,
} from '@diabetes-universe/identity/server';

export async function POST(request: Request) {
  if (!isAuthE2eFixtureEndpointEnabled(process.env)) {
    return new Response('Not found', { status: 404 });
  }

  const environment = resolveAuthEnvironment();
  const identityService = await getIdentityService(environment);
  const result = await markCurrentSessionStaleForE2eFixture(
    identityService,
    environment,
    request.headers,
  );

  if (result === 'unauthenticated') {
    return new Response('Not found', { status: 404 });
  }

  return Response.json({ ok: true });
}
