'use client';

import { SidebarTrigger } from '../ui/sidebar';

export function AppHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-sm sm:px-6 sticky top-0 z-10">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Can add breadcrumbs or title here */}
      </div>
    </header>
  );
}
