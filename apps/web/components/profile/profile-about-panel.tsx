'use client';

import { useMemo } from 'react';

import type { AppBuildMetadata } from '../../lib/app/app-metadata';
import { ProductBrandLogo } from '../brand/product-brand-logo';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveProfileAboutLabels } from './profile-about-labels';
import {
  profileCardClassName,
  profileComingSoonBadgeClassName,
  profileDisabledRowClassName,
  profileInsetSurfaceClassName,
  profileSectionHeadingClassName,
} from './profile-surface-styles';

function ProfileAboutSection({
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

function ProfileAboutComingSoonRow({
  comingSoonLabel,
  title,
}: {
  readonly comingSoonLabel: string;
  readonly title: string;
}) {
  return (
    <div aria-disabled="true" className={profileDisabledRowClassName}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-text-primary truncate text-sm font-semibold">
            {title}
          </p>
          <span className={profileComingSoonBadgeClassName}>
            {comingSoonLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileAboutInfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className={`${profileInsetSurfaceClassName} px-4 py-3`}>
      <p className="text-text-secondary text-xs">{label}</p>
      <p className="text-text-primary mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function ProfileAboutPanel({
  metadata,
}: {
  readonly metadata: AppBuildMetadata;
}) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileAboutLabels(localization),
    [localization],
  );

  return (
    <div className={`${profileCardClassName} space-y-5 p-6`}>
      <header className="space-y-2">
        <h2 className="text-text-primary text-lg font-bold">
          {labels.page.title}
        </h2>
      </header>

      <section
        aria-labelledby="profile-about-product-heading"
        className={`${profileInsetSurfaceClassName} space-y-3 px-4 py-5 text-center`}
      >
        <div className="flex justify-center">
          <ProductBrandLogo priority variant="auth" />
        </div>
        <div className="space-y-1">
          <h3
            className="text-text-primary text-base font-bold"
            id="profile-about-product-heading"
          >
            {labels.page.productName}
          </h3>
          {metadata.version ? (
            <p className="text-text-secondary text-xs">
              {labels.versionLabel}: {metadata.version}
            </p>
          ) : null}
          <p className="text-text-secondary text-sm">{labels.description}</p>
        </div>
      </section>

      <section
        className={`${profileInsetSurfaceClassName} space-y-2 px-4 py-4`}
      >
        <h3 className="text-text-primary text-sm font-semibold">
          {labels.page.ecosystem.title}
        </h3>
        <p className="text-text-secondary text-sm">
          {labels.page.ecosystem.description}
        </p>
      </section>

      <section
        aria-labelledby="profile-about-medical-heading"
        className={`${profileInsetSurfaceClassName} space-y-2 border-amber-200/80 bg-amber-50/70 px-4 py-4 dark:border-amber-400/20 dark:bg-amber-400/10`}
      >
        <h3
          className="text-text-primary text-sm font-semibold"
          id="profile-about-medical-heading"
        >
          {labels.page.medical.title}
        </h3>
        <p className="text-text-secondary text-sm">
          {labels.page.medical.description}
        </p>
      </section>

      <ProfileAboutSection title={labels.page.sections.privacyAndData}>
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.privacyPolicy}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.dataManagement}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.dataExport}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.accountDeletion}
        />
      </ProfileAboutSection>

      <ProfileAboutSection title={labels.page.sections.legal}>
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.termsOfUse}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.licenses}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.openSourceLicenses}
        />
      </ProfileAboutSection>

      <ProfileAboutSection title={labels.page.sections.help}>
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.supportCenter}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.contactSupport}
        />
        <ProfileAboutComingSoonRow
          comingSoonLabel={labels.comingSoonBadge}
          title={labels.page.rows.reportIssue}
        />
      </ProfileAboutSection>

      {metadata.version || metadata.buildLabel ? (
        <ProfileAboutSection title={labels.page.sections.technical}>
          {metadata.version ? (
            <ProfileAboutInfoRow
              label={labels.versionLabel}
              value={metadata.version}
            />
          ) : null}
          {metadata.buildLabel ? (
            <ProfileAboutInfoRow
              label={labels.page.buildInfoLabel}
              value={metadata.buildLabel}
            />
          ) : null}
        </ProfileAboutSection>
      ) : null}
    </div>
  );
}
