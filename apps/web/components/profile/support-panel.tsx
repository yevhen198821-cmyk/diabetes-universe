'use client';
import Link from 'next/link';
import type { TranslationKey } from '@diabetes-universe/i18n';
import { useLocalization } from '../../lib/platform/react/use-localization';

export function SupportPanel() {
  const localization = useLocalization();
  const t = (key: string) =>
    localization.translate({ key: key as TranslationKey }).value;
  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-xl border p-6">
      <Link href="/" className="inline-flex min-h-11 items-center underline">
        {t('timeline.topBar.home')}
      </Link>
      <h1 className="text-xl font-semibold">{t('account.support.title')}</h1>
      <p>{t('account.support.operator')}</p>
      <a
        className="inline-flex min-h-11 items-center underline"
        href="mailto:resulto.universe@gmail.com"
      >
        resulto.universe@gmail.com
      </a>
      <p>{t('account.support.description')}</p>
      <p>{t('account.support.dataRequests')}</p>
    </section>
  );
}
