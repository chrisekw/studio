
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { type Lead } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { SearchForm } from '@/components/dashboard/search-form';
import { Sparkles } from 'lucide-react';
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner';

const LeadsTable = dynamic(
  () => import('@/components/dashboard/leads-table').then(mod => mod.LeadsTable),
  { ssr: false }
);

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-headline font-semibold">Welcome to oPilot</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        Your AI-powered lead generation copilot. Start a search below to find your next customers.
      </p>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-y-auto">
        <div className="h-full">
            {leads.length > 0 || isLoading ? (
              <LeadsTable
                  leads={leads}
                  isLoading={isLoading}
                  progress={progress}
                  progressMessage={progressMessage}
                />
            ) : (
              renderEmptyState()
            )}
        </div>
      </div>

      <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-3xl mx-auto">
          <SearchForm
            setIsLoading={setIsLoading}
            setLeads={setLeads}
            setProgress={setProgress}
            setProgressMessage={setProgressMessage}
            setShowUpgradeBanner={setShowUpgradeBanner}
          />
        </div>
      </div>
      <UpgradeBanner isOpen={showUpgradeBanner} onClose={() => setShowUpgradeBanner(false)} />
    </div>
  );
}
