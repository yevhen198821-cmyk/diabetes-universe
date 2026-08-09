import { getLastCapturedMagicLinkEmail } from '@diabetes-universe/identity/server';

export async function GET() {
  if (process.env.AUTH_E2E_FIXTURES !== 'true') {
    return new Response('Not found', { status: 404 });
  }

  const captured = getLastCapturedMagicLinkEmail();

  return Response.json({
    url: captured?.url ?? null,
  });
}
