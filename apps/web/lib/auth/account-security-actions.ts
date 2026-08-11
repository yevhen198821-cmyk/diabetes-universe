'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { GENERIC_PASSKEY_ERROR_MESSAGE } from '@diabetes-universe/identity';

import { getWebIdentityService } from './get-web-identity-service';

export interface PasskeyMutationState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
}

export async function deletePasskeyAction(
  _previousState: PasskeyMutationState,
  formData: FormData,
): Promise<PasskeyMutationState> {
  const passkeyId = String(formData.get('passkeyId') ?? '').trim();

  if (!passkeyId) {
    return { status: 'error', message: GENERIC_PASSKEY_ERROR_MESSAGE };
  }

  try {
    const identityService = await getWebIdentityService();
    await identityService.deletePasskey({
      passkeyId,
      headers: await headers(),
    });
    revalidatePath('/account/security');
    return { status: 'success', message: 'Passkey удалён.' };
  } catch {
    return { status: 'error', message: GENERIC_PASSKEY_ERROR_MESSAGE };
  }
}

export async function signOutCurrentSessionAction(): Promise<never> {
  try {
    const identityService = await getWebIdentityService();
    await identityService.signOutCurrentSession(await headers());
  } finally {
    redirect('/auth');
  }
}
