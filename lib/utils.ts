import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateWordCount(html: string): number {
  if (typeof window === 'undefined') return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || '';
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function generateTitleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 50) + '...';
}

export function formatRelativeTime(timestamp: Date | number, locale: string = 'en'): string {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const seconds = Math.floor((Date.now() - time) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (seconds < 60) return locale === 'zh' ? '刚刚' : 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return rtf.format(-minutes, 'minute');
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return rtf.format(-hours, 'hour');
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return rtf.format(-days, 'day');
  }
  const weeks = Math.floor(seconds / 604800);
  return rtf.format(-weeks, 'week');
}
