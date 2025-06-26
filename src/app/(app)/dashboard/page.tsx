import { SearchForm } from '@/components/dashboard/search-form';
import { LeadsTable } from '@/components/dashboard/leads-table';

export default function DashboardPage() {
  return (
    <div className="space-y-8 py-6">
      <SearchForm />
      <LeadsTable />
    </div>
  );
}
