
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the oPilot control panel.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            This is where you can manage users, view analytics, and oversee your sales teams.
            More features coming soon!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
