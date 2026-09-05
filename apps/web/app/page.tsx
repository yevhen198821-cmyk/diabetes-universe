import type { Metadata } from 'next';

import { DashboardRoot } from '../components/dashboard/dashboard-root';
import { createLocalizedRouteMetadata } from '../lib/platform/create-localized-route-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createLocalizedRouteMetadata({
    titleKey: 'dashboard.header.title',
    descriptionKey: 'dashboard.header.description',
  });
}

export default function HomePage() {
  return <DashboardRoot />;
}
