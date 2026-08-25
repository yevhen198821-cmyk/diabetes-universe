import { USER_AVATAR_MAX_UPLOAD_BYTES } from '@diabetes-universe/identity/server';

import { normalizeAuthRequestHeaders } from '../auth/normalize-auth-request-headers';
import { getWebIdentityService } from '../auth/get-web-identity-service';

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function handleGetCurrentUserAvatar(
  request: Request,
): Promise<Response> {
  const identityService = await getWebIdentityService();
  const avatar = await identityService.getUserAvatarForCurrentUser(
    normalizeAuthRequestHeaders(request.headers),
  );

  if (!avatar) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(avatar.content), {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'Content-Length': String(avatar.byteSize),
      'Content-Type': avatar.contentType,
    },
    status: 200,
  });
}

export async function handleUploadCurrentUserAvatar(
  request: Request,
): Promise<Response> {
  const identityService = await getWebIdentityService();
  const headers = normalizeAuthRequestHeaders(request.headers);
  const principal = await identityService.getCurrentPrincipal(headers);

  if (!principal) {
    return jsonResponse({ code: 'AUTHENTICATION_REQUIRED', ok: false }, 401);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ code: 'AVATAR_INVALID_TYPE', ok: false }, 400);
  }

  const file = formData.get('avatar');

  if (!(file instanceof File)) {
    return jsonResponse({ code: 'AVATAR_INVALID_TYPE', ok: false }, 400);
  }

  const fileBytes = Buffer.from(await file.arrayBuffer());

  if (fileBytes.byteLength > USER_AVATAR_MAX_UPLOAD_BYTES) {
    return jsonResponse({ code: 'AVATAR_TOO_LARGE', ok: false }, 413);
  }

  const result = await identityService.uploadUserAvatar({
    fileBytes,
    headers,
  });

  if (!result.ok) {
    const status =
      result.code === 'AUTHENTICATION_REQUIRED'
        ? 401
        : result.code === 'AVATAR_TOO_LARGE'
          ? 413
          : 400;

    return jsonResponse({ code: result.code, ok: false }, status);
  }

  return jsonResponse({
    avatarUrl: result.avatarUrl,
    code: result.code,
    ok: true,
  });
}

export async function handleDeleteCurrentUserAvatar(
  request: Request,
): Promise<Response> {
  const identityService = await getWebIdentityService();
  const headers = normalizeAuthRequestHeaders(request.headers);
  const result = await identityService.deleteUserAvatar(headers);

  if (!result.ok) {
    const status = result.code === 'AUTHENTICATION_REQUIRED' ? 401 : 400;
    return jsonResponse({ code: result.code, ok: false }, status);
  }

  return jsonResponse({
    avatarUrl: null,
    code: result.code,
    ok: true,
  });
}
