import type { Metadata } from 'next';

import { TimelineShell } from '../../components/timeline/timeline-shell';

export const metadata: Metadata = {
  title: 'Timeline | Diabetes Universe',
  description: 'Демонстрационный журнал событий Diabetes Universe.',
};

export default function TimelinePage() {
  return <TimelineShell />;
}
