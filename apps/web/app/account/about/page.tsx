import { ProfileAboutPanel } from '../../../components/profile/profile-about-panel';
import { resolveAppBuildMetadata } from '../../../lib/app/app-metadata';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.profile.about.page.title',
    descriptionKey: 'account.profile.about.description',
  });
}

export default function AccountAboutPage() {
  const metadata = resolveAppBuildMetadata();

  return <ProfileAboutPanel metadata={metadata} />;
}
