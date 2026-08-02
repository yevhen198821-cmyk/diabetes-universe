import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from './providers';

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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
