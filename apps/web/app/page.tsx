import type { Metadata } from 'next';

import { APP_BASELINE_DESCRIPTION } from '../lib/brand/brand-symbol-paths';
import { DashboardRoot } from '../components/dashboard/dashboard-root';
import { createLocalizedRouteMetadata } from '../lib/platform/create-localized-route-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await createLocalizedRouteMetadata({
      titleKey: 'dashboard.header.title',
    })),
    description: APP_BASELINE_DESCRIPTION,
  };
}

export default function HomePage() {
  return <DashboardRoot />;
}
