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
import { Badge } from '../ui/badge';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

interface SavedLeadsTableProps {
  leads: Lead[];
}

export function SavedLeadsTable({ leads }: SavedLeadsTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async (leadToDelete: Lead) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
      return;
    }

    try {
      const leadDocRef = doc(db, 'users', user.uid, 'savedLeads', leadToDelete.id);
      await deleteDoc(leadDocRef);
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
    csvContent += "Name,Email,Phone,Website,Address,LinkedIn,Tags\n";
    leads.forEach(lead => {
      const tags = lead.tags ? lead.tags.join(';') : '';
      const row = [
        lead.name,
        lead.email,
        lead.phone,
        lead.website,
        lead.address,
        lead.linkedin,
        `"${tags}"`
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
      csvContent += row + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leadgen_saved_leads.csv");
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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags?.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm text-muted-foreground">{lead.email}</div>
                    <div className="text-xs text-muted-foreground/80">{lead.phone}</div>
                  </TableCell>
                  <TableCell>
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
                <TableCell colSpan={4} className="text-center h-24">
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
