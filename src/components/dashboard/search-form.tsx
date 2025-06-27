'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, type Dispatch, type SetStateAction, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface SearchFormProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  selectedSuggestion: string;
}

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'construction', label: 'Construction' },
  { value: 'retail', label: 'Retail' },
  { value: 'non-profit', label: 'Non-profit' },
  { value: 'legal', label: 'Legal' },
  { value: 'consulting', label: 'Consulting' },
];

const PLAN_LIMITS = {
  Free: 5, // Daily
  Starter: 200, // Monthly
  Pro: 1000, // Monthly
  Agency: 5000, // Monthly
};

const maxLeadsPerSearch = 100;

const formSchema = z.object({
  keyword: z.string().min(3, { message: 'Keyword must be at least 3 characters.' }),
  industry: z.string().optional(),
  numLeads: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(1, { message: 'Please generate at least 1 lead.' })
    .max(maxLeadsPerSearch, { message: `You can generate up to ${maxLeadsPerSearch} leads per search.` }),
  radius: z.enum(['local', 'broad']),
  includeAddress: z.boolean().default(false).optional(),
  includeLinkedIn: z.boolean().default(false).optional(),
});


export function SearchForm({ setIsLoading, setLeads, setSearchQuery, setShowSuggestions, selectedSuggestion }: SearchFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [openIndustry, setOpenIndustry] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const defaultsSet = useRef(false);

  const isFreePlan = userProfile?.plan === 'Free';
  const planLimit = userProfile ? PLAN_LIMITS[userProfile.plan] : 0;
  const addonCredits = userProfile?.addonCredits ?? 0;
  const leadPoints = userProfile?.leadPoints ?? 0;

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const leadsUsedToday = (isFreePlan && userProfile?.lastLeadGenerationDate === today) ? userProfile.leadsGeneratedToday ?? 0 : 0;
  const leadsUsedThisMonth = (!isFreePlan && userProfile?.lastLeadGenerationMonth === currentMonth) ? userProfile.leadsGeneratedThisMonth ?? 0 : 0;
  
  const remainingPlanLeads = isFreePlan ? planLimit - leadsUsedToday : planLimit - leadsUsedThisMonth;
  const remainingLeads = remainingPlanLeads + addonCredits + leadPoints;
  const userCanGenerate = remainingLeads > 0;

  let remainingLeadsText = '';
  if (userProfile) {
    const parts = [];
    if (isFreePlan) {
      parts.push(`${remainingPlanLeads} daily`);
    } else {
      parts.push(`${remainingPlanLeads.toLocaleString()} monthly`);
    }
    if (leadPoints > 0) parts.push(`${leadPoints.toLocaleString()} points`);
    if (addonCredits > 0) parts.push(`${addonCredits.toLocaleString()} add-ons`);
    remainingLeadsText = `You have ${parts.join(' + ')} leads remaining.`;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: 'Marketing agencies in London',
      radius: 'broad',
      numLeads: 5,
      includeAddress: true,
      includeLinkedIn: true,
    },
  });

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
  

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to generate leads.',
      });
      return;
    }

    if (values.numLeads > remainingLeads) {
      toast({
        variant: 'destructive',
        title: isFreePlan ? 'Daily Limit Exceeded' : 'Monthly Limit Exceeded',
        description: `You only have ${remainingLeads.toLocaleString()} leads remaining. Please request ${remainingLeads.toLocaleString()} or fewer.`,
      });
      return;
    }
    
    setIsGenerating(true);
    setIsLoading(true);
    setLeads([]);
    setShowSuggestions(false);
    setSearchQuery(values.keyword);
    
    try {
      const industryLabel = industries.find(i => i.value === values.industry)?.label;
      const fullQuery = values.industry && industryLabel ? `${values.keyword} in the ${industryLabel} industry` : values.keyword;
      const result = await generateLeads({
        query: fullQuery,
        numLeads: values.numLeads,
        includeAddress: !isFreePlan && (values.includeAddress ?? false),
        includeLinkedIn: !isFreePlan && (values.includeLinkedIn ?? false),
        extractContactInfo: true,
        includeDescription: !isFreePlan,
      });

      const newLeads = result.map((lead, index) => ({
        ...lead,
        id: `${Date.now()}-${index}`,
      }));

      const leadsGeneratedCount = newLeads.length;
      if (leadsGeneratedCount > 0) {
        const userDocRef = doc(db, 'users', user.uid);
        let leadsToDeduct = leadsGeneratedCount;
        const updatePayload: any = {};
        
        // 1. Deduct from plan quota
        const planLeadsToUse = Math.min(leadsToDeduct, Math.max(0, remainingPlanLeads));
        if (planLeadsToUse > 0) {
          if (isFreePlan) {
            updatePayload.leadsGeneratedToday = increment(planLeadsToUse);
            updatePayload.lastLeadGenerationDate = today;
          } else {
            updatePayload.leadsGeneratedThisMonth = increment(planLeadsToUse);
            updatePayload.lastLeadGenerationMonth = currentMonth;
          }
          leadsToDeduct -= planLeadsToUse;
        }

        // 2. Deduct from lead points
        if (leadsToDeduct > 0) {
          const pointsToUse = Math.min(leadsToDeduct, Math.max(0, leadPoints));
          if (pointsToUse > 0) {
            updatePayload.leadPoints = increment(-pointsToUse);
            leadsToDeduct -= pointsToUse;
          }
        }

        // 3. Deduct from add-on credits
        if (leadsToDeduct > 0) {
          const addonsToUse = Math.min(leadsToDeduct, Math.max(0, addonCredits));
          if (addonsToUse > 0) {
            updatePayload.addonCredits = increment(-addonsToUse);
            leadsToDeduct -= addonsToUse;
          }
        }
        
        if (Object.keys(updatePayload).length > 0) {
          await updateDoc(userDocRef, updatePayload);
        }
      }
      
      setLeads(newLeads);
      
      toast({
        title: 'Search Complete',
        description: `We've found ${newLeads.length} potential leads for "${values.keyword}".`,
      });
    } catch (error: any) {
       console.error('Failed to generate leads:', error);
       toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Failed to generate leads. Please try again.',
      });
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
      setShowSuggestions(true);
    }
  }

  return (
    <Card className="border-primary/20 bg-background/30 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Generate New Leads</CardTitle>
        <CardDescription>
          Enter a keyword and select options to start scraping for potential business leads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keyword or Company Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'SaaS companies in New York'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="numLeads"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Leads</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                        onChange={event => field.onChange(+event.target.value)}
                        max={Math.min(maxLeadsPerSearch, remainingLeads)}
                        min={1}
                      />
                    </FormControl>
                     {userProfile && (
                       <FormDescription>
                         {remainingLeadsText}
                       </FormDescription>
                     )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Industry / Category (Optional)</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <div tabIndex={isFreePlan ? 0 : -1}>
                            <Popover open={openIndustry} onOpenChange={setOpenIndustry}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={isFreePlan}
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground",
                                      isFreePlan && 'cursor-not-allowed opacity-70'
                                    )}
                                  >
                                    {field.value
                                      ? industries.find(
                                          (industry) => industry.value === field.value
                                        )?.label
                                      : "Select an industry"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                  <CommandInput placeholder="Search industry..." />
                                  <CommandList>
                                    <CommandEmpty>No industry found.</CommandEmpty>
                                    <CommandGroup>
                                      {industries.map((industry) => (
                                        <CommandItem
                                          value={industry.label}
                                          key={industry.value}
                                          onSelect={() => {
                                            form.setValue("industry", industry.value === field.value ? undefined : industry.value);
                                            setOpenIndustry(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              industry.value === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {industry.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TooltipTrigger>
                        {isFreePlan && (
                           <TooltipContent>
                            <p>Industry filter is a premium feature. Please upgrade.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
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
            
            
            <div>
              <FormLabel>Additional Information</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="includeAddress"
                  render={({ field }) => (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div tabIndex={isFreePlan ? 0 : -1} className="w-full">
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 h-full">
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
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 h-full">
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
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
              <Button type="submit" disabled={isGenerating || !userCanGenerate} className="shadow-lg shadow-primary/30">
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
      </CardContent>
    </Card>
  );
}
