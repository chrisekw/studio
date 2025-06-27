
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import type { UserPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading || !userProfile) { // Wait for auth and profile to be resolved
      return;
    }

    if (!user) {
      router.replace('/login'); // Not logged in, should not be here
      return;
    }

    const plan = searchParams.get('plan') as UserPlan | null;
    const credits = searchParams.get('credits');
    const status = searchParams.get('status');
    const userDocRef = doc(db, 'users', user.uid);

    if (status === 'successful') {
      // Handle plan upgrade
      if (plan && (plan === 'Starter' || plan === 'Pro' || plan === 'Agency')) {
        updateDoc(userDocRef, {
          plan: plan,
          leadsGeneratedThisMonth: 0, // Reset monthly quota
          lastLeadGenerationMonth: new Date().toISOString().slice(0, 7)
        }).then(() => {
          toast({
            title: 'Upgrade Successful!',
            description: `Your plan has been upgraded to ${plan}.`,
          });
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
      } 
      // Handle addon credits purchase
      else if (credits) {
        const creditsToAdd = parseInt(credits, 10);
        if (!isNaN(creditsToAdd) && creditsToAdd > 0) {
          updateDoc(userDocRef, {
            addonCredits: increment(creditsToAdd) // Use Firestore increment for safety
          }).then(() => {
            toast({
              title: 'Purchase Successful!',
              description: `You've successfully added ${creditsToAdd.toLocaleString()} credits to your account.`,
            });
            setTimeout(() => router.replace('/dashboard'), 3000);
          }).catch(error => {
            console.error("Error adding credits: ", error);
            toast({
              variant: 'destructive',
              title: 'Update Failed',
              description: 'Your payment was successful, but we failed to add credits to your account. Please contact support.',
            });
            setTimeout(() => router.replace('/pricing'), 3000);
          });
        } else {
           // Invalid credits param
           toast({ variant: 'destructive', title: 'Invalid Request', description: 'The number of credits is invalid.' });
           router.replace('/pricing');
        }
      }
      // Handle other successful payments that are not for plans or credits
      else {
        toast({
            variant: 'destructive',
            title: 'Invalid Payment Redirect',
            description: 'Could not verify the payment purpose. Please check your subscription or contact support.',
        });
        router.replace('/pricing');
      }
    } else {
      // If status is not successful or params are missing
      toast({
          variant: 'destructive',
          title: 'Invalid Payment Redirect',
          description: 'Could not verify the payment. Please check your subscription status or contact support.',
      });
      router.replace('/pricing');
    }
  }, [user, userProfile, loading, router, searchParams, toast]);

  if (loading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying payment details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold">Payment Successful!</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Your account is being updated. You will be redirected to the dashboard shortly.
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
                    <CardTitle className="text-center font-headline">Processing Your Purchase</CardTitle>
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
