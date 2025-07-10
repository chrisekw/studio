'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import type { Lead } from '@/lib/types';
import { doc, increment, runTransaction } from 'firebase/firestore';
import { Globe, Linkedin, Mail, MapPin, MoreHorizontal, Phone, Tag, Trash2 } from 'lucide-react';

interface SavedLeadsCardsProps {
  leads: Lead[];
}

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


export function SavedLeadsCards({ leads }: SavedLeadsCardsProps) {
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

  if (leads.length === 0) {
    return (
      <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
        No saved leads. Start generating and saving leads to see them here.
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {leads.map((lead) => (
        <AccordionItem key={lead.id} value={lead.id} className="border rounded-lg bg-card/60 backdrop-blur-xl transition-all hover:border-primary/30 [&[data-state=open]]:border-primary/50">
          <AccordionTrigger className="p-4 font-normal text-left hover:no-underline">
            <div className="flex-1 flex items-center gap-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={`https://logo.clearbit.com/${getHostname(lead.website)}`} alt={`${lead.name} logo`} />
                <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{lead.name}</p>
                {lead.website && <p className="text-sm text-muted-foreground">{getHostname(lead.website)}</p>}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
             <div className="border-t pt-4 space-y-4">
                {lead.description && <p className="text-sm text-muted-foreground italic">"{lead.description}"</p>}
                
                <div className="space-y-3 text-sm">
                    {lead.email && (
                        <div className="flex items-center text-muted-foreground">
                            <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                    )}
                    {lead.phone && (
                        <div className="flex items-center text-muted-foreground">
                            <Phone className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
                            <span className="truncate">{lead.phone}</span>
                        </div>
                    )}
                    {lead.address && (
                        <div className="flex items-start text-muted-foreground">
                            <MapPin className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{lead.address}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {lead.website && (
                        <Button asChild size="sm" variant="outline">
                            <a href={getFullUrl(lead.website)} target="_blank" rel="noopener noreferrer">
                                <Globe className="mr-2 h-4 w-4"/> Website
                            </a>
                        </Button>
                    )}
                    {lead.linkedin && (
                         <Button asChild size="sm" variant="outline">
                            <a href={getFullUrl(lead.linkedin)} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="mr-2 h-4 w-4"/> LinkedIn
                            </a>
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-1 flex-wrap">
                        {lead.tags?.map((tag, i) => (
                            <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
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
                </div>

             </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
