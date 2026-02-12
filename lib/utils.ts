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

export function formatRelativeTime(timestamp: Date | number): string {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const seconds = Math.floor((Date.now() - time) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  const weeks = Math.floor(seconds / 604800);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
}
