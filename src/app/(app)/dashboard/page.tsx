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

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const { userProfile } = useAuth();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  const handleQuotaExceeded = () => {
    setShowUpgradeBanner(true);
  };

  return (
    <div className="space-y-8 py-6 animate-in fade-in-50">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Welcome back. Generate, view, and manage your leads with the power of AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <SearchForm
            setIsLoading={setIsLoading}
            setLeads={setLeads}
            setSearchQuery={setSearchQuery}
            setShowSuggestions={setShowSuggestions}
            selectedSuggestion={selectedSuggestion}
            onQuotaExceeded={handleQuotaExceeded}
          />
          {userProfile?.plan === 'Agency' && (
            <BulkUploadForm 
              setIsLoading={setIsLoading}
              setLeads={setLeads}
              onQuotaExceeded={handleQuotaExceeded}
            />
          )}
        </div>
        <div className="lg:col-span-1 sticky top-20">
          {showSuggestions && <SuggestedQueries query={searchQuery} onSuggestionClick={handleSuggestionClick} />}
        </div>
      </div>

      <Separator className="my-8 bg-border/50" />
      
      <LeadsTable leads={leads} isLoading={isLoading} />

      <UpgradeBanner isOpen={showUpgradeBanner} onClose={() => setShowUpgradeBanner(false)} />
    </div>
  );
}
