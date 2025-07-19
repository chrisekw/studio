
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, UserPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Users, TrendingUp, HandCoins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PLAN_PRICES: Record<UserPlan, number> = {
  'Free': 0,
  'Starter': 19,
  'Pro': 59,
  'Agency': 199,
};

export default function AdminPaymentsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const { mrr, arr, totalPaidUsers, planDistribution } = useMemo(() => {
    if (isLoading) {
      return { mrr: 0, arr: 0, totalPaidUsers: 0, planDistribution: [] };
    }

    const mrr = users.reduce((total, user) => total + (PLAN_PRICES[user.plan] || 0), 0);
    const arr = mrr * 12;
    const totalPaidUsers = users.filter(user => user.plan !== 'Free').length;

    const distribution = users.reduce((acc, user) => {
      if (user.plan !== 'Free') {
        acc[user.plan] = (acc[user.plan] || 0) + 1;
      }
      return acc;
    }, {} as Record<UserPlan, number>);

    const planDistribution = Object.entries(distribution).map(([name, count]) => ({ name, users: count }));

    return { mrr, arr, totalPaidUsers, planDistribution };
  }, [users, isLoading]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </>
      );
    }

    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mrr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Based on current subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${arr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Estimated yearly revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{totalPaidUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total users on paid plans</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <HandCoins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Requires transaction history</p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Active Subscriptions by Plan</CardTitle>
                <CardDescription>A visual breakdown of how many users are on each paid plan.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={planDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend />
                        <Bar dataKey="users" fill="hsl(var(--primary))" name="Active Users" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments & Revenue</h1>
        <p className="text-muted-foreground">
          Monitor your financial performance and subscription metrics.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}
