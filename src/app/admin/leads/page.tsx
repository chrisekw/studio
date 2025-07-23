
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LeadGenerationEvent, UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface EventWithUserData extends LeadGenerationEvent {
    userEmail?: string;
}

export default function AdminLeadsPage() {
    const [events, setEvents] = useState<EventWithUserData[]>([]);
    const [users, setUsers] = useState<Map<string, UserProfile>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
            const usersMap = new Map<string, UserProfile>();
            querySnapshot.forEach(doc => {
                usersMap.set(doc.id, doc.data() as UserProfile);
            });
            setUsers(usersMap);
        });
        
        const eventsQuery = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
        const unsubscribeEvents = onSnapshot(eventsQuery, (querySnapshot) => {
            const eventsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<LeadGenerationEvent, 'id'>)
            })) as LeadGenerationEvent[];
            
            // Wait for users map to be populated before setting events
            setEvents(prevEvents => {
                 // only update if users map is ready
                if(users.size > 0) {
                     return eventsData.map(event => ({
                        ...event,
                        userEmail: users.get(event.userId)?.email ?? 'Unknown User'
                    }));
                }
                return eventsData.map(e => ({...e, userEmail: 'Loading...'})); // Temp state
            });
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching events: ", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeEvents();
        };
    }, [users]); // Rerun effect when users map changes

     const filteredEvents = useMemo(() => {
        if (!filter) return events;
        return events.filter(event => 
            event.userEmail?.toLowerCase().includes(filter.toLowerCase()) ||
            event.query.toLowerCase().includes(filter.toLowerCase())
        );
    }, [events, filter]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            );
        }

        if (events.length === 0) {
             return (
                <div className="text-center h-48 flex items-center justify-center text-muted-foreground border rounded-lg">
                    No lead generation events have been recorded yet.
                </div>
            );
        }

        return (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Query</TableHead>
                            <TableHead className="text-center">Leads</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEvents.map(event => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.userEmail}</TableCell>
                                <TableCell className="text-muted-foreground italic">"{event.query}"</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{event.leadsGenerated}</Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                    {event.timestamp.toDate().toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="font-headline">Lead Generation Log</CardTitle>
                            <CardDescription>
                                A real-time log of all lead generation activities across the platform.
                            </CardDescription>
                        </div>
                        <Input 
                            placeholder="Filter by user or query..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
