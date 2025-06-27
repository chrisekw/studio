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

const PLAN_LIMITS = {
    Free: 5, // Daily
    Starter: 200, // Monthly
    Pro: 1000, // Monthly
    Agency: 5000, // Monthly
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
  const planLimit = PLAN_LIMITS[plan];

  const today = new Date().toISOString().split('T')[0];
  const leadsUsedToday = (isFreePlan && userProfile.lastLeadGenerationDate === today) ? userProfile.leadsGeneratedToday ?? 0 : 0;
  const dailyUsagePercentage = isFreePlan ? (leadsUsedToday / planLimit) * 100 : 0;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const leadsUsedThisMonth = (!isFreePlan && userProfile.lastLeadGenerationMonth === currentMonth) ? userProfile.leadsGeneratedThisMonth ?? 0 : 0;
  const monthlyUsagePercentage = !isFreePlan ? (leadsUsedThisMonth / planLimit) * 100 : 0;

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
                    <span>{leadsUsedToday} / {planLimit}</span>
                </div>
                <Progress value={dailyUsagePercentage} className="h-2" />
            </div>
        ) : (
             <div className="px-2 pt-1 space-y-2">
                <div className="text-xs text-sidebar-foreground/80 flex justify-between">
                    <span>Monthly Lead Quota</span>
                    <span>{leadsUsedThisMonth.toLocaleString()} / {planLimit.toLocaleString()}</span>
                </div>
                <Progress value={monthlyUsagePercentage} className="h-2" />
            </div>
        )}

        <Button variant="outline" size="sm" className="w-full bg-transparent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
            <Link href="/pricing">Manage Plan</Link>
        </Button>
    </div>
  );
}
