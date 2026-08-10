import { isAuthE2eFixtureEndpointEnabled } from '@diabetes-universe/identity';
import { getLastCapturedMagicLinkEmail } from '@diabetes-universe/identity/server';

export async function GET() {
  if (!isAuthE2eFixtureEndpointEnabled(process.env)) {
    return new Response('Not found', { status: 404 });
  }

  const captured = getLastCapturedMagicLinkEmail();

  return Response.json({
    url: captured?.url ?? null,
  });
}
