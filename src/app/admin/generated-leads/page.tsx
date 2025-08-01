
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EventWithUserData extends LeadGenerationEvent {
    userEmail?: string;
}

interface UserWithEvents {
    id: string;
    email: string | null | undefined;
    events: EventWithUserData[];
}

export default function AdminGeneratedLeadsPage() {
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
            
            setEvents(eventsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching events: ", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeEvents();
        };
    }, []);

    const usersWithEvents = useMemo(() => {
        if (users.size === 0 || events.length === 0) return [];
        
        const userEventsMap = new Map<string, UserWithEvents>();

        events.forEach(event => {
            const userProfile = users.get(event.userId);
            if (!userProfile) return;

            if (!userEventsMap.has(event.userId)) {
                userEventsMap.set(event.userId, {
                    id: event.userId,
                    email: userProfile.email,
                    events: [],
                });
            }
            
            userEventsMap.get(event.userId)!.events.push({
                ...event,
                userEmail: userProfile.email,
            });
        });

        const sortedUsers = Array.from(userEventsMap.values()).sort((a, b) => {
            const aLatestEvent = a.events[0]?.timestamp.toMillis() || 0;
            const bLatestEvent = b.events[0]?.timestamp.toMillis() || 0;
            return bLatestEvent - aLatestEvent;
        });

        if (!filter) return sortedUsers;

        return sortedUsers.filter(user => 
            user.email?.toLowerCase().includes(filter.toLowerCase())
        );

    }, [events, users, filter]);

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

        if (usersWithEvents.length === 0) {
             return (
                <div className="text-center h-48 flex items-center justify-center text-muted-foreground border rounded-lg">
                    No lead generation events have been recorded yet.
                </div>
            );
        }

        return (
             <div className="rounded-lg border">
                 <Accordion type="single" collapsible className="w-full">
                    {usersWithEvents.map(user => (
                        <AccordionItem value={user.id} key={user.id}>
                            <AccordionTrigger className="px-4 hover:no-underline">
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 items-center text-left">
                                    <span className="font-medium truncate col-span-2 md:col-span-1">{user.email}</span>
                                    <div className="hidden md:flex items-center">
                                        <Badge variant="secondary">{user.events.length} searches</Badge>
                                    </div>
                                    <div className="hidden md:flex items-center">
                                        Total leads: {user.events.reduce((acc, e) => acc + e.leadsGenerated, 0)}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="bg-muted/50 p-4">
                                    <div className="rounded-md border bg-background">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Query</TableHead>
                                                    <TableHead className="text-center">Leads</TableHead>
                                                    <TableHead className="text-right">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {user.events.map(event => (
                                                    <TableRow key={event.id}>
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
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
             </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="font-headline">Generated Leads by User</CardTitle>
                            <CardDescription>
                                An overview of lead generation activity, grouped by user.
                            </CardDescription>
                        </div>
                        <Input 
                            placeholder="Filter by user email..."
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
