import type { Metadata } from 'next';

import { ProfileLanguageSelectionPanel } from '../../../components/profile/profile-language-selection-panel';

export const metadata: Metadata = {
  title: 'Language',
  description:
    'Choose the language used for the app, dates, times, and numbers.',
};

export default function AccountLanguagePage() {
  return <ProfileLanguageSelectionPanel />;
}
