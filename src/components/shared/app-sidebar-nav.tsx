'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { LayoutDashboard, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/saved-leads', icon: Save, label: 'Saved Leads' },
];

interface AppSidebarNavProps {
  isMobile?: boolean;
}

export function AppSidebarNav({ isMobile = false }: AppSidebarNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const linkClasses = cn(
          'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
          isActive && 'bg-accent text-accent-foreground',
          isMobile && 'w-full h-auto justify-start gap-4 px-2.5 py-2 text-base'
        );
        const Icon = item.icon;

        if (isMobile) {
          return (
             <Link key={item.href} href={item.href} className={linkClasses}>
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        }

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link href={item.href} className={linkClasses}>
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </TooltipProvider>
  );
}
