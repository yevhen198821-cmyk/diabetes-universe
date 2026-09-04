import type { Metadata } from 'next';

import { AuthErrorPageContent } from '../../../components/auth/auth-error-page-content';

export const metadata: Metadata = {
  title: 'Sign-in error',
  description: 'Could not complete sign-in.',
};

export default function AuthErrorPage() {
  return <AuthErrorPageContent />;
}
