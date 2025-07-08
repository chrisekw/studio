'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { AppHeader } from '@/components/shared/app-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to resolve.

    if (!user) {
      router.replace('/login');
      return;
    }

    // Check if the user signed up with email/password and is not verified.
    const isEmailPasswordUser = user.providerData.some(
      (provider) => provider.providerId === 'password'
    );

    if (isEmailPasswordUser && !user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [user, loading, router]);
  
  const isEmailPasswordUser = user?.providerData.some(
    (provider) => provider.providerId === 'password'
  );

  // Show a loader while auth state is resolving, or if there's no user,
  // or if an unverified user is being redirected.
  if (loading || !user || (isEmailPasswordUser && !user.emailVerified)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user exists and is verified (or a social login), render the app layout.
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="p-4 sm:px-6 sm:py-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
