'use client';

import { useAuth } from '@/context/auth-context';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';

const PLAN_BADGE_VARIANTS: { [key: string]: BadgeProps['variant'] } = {
    Free: 'secondary',
    Starter: 'default',
    Pro: 'accent',
    Agency: 'destructive',
};

export function QuotaDisplay() {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    return (
        <div className="p-2 space-y-3 group-data-[collapsible=icon]:hidden">
             <div className="flex justify-between items-center px-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
             <div className="px-2 pt-1">
                <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-9 w-full" />
        </div>
    );
  }

  const { plan } = userProfile;
  const planBadgeVariant = PLAN_BADGE_VARIANTS[plan];

  const isFreePlan = plan === 'Free';
  const dailyLimit = 5;
  const today = new Date().toISOString().split('T')[0];
  const leadsUsedToday = (isFreePlan && userProfile.lastLeadGenerationDate === today) ? userProfile.leadsGeneratedToday ?? 0 : 0;
  const usagePercentage = isFreePlan ? (leadsUsedToday / dailyLimit) * 100 : 0;

  return (
    <div className="p-2 space-y-3 group-data-[collapsible=icon]:hidden">
        <div className="flex justify-between items-center px-2">
            <p className="text-sm font-medium text-sidebar-foreground">Current Plan</p>
            <Badge variant={planBadgeVariant}>{plan}</Badge>
        </div>
        
        {isFreePlan ? (
             <div className="px-2 pt-1 space-y-2">
                <div className="text-xs text-sidebar-foreground/80 flex justify-between">
                    <span>Daily Lead Quota</span>
                    <span>{leadsUsedToday} / {dailyLimit}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
            </div>
        ) : (
             <div className="text-xs text-sidebar-foreground/80 px-2 pt-1">
                You are on the <span className="font-semibold text-sidebar-foreground">{plan}</span> plan.
            </div>
        )}

        <Button variant="outline" size="sm" className="w-full bg-transparent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
            <Link href="/pricing">Manage Plan</Link>
        </Button>
    </div>
  );
}
