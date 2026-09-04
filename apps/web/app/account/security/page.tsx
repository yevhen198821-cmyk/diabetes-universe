import { headers } from 'next/headers';

import type { PasskeySummary } from '@diabetes-universe/identity';

import { ProfileSecuritySegment } from '../../../components/profile/profile-security-segment';
import { requireAuthenticatedPrincipal } from '../../../lib/auth/get-authenticated-principal';
import {
  getWebIdentityService,
  isWebPasskeyConfigured,
} from '../../../lib/auth/get-web-identity-service';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.profile.segments.security',
    descriptionKey: 'account.profile.security.sessionsLink.subtitle',
  });
}

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
