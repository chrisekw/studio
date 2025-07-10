
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAgencyPlan = userProfile?.plan === 'Agency';
  const maxLeadsPerSearch = isAgencyPlan ? 1000 : 100;

  const formSchema = z.object({
    keyword: z.string().min(3, { message: 'Keyword must be at least 3 characters.' }),
    numLeads: z.coerce
      .number({ invalid_type_error: 'Please enter a valid number.' })
      .min(1, { message: 'Please generate at least 1 lead.' })
      .max(maxLeadsPerSearch, { message: `You can generate up to ${maxLeadsPerSearch.toLocaleString()} leads per search.` }),
    radius: z.enum(['local', 'broad']),
    includeAddress: z.boolean().default(false).optional(),
    includeLinkedIn: z.boolean().default(false).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: '',
      radius: 'broad',
      numLeads: 10,
      includeAddress: true,
      includeLinkedIn: true,
    },
  });
  
  const isFreePlan = userProfile?.plan === 'Free';
  const { remainingPlanLeads, leadPoints, addonCredits } = calculateRemainingLeads(userProfile);

  useEffect(() => {
    if (userProfile && !defaultsSet.current) {
      form.setValue('includeAddress', userProfile.defaultIncludeAddress ?? true);
      form.setValue('includeLinkedIn', userProfile.defaultIncludeLinkedIn ?? true);
      const defaultLeads = isFreePlan ? Math.min(5, remainingLeads) : Math.min(10, remainingLeads);
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
    if (!user || leadsGeneratedCount <= 0) return;
  
    // Re-fetch the latest remainingLeads count before updating
    const freshProfile = calculateRemainingLeads(userProfile);
    let leadsToDeduct = leadsGeneratedCount;
    const updatePayload: any = {};
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
  
    const planLeadsToUse = Math.min(leadsToDeduct, Math.max(0, freshProfile.remainingPlanLeads));
    if (planLeadsToUse > 0) {
      if (isFreePlan) {
        if (userProfile?.lastLeadGenerationDate === today) {
          updatePayload.leadsGeneratedToday = increment(planLeadsToUse);
        } else {
          updatePayload.leadsGeneratedToday = planLeadsToUse;
        }
        updatePayload.lastLeadGenerationDate = today;
      } else {
        if (userProfile?.lastLeadGenerationMonth === currentMonth) {
          updatePayload.leadsGeneratedThisMonth = increment(planLeadsToUse);
        } else {
          updatePayload.leadsGeneratedThisMonth = planLeadsToUse;
        }
        updatePayload.lastLeadGenerationMonth = currentMonth;
      }
      leadsToDeduct -= planLeadsToUse;
    }
  
    if (leadsToDeduct > 0) {
      const pointsToUse = Math.min(leadsToDeduct, Math.max(0, freshProfile.leadPoints));
      if (pointsToUse > 0) {
        updatePayload.leadPoints = increment(-pointsToUse);
        leadsToDeduct -= pointsToUse;
      }
    }
  
    if (leadsToDeduct > 0) {
      const addonsToUse = Math.min(leadsToDeduct, Math.max(0, freshProfile.addonCredits));
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
        title: isFreePlan ? 'Daily Limit Exceeded' : 'Quota Exceeded',
        description: `You only have ${remainingLeads.toLocaleString()} leads remaining. Please request ${remainingLeads.toLocaleString()} or fewer.`,
      });
      return;
    }
    
    setIsGenerating(true);
    setIsLoading(true);
    setLeads([]);
    setShowSuggestions(false);
    setSearchQuery(values.keyword);

    const totalLeadsToGenerate = values.numLeads;
    const chunkSize = 100; // Generate in chunks of 100
    const numChunks = Math.ceil(totalLeadsToGenerate / chunkSize);
    let allNewLeads: Lead[] = [];
    let totalLeadsGenerated = 0;

    setProgress(5);

    for (let i = 0; i < numChunks; i++) {
        const leadsForThisChunk = Math.min(chunkSize, totalLeadsToGenerate - totalLeadsGenerated);
        const progressStart = (i / numChunks) * 100;
        const progressEnd = ((i + 1) / numChunks) * 100;
        
        setProgressMessage(`Generating leads... (${totalLeadsGenerated.toLocaleString()}/${totalLeadsToGenerate.toLocaleString()})`);

        try {
            const isProOrAgency = userProfile.plan === 'Pro' || userProfile.plan === 'Agency';
            const result = await generateLeads({
                query: values.keyword,
                numLeads: leadsForThisChunk,
                includeAddress: !isFreePlan && (values.includeAddress ?? false),
                includeLinkedIn: !isFreePlan && (values.includeLinkedIn ?? false),
                extractContactInfo: true,
                includeDescription: !isFreePlan,
                scoreLeads: isProOrAgency,
            });

            const newLeads = result.map((lead, index) => ({
                ...lead,
                id: `${Date.now()}-${i}-${index}`,
            }));

            totalLeadsGenerated += newLeads.length;
            allNewLeads = [...allNewLeads, ...newLeads];
            setLeads(allNewLeads); // Update UI incrementally

            // We update the quota in Firestore after each successful chunk
            await updateQuotaInFirestore(newLeads.length);

        } catch (error: any) {
            console.error(`Error in chunk ${i + 1}:`, error);
            toast({
                variant: 'destructive',
                title: `Error in Batch ${i + 1}`,
                description: error.message || 'An error occurred during this batch. The process will stop.',
            });
            break; // Stop processing further chunks if one fails
        }
        setProgress(progressEnd);
    }
    
    toast({
        title: 'Search Complete',
        description: `We've found ${totalLeadsGenerated.toLocaleString()} potential leads for "${values.keyword}".`,
    });

    setIsGenerating(false);
    setIsLoading(false);
    setShowSuggestions(true);
    setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
    }, 1000);
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

        <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isGenerating} className="w-full sm:w-auto shadow-lg shadow-primary/30">
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
