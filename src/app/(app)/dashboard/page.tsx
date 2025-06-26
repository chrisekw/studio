import { SearchForm } from '@/components/dashboard/search-form';
import { LeadsTable } from '@/components/dashboard/leads-table';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <SearchForm />
      <LeadsTable />
    </div>
  );
}
