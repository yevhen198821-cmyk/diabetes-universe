import { isAuthE2eFixtureEndpointEnabled } from '@diabetes-universe/identity';
import { getCapturedMagicLinkEmailForAddress } from '@diabetes-universe/identity/server';

export async function GET(request: Request) {
  if (!isAuthE2eFixtureEndpointEnabled(process.env)) {
    return new Response('Not found', { status: 404 });
  }

  const email = new URL(request.url).searchParams.get('email')?.trim();

  if (!email) {
    return new Response('Not found', { status: 404 });
  }

  const captured = getCapturedMagicLinkEmailForAddress(email);

  return Response.json({
    email: captured?.email ?? null,
    url: captured?.url ?? null,
  });
}
