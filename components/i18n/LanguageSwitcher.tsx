'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

const locales: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Set cookie and refresh
      document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.refresh();
    });
  };

  const currentLocale = locales.find((l) => l.value === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocale?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.value}
            onClick={() => handleLocaleChange(loc.value)}
            className={loc.value === locale ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
          >
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
