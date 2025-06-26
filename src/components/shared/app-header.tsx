'use client';

import { SidebarTrigger } from '../ui/sidebar';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-sm sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger>
           <svg
            className="h-6 w-6 text-primary"
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
        </SidebarTrigger>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="font-headline text-lg font-bold">Leadgen</span>
        </Link>
      </div>

      <div className="flex-1">
        {/* Can add breadcrumbs or title here */}
      </div>
    </header>
  );
}
