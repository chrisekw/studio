'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { SalesTeamTable } from '@/components/admin/sales/sales-team-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface UserWithId extends UserProfile {
    id: string;
}

interface SalesMember extends UserWithId {
    referredUsers: UserWithId[];
}

export default function AdminSalesPage() {
    const [allUsers, setAllUsers] = useState<UserWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as UserProfile)
            })) as UserWithId[];
            setAllUsers(usersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const salesMembers = useMemo(() => {
        if (isLoading || allUsers.length === 0) return [];
        
        // A sales member is a user who has referred at least one person.
        const referrers = allUsers.filter(user => user.referrals && user.referrals.length > 0);

        return referrers.map(referrer => {
            const referredUsers = allUsers.filter(u => referrer.referrals?.includes(u.id));
            return {
                ...referrer,
                referredUsers: referredUsers,
            };
        });
    }, [allUsers, isLoading]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            );
        }
        return <SalesTeamTable members={salesMembers} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Team Management</h1>
                    <p className="text-muted-foreground">
                        View sales members, their referrals, and track payments.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Member
                </Button>
            </div>
            {renderContent()}
        </div>
    );
}
