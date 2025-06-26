'use client';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { AppSidebarNav } from './app-sidebar-nav';
import { useSidebar } from '@/components/ui/sidebar';
import { QuotaDisplay } from './quota-display';

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="group flex w-full items-center justify-center gap-2 rounded-md p-2 text-lg font-semibold text-primary-foreground md:text-base"
        >
          <svg
            className="h-8 w-8 text-primary transition-all group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 12L22 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 12V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 12L2 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M17 4.5L7 9.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span className={state === 'collapsed' ? 'hidden': 'font-headline text-lg text-foreground font-bold'}>Leadgen</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarNav />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <QuotaDisplay />
      </SidebarFooter>
    </Sidebar>
  );
}
