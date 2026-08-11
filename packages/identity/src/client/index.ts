'use client';

import { passkeyClient } from '@better-auth/passkey/client';
import { createAuthClient } from 'better-auth/client';

import {
  GENERIC_PASSKEY_ERROR_MESSAGE,
  type PasskeyClientResult,
} from '../contracts/auth-contracts';

const authClient = createAuthClient({
  plugins: [passkeyClient()],
});

export async function signInWithPasskey(): Promise<PasskeyClientResult> {
  try {
    const result = await authClient.signIn.passkey({ autoFill: false });

    if (result.error) {
      return { ok: false, message: GENERIC_PASSKEY_ERROR_MESSAGE };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC_PASSKEY_ERROR_MESSAGE };
  }
}

export async function addPasskey(name?: string): Promise<PasskeyClientResult> {
  try {
    const result = await authClient.passkey.addPasskey({
      name: name?.trim() || undefined,
    });

    if (result.error) {
      return { ok: false, message: GENERIC_PASSKEY_ERROR_MESSAGE };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC_PASSKEY_ERROR_MESSAGE };
  }
}
