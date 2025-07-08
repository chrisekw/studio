'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import type { Lead } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { SavedLeadsCards } from '@/components/saved-leads/saved-leads-cards';

export default function SavedLeadsPage() {
  const { user } = useAuth();
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
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
  }, [user]);

  const exportToCSV = () => {
    if (savedLeads.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Description,Email,Phone,Website,Address,LinkedIn,Tags,Score,Score Rationale\n";
    savedLeads.forEach(lead => {
      const tags = lead.tags ? lead.tags.join(';') : '';
      const row = [
        lead.name,
        lead.description,
        lead.email,
        lead.phone,
        lead.website,
        lead.address,
        lead.linkedin,
        `"${tags}"`,
        lead.score,
        lead.scoreRationale,
      ].map(field => `"${(String(field ?? '')).replace(/"/g, '""')}"`).join(',');
      csvContent += row + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "oPilot_saved_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Successful',
      description: 'Saved leads have been exported to CSV.',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
            ))}
        </div>
      );
    }

    return <SavedLeadsCards leads={savedLeads} />;
  }

  return (
    <div className="py-6">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <CardTitle className="font-headline">Saved Leads</CardTitle>
                    <CardDescription>
                        View, manage, and export your saved business leads. Click a lead to see details.
                    </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={exportToCSV} disabled={savedLeads.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                </Button>
            </div>
        </CardHeader>
        <CardContent className="px-4">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
