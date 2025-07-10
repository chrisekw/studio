'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // The AuthProvider ensures that `user` and `loading` are resolved.
    // We can now safely redirect based on the user's state.
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // The loading state is now handled by AuthProvider, so we don't need a spinner here.
  // Returning null or an empty fragment is sufficient.
  return null;
}
