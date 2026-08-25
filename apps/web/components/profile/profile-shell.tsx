'use client';

import { usePathname } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';

import { signOutCurrentSessionAction } from '../../lib/auth/account-security-actions';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { SkipLink } from '../accessibility/skip-link';
import { DashboardMobileNav } from '../dashboard/dashboard-mobile-nav';
import {
  SegmentedControl,
  SegmentedControlPanel,
} from '../shared/segmented-control';
import { resolveProfileLabels } from './profile-labels';
import {
  profileMainContainerClassName,
  ProfilePageBackground,
  profilePageShellClassName,
} from './profile-page-background';
import {
  PROFILE_SEGMENT_PATHS,
  resolveProfileSegmentFromPathname,
  type ProfileSegment,
} from './profile-segment';

export interface ProfileShellProps {
  readonly children: ReactNode;
}

function getActivePanelId(segment: ProfileSegment): string {
  return `profile-segment-${segment}`;
}

export function ProfileShell({ children }: ProfileShellProps) {
  const localization = useLocalization();
  const pathname = usePathname() ?? '/account';
  const labels = useMemo(
    () => resolveProfileLabels(localization),
    [localization],
  );
  const activeSegment = resolveProfileSegmentFromPathname(pathname);

  const segmentedItems = useMemo(
    () => [
      {
        href: PROFILE_SEGMENT_PATHS.profile,
        id: 'profile',
        label: labels.segments.profile,
      },
      {
        href: PROFILE_SEGMENT_PATHS.settings,
        id: 'settings',
        label: labels.segments.settings,
      },
      {
        href: PROFILE_SEGMENT_PATHS.security,
        id: 'security',
        label: labels.segments.security,
      },
    ],
    [
      labels.segments.profile,
      labels.segments.security,
      labels.segments.settings,
    ],
  );

  return (
    <div className={profilePageShellClassName}>
      <ProfilePageBackground />
      <SkipLink />

      <main className={profileMainContainerClassName} id="main-content">
        <header className="space-y-1">
          <h1 className="text-text-primary text-[1.75rem] font-extrabold tracking-tight sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="text-text-secondary text-sm">{labels.subtitle}</p>
        </header>

        <SegmentedControl
          activeItemId={activeSegment}
          ariaLabel={labels.title}
          items={segmentedItems}
        />

        <SegmentedControlPanel labelledBy={getActivePanelId(activeSegment)}>
          {children}
        </SegmentedControlPanel>
      </main>

      <DashboardMobileNav activeTab="account" />
    </div>
  );
}

export function ProfileLogoutButton({ label }: { readonly label: string }) {
  return (
    <form action={signOutCurrentSessionAction} className="pt-2">
      <button
        className="focus-visible:outline-interactive-primary min-h-11 w-full rounded-[1rem] border border-rose-400/30 bg-rose-500/10 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 focus-visible:outline-2 focus-visible:outline-offset-2"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
