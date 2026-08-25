import type { Metadata } from 'next';

import { ProfileAboutPanel } from '../../../components/profile/profile-about-panel';
import { resolveAppBuildMetadata } from '../../../lib/app/app-metadata';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Diabetes Universe.',
};

export default function AccountAboutPage() {
  const metadata = resolveAppBuildMetadata();

  return <ProfileAboutPanel metadata={metadata} />;
}
