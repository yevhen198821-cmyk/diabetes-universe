import { ProfileLanguageSelectionPanel } from '../../../components/profile/profile-language-selection-panel';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.profile.language.page.title',
    descriptionKey: 'account.profile.language.page.description',
  });
}

export default function AccountLanguagePage() {
  return <ProfileLanguageSelectionPanel />;
}
