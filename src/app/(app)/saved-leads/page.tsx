'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import type { Lead } from '@/lib/types';

import { SavedLeadsTable } from '@/components/saved-leads/saved-leads-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SavedLeadsPage() {
  const { user, userProfile } = useAuth();
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.plan !== 'Free') {
      const savedLeadsQuery = query(collection(db, 'users', user.uid, 'savedLeads'));
      const unsubscribe = onSnapshot(savedLeadsQuery, (querySnapshot) => {
        const leadsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Lead, 'id'>)
        })) as Lead[];
        setSavedLeads(leadsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching saved leads: ", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
      setSavedLeads([]);
    }
  }, [user, userProfile]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Skeleton className="h-9 w-28" />
            </div>
            <div className="border rounded-lg p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
      );
    }
    
    if (userProfile?.plan === 'Free') {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium">Feature Unavailable</h3>
                <p className="text-muted-foreground mt-1">Saving leads is a premium feature. Please upgrade your plan to access your saved leads.</p>
            </div>
        )
    }

    return <SavedLeadsTable leads={savedLeads} />;
  }

  return (
    <div className="py-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Saved Leads</CardTitle>
          <CardDescription>
            View, manage, and export your saved business leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
