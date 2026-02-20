import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming `locale` parameter is valid
  const locale = await requestLocale;

  console.log('[i18n-request] requestLocale:', locale);

  if (!locale || !locales.includes(locale as Locale)) {
    console.log('[i18n-request] Invalid or missing locale:', locale, '- calling notFound()');
    notFound();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
