import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { createRequestPlatformRuntime } from '../lib/platform';
import { ApplicationRuntimeGate } from '../lib/platform/integration/application-runtime-gate';
import {
  createApplicationPlatformBootstrap,
  type ApplicationPlatformBootstrap,
} from '../lib/platform/integration/server';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Diabetes Universe',
    template: '%s | Diabetes Universe',
  },
  description: 'Демонстрационное приложение Diabetes Universe.',
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

function resolveDocumentLanguage(
  bootstrap: ApplicationPlatformBootstrap,
): string {
  if (bootstrap.status === 'ready') {
    return bootstrap.snapshot.language;
  }

  return bootstrap.seed.language;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const bootstrap = createApplicationPlatformBootstrap(
    await createRequestPlatformRuntime(),
  );

  return (
    <html lang={resolveDocumentLanguage(bootstrap)} suppressHydrationWarning>
      <body>
        <ApplicationRuntimeGate bootstrap={bootstrap}>
          {children}
        </ApplicationRuntimeGate>
      </body>
    </html>
  );
}
