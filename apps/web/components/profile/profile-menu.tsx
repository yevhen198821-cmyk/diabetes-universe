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

const APP_VERSION = '0.0.0';

type ProfileMenuIconTone =
  'amber' | 'blue' | 'coral' | 'neutral' | 'teal' | 'violet';

const ICON_TONE_CLASS: Readonly<Record<ProfileMenuIconTone, string>> = {
  amber:
    'bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/25 dark:text-amber-100',
  blue: 'bg-blue-400/15 text-blue-200 ring-1 ring-blue-300/25 dark:text-blue-100',
  coral:
    'bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/25 dark:text-rose-100',
  neutral:
    'bg-slate-400/10 text-slate-200 ring-1 ring-slate-300/15 dark:text-slate-100',
  teal: 'bg-teal-400/15 text-teal-200 ring-1 ring-teal-300/25 dark:text-teal-100',
  violet:
    'bg-violet-400/15 text-violet-200 ring-1 ring-violet-300/25 dark:text-violet-100',
};

function ProfileMenuSection({
  title,
  children,
}: {
  readonly children: React.ReactNode;
  readonly title: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
        {title}
      </h3>
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
      className={`grid size-10 shrink-0 place-items-center rounded-xl ${ICON_TONE_CLASS[tone]}`}
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
    <div
      aria-disabled="true"
      className="flex min-h-[4.75rem] items-center gap-3 rounded-[1.15rem] border border-white/6 bg-slate-950/25 px-4 py-3 opacity-80"
    >
      <ProfileMenuIcon icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-200">
            {title}
          </p>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
            {comingSoonLabel}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function ProfileMenuAboutRow({ labels }: { readonly labels: ProfileLabels }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[1.15rem] border border-white/8 bg-slate-950/30 px-4 py-3">
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
        <div className="mt-3 border-t border-white/8 pt-3 pl-[3.25rem] text-sm text-slate-300">
          <p>{labels.about.description}</p>
          <p className="mt-2 text-xs text-slate-400">
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
