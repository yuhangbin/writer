'use client';

import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 300;
const STORAGE_KEY = 'sidebar-width';

export function SidebarResizeHandle() {
  const { open, state } = useSidebar();
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    }
    return DEFAULT_WIDTH;
  });

  // Update CSS variable when width changes
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
      localStorage.setItem(STORAGE_KEY, width.toString());
    }
  }, [width, open]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Hide on mobile or when collapsed
  if (!open || state === 'collapsed') return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute top-0 right-0 h-full w-1 cursor-col-resize',
        'hover:w-2 hover:bg-zinc-300 dark:hover:bg-zinc-600',
        'transition-colors group-data-[side=left]:-right-0',
        'hidden md:block' // Hide on mobile
      )}
    />
  );
}
