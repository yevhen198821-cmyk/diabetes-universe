'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  AUTH_UNAVAILABLE_MESSAGE,
  resolveSafeAuthCallbackPath,
} from '@diabetes-universe/identity';

import {
  getWebIdentityService,
  isWebAuthConfigured,
} from './get-web-identity-service';

export interface RequestMagicLinkState {
  readonly message?: string;
  readonly status: 'idle' | 'sent' | 'unavailable';
}

export async function requestMagicLinkAction(
  _previousState: RequestMagicLinkState,
  formData: FormData,
): Promise<RequestMagicLinkState> {
  if (!isWebAuthConfigured()) {
    return {
      message: AUTH_UNAVAILABLE_MESSAGE,
      status: 'unavailable',
    };
  }

  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return {
      message: 'Укажите email.',
      status: 'idle',
    };
  }

  const callbackPath = resolveSafeAuthCallbackPath(
    String(formData.get('callbackPath') ?? '/account'),
  );
  const identityService = await getWebIdentityService();
  await identityService.requestMagicLink({
    callbackPath,
    email,
    headers: await headers(),
  });

  redirect(`/auth/check-email?email=${encodeURIComponent(email)}`);
}
