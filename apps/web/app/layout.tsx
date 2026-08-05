import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import {
  APP_BASELINE_DESCRIPTION,
  BRAND_SYMBOL_APPLE_TOUCH_ICON,
  BRAND_SYMBOL_ICON_192,
  BRAND_SYMBOL_ICON_512,
  BRAND_SYMBOL_ICON_PNG,
  BRAND_SYMBOL_ICON_SVG,
} from '../lib/brand/brand-symbol-paths';
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
  description: APP_BASELINE_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: BRAND_SYMBOL_ICON_SVG, type: 'image/svg+xml' },
      {
        url: BRAND_SYMBOL_ICON_192,
        type: 'image/png',
        sizes: '192x192',
      },
      {
        url: BRAND_SYMBOL_ICON_512,
        type: 'image/png',
        sizes: '512x512',
      },
      {
        url: BRAND_SYMBOL_ICON_PNG,
        type: 'image/png',
        sizes: '1024x1024',
      },
    ],
    apple: [
      {
        url: BRAND_SYMBOL_APPLE_TOUCH_ICON,
        type: 'image/png',
        sizes: '180x180',
      },
    ],
    shortcut: BRAND_SYMBOL_ICON_192,
  },
  appleWebApp: {
    capable: true,
    title: 'Diabetes Universe',
    statusBarStyle: 'default',
  },
  applicationName: 'Diabetes Universe',
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
