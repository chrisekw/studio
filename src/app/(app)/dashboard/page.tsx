'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/dashboard/search-form';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { type Lead } from '@/lib/types';
import { SuggestedQueries } from '@/components/dashboard/suggested-queries';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="space-y-8 py-6">
      <SearchForm
        setIsLoading={setIsLoading}
        setLeads={setLeads}
        setSearchQuery={setSearchQuery}
        setShowSuggestions={setShowSuggestions}
      />
      <LeadsTable leads={leads} isLoading={isLoading} />
      {showSuggestions && <SuggestedQueries query={searchQuery} />}
    </div>
  );
}
