
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state and profile to resolve.
    if (loading) return;

    if (user && userProfile) {
      // If user is logged in, redirect them.
      if (userProfile.isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  // Show a loader while auth state is resolving or if a redirect is in progress.
  if (loading || user) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If there's no user and auth is resolved, render the auth layout
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 lg:py-0">
        <div className="mx-auto grid w-[350px] gap-6">
            <Link
                href="/"
                className="group flex items-center justify-center gap-2 mb-4"
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
                <span className="text-3xl font-headline font-bold text-foreground">oPilot</span>
            </Link>
            {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col p-8 text-center">
        <Image 
          src="https://placehold.co/600x400.png"
          alt="AI Copilot graphic"
          width={600}
          height={400}
          className="rounded-lg shadow-2xl shadow-primary/20"
          data-ai-hint="abstract geometric"
        />
        <p className="mt-8 text-lg text-muted-foreground">
          Your AI copilot for lead generation.
        </p>
      </div>
    </div>
  );
}
