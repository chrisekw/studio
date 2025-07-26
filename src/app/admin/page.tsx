
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, UserPlan, LeadGenerationEvent } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, DollarSign, Activity, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PLAN_PRICES: Record<UserPlan, number> = {
  'Free': 0,
  'Starter': 19,
  'Pro': 59,
  'Agency': 199,
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listener for total users
    const usersCollection = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user data: ", error);
      setIsLoading(false);
    });

    // Listener for active users
    const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
    const eventsQuery = query(
        collection(db, 'events'), 
        where('timestamp', '>', fiveMinutesAgo)
    );
    const unsubscribeActiveUsers = onSnapshot(eventsQuery, (snapshot) => {
        const activeUserIds = new Set<string>();
        snapshot.docs.forEach(doc => {
            const event = doc.data() as LeadGenerationEvent;
            activeUserIds.add(event.userId);
        });
        setActiveUsersCount(activeUserIds.size);
    }, (error) => {
        console.error("Error fetching active users: ", error);
    });


    return () => {
        unsubscribeUsers();
        unsubscribeActiveUsers();
    };
  }, []);

  const totalUsers = users.length;
  const totalRevenue = users.reduce((sum, user) => sum + (PLAN_PRICES[user.plan] || 0), 0);
  const paidSubscribers = users.filter(user => user.plan !== 'Free').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the oPilot control panel.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Recurring Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">
              From active subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">+{paidSubscribers.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">
              Total paid subscribers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activeUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              Users active in the last 5 mins
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            This is where you can manage users, view analytics, and oversee your sales teams.
            More features coming soon!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
