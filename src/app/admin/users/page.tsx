
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, LeadGenerationEvent } from '@/lib/types';
import { UsersTable } from '@/components/admin/users/users-table';
import { Skeleton } from '@/components/ui/skeleton';

interface UserWithId extends UserProfile {
    id: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserWithId[]>([]);
    const [events, setEvents] = useState<LeadGenerationEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as UserProfile)
            })) as UserWithwithEvents[];
            setUsers(usersData);
            if(events.length > 0) setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setIsLoading(false);
        });

        const eventsQuery = query(collection(db, 'events'));
        const unsubscribeEvents = onSnapshot(eventsQuery, (querySnapshot) => {
            const eventsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<LeadGenerationEvent, 'id'>)
            })) as LeadGenerationEvent[];
            setEvents(eventsData);
            if(users.length > 0) setIsLoading(false);
        }, (error) => {
            console.error("Error fetching events: ", error);
            setIsLoading(false);
        });

        // Initial loading state handling
        if(users.length === 0 && events.length === 0) {
            const unsub = onSnapshot(usersQuery, () => {
                // assume loaded after first snapshot, even if empty
                setIsLoading(false);
                unsub();
            })
        }

        return () => {
            unsubscribeUsers();
            unsubscribeEvents();
        };
    }, []);

    const usersWithEventCounts = useMemo(() => {
        if (users.length === 0) return [];

        const eventCounts = new Map<string, number>();
        events.forEach(event => {
            eventCounts.set(event.userId, (eventCounts.get(event.userId) || 0) + 1);
        });
        
        return users.map(user => ({
            ...user,
            generationEventsCount: eventCounts.get(user.id) || 0,
        }));

    }, [users, events]);

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
        return <UsersTable users={usersWithEventCounts} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    View, search, and manage all registered users with live updates.
                </p>
            </div>
            {renderContent()}
        </div>
    );
}

// Minimal type for initial user load
interface UserWithwithEvents extends UserWithId {
    generationEventsCount?: number;
}
