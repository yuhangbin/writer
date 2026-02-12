'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User as UserType } from '@/hooks/use-auth';

interface UserProfileHeaderProps {
  user: UserType | null;
  onLogout: () => Promise<void>;
}

export function UserProfileHeader({ user, onLogout }: UserProfileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials (first 2 characters, capitalized)
  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await onLogout();
      // Redirect to login page will be handled by the auth state change
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center" ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-100 data-[state=open]:bg-zinc-100 dark:hover:bg-zinc-800 dark:data-[state=open]:bg-zinc-800"
          >
            {/* Avatar with initials */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900">
              <span className="text-xs font-medium">{getUserInitials(user.username)}</span>
            </div>

            {/* Username - hidden on mobile */}
            <span className="hidden text-sm font-medium text-zinc-900 dark:text-zinc-50 sm:block">
              {user.username}
            </span>

            {/* Dropdown arrow */}
            <ChevronDown className="h-4 w-4 text-zinc-500 sm:hidden" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 z-50">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              {user.email && (
                <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-zinc-600 focus:text-zinc-600 dark:text-zinc-400 dark:focus:text-zinc-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
