
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state and profile to resolve.

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!userProfile?.isAdmin) {
      router.replace('/dashboard'); // Redirect non-admins
    }
  }, [user, userProfile, loading, router]);

  // Show a loader while auth state is resolving or if the user is not an admin and is being redirected.
  if (loading || !userProfile || !userProfile.isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is an admin, render the admin layout.
  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1">
        <AdminHeader />
        <main className="flex-1 p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
