
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import type { UserPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is resolved
    }

    if (!user) {
      router.replace('/login'); // Not logged in, should not be here
      return;
    }

    const plan = searchParams.get('plan') as UserPlan | null;
    const status = searchParams.get('status');

    // We expect a redirect from the payment provider with these params
    if (status === 'successful' && plan && (plan === 'Starter' || plan === 'Pro' || plan === 'Agency')) {
      const userDocRef = doc(db, 'users', user.uid);
      
      updateDoc(userDocRef, {
        plan: plan,
        // Reset monthly quota when plan changes
        leadsGeneratedThisMonth: 0, 
        lastLeadGenerationMonth: new Date().toISOString().slice(0, 7)
      }).then(() => {
        toast({
          title: 'Upgrade Successful!',
          description: `Your plan has been upgraded to ${plan}.`,
        });
        // Redirect to dashboard after a short delay to show the success message
        setTimeout(() => router.replace('/dashboard'), 3000);
      }).catch(error => {
        console.error("Error updating user plan: ", error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Your payment was successful, but we failed to update your plan. Please contact support.',
        });
        setTimeout(() => router.replace('/pricing'), 3000);
      });
    } else {
      // If params are missing or invalid, just redirect away.
      toast({
          variant: 'destructive',
          title: 'Invalid Payment Redirect',
          description: 'Could not verify the payment. Please check your subscription status or contact support.',
      });
      router.replace('/pricing');
    }
  }, [user, loading, router, searchParams, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold">Payment Successful!</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Your plan is being updated. You will be redirected to the dashboard shortly.
      </p>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function PaymentSuccessPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center font-headline">Processing Your Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                        <SuccessPageContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
