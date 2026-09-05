import { CheckEmailPageContent } from '../../../components/auth/check-email-page-content';
import { createLocalizedRouteMetadata } from '../../../lib/platform/create-localized-route-metadata';

export async function generateMetadata() {
  return createLocalizedRouteMetadata({
    titleKey: 'account.auth.checkEmail.title',
    descriptionKey: 'account.auth.checkEmail.withoutAddress',
  });
}

interface CheckEmailPageProps {
  readonly searchParams: Promise<{
    readonly email?: string;
  }>;
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const params = await searchParams;
  const email = params.email?.trim();

  return <CheckEmailPageContent email={email} />;
}
