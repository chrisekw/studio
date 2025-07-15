'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, type Dispatch, type SetStateAction, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateLeads } from '@/ai/flows/generate-leads-flow';
import type { Lead } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/auth-context';
import { calculateRemainingLeads } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Switch } from '@/components/ui/switch';

interface SearchFormProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  selectedSuggestion: string;
  remainingLeads: number;
  remainingLeadsText: string;
  setShowUpgradeBanner: Dispatch<SetStateAction<boolean>>;
  setProgress: Dispatch<SetStateAction<number>>;
  setProgressMessage: Dispatch<SetStateAction<string>>;
}

export function SearchForm({ setIsLoading, setLeads, setSearchQuery, setShowSuggestions, selectedSuggestion, remainingLeads, remainingLeadsText, setShowUpgradeBanner, setProgress, setProgressMessage }: SearchFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const defaultsSet = useRef(false);

  const isAgencyPlan = userProfile?.plan === 'Agency';
  const maxLeadsPerSearch = isAgencyPlan ? 1000 : 100;
  const largeSearchThreshold = 100;

  const formSchema = z.object({
    keyword: z.string().min(3, { message: 'Keyword must be at least 3 characters.' }),
    numLeads: z.coerce
      .number({ invalid_type_error: 'Please enter a valid number.' })
      .min(1, { message: 'Please generate at least 1 lead.' })
      .max(maxLeadsPerSearch, { message: `You can generate up to ${maxLeadsPerSearch.toLocaleString()} leads per search.` }),
    radius: z.enum(['local', 'broad']),
    includeAddress: z.boolean().default(false).optional(),
    includeLinkedIn: z.boolean().default(false).optional(),
    confirmLargeSearch: z.boolean().default(false).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: '',
      radius: 'broad',
      numLeads: 10,
      includeAddress: true,
      includeLinkedIn: true,
      confirmLargeSearch: false,
    },
  });

  const numLeadsValue = form.watch('numLeads');
  const showLargeSearchToggle = isAgencyPlan && numLeadsValue > largeSearchThreshold;
  
  const isFreePlan = userProfile?.plan === 'Free';

  useEffect(() => {
    if (userProfile && !defaultsSet.current) {
      form.setValue('includeAddress', userProfile.defaultIncludeAddress ?? true);
      form.setValue('includeLinkedIn', userProfile.defaultIncludeLinkedIn ?? true);
      const defaultLeads = isFreePlan ? Math.min(10, remainingLeads) : Math.min(10, remainingLeads);
      form.setValue('numLeads', Math.max(1, defaultLeads));
      defaultsSet.current = true;
    }
  }, [userProfile, form, isFreePlan, remainingLeads]);

  useEffect(() => {
    if (selectedSuggestion) {
      form.setValue('keyword', selectedSuggestion);
    }
  }, [selectedSuggestion, form]);
  
  const updateQuotaInFirestore = async (leadsGeneratedCount: number) => {
    if (!user || !userProfile || leadsGeneratedCount <= 0) return;
  
    const { remainingPlanLeads, leadPoints, addonCredits } = calculateRemainingLeads(userProfile);
    let leadsToDeduct = leadsGeneratedCount;
    const updatePayload: any = {};
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
  
    // Determine how many leads to pull from the main plan quota
    const planLeadsToUse = Math.min(leadsToDeduct, Math.max(0, remainingPlanLeads));
    
    if (planLeadsToUse > 0) {
      if (isFreePlan) {
        // For free plan, update both daily and monthly counts
        updatePayload.lastLeadGenerationDate = today;
        updatePayload.lastLeadGenerationMonth = currentMonth;
        
        if (userProfile.lastLeadGenerationDate === today) {
          updatePayload.leadsGeneratedToday = increment(planLeadsToUse);
        } else {
          updatePayload.leadsGeneratedToday = planLeadsToUse; // Reset for the new day
        }
        
        if (userProfile.lastLeadGenerationMonth === currentMonth) {
          updatePayload.monthlyLeadsGenerated = increment(planLeadsToUse);
        } else {
          updatePayload.monthlyLeadsGenerated = planLeadsToUse; // Reset for the new month
        }

      } else { // For paid plans
        updatePayload.lastLeadGenerationMonth = currentMonth;
        if (userProfile.lastLeadGenerationMonth === currentMonth) {
          updatePayload.leadsGeneratedThisMonth = increment(planLeadsToUse);
        } else {
          updatePayload.leadsGeneratedThisMonth = planLeadsToUse; // Reset for the new month
        }
      }
      leadsToDeduct -= planLeadsToUse;
    }
  
    // Deduct from lead points if necessary
    if (leadsToDeduct > 0) {
      const pointsToUse = Math.min(leadsToDeduct, Math.max(0, leadPoints));
      if (pointsToUse > 0) {
        updatePayload.leadPoints = increment(-pointsToUse);
        leadsToDeduct -= pointsToUse;
      }
    }
  
    // Deduct from add-on credits if necessary
    if (leadsToDeduct > 0) {
      const addonsToUse = Math.min(leadsToDeduct, Math.max(0, addonCredits));
      if (addonsToUse > 0) {
        updatePayload.addonCredits = increment(-addonsToUse);
        leadsToDeduct -= addonsToUse;
      }
    }
    
    if (Object.keys(updatePayload).length > 0) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, updatePayload);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to generate leads.',
      });
      return;
    }

    if (remainingLeads <= 0) {
      setShowUpgradeBanner(true);
      return;
    }
    
    if (values.numLeads > remainingLeads) {
      toast({
        variant: 'destructive',
        title: 'Quota Exceeded',
        description: `You only have ${remainingLeads.toLocaleString()} leads remaining. Please request ${remainingLeads.toLocaleString()} or fewer.`,
      });
      return;
    }

    if (showLargeSearchToggle && !values.confirmLargeSearch) {
        toast({
            variant: 'destructive',
            title: 'Confirmation Required',
            description: 'Please confirm you want to start a large search operation.',
        });
        return;
    }
    
    setIsGenerating(true);
    setIsLoading(true);
    setLeads([]);
    setSearchQuery(values.keyword);
    
    try {
      setProgress(10);
      setProgressMessage('Initializing...');

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(30);
      setProgressMessage('Searching the web...');
      
      const result = await generateLeads({
          query: values.keyword,
          numLeads: values.numLeads,
          includeAddress: !isFreePlan && (values.includeAddress ?? false),
          includeLinkedIn: !isFreePlan && (values.includeLinkedIn ?? false),
          includeSocials: isAgencyPlan,
          extractContactInfo: true,
          includeDescription: !isFreePlan,
      });

      setProgress(70);
      setProgressMessage('Analyzing & compiling leads...');

      const newLeads = result.map((lead, index) => ({
          ...lead,
          id: `${Date.now()}-${index}`,
      }));
      
      if (!newLeads[0]?.mock) {
        await updateQuotaInFirestore(newLeads.length);
      }
      
      setLeads(newLeads);
      
      setProgress(100);
      setProgressMessage(`Success! Found ${newLeads.length.toLocaleString()} leads.`);
      
      toast({
          variant: 'success',
          title: 'Search Complete',
          description: `We've found and processed ${newLeads.length.toLocaleString()} potential leads.`,
      });

    } catch (error: any) {
       setProgress(100); // Complete the bar even on error
       setProgressMessage('An error occurred.');
       toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsGenerating(false);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          setProgressMessage('');
        }, 2000);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <FormLabel className="text-base font-semibold">Search Criteria</FormLabel>
          <FormDescription>Start by telling us who you&apos;re looking for.</FormDescription>
          <div className="pt-4">
             <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="e.g., 'SaaS companies in New York focusing on AI'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <FormLabel className="text-base font-semibold">Configuration</FormLabel>
          <FormDescription>Fine-tune the search parameters to match your needs.</FormDescription>
           <div className="grid grid-cols-1 gap-y-4 pt-4">
               <FormField
                control={form.control}
                name="numLeads"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Leads</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={event => field.onChange(+event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="radius"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Search Radius</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4 pt-1"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="broad" id="r-broad"/>
                          </FormControl>
                          <FormLabel className="font-normal" htmlFor="r-broad">
                            Broad Geography
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="local" id="r-local" />
                          </FormControl>
                          <FormLabel className="font-normal" htmlFor="r-local">
                            Local Focus
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
           </div>
           {userProfile && (
              <p className="text-sm text-muted-foreground pt-4">
                {remainingLeadsText}
              </p>
            )}
        </div>

        <div>
            <FormLabel className="text-base font-semibold">Data Enrichment</FormLabel>
            <FormDescription>Select additional data points to include for each lead. (Paid plans only)</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <FormField
                control={form.control}
                name="includeAddress"
                render={({ field }) => (
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <div tabIndex={isFreePlan ? 0 : -1} className="w-full">
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full hover:border-primary/50 transition-colors">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="includeAddress"
                                disabled={isFreePlan}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <label
                                htmlFor="includeAddress"
                                className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                Include Address
                                </label>
                            </div>
                            </FormItem>
                        </div>
                        </TooltipTrigger>
                        {isFreePlan && (
                        <TooltipContent>
                            <p>Address is a premium feature. Please upgrade.</p>
                        </TooltipContent>
                        )}
                    </Tooltip>
                    </TooltipProvider>
                )}
                />
                <FormField
                control={form.control}
                name="includeLinkedIn"
                render={({ field }) => (
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <div tabIndex={isFreePlan ? 0 : -1} className="w-full">
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full hover:border-primary/50 transition-colors">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="includeLinkedIn"
                                disabled={isFreePlan}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <label
                                htmlFor="includeLinkedIn"
                                className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                Include LinkedIn
                                </label>
                            </div>
                            </FormItem>
                        </div>
                        </TooltipTrigger>
                        {isFreePlan && (
                        <TooltipContent>
                            <p>LinkedIn is a premium feature. Please upgrade.</p>
                        </TooltipContent>
                        )}
                    </Tooltip>
                    </TooltipProvider>
                )}
                />
            </div>
        </div>
        
        {showLargeSearchToggle && (
            <FormField
                control={form.control}
                name="confirmLargeSearch"
                render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-500/10 border-amber-500/30">
                    <div className="space-y-0.5">
                    <FormLabel className="text-base text-amber-900 dark:text-amber-200">Confirm Large Search</FormLabel>
                    <FormDescription className="text-amber-800 dark:text-amber-300">
                        This will generate over {largeSearchThreshold} leads and may take some time to complete.
                    </FormDescription>
                    </div>
                    <FormControl>
                    <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-readonly
                    />
                    </FormControl>
                </FormItem>
                )}
            />
        )}


        <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isGenerating || (showLargeSearchToggle && !form.getValues('confirmLargeSearch'))} className="w-full sm:w-auto shadow-lg shadow-primary/30">
            {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Search className="mr-2 h-4 w-4" />
            )}
            Generate Leads
            </Button>
        </div>
      </form>
    </Form>
  );
}