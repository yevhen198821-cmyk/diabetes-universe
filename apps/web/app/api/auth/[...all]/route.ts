import { toNextJsHandler } from 'better-auth/next-js';

import { getBetterAuthInstance } from '../../../../lib/auth/better-auth-instance';

import { getWebIdentityService } from '../../../../lib/auth/get-web-identity-service';
import { normalizeSessionOwnerResponse } from '../../../../lib/auth/normalize-session-owner-response';

async function getRouteHandlers() {
  const auth = await getBetterAuthInstance();
  return toNextJsHandler(auth);
}

export async function GET(request: Request) {
  const { GET: getHandler } = await getRouteHandlers();
  const response = await getHandler(request);
  if (!new URL(request.url).pathname.endsWith('/get-session')) {
    return response;
  }
  return normalizeSessionOwnerResponse(response, async () => {
    const service = await getWebIdentityService();
    return service.getCurrentPrincipal(request.headers);
  });
}

export async function POST(request: Request) {
  const { POST: postHandler } = await getRouteHandlers();
  return postHandler(request);
}
