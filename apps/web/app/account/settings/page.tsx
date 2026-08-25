import type { Metadata } from 'next';

import { ProfileSettingsPanel } from '../../../components/profile/profile-settings-panel';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Account settings for Diabetes Universe.',
};

export default function AccountSettingsPage() {
  return <ProfileSettingsPanel />;
}
