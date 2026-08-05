import type { Metadata } from 'next';

import { APP_BASELINE_DESCRIPTION } from '../../lib/brand/brand-symbol-paths';
import { TimelineShell } from '../../components/timeline/timeline-shell';

export const metadata: Metadata = {
  title: 'Timeline | Diabetes Universe',
  description: APP_BASELINE_DESCRIPTION,
};

export default function TimelinePage() {
  return <TimelineShell />;
}
