import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { ProfileShell } from '../../components/profile/profile-shell';
import { getAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';

type AccountLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const principal = await getAuthenticatedPrincipal();

  if (!principal) {
    redirect('/auth?callback=/account');
  }

  return <ProfileShell>{children}</ProfileShell>;
}
