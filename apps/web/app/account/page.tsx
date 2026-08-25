import type { Metadata } from 'next';

import { ProfileProfileSegment } from '../../components/profile/profile-profile-segment';
import { requireAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your Diabetes Universe account and preferences.',
};

export default async function AccountPage() {
  const principal = await requireAuthenticatedPrincipal();

  return <ProfileProfileSegment principal={principal} />;
}
