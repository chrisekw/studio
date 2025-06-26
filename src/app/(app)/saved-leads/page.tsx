import { SavedLeadsTable } from '@/components/saved-leads/saved-leads-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SavedLeadsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Saved Leads</CardTitle>
        <CardDescription>
          View, manage, and export your saved business leads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SavedLeadsTable />
      </CardContent>
    </Card>
  );
}
