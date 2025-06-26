'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  MoreHorizontal,
  Save,
  Trash2,
} from 'lucide-react';
import { type Lead } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
}

export function LeadsTable({ leads, isLoading }: LeadsTableProps) {
  const { toast } = useToast();

  const handleSaveLead = (lead: Lead) => {
    toast({
      title: 'Lead Saved',
      description: `${lead.name} has been added to your saved leads.`,
    });
  };
  
  const getHostname = (url: string) => {
    if (!url) return '';
    try {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return new URL(url).hostname;
    } catch (e) {
      console.error('Invalid URL provided:', url);
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  };
  
  const getFullUrl = (url: string) => {
    if (!url) return '#';
    if (!/^https?:\/\//i.test(url)) {
        return 'https://' + url;
    }
    return url;
  }

  const exportToCSV = () => {
    if (leads.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Phone,Website\n";
    leads.forEach(lead => {
      const row = [lead.name, lead.email, lead.phone, lead.website].join(",");
      csvContent += row + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "prospectiq_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
     toast({
      title: 'Export Successful',
      description: `Leads have been exported to CSV.`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Generated Leads</CardTitle>
          <CardDescription>
            Review the generated leads. Save or export them as needed.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={exportToCSV} disabled={isLoading || leads.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden md:table-cell">Website</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-12 w-12 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </TableCell>
                  <TableCell>
                     <Skeleton className="h-4 w-40" />
                     <Skeleton className="mt-2 h-4 w-32" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                     <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="hidden sm:table-cell">
                    <img
                      alt={`${lead.name} logo`}
                      className="aspect-square rounded-md object-cover"
                      height="48"
                      src={`https://logo.clearbit.com/${getHostname(lead.website)}`}
                      width="48"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src="https://placehold.co/48x48.png";
                      }}
                      data-ai-hint="company logo"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {lead.email}
                    </div>
                    <div className="text-xs text-muted-foreground/80">{lead.phone}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <a href={getFullUrl(lead.website)} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent-foreground/80">
                      {getHostname(lead.website)}
                    </a>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleSaveLead(lead)}>
                          <Save className="mr-2 h-4 w-4" /> Save Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No leads generated yet. Start a new search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
