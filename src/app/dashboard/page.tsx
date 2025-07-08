
'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/dashboard/search-form';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { type Lead } from '@/lib/types';
import { SuggestedQueries } from '@/components/dashboard/suggested-queries';
import { useAuth } from '@/context/auth-context';
import { BulkUploadForm } from '@/components/dashboard/bulk-upload-form';
import { Separator } from '@/components/ui/separator';
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner';
import { calculateRemainingLeads } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UploadCloud } from 'lucide-react';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const { userProfile } = useAuth();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Centralize quota calculation
  const { remainingLeads, remainingLeadsText } = calculateRemainingLeads(userProfile);

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  return (
    <div className="space-y-8 py-6 animate-in fade-in-50">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold tracking-tight">AI Lead Finder</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Describe your ideal customer, and let our AI build you a list of qualified leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          <SearchForm
            setIsLoading={setIsLoading}
            setLeads={setLeads}
            setSearchQuery={setSearchQuery}
            setShowSuggestions={setShowSuggestions}
            selectedSuggestion={selectedSuggestion}
            remainingLeads={remainingLeads}
            remainingLeadsText={remainingLeadsText}
            setShowUpgradeBanner={setShowUpgradeBanner}
            setProgress={setProgress}
            setProgressMessage={setProgressMessage}
          />
          {userProfile?.plan === 'Agency' && (
             <div className="text-center border-t pt-8">
              <p className="text-sm text-muted-foreground mb-4">Have multiple prompts? Save time with a bulk upload.</p>
              <Button variant="outline" size="lg" onClick={() => setIsBulkUploadOpen(true)}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Bulk Prompt Upload
              </Button>
            </div>
          )}
        </div>
        <div className="lg:col-span-1 sticky top-20">
          {showSuggestions && <SuggestedQueries query={searchQuery} onSuggestionClick={handleSuggestionClick} />}
        </div>
      </div>

      <Separator className="my-8 bg-border/50" />
      
      <LeadsTable
        leads={leads}
        isLoading={isLoading}
        progress={progress}
        progressMessage={progressMessage}
      />

      <UpgradeBanner isOpen={showUpgradeBanner} onClose={() => setShowUpgradeBanner(false)} />

      {userProfile?.plan === 'Agency' && (
        <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline flex items-center gap-2 text-2xl">
                        <UploadCloud className="text-primary"/>
                        Bulk Prompt Upload
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV with a &quot;query&quot; column to generate leads in bulk. {remainingLeadsText}
                    </DialogDescription>
                </DialogHeader>
                <BulkUploadForm 
                  setIsLoading={setIsLoading}
                  setLeads={setLeads}
                  remainingLeads={remainingLeads}
                  remainingLeadsText={remainingLeadsText}
                  setShowUpgradeBanner={setShowUpgradeBanner}
                  onComplete={() => setIsBulkUploadOpen(false)}
                />
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
