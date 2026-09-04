import type { Metadata } from 'next';

import { APP_BASELINE_DESCRIPTION } from '../../lib/brand/brand-symbol-paths';
import { TimelineShell } from '../../components/timeline/timeline-shell';
import { createLocalizedRouteMetadata } from '../../lib/platform/create-localized-route-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await createLocalizedRouteMetadata({
      titleKey: 'timeline.header.title',
    })),
    description: APP_BASELINE_DESCRIPTION,
  };
}

export default function TimelinePage() {
  return <TimelineShell />;
}
