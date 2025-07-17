
'use client';

import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

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

  if (loading || !user || (isEmailPasswordUser && !user.emailVerified)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
