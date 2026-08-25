'use client';

import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import { getDashboardAvatarImageUrl } from '../dashboard/dashboard-header-model';

const defaultAvatarShellClassName =
  'grid shrink-0 place-items-center overflow-hidden rounded-full border border-border-default bg-surface-subtle text-sm font-semibold text-text-primary ring-1 ring-border-subtle dark:border-white/10 dark:bg-slate-900/85 dark:ring-white/10';

export interface UserAvatarProps {
  readonly avatarInitials: string | null;
  readonly avatarLabel: string;
  readonly avatarUrl: string | null;
  readonly className?: string;
  readonly sizeClassName?: string;
}

export function UserAvatar({
  avatarInitials,
  avatarLabel,
  avatarUrl,
  className,
  sizeClassName = 'size-16',
}: UserAvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const visibleAvatarUrl = getDashboardAvatarImageUrl(
    avatarUrl,
    failedAvatarUrl,
  );
  const shellClassName = `${defaultAvatarShellClassName} ${sizeClassName} ${className ?? ''}`;

  let content: ReactNode;

  if (visibleAvatarUrl) {
    content = (
      <Image
        alt={avatarLabel}
        className="size-full object-cover"
        height={64}
        onError={() => setFailedAvatarUrl(visibleAvatarUrl)}
        sizes="64px"
        src={visibleAvatarUrl}
        unoptimized
        width={64}
      />
    );
  } else if (avatarInitials) {
    content = <span aria-hidden="true">{avatarInitials}</span>;
  } else {
    content = <UserRound aria-hidden="true" size={24} strokeWidth={2.2} />;
  }

  return (
    <span aria-label={avatarLabel} className={shellClassName} role="img">
      {content}
    </span>
  );
}
