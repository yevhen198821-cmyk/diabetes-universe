import type { Metadata } from 'next';

import { CheckEmailPageContent } from '../../../components/auth/check-email-page-content';

export const metadata: Metadata = {
  title: 'Check your email',
  description: 'Confirm sign-in from the email link.',
};

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
