import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { resolveSafeAuthCallbackPath } from '@diabetes-universe/identity';
import {
  isPreviewAuthDeployment,
  probeAuthConfiguration,
} from '@diabetes-universe/identity';

import { SignInPageContent } from '../../components/auth/sign-in-page-content';
import { getAuthenticatedPrincipal } from '../../lib/auth/get-authenticated-principal';
import {
  isWebAuthConfigured,
  isWebPasskeyConfigured,
} from '../../lib/auth/get-web-identity-service';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Diabetes Universe.',
};

interface AuthPageProps {
  readonly searchParams: Promise<{
    readonly callback?: string;
  }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const callbackPath = resolveSafeAuthCallbackPath(params.callback);
  const principal = await getAuthenticatedPrincipal();

  if (principal) {
    redirect(callbackPath);
  }

  const isAuthAvailable = isWebAuthConfigured();

  if (isPreviewAuthDeployment() && !isAuthAvailable) {
    const probe = probeAuthConfiguration();
    console.info(
      '[preview-auth-config]',
      JSON.stringify({
        failureStage: probe.failureStage,
        failureMessage: probe.failureMessage,
        envPresence: probe.envPresence,
      }),
    );
  }

  return (
    <SignInPageContent
      callbackPath={callbackPath}
      isAuthAvailable={isAuthAvailable}
      isPasskeyAvailable={isAuthAvailable && isWebPasskeyConfigured()}
    />
  );
}
