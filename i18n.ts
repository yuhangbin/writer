import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import type { Locale } from '@/lib/i18n';
import { readFileSync } from 'fs';
import { join } from 'path';

function getMessages(locale: Locale) {
  const filePath = join(process.cwd(), 'messages', `${locale}.json`);
  const fileContents = readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale;

  return {
    locale,
    messages: getMessages(locale),
  };
});
