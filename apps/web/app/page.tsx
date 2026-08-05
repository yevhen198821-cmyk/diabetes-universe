import type { Metadata } from 'next';

import { APP_BASELINE_DESCRIPTION } from '../lib/brand/brand-symbol-paths';
import { DashboardRoot } from '../components/dashboard/dashboard-root';

export const metadata: Metadata = {
  title: 'Dashboard | Diabetes Universe',
  description: APP_BASELINE_DESCRIPTION,
};

export default function HomePage() {
  return <DashboardRoot />;
}
