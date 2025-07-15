'use client';

import { useAuth } from '@/context/auth-context';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { PLAN_LIMITS } from '@/lib/utils';

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
  const addonCredits = userProfile.addonCredits ?? 0;
  const leadPoints = userProfile.leadPoints ?? 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const today = new Date().toISOString().split('T')[0];

  const leadsUsedToday = (isFreePlan && userProfile.lastLeadGenerationDate === today) 
    ? userProfile.leadsGeneratedToday ?? 0 
    : 0;
  const dailyLimit = PLAN_LIMITS.Free;
  const dailyUsagePercentage = (leadsUsedToday / dailyLimit) * 100;

  const leadsUsedThisMonth = userProfile.lastLeadGenerationMonth === currentMonth
    ? (isFreePlan ? userProfile.monthlyLeadsGenerated : userProfile.leadsGeneratedThisMonth) ?? 0
    : 0;

  const monthlyLimit = isFreePlan ? PLAN_LIMITS.FreeMonthly : PLAN_LIMITS[plan];
  const monthlyUsagePercentage = (leadsUsedThisMonth / monthlyLimit) * 100;

  return (
    <div className="p-2 space-y-3 group-data-[collapsible=icon]:hidden">
        <div className="flex justify-between items-center px-2">
            <p className="text-sm font-medium text-sidebar-foreground">Current Plan</p>
            <Badge variant={planBadgeVariant}>{plan}</Badge>
        </div>
        
        {isFreePlan ? (
             <div className="px-2 pt-1 space-y-2">
                <div className="text-xs text-sidebar-foreground/80 flex justify-between">
                    <span>Daily Usage</span>
                    <span>{leadsUsedToday} / {dailyLimit}</span>
                </div>
                <Progress value={dailyUsagePercentage} className="h-2" />
                <div className="text-xs text-sidebar-foreground/80 flex justify-between">
                    <span>Monthly Usage</span>
                    <span>{leadsUsedThisMonth} / {monthlyLimit}</span>
                </div>
                <Progress value={monthlyUsagePercentage} className="h-2" />
                {leadPoints > 0 && (
                    <div className="text-xs text-sidebar-foreground/80 flex justify-between pt-2">
                        <span>Referral Points</span>
                        <span>{leadPoints.toLocaleString()}</span>
                    </div>
                )}
            </div>
        ) : (
             <div className="px-2 pt-1 space-y-2">
                <div className="text-xs text-sidebar-foreground/80 flex justify-between">
                    <span>Monthly Lead Quota</span>
                    <span>{leadsUsedThisMonth.toLocaleString()} / {monthlyLimit.toLocaleString()}</span>
                </div>
                <Progress value={monthlyUsagePercentage} className="h-2" />
                 {leadPoints > 0 && (
                    <div className="text-xs text-sidebar-foreground/80 flex justify-between pt-2">
                        <span>Referral Points</span>
                        <span>{leadPoints.toLocaleString()}</span>
                    </div>
                )}
                 {addonCredits > 0 && (
                    <div className="text-xs text-sidebar-foreground/80 flex justify-between pt-2">
                        <span>Add-on Credits</span>
                        <span>{addonCredits.toLocaleString()}</span>
                    </div>
                )}
            </div>
        )}

        <Button variant="outline" size="sm" className="w-full bg-transparent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
            <Link href="/pricing">Manage Plan</Link>
        </Button>
    </div>
  );
}
