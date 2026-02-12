import type { ReactNode } from 'react';

interface MainLayoutProps {
  sidebar: ReactNode;
  inputBar: ReactNode;
  creativeZone: ReactNode;
}

export default function MainLayout({
  sidebar,
  inputBar,
  creativeZone,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[280px] min-w-[280px] border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {sidebar}
        </div>

        {/* Right Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Input Bar */}
          <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {inputBar}
          </div>

          {/* Bottom Creative Zone */}
          <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900">
            {creativeZone}
          </div>
        </div>
      </div>
    </div>
  );
}
