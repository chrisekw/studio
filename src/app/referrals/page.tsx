'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Users, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReferralsPage() {
  const { userProfile, loading } = useAuth();
  const [referralLink, setReferralLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile?.referralCode) {
      setReferralLink(`${window.location.origin}/register?ref=${userProfile.referralCode}`);
    }
  }, [userProfile]);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Link Copied!',
      description: 'Your referral link has been copied to the clipboard.',
    });
  };

  const handleShare = () => {
     if (navigator.share && referralLink) {
      navigator.share({
        title: 'Join me on oPilot!',
        text: 'Sign up for oPilot using my referral link and get started with AI-powered lead generation.',
        url: referralLink,
      }).catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 py-6 animate-in fade-in-50">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-96" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 animate-in fade-in-50">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Refer & Earn</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Share your link and earn lead points when your friends sign up and subscribe. You both get rewarded!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Lead Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile?.leadPoints?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Points to redeem for more leads.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile?.referrals?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Users who signed up with your link.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Share Your Link</CardTitle>
          <CardDescription>
            Copy your unique referral link and share it anywhere. When a friend subscribes, you both get rewarded with lead points.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full items-center space-x-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-muted"
            />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
            <Button size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
               <span className="sr-only">Share</span>
            </Button>
          </div>
            <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-background/50">
                <h4 className="font-semibold text-foreground mb-2">How it works:</h4>
                <ul className="list-disc list-inside space-y-2">
                    <li>You get <span className="font-semibold text-primary">5 points</span> when a friend signs up with your link.</li>
                    <li>When a referred user upgrades to a paid plan, <span className="font-semibold">you both receive the bonus points</span>:
                        <ul className="list-disc list-inside mt-1 ml-5">
                            <li>Starter Plan: <span className="font-semibold text-primary">20 points</span> each</li>
                            <li>Pro Plan: <span className="font-semibold text-primary">50 points</span> each</li>
                            <li>Agency Plan: <span className="font-semibold text-primary">100 points</span> each</li>
                        </ul>
                    </li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
