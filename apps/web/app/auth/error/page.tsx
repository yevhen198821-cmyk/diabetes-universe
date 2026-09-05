import { AuthErrorPageContent } from '../../../components/auth/auth-error-page-content';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.auth.error.title',
    descriptionKey: 'account.auth.error.description',
  });
}

export default function AuthErrorPage() {
  return <AuthErrorPageContent />;
}
