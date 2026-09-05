import type { Metadata } from 'next';

import { TimelineShell } from '../../components/timeline/timeline-shell';
import { createLocalizedRouteMetadata } from '../../lib/platform/create-localized-route-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createLocalizedRouteMetadata({
    titleKey: 'timeline.header.title',
    descriptionKey: 'timeline.header.description',
  });
}

export default function TimelinePage() {
  return <TimelineShell />;
}
