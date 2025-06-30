'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { Loader2, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  // If user becomes verified (e.g., in another tab), redirect them.
  useEffect(() => {
    if (user?.emailVerified) {
      toast({
        title: 'Email Verified!',
        description: 'Thank you for verifying your email. Welcome aboard!',
      });
      router.replace('/dashboard');
    }
  }, [user, router, toast]);

  const handleResend = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent',
        description: 'A new verification link has been sent to your email address.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send verification email.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // While checking auth state or if user is already verified and redirecting.
  if (loading || user?.emailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  // If there's no user object, they shouldn't be here.
  if (!user) {
    router.replace('/login');
    return (
       <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 text-center">
        <div className="flex justify-center">
          <MailCheck className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline">Verify Your Email</h1>
        <p className="text-balance text-muted-foreground">
          We've sent a verification link to <strong>{user.email}</strong>. Please check your inbox and click the link to continue.
        </p>
      </div>
      <div className="grid gap-4 mt-6">
        <Button onClick={() => window.location.reload()}>I've verified my email</Button>
        <Button variant="outline" onClick={handleResend} disabled={isSending}>
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Resend Verification Link
        </Button>
      </div>
      <div className="mt-4 text-center text-sm">
        <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>
          Back to Login
        </Button>
      </div>
    </>
  );
}
