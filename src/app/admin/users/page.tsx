
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { UsersTable } from '@/components/admin/users/users-table';
import { Skeleton } from '@/components/ui/skeleton';

interface UserWithId extends UserProfile {
    id: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as UserProfile)
            })) as UserWithId[];
            setUsers(usersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            );
        }
        return <UsersTable users={users} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    View, search, and manage all registered users.
                </p>
            </div>
            {renderContent()}
        </div>
    );
}
