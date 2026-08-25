'use client';

import {
  Activity,
  Download,
  Globe2,
  Info,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import type { ProfileLabels } from './profile-labels';
import {
  profileAboutExpandedDividerClassName,
  profileComingSoonBadgeClassName,
  profileDisabledRowClassName,
  profileInsetSurfaceClassName,
  PROFILE_ICON_TONE_CLASS,
  profileSectionHeadingClassName,
  type ProfileMenuIconTone,
} from './profile-surface-styles';

const APP_VERSION = '0.0.0';

function ProfileMenuSection({
  title,
  children,
}: {
  readonly children: React.ReactNode;
  readonly title: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className={profileSectionHeadingClassName}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ProfileMenuIcon({
  icon: Icon,
  tone,
}: {
  readonly icon: LucideIcon;
  readonly tone: ProfileMenuIconTone;
}) {
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-xl ${PROFILE_ICON_TONE_CLASS[tone]}`}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
    </span>
  );
}

function ProfileMenuDisabledRow({
  comingSoonLabel,
  icon,
  subtitle,
  title,
  tone,
}: {
  readonly comingSoonLabel: string;
  readonly icon: LucideIcon;
  readonly subtitle: string;
  readonly title: string;
  readonly tone: ProfileMenuIconTone;
}) {
  return (
    <div aria-disabled="true" className={profileDisabledRowClassName}>
      <ProfileMenuIcon icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-text-primary truncate text-sm font-semibold">
            {title}
          </p>
          <span className={profileComingSoonBadgeClassName}>
            {comingSoonLabel}
          </span>
        </div>
        <p className="text-text-secondary mt-0.5 line-clamp-2 text-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ProfileMenuAboutRow({ labels }: { readonly labels: ProfileLabels }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${profileInsetSurfaceClassName} px-4 py-3`}>
      <button
        aria-expanded={expanded}
        className="focus-visible:outline-interactive-primary flex min-h-11 w-full items-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <ProfileMenuIcon icon={Info} tone="neutral" />
        <span className="min-w-0 flex-1">
          <span className="text-text-primary block text-sm font-semibold">
            {labels.about.title}
          </span>
          <span className="text-text-secondary mt-0.5 block text-xs">
            {labels.about.subtitle}
          </span>
        </span>
      </button>
      {expanded ? (
        <div className={profileAboutExpandedDividerClassName}>
          <p>{labels.about.description}</p>
          <p className="text-text-tertiary mt-2 text-xs">
            {labels.about.versionLabel}: {APP_VERSION}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileMenu({ labels }: { readonly labels: ProfileLabels }) {
  return (
    <div className="space-y-5">
      <ProfileMenuSection title={labels.menu.section.diabetesManagement}>
        <ProfileMenuDisabledRow
          comingSoonLabel={labels.comingSoonBadge}
          icon={Activity}
          subtitle={labels.menu.diabetesSettings.subtitle}
          title={labels.menu.diabetesSettings.title}
          tone="violet"
        />
      </ProfileMenuSection>

      <ProfileMenuSection title={labels.menu.section.devices}>
        <ProfileMenuDisabledRow
          comingSoonLabel={labels.comingSoonBadge}
          icon={Smartphone}
          subtitle={labels.menu.devices.subtitle}
          title={labels.menu.devices.title}
          tone="blue"
        />
      </ProfileMenuSection>

      <ProfileMenuSection title={labels.menu.section.personalization}>
        <ProfileMenuDisabledRow
          comingSoonLabel={labels.comingSoonBadge}
          icon={Globe2}
          subtitle={labels.menu.language.subtitle}
          title={labels.menu.language.title}
          tone="teal"
        />
      </ProfileMenuSection>

      <ProfileMenuSection title={labels.menu.section.data}>
        <ProfileMenuDisabledRow
          comingSoonLabel={labels.comingSoonBadge}
          icon={Download}
          subtitle={labels.menu.export.subtitle}
          title={labels.menu.export.title}
          tone="coral"
        />
        <ProfileMenuAboutRow labels={labels} />
      </ProfileMenuSection>
    </div>
  );
}
