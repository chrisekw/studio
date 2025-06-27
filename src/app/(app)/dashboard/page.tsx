'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/dashboard/search-form';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { type Lead } from '@/lib/types';
import { SuggestedQueries } from '@/components/dashboard/suggested-queries';
import { useAuth } from '@/context/auth-context';
import { BulkUploadForm } from '@/components/dashboard/bulk-upload-form';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const { userProfile } = useAuth();

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  return (
    <div className="space-y-8 py-6">
      <SearchForm
        setIsLoading={setIsLoading}
        setLeads={setLeads}
        setSearchQuery={setSearchQuery}
        setShowSuggestions={setShowSuggestions}
        selectedSuggestion={selectedSuggestion}
      />
      {userProfile?.plan === 'Agency' && (
        <BulkUploadForm 
          setIsLoading={setIsLoading}
          setLeads={setLeads}
        />
      )}
      <LeadsTable leads={leads} isLoading={isLoading} userProfile={userProfile} />
      {showSuggestions && <SuggestedQueries query={searchQuery} onSuggestionClick={handleSuggestionClick} />}
    </div>
  );
}
