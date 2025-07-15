
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
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
  FileSpreadsheet,
  Rocket,
  Database,
  ChevronDown,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { Lead, UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { collection, doc, increment, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  progress: number;
  progressMessage: string;
}

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
);


export function LeadsTable({ leads, isLoading, progress, progressMessage }: LeadsTableProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const handleSaveLead = async (leadToSave: Lead) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to save leads.',
      });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('User document does not exist.');
        }

        const currentProfile = userDoc.data() as UserProfile;
        
        if (currentProfile.plan === 'Free' && (currentProfile.savedLeadsCount ?? 0) >= 20) {
          throw new Error('Save Limit Reached');
        }
        
        const savedLeadsCollectionRef = collection(db, 'users', user.uid, 'savedLeads');
        const newLeadDocRef = doc(savedLeadsCollectionRef); // Firestore generates the ID
        
        const { id, ...leadData } = leadToSave;
        
        transaction.set(newLeadDocRef, leadData);
        transaction.update(userDocRef, { savedLeadsCount: increment(1) });
      });

      toast({
        title: 'Lead Saved',
        description: `${leadToSave.name} has been added to your saved leads.`,
      });

    } catch (error: any) {
      console.error("Error saving lead: ", error);
      if (error.message === 'Save Limit Reached') {
        toast({
          variant: 'destructive',
          title: 'Save Limit Reached',
          description: 'You have reached your limit of 20 saved leads. Please upgrade to save more.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Saving Lead',
          description: 'Could not save the lead. This may be due to a permissions issue. Please contact support if the problem persists.',
        });
      }
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
    csvContent += 'Name,Description,Email,Phone,Website,Address,LinkedIn,Facebook,X\n';
    leads.forEach((lead) => {
       const row = [
        lead.name,
        lead.description,
        lead.email,
        lead.phone,
        lead.website,
        lead.address,
        lead.linkedin,
        lead.facebook,
        lead.x
      ].map(field => `"${(String(field ?? '')).replace(/"/g, '""')}"`).join(',');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'oPilot_leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Successful',
      description: `Leads have been exported to CSV.`,
    });
  };

  const handlePremiumExport = (platform: string) => {
    toast({
      title: 'Coming Soon!',
      description: `${platform} integration is on our roadmap. Stay tuned!`,
    });
  };

  const canExport = userProfile?.plan !== 'Free';

  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col border-primary/10 bg-card/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
             <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 p-4 pt-2">
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-4 w-40" />
             <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderProgress = () => (
    <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-border bg-card/60 backdrop-blur-xl">
      <div className="w-full max-w-md text-center p-4">
        <Sparkles className="h-16 w-16 text-primary animate-pulse mb-4 mx-auto" />
        <h3 className="text-xl font-headline font-medium text-foreground">
          {progressMessage || 'Processing...'}
        </h3>
        <p className="text-muted-foreground/80 mt-2 mb-4">
          Our AI is hard at work. This may take a few moments.
        </p>
        <Progress value={progress} className="w-full" />
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="border-primary/10 bg-card/60 backdrop-blur-xl transition-all hover:border-primary/30 flex flex-col">
          <CardHeader className="p-4 pb-2 flex-row items-start justify-between space-y-0">
            <div className="flex-1 space-y-2">
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
          <CardContent className="flex-grow space-y-3 p-4 pt-2">
            {lead.description && (
              <p className="text-sm text-muted-foreground italic mb-3">"{lead.description}"</p>
            )}
            {lead.email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-start text-sm text-muted-foreground">
                <MapPin className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{lead.address}</span>
              </div>
            )}
          </CardContent>
           <CardFooter className="flex-wrap gap-2 p-4 pt-0">
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
              {lead.facebook && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild size="icon" variant="outline">
                          <a href={getFullUrl(lead.facebook)} target="_blank" rel="noopener noreferrer">
                              <FacebookIcon />
                          </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>View on Facebook</p></TooltipContent>
                  </Tooltip>
              )}
              {lead.x && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild size="icon" variant="outline">
                          <a href={getFullUrl(lead.x)} target="_blank" rel="noopener noreferrer">
                              <XIcon />
                          </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>View on X</p></TooltipContent>
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

  const renderContent = () => {
    if (isLoading && progress > 0) {
      return renderProgress();
    }
    if (isLoading) {
      return renderSkeleton();
    }
    if (leads.length > 0) {
      return renderLeads();
    }
    return renderEmptyState();
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold">Generated Leads</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Review the generated leads below. Agency plan users get additional social media profile links.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading || leads.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV} disabled={!canExport}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span>Export to CSV</span>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
            <DropdownMenuLabel>Premium Exports</DropdownMenuLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={!canExport ? 'cursor-not-allowed' : ''}>
                    <DropdownMenuItem
                      onClick={() => handlePremiumExport('HubSpot')}
                      disabled={!canExport}
                    >
                      <Rocket className="mr-2 h-4 w-4" />
                      <span>HubSpot</span>
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                {!canExport && <TooltipContent><p>Upgrade to use premium exports.</p></TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={!canExport ? 'cursor-not-allowed' : ''}>
                    <DropdownMenuItem
                      onClick={() => handlePremiumExport('Pipedrive')}
                      disabled={!canExport}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      <span>Pipedrive</span>
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                {!canExport && <TooltipContent><p>Upgrade to use premium exports.</p></TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={!canExport ? 'cursor-not-allowed' : ''}>
                    <DropdownMenuItem
                      onClick={() => handlePremiumExport('Gmail Draft')}
                      disabled={!canExport}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Gmail Draft</span>
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                {!canExport && <TooltipContent><p>Upgrade to use premium exports.</p></TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {renderContent()}
    </div>
  );
}
