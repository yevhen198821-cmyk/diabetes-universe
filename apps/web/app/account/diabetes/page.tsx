import { ProfileDiabetesManagementPanel } from '../../../components/profile/profile-diabetes-management-panel';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.diabetesManagement.page.title',
    descriptionKey: 'account.diabetesManagement.page.description',
  });
}

export default function AccountDiabetesManagementPage() {
  return <ProfileDiabetesManagementPanel />;
}
