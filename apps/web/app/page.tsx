import type { Metadata } from 'next';

import { DashboardRoot } from '../components/dashboard/dashboard-root';

export const metadata: Metadata = {
  title: 'Dashboard | Diabetes Universe',
  description: 'Главный экран Diabetes Universe.',
};

export default function HomePage() {
  return <DashboardRoot />;
}
