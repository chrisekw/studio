'use client';

import { useAuth } from '@/context/auth-context';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '../ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

const PLAN_LIMITS = {
    Free: { daily: 5 },
    Starter: { monthly: 200 },
    Pro: { monthly: 1000 },
    Agency: { monthly: Infinity },
};

const PLAN_BADGE_VARIANTS: { [key: string]: BadgeProps['variant'] } = {
    Free: 'secondary',
    Starter: 'default',
    Pro: 'accent',
    Agency: 'destructive',
};

export function QuotaDisplay() {
  const { userProfile, userUsage, loading } = useAuth();

  if (loading) {
    return (
        <div className="p-2 space-y-3 group-data-[collapsible=icon]:hidden">
             <div className="flex justify-between items-center px-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
             <div className="px-2 pt-1">
                <Skeleton className="h-2 w-full" />
            </div>
            <div className="px-2">
                 <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-9 w-full" />
        </div>
    );
  }

  if (!userProfile) return null;

  const { plan } = userProfile;
  const limits = PLAN_LIMITS[plan];
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');

  let used = 0;
  let total = 0;
  let period = '';
  let remaining: number | string = 0;

  if (plan === 'Agency') {
    remaining = 'Unlimited';
  } else if (limits.daily) {
    used = userUsage?.lastGeneratedDate === today ? userUsage.dailyCount || 0 : 0;
    total = limits.daily;
    period = 'today';
    remaining = total - used;
  } else if (limits.monthly) {
    used = userUsage?.lastGeneratedMonth === currentMonth ? userUsage.monthlyCount || 0 : 0;
    total = limits.monthly;
    period = 'this month';
    remaining = total - used;
  }
  
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const planBadgeVariant = PLAN_BADGE_VARIANTS[plan];

  return (
    <div className="p-2 space-y-3 group-data-[collapsible=icon]:hidden">
        <div className="flex justify-between items-center px-2">
            <p className="text-sm font-medium text-foreground">Current Plan</p>
            <Badge variant={planBadgeVariant}>{plan}</Badge>
        </div>
        
        {plan === 'Agency' ? (
             <div className="text-xs text-muted-foreground px-2 pt-1">
                You have unlimited leads. Enjoy!
            </div>
        ) : (
            <>
                <div className="px-2 pt-1">
                    <Progress value={percentage} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground px-2">
                    <p><span className="font-semibold text-foreground">{remaining.toLocaleString()}</span> leads left {period}.</p>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/pricing">Upgrade Plan</Link>
                </Button>
            </>
        )}
    </div>
  );
}
