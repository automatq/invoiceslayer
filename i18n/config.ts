export type Locale = (typeof locales)[number];

export const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr', 'vi', 'th', 'id', 'sv', 'no', 'da', 'fi', 'cs', 'hu', 'ro', 'uk'] as const;

export const defaultLocale: Locale = 'en';
