'use client';

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
  Mail,
  Phone,
  Globe,
  MapPin,
  Linkedin,
} from 'lucide-react';
import { type Lead, type UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  userProfile: UserProfile | null;
}

export function LeadsTable({ leads, isLoading, userProfile }: LeadsTableProps) {
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
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Name,Email,Phone,Website,Address,LinkedIn\n';
    leads.forEach((lead) => {
       const row = [
        lead.name,
        lead.email,
        lead.phone,
        lead.website,
        lead.address,
        lead.linkedin,
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'leadgen_leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Successful',
      description: `Leads have been exported to CSV.`,
    });
  };

  const canExport = userProfile?.plan !== 'Free';
  
  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent className="flex-grow space-y-4 pt-4">
             <Skeleton className="h-4 w-40" />
             <Skeleton className="h-4 w-32" />
             <Skeleton className="h-4 w-28" />
             <Skeleton className="h-4 w-36" />
             <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderLeads = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="flex flex-col transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://logo.clearbit.com/${getHostname(lead.website)}`}
                  alt={`${lead.name} logo`}
                  data-ai-hint="company logo"
                />
                <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('').substring(0,2)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg font-medium">{lead.name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
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
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe className="mr-3 h-4 w-4 flex-shrink-0" />
              <a href={getFullUrl(lead.website)} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent-foreground/80 truncate">
                {getHostname(lead.website)}
              </a>
            </div>
            {lead.address && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{lead.address}</span>
              </div>
            )}
            {lead.linkedin && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Linkedin className="mr-3 h-4 w-4 flex-shrink-0" />
                <a href={getFullUrl(lead.linkedin)} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent-foreground/80 truncate">
                  {lead.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-48 rounded-lg border border-dashed">
      <div className="text-center">
        <p className="text-muted-foreground">No leads generated yet.</p>
        <p className="text-sm text-muted-foreground/80">Start a new search to see results here.</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Generated Leads</CardTitle>
          <CardDescription>
            Review the generated leads. Save or export them as needed.
          </CardDescription>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={isLoading || leads.length === 0 || !canExport}
                  className={!canExport ? 'cursor-not-allowed' : ''}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </TooltipTrigger>
            {!canExport && (
              <TooltipContent>
                <p>Export is a paid feature. Please upgrade your plan.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {isLoading
          ? renderSkeleton()
          : leads.length > 0
          ? renderLeads()
          : renderEmptyState()}
      </CardContent>
    </Card>
  );
}
