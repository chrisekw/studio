'use client';

import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import Link from 'next/link';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { isMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-sm sm:px-6 sticky top-0 z-10">
      <div className="flex-1 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <svg
            className="h-8 w-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            >
             <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                fill="currentColor"
            />
            </svg>
          <span className="font-headline text-lg font-bold">oPilot</span>
        </Link>
      </div>
      
      {isMobile ? (
        <SidebarTrigger>
          <Menu className="h-6 w-6" />
        </SidebarTrigger>
      ) : (
        <Button onClick={toggleSidebar} variant="ghost" size="icon" className="ml-auto">
          {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}

    </header>
  );
}
