import type { ReactNode } from 'react';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarResizeHandle } from './SidebarResizeHandle';

interface MainLayoutProps {
  sidebar: ReactNode;
  inputBar: ReactNode;
  creativeZone: ReactNode;
  userProfile?: ReactNode;
  headerLeft?: ReactNode;
}

export default function MainLayout({
  sidebar,
  inputBar,
  creativeZone,
  userProfile,
  headerLeft,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsible="offcanvas">
          <div className="flex h-full flex-col">
            {sidebar}
          </div>
        </Sidebar>
        <SidebarResizeHandle />
        <SidebarInset>
          <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {(headerLeft || userProfile) && (
              <div className="flex h-14 items-center justify-between border-b border-zinc-200 bg-background px-4 dark:border-zinc-800">
                <div className="flex items-center">
                  {headerLeft}
                </div>
                <div className="flex items-center">
                  {userProfile}
                </div>
              </div>
            )}
            <div className="border-b border-zinc-200 bg-background dark:border-zinc-800">
              {inputBar}
            </div>
            <div className="flex-1 overflow-hidden bg-background">
              {creativeZone}
            </div>
          </div>
        </SidebarInset>
      </div>
    </div>
  );
}
