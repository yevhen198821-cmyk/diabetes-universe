import type { Metadata } from 'next';

import { ProfileDiabetesManagementPanel } from '../../../components/profile/profile-diabetes-management-panel';

export const metadata: Metadata = {
  title: 'Diabetes management',
  description:
    'Configure glucose display units, diabetes type, and target range.',
};

export default function AccountDiabetesManagementPage() {
  return <ProfileDiabetesManagementPanel />;
}
