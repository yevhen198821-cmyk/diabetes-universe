import { ProfileSettingsPanel } from '../../../components/profile/profile-settings-panel';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.profile.settings.title',
    descriptionKey: 'account.profile.settings.description',
  });
}

export default function AccountSettingsPage() {
  return <ProfileSettingsPanel />;
}
