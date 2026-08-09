import { toNextJsHandler } from 'better-auth/next-js';

import { getBetterAuthInstance } from '../../../../lib/auth/better-auth-instance';

async function getRouteHandlers() {
  const auth = await getBetterAuthInstance();
  return toNextJsHandler(auth);
}

export async function GET(request: Request) {
  const { GET: getHandler } = await getRouteHandlers();
  return getHandler(request);
}

export async function POST(request: Request) {
  const { POST: postHandler } = await getRouteHandlers();
  return postHandler(request);
}
