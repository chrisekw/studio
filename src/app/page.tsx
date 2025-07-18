'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait until loading is false

    if (user && userProfile) {
      // If user is logged in, check their role and redirect
      if (userProfile.isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } else if (!user) {
      // If no user, redirect to login
      router.replace('/login');
    }
    
    // The case where `user` exists but `userProfile` is still loading
    // is handled by the main `loading` flag.

  }, [user, userProfile, loading, router]);

  // Show a loader while authentication state is being determined.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
