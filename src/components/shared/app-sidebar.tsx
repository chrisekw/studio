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
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function AppSidebar() {
  const { state } = useSidebar();
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
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                fill="currentColor"
            />
          </svg>
          <span className={state === 'collapsed' ? 'hidden': 'font-headline text-lg font-bold'}>oPilot</span>
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
      </SidebarFooter>
    </Sidebar>
  );
}
