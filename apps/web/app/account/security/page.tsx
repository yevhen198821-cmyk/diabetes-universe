import type { Metadata } from 'next';
import { headers } from 'next/headers';

import type { PasskeySummary } from '@diabetes-universe/identity';

import { ProfileSecuritySegment } from '../../../components/profile/profile-security-segment';
import { requireAuthenticatedPrincipal } from '../../../lib/auth/get-authenticated-principal';
import {
  getWebIdentityService,
  isWebPasskeyConfigured,
} from '../../../lib/auth/get-web-identity-service';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Manage sign-in security for Diabetes Universe.',
};

export default async function AccountSecurityPage() {
  await requireAuthenticatedPrincipal();

  const passkeyEnabled = isWebPasskeyConfigured();
  let passkeys: PasskeySummary[] = [];

  if (passkeyEnabled) {
    try {
      const identityService = await getWebIdentityService();
      passkeys = [...(await identityService.listPasskeys(await headers()))];
    } catch {
      passkeys = [];
    }
  }

  return (
    <ProfileSecuritySegment
      passkeyEnabled={passkeyEnabled}
      passkeys={passkeys}
    />
  );
}
