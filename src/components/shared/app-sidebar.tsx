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
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
      });
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="group flex w-full items-center justify-center gap-2 rounded-md p-2 text-lg font-semibold md:text-base"
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
          <span className={state === 'collapsed' ? 'hidden': 'font-headline text-lg font-bold'}>LeadGen</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarNav />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <QuotaDisplay />
        {user && (
          <>
            <SidebarSeparator />
            <div className="p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start p-2 h-auto text-muted-foreground hover:text-foreground">
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
              </Button>
            </div>
          </>
        )}
        <SidebarSeparator />
        <div className="hidden md:flex p-2 pt-2">
            <Button onClick={toggleSidebar} variant="ghost" className="w-full justify-start p-2 h-auto">
                {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                <span className="group-data-[collapsible=icon]:hidden ml-2">Collapse</span>
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
