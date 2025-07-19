
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, UserPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, Ratio, Target, BarChart2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PLAN_PRICES: Record<UserPlan, number> = {
  'Free': 0,
  'Starter': 19,
  'Pro': 59,
  'Agency': 199,
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function AdminAnalyticsPage() {
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

  const { planDistribution, conversionRate, arpu, totalUsers } = useMemo(() => {
    if (isLoading || users.length === 0) {
      return { planDistribution: [], conversionRate: 0, arpu: 0, totalUsers: 0 };
    }

    const totalUsers = users.length;
    const paidUsers = users.filter(user => user.plan !== 'Free');
    const totalRevenue = paidUsers.reduce((sum, user) => sum + (PLAN_PRICES[user.plan] || 0), 0);

    const conversionRate = totalUsers > 0 ? (paidUsers.length / totalUsers) * 100 : 0;
    const arpu = paidUsers.length > 0 ? totalRevenue / paidUsers.length : 0;

    const distribution = users.reduce((acc, user) => {
      acc[user.plan] = (acc[user.plan] || 0) + 1;
      return acc;
    }, {} as Record<UserPlan, number>);
    
    const planDistribution = Object.entries(distribution).map(([name, value]) => ({ name, value }));
    
    return { planDistribution, conversionRate, arpu, totalUsers };
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="lg:col-span-4 h-96" />
            <Skeleton className="lg:col-span-3 h-96" />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Conversion Rate</CardTitle>
              <Ratio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">From Free to any paid plan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${arpu.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Based on paid users only</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads Generated</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">Requires event logging</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>User Plan Distribution</CardTitle>
              <CardDescription>A breakdown of users by their current subscription plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
           <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>More detailed analytics and user activity timelines are on the way.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-60">
                <p className="text-muted-foreground">User growth chart coming soon...</p>
              </CardContent>
           </Card>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
        <p className="text-muted-foreground">
          Track user engagement, lead generation, and platform growth.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}
