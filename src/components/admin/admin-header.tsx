
'use client';

import { useSidebar } from '../ui/sidebar';
import Link from 'next/link';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export function AdminHeader() {
  const { isMobile, toggleSidebar, state } = useSidebar();
  const { userProfile } = useAuth();
  const isCollapsed = state === 'collapsed';

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      {/* Mobile Header */}
      <div className="flex w-full items-center gap-4 md:hidden">
         <Button variant="outline" size="icon" className="shrink-0" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
        </Button>
        <div className="flex-1 text-right text-sm text-muted-foreground truncate">
            {userProfile?.email}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden flex-1 items-center gap-4 md:flex">
        <Button onClick={toggleSidebar} variant="ghost" size="icon">
            {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div className="flex-1 text-right text-sm text-muted-foreground">
            {userProfile?.email}
        </div>
      </div>
    </header>
  );
}
