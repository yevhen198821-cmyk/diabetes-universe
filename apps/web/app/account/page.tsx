import { ProfileProfileSegment } from '../../components/profile/profile-profile-segment';
import { requireAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';
import { createLocalizedRouteMetadata } from '../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.profile.title',
    descriptionKey: 'account.profile.subtitle',
  });
}

export default async function AccountPage() {
  const principal = await requireAuthenticatedPrincipal();

  return <ProfileProfileSegment principal={principal} />;
}
