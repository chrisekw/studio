'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
  SearchX,
} from 'lucide-react';
import { type Lead, type UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  userProfile: UserProfile | null;
}

export function LeadsTable({ leads, isLoading, userProfile }: LeadsTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveLead = async (leadToSave: Lead) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to save leads.',
      });
      return;
    }

    if (userProfile?.plan === 'Free') {
        toast({
            variant: 'destructive',
            title: 'Upgrade to Save',
            description: 'Saving leads is a premium feature. Please upgrade your plan.',
        });
        return;
    }

    try {
      // Omit id from lead before saving, as Firestore will generate one.
      const { id, ...leadData } = leadToSave;
      const savedLeadsCollection = collection(db, 'users', user.uid, 'savedLeads');
      await addDoc(savedLeadsCollection, leadData);
      
      toast({
        title: 'Lead Saved',
        description: `${leadToSave.name} has been added to your saved leads.`,
      });
    } catch (error) {
        console.error("Error saving lead: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save the lead. Please try again.',
        });
    }
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
  const canSave = userProfile?.plan !== 'Free';
  
  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col border-primary/10 bg-black/20 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 pt-4">
             <Skeleton className="h-4 w-40" />
             <Skeleton className="h-4 w-32" />
             <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderLeads = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="border-primary/10 bg-black/20 backdrop-blur-xl transition-all hover:border-primary/30 flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
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
                <DropdownMenuItem onClick={() => handleSaveLead(lead)} disabled={!canSave}>
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
            {lead.email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-accent" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-3 h-4 w-4 flex-shrink-0 text-accent" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-start text-sm text-muted-foreground">
                <MapPin className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                <span>{lead.address}</span>
              </div>
            )}
          </CardContent>
           <CardFooter className="flex-wrap gap-2 pt-4">
             <TooltipProvider>
              {lead.website && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild size="icon" variant="outline">
                          <a href={getFullUrl(lead.website)} target="_blank" rel="noopener noreferrer">
                              <Globe />
                          </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{getHostname(lead.website)}</p></TooltipContent>
                  </Tooltip>
              )}
               {lead.linkedin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild size="icon" variant="outline">
                          <a href={getFullUrl(lead.linkedin)} target="_blank" rel="noopener noreferrer">
                              <Linkedin />
                          </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>View on LinkedIn</p></TooltipContent>
                  </Tooltip>
              )}
             </TooltipProvider>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-border">
      <SearchX className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-xl font-headline font-medium text-muted-foreground">No Leads Generated Yet</h3>
      <p className="text-muted-foreground/80 mt-1">Start a new search to see results here.</p>
    </div>
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold">Generated Leads</h2>
          <p className="text-muted-foreground mt-1">
            Review the generated leads. Save or export them as needed.
          </p>
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
      </div>

        {isLoading
          ? renderSkeleton()
          : leads.length > 0
          ? renderLeads()
          : renderEmptyState()}
    </div>
  );
}
