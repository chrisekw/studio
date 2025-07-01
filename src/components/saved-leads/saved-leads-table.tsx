
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  MoreHorizontal,
  Tag,
  Trash2,
} from 'lucide-react';
import type { Lead } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge, type BadgeProps } from '../ui/badge';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, increment, runTransaction } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface SavedLeadsTableProps {
  leads: Lead[];
}

const getScoreBadgeVariant = (score?: number): BadgeProps['variant'] => {
  if (score === undefined) return 'secondary';
  if (score >= 80) return 'accent';
  if (score >= 50) return 'default';
  if (score > 0) return 'secondary';
  return 'destructive';
};


export function SavedLeadsTable({ leads }: SavedLeadsTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async (leadToDelete: Lead) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const leadDocRef = doc(db, 'users', user.uid, 'savedLeads', leadToDelete.id);

        transaction.delete(leadDocRef);
        transaction.update(userDocRef, { savedLeadsCount: increment(-1) });
      });

      toast({
        variant: 'destructive',
        title: 'Lead Deleted',
        description: `${leadToDelete.name} has been removed from your saved leads.`,
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the lead. Please try again.' });
    }
  };
  
  const exportToCSV = () => {
    if (leads.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Description,Email,Phone,Website,Address,LinkedIn,Tags,Score,Score Rationale\n";
    leads.forEach(lead => {
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
    link.setAttribute("download", "LeadGen_saved_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Successful',
      description: 'Saved leads have been exported to CSV.',
    });
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={exportToCSV} disabled={leads.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>
      <div className="border rounded-lg w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Company</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium align-top">
                    <div className="font-semibold text-base">{lead.name}</div>
                    {lead.description && <p className="text-sm text-muted-foreground italic mt-1 whitespace-normal break-words">{lead.description}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell align-top">
                    <div className="text-sm text-muted-foreground break-all">{lead.email}</div>
                    <div className="text-sm text-muted-foreground mt-1">{lead.phone}</div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags?.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-center">
                    {lead.score !== undefined ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant={getScoreBadgeVariant(lead.score)}>
                              {lead.score}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{lead.scoreRationale}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Tag className="mr-2 h-4 w-4" /> Add Tag
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the lead for {lead.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(lead)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No saved leads.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
